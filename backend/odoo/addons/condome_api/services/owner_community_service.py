import logging

from odoo import _, fields, http
from odoo.http import request

from .base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class OwnerCommunityService(BaseApiService):
    """Gestiona anuncios, áreas comunes, reservas y auditoría del condominio."""

    def handle_announcements(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            model = request.env["condome.comunicado"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="write_date desc, id desc")
                return self.build_response({"data": [self.serialize_comunicado(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            title = self.clean_str(payload.get("title") or payload.get("titulo"))
            message = self.clean_str(payload.get("message") or payload.get("mensaje"))
            if not title or not message:
                return self.error_response(_("El titulo y el mensaje son requeridos"))

            record = model.create(
                {
                    "name": title,
                    "mensaje": message,
                    "prioridad": self.clean_str(payload.get("priority") or payload.get("prioridad")) or "media",
                    "alcance": self.clean_str(payload.get("scope") or payload.get("alcance")) or "general",
                    "canal": self.clean_str(payload.get("channel") or payload.get("canal")) or "panel",
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "draft",
                    "target_label": self.clean_str(payload.get("targetLabel") or payload.get("target_label")) or "Todo el condominio",
                    "scheduled_for": self.normalize_datetime_value(payload.get("scheduledFor") or payload.get("scheduled_for")),
                    "condominio_id": condominio.id,
                }
            )
            self.create_audit_entry(
                condominio,
                "avisos",
                _("Comunicado %s") % ("publicado" if record.estado == "published" else "creado"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if record.prioridad == "alta" else "info",
            )
            return self.build_response({"data": self.serialize_comunicado(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community announcements failed")
            return self.error_response(error, status=400)

    def handle_announcement_update(self, comunicado_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            record = self.get_owner_comunicado(comunicado_id, user)
            payload = self.read_payload()
            values = {}
            if "title" in payload or "titulo" in payload:
                values["name"] = self.clean_str(payload.get("title") or payload.get("titulo")) or record.name
            if "message" in payload or "mensaje" in payload:
                values["mensaje"] = self.clean_str(payload.get("message") or payload.get("mensaje")) or record.mensaje
            if "priority" in payload or "prioridad" in payload:
                values["prioridad"] = self.clean_str(payload.get("priority") or payload.get("prioridad")) or record.prioridad
            if "scope" in payload or "alcance" in payload:
                values["alcance"] = self.clean_str(payload.get("scope") or payload.get("alcance")) or record.alcance
            if "channel" in payload or "canal" in payload:
                values["canal"] = self.clean_str(payload.get("channel") or payload.get("canal")) or record.canal
            if "status" in payload or "estado" in payload:
                values["estado"] = self.clean_str(payload.get("status") or payload.get("estado")) or record.estado
            if "targetLabel" in payload or "target_label" in payload:
                values["target_label"] = self.clean_str(payload.get("targetLabel") or payload.get("target_label")) or record.target_label
            if "scheduledFor" in payload or "scheduled_for" in payload:
                values["scheduled_for"] = self.normalize_datetime_value(payload.get("scheduledFor") or payload.get("scheduled_for"))
            record.write(values)
            self.create_audit_entry(
                record.condominio_id,
                "avisos",
                _("Comunicado actualizado"),
                _("%s · %s") % (record.name, record.estado),
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if record.prioridad == "alta" else "success",
            )
            return self.build_response({"data": self.serialize_comunicado(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community announcement update failed")
            return self.error_response(error, status=400)

    def handle_common_areas(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                condominio,
                "reservas",
                _("Area comun registrada"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
            )
            return self.build_response({"data": self.serialize_common_area(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community common areas failed")
            return self.error_response(error, status=400)

    def handle_common_area_update(self, area_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                record.condominio_id,
                "reservas",
                _("Area comun actualizada"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="success" if record.active else "warning",
            )
            return self.build_response({"data": self.serialize_common_area(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community common area update failed")
            return self.error_response(error, status=400)

    def handle_reservations(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                condominio,
                "reservas",
                _("Solicitud de reserva registrada"),
                _("%s · %s") % (record.area_id.name, record.residente_id.name),
                actor=self.clean_str(user.name or user.login) or "Administracion",
            )
            return self.build_response({"data": self.serialize_area_reservation(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community reservations failed")
            return self.error_response(error, status=400)

    def handle_reservation_update(self, reservation_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
                values["motivo"] = self.clean_str(payload.get("purpose") or payload.get("motivo"))
            if "status" in payload or "estado" in payload:
                values["estado"] = self.clean_str(payload.get("status") or payload.get("estado")) or record.estado
            if "decisionNote" in payload or "nota_decision" in payload:
                values["nota_decision"] = self.clean_str(payload.get("decisionNote") or payload.get("nota_decision"))
            if "estado" in values:
                values["fecha_decision"] = fields.Datetime.now()
                values["aprobado_por_id"] = user.id
            record.write(values)
            severity = "warning" if record.estado in {"rejected", "cancelled"} else "success"
            title_map = {
                "approved": _("Reserva aprobada"),
                "rejected": _("Reserva rechazada"),
                "cancelled": _("Reserva cancelada"),
                "pending": _("Reserva actualizada"),
            }
            self.create_audit_entry(
                record.condominio_id,
                "reservas",
                title_map.get(record.estado, _("Reserva actualizada")),
                _("%s · %s") % (record.area_id.name, record.residente_id.name),
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity=severity,
            )
            return self.build_response({"data": self.serialize_area_reservation(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community reservation update failed")
            return self.error_response(error, status=400)

    def handle_audit_entries(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            condominio_id = request.httprequest.args.get("condominio_id")
            domain = self.owner_domain(user)
            if condominio_id:
                domain.append(("condominio_id", "=", int(condominio_id)))
            records = request.env["condome.audit.entry"].sudo().search(domain, order="create_date desc, id desc")
            return self.build_response({"data": [self.serialize_audit_entry(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner community audit entries failed")
            return self.error_response(error, status=400)
