import logging

from odoo import _, fields
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class AccessApiService(BaseApiService):
    """Centraliza visitas, notificaciones operativas, vehículos y políticas."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_resident_visits(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            resident = self.resident_for_user(user)
            model = request.env["condome.visita"].sudo()

            if request.httprequest.method == "GET":
                records = model.search([("residente_id", "=", resident.id)], order="fecha_visita desc, id desc")
                return self.build_response({"data": [self.serialize_visita(record) for record in records]})

            payload = self.read_payload()
            guest_name = self.clean_str(payload.get("visitante_nombre"))
            visit_date = payload.get("fecha_visita")
            entry_time = self.clean_str(payload.get("hora_ingreso"))
            if not guest_name or not visit_date or not entry_time:
                return self.error_response(_("Nombre del invitado, fecha de visita y hora de ingreso son requeridos"))

            record = model.create(
                {
                    "visitante_nombre": guest_name,
                    "visitante_documento": self.clean_str(payload.get("visitante_documento")),
                    "visitante_telefono": self.clean_str(payload.get("visitante_telefono")),
                    "fecha_visita": visit_date,
                    "hora_ingreso": entry_time,
                    "hora_salida": self.clean_str(payload.get("hora_salida")),
                    "cantidad_personas": int(payload.get("cantidad_personas") or 1),
                    "motivo": self.clean_str(payload.get("motivo")),
                    "residente_id": resident.id,
                    "apartamento_id": resident.apartamento_id.id,
                }
            )
            return self.build_response({"data": self.serialize_visita(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API resident visits failed")
            return self.error_response(error, status=400)

    def handle_owner_visits(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            status_filter = self.clean_str(request.httprequest.args.get("estado"))
            domain = self.owner_domain(user)
            if status_filter:
                domain.append(("estado", "=", status_filter))
            records = request.env["condome.visita"].sudo().search(domain, order="fecha_visita asc, id desc")
            return self.build_response({"data": [self.serialize_visita(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API owner visits failed")
            return self.error_response(error, status=400)

    def handle_visit_decision(self, visita_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            visit = self.get_owner_visita(visita_id, user)
            payload = self.read_payload()
            status = self.clean_str(payload.get("estado")) or visit.estado
            if status not in {"aprobada", "rechazada", "cancelada", "pendiente"}:
                return self.error_response(_("El estado de la solicitud no es valido"))

            visit.write(
                {
                    "estado": status,
                    "notas_propietario": self.clean_str(payload.get("notas_propietario")),
                    "fecha_decision": fields.Datetime.now(),
                    "aprobado_por_id": user.id,
                }
            )
            return self.build_response({"data": self.serialize_visita(visit)})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API visit decision failed")
            return self.error_response(error, status=400)

    def handle_notifications(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            model = request.env["condome.notification"].sudo()

            if request.httprequest.method == "GET":
                domain = self.owner_domain(user, owner_field="owner_user_id")
                condominio_id = request.httprequest.args.get("condominio_id")
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_notification(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            message = self.clean_str(payload.get("message") or payload.get("mensaje"))
            if not message:
                return self.error_response(_("El mensaje es requerido"))

            target_resident_id = payload.get("residente_id")
            target_resident = False
            if target_resident_id:
                target_resident = self.find_resident(
                    user,
                    resident_id=target_resident_id,
                    condominio=condominio,
                )
            record = model.create(
                {
                    "message": message,
                    "condominio_id": condominio.id,
                    "owner_user_id": user.id,
                    "residente_id": target_resident.id if target_resident else False,
                }
            )
            return self.build_response({"data": self.serialize_notification(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API notifications failed")
            return self.error_response(error, status=400)

    def handle_notification_update(self, notification_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            domain = self.owner_domain(user, owner_field="owner_user_id") + [("id", "=", notification_id)]
            notification = request.env["condome.notification"].sudo().search(domain, limit=1)
            if not notification:
                return self.error_response(_("Notificacion no encontrada"), status=404)

            payload = self.read_payload()
            if "read" in payload and payload.get("read"):
                notification.mark_as_read(user)
            return self.build_response({"data": self.serialize_notification(notification)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API notification update failed")
            return self.error_response(error, status=400)

    def handle_notification_read(self, notification_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            domain = self.owner_domain(user, owner_field="owner_user_id") + [("id", "=", notification_id)]
            notification = request.env["condome.notification"].sudo().search(domain, limit=1)
            if not notification:
                return self.error_response(_("Notificacion no encontrada"), status=404)
            notification.mark_as_read(user)
            return self.build_response({"data": self.serialize_notification(notification)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API notification read failed")
            return self.error_response(error, status=400)

    def handle_access_policies(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.access.policy"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="write_date desc, id desc")
                return self.build_response({"data": [self.serialize_access_policy(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            name = self.clean_str(payload.get("name"))
            description = self.clean_str(payload.get("description") or payload.get("descripcion"))
            applies_to = self.clean_str(payload.get("appliesTo") or payload.get("applies_to"))
            if not name or not description or not applies_to:
                return self.error_response(_("Nombre, ubicacion y descripcion son requeridos"))

            record = model.create(
                {
                    "name": name,
                    "tipo": self.clean_str(payload.get("type") or payload.get("tipo")) or "visita",
                    "applies_to": applies_to,
                    "descripcion": description,
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "active",
                    "condominio_id": condominio.id,
                }
            )
            return self.build_response({"data": self.serialize_access_policy(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API access policies failed")
            return self.error_response(error, status=400)

    def handle_access_policy_update(self, policy_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_access_policy(policy_id, user)
            payload = self.read_payload()
            values = {}
            if "name" in payload:
                values["name"] = self.clean_str(payload.get("name")) or record.name
            if "type" in payload or "tipo" in payload:
                values["tipo"] = self.clean_str(payload.get("type") or payload.get("tipo")) or record.tipo
            if "appliesTo" in payload or "applies_to" in payload:
                values["applies_to"] = self.clean_str(payload.get("appliesTo") or payload.get("applies_to")) or record.applies_to
            if "description" in payload or "descripcion" in payload:
                values["descripcion"] = self.clean_str(payload.get("description") or payload.get("descripcion")) or record.descripcion
            if "status" in payload or "estado" in payload:
                values["estado"] = self.clean_str(payload.get("status") or payload.get("estado")) or record.estado
            record.write(values)
            return self.build_response({"data": self.serialize_access_policy(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API access policy update failed")
            return self.error_response(error, status=400)

    def handle_vehicles(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            model = request.env["condome.vehiculo"].sudo()

            if request.httprequest.method == "GET":
                domain = self.owner_domain(user)
                condominio_id = request.httprequest.args.get("condominio_id")
                residente_id = request.httprequest.args.get("residente_id")
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                if residente_id:
                    domain.append(("residente_id", "=", int(residente_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_vehiculo(record) for record in records]})

            payload = self.read_payload()
            residente_id = payload.get("residente_id") or payload.get("residenteId")
            placa = self.clean_str(payload.get("placa") or payload.get("license_plate"))
            marca = self.clean_str(payload.get("marca") or payload.get("brand"))
            if not residente_id or not placa or not marca:
                return self.error_response(_("Residente, placa y marca son requeridos"))

            resident = self.find_resident(user, resident_id=residente_id)

            record = model.create(
                {
                    "placa": placa,
                    "marca": marca,
                    "modelo": self.clean_str(payload.get("modelo") or payload.get("model")),
                    "color": self.clean_str(payload.get("color")),
                    "ano": int(payload.get("ano") or payload.get("year") or 0) if payload.get("ano") or payload.get("year") else False,
                    "tipo": self.clean_str(payload.get("tipo") or payload.get("type")) or "auto",
                    "estado": self.clean_str(payload.get("estado") or payload.get("status")) or "activo",
                    "propietario_documento": self.clean_str(payload.get("propietario_documento") or payload.get("ownerDocument")),
                    "propietario_nombre": self.clean_str(payload.get("propietario_nombre") or payload.get("ownerName")),
                    "propietario_telefono": self.clean_str(payload.get("propietario_telefono") or payload.get("ownerPhone")),
                    "residente_id": int(residente_id),
                    "notas": self.clean_str(payload.get("notas") or payload.get("notes")),
                }
            )
            return self.build_response({"data": self.serialize_vehiculo(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API vehicles failed")
            return self.error_response(error, status=400)

    def handle_vehicle_update(self, vehiculo_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            model = request.env["condome.vehiculo"].sudo()
            record = model.search([("id", "=", vehiculo_id)] + self.owner_domain(user), limit=1)
            if not record:
                return self.error_response(_("Vehiculo no encontrado"), status=404)

            payload = self.read_payload()
            values = {}
            if "placa" in payload:
                values["placa"] = self.clean_str(payload.get("placa") or payload.get("license_plate")) or record.placa
            if "marca" in payload or "brand" in payload:
                values["marca"] = self.clean_str(payload.get("marca") or payload.get("brand")) or record.marca
            if "modelo" in payload or "model" in payload:
                values["modelo"] = self.clean_str(payload.get("modelo") or payload.get("model")) or record.modelo
            if "color" in payload:
                values["color"] = self.clean_str(payload.get("color")) or record.color
            if "ano" in payload or "year" in payload:
                year_value = payload.get("ano") or payload.get("year")
                values["ano"] = int(year_value) if year_value else record.ano
            if "tipo" in payload or "type" in payload:
                values["tipo"] = self.clean_str(payload.get("tipo") or payload.get("type")) or record.tipo
            if "estado" in payload or "status" in payload:
                values["estado"] = self.clean_str(payload.get("estado") or payload.get("status")) or record.estado
            if "propietario_documento" in payload or "ownerDocument" in payload:
                values["propietario_documento"] = self.clean_str(payload.get("propietario_documento") or payload.get("ownerDocument")) or record.propietario_documento
            if "propietario_nombre" in payload or "ownerName" in payload:
                values["propietario_nombre"] = self.clean_str(payload.get("propietario_nombre") or payload.get("ownerName")) or record.propietario_nombre
            if "propietario_telefono" in payload or "ownerPhone" in payload:
                values["propietario_telefono"] = self.clean_str(payload.get("propietario_telefono") or payload.get("ownerPhone")) or record.propietario_telefono
            if "notas" in payload or "notes" in payload:
                values["notas"] = self.clean_str(payload.get("notas") or payload.get("notes")) or record.notas

            if values:
                record.write(values)
            return self.build_response({"data": self.serialize_vehiculo(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Access API vehicle update failed")
            return self.error_response(error, status=400)
