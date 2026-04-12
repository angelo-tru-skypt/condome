import logging

from odoo import _, fields
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class CommunityOperationsService(BaseApiService):
    """Gestiona áreas comunes y sus reservas."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_common_areas(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.common.area"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="name asc, id asc")
                return self.build_response({"data": [self.serialize_common_area(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            name = self.clean_str(payload.get("name") or payload.get("nombre"))
            if not name:
                return self.error_response(_("El nombre del area comun es requerido"))

            record = model.create(
                {
                    "name": name,
                    "capacidad": int(payload.get("capacity") or payload.get("capacidad") or 0),
                    "horario": self.clean_str(payload.get("schedule") or payload.get("horario")),
                    "reglas": self.clean_str(payload.get("rules") or payload.get("reglas")),
                    "active": payload.get("active", True),
                    "condominio_id": condominio.id,
                }
            )
            self.create_audit_entry(condominio, "reservas", _("Area comun registrada"), record.name, actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_common_area(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Reservation common areas failed")
            return self.error_response(error, status=400)

    def handle_common_area_update(self, area_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_common_area(area_id, user)
            payload = self.read_payload()
            values = {}
            if "name" in payload or "nombre" in payload:
                values["name"] = self.clean_str(payload.get("name") or payload.get("nombre")) or record.name
            if "capacity" in payload or "capacidad" in payload:
                values["capacidad"] = int(payload.get("capacity") or payload.get("capacidad") or 0)
            if "schedule" in payload or "horario" in payload:
                values["horario"] = self.clean_str(payload.get("schedule") or payload.get("horario"))
            if "rules" in payload or "reglas" in payload:
                values["reglas"] = self.clean_str(payload.get("rules") or payload.get("reglas"))
            if "active" in payload:
                values["active"] = payload.get("active")
            record.write(values)
            self.create_audit_entry(record.condominio_id, "reservas", _("Area comun actualizada"), record.name, actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_common_area(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Reservation common area update failed")
            return self.error_response(error, status=400)

    def handle_reservations(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.area.reservation"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                status_filter = self.clean_str(request.httprequest.args.get("status"))
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                if status_filter:
                    domain.append(("estado", "=", status_filter))
                records = model.search(domain, order="fecha_reserva desc, id desc")
                return self.build_response({"data": [self.serialize_area_reservation(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            area = request.env["condome.common.area"].sudo().search(
                [("condominio_id", "=", condominio.id), ("id", "=", int(payload.get("areaId") or payload.get("area_id") or 0))]
                if (payload.get("areaId") or payload.get("area_id"))
                else [("condominio_id", "=", condominio.id), ("name", "=", self.clean_str(payload.get("areaName") or payload.get("area_nombre")))],
                limit=1,
            )
            if not area:
                return self.error_response(_("Debes seleccionar un area comun valida"))

            apartment = self.find_apartamento(
                user,
                apartment_id=payload.get("apartmentId") or payload.get("apartamento_id"),
                apartment_name=payload.get("apartmentName") or payload.get("apartamento_nombre"),
                condominio=condominio,
            )
            resident = self.find_resident(
                user,
                resident_id=payload.get("residentId") or payload.get("residente_id"),
                resident_name=payload.get("residentName") or payload.get("residente_nombre"),
                apartment=apartment,
                condominio=condominio,
            )
            reservation_date = payload.get("date") or payload.get("fecha_reserva")
            time_range = self.clean_str(payload.get("timeRange") or payload.get("rango_horario"))
            if not reservation_date or not time_range:
                return self.error_response(_("La fecha y el rango horario son requeridos"))

            record = model.create(
                {
                    "area_id": area.id,
                    "residente_id": resident.id,
                    "fecha_reserva": reservation_date,
                    "rango_horario": time_range,
                    "asistentes": int(payload.get("attendees") or payload.get("asistentes") or 1),
                    "motivo": self.clean_str(payload.get("purpose") or payload.get("motivo")),
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "pending",
                }
            )
            self.create_audit_entry(condominio, "reservas", _("Solicitud de reserva registrada"), _("%s · %s") % (record.area_id.name, record.residente_id.name), actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_area_reservation(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Reservation flow failed")
            return self.error_response(error, status=400)

    def handle_reservation_update(self, reservation_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_area_reservation(reservation_id, user)
            payload = self.read_payload()
            values = {}
            if "date" in payload or "fecha_reserva" in payload:
                values["fecha_reserva"] = payload.get("date") or payload.get("fecha_reserva")
            if "timeRange" in payload or "rango_horario" in payload:
                values["rango_horario"] = self.clean_str(payload.get("timeRange") or payload.get("rango_horario")) or record.rango_horario
            if "attendees" in payload or "asistentes" in payload:
                values["asistentes"] = int(payload.get("attendees") or payload.get("asistentes") or record.asistentes)
            if "purpose" in payload or "motivo" in payload:
                values["motivo"] = self.clean_str(payload.get("purpose") or payload.get("motivo")) or record.motivo
            if "status" in payload or "estado" in payload:
                new_status = self.clean_str(payload.get("status") or payload.get("estado")) or record.estado
                if new_status not in {"pending", "approved", "rejected", "cancelled"}:
                    return self.error_response(_("El estado de la reserva no es valido"))
                values["estado"] = new_status
                values["fecha_decision"] = fields.Datetime.now() if new_status in {"approved", "rejected", "cancelled"} else False
                values["aprobado_por_id"] = user.id if new_status in {"approved", "rejected", "cancelled"} else False
            if "decisionNote" in payload or "nota_decision" in payload:
                values["nota_decision"] = self.clean_str(payload.get("decisionNote") or payload.get("nota_decision")) or record.nota_decision

            if values:
                record.write(values)
                self.create_audit_entry(
                    record.condominio_id,
                    "reservas",
                    _("Reserva actualizada"),
                    _("%s · %s") % (record.area_id.name, record.residente_id.name),
                    actor=self.clean_str(user.name or user.login),
                )
            return self.build_response({"data": self.serialize_area_reservation(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Reservation update failed")
            return self.error_response(error, status=400)
