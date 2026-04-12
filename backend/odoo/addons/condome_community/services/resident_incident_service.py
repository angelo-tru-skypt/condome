import logging

from odoo import _
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class ResidentIncidentService(BaseApiService):
    """Gestiona el reporte y consulta de incidencias desde el portal residente."""

    def handle_context(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            resident = self.resident_for_user(user)
            return self.build_response({"data": self.serialize_resident_context(resident)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Resident portal context failed")
            return self.error_response(error, status=400)

    def handle_visits(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            _logger.exception("Resident portal visits failed")
            return self.error_response(error, status=400)

    def handle_incidents(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            resident = self.resident_for_user(user)
            model = request.env["condome.incidencia"].sudo()

            if request.httprequest.method == "GET":
                records = model.search([("residente_id", "=", resident.id)], order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_incidencia(record) for record in records]})

            payload = self.read_payload()
            title = self.clean_str(payload.get("titulo"))
            description = self.clean_str(payload.get("descripcion"))
            location_type = self.clean_str(payload.get("ubicacion_tipo")) or "apartamento"
            if not title or not description:
                return self.error_response(_("Titulo y descripcion son requeridos"))
            if location_type not in {"apartamento", "edificio"}:
                return self.error_response(_("La ubicacion seleccionada no es valida"))

            building = resident.edificio_id
            if location_type == "edificio":
                building_id = payload.get("edificio_id")
                building = request.env["condome.edificio"].sudo().search(
                    [("id", "=", int(building_id or 0)), ("condominio_id", "=", resident.condominio_id.id)],
                    limit=1,
                )
                if not building:
                    return self.error_response(_("Debes seleccionar un edificio valido para esta incidencia"))

            record = model.create(
                {
                    "titulo": title,
                    "descripcion": description,
                    "ubicacion_tipo": location_type,
                    "categoria": payload.get("categoria") or "mantenimiento",
                    "prioridad": payload.get("prioridad") or "media",
                    "ubicacion_detalle": self.clean_str(payload.get("ubicacion_detalle")),
                    "residente_id": resident.id,
                    "apartamento_id": resident.apartamento_id.id,
                    "edificio_id": building.id,
                }
            )
            self.create_incident_notification(resident, record)
            return self.build_response({"data": self.serialize_incidencia(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Resident portal incidents failed")
            return self.error_response(error, status=400)
