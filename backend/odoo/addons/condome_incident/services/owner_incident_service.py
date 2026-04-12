import logging

from odoo import _, fields
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class OwnerIncidentService(BaseApiService):
    """Gestiona la revisión administrativa de incidencias del condominio."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_incidents(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            status_filter = self.clean_str(request.httprequest.args.get("estado"))
            domain = self.owner_domain(user)
            if status_filter:
                domain.append(("estado", "=", status_filter))
            records = request.env["condome.incidencia"].sudo().search(domain, order="create_date desc, id desc")
            return self.build_response({"data": [self.serialize_incidencia(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Incident owner flow failed")
            return self.error_response(error, status=400)

    def handle_incident_update(self, incidencia_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            incident = self.get_owner_incidencia(incidencia_id, user)
            payload = self.read_payload()
            status = self.clean_str(payload.get("estado")) or incident.estado
            if status not in {"reportada", "en_revision", "resuelta", "cerrada"}:
                return self.error_response(_("El estado indicado no es valido"))

            values = {
                "estado": status,
                "respuesta_propietario": self.clean_str(payload.get("respuesta_propietario")),
            }
            values["fecha_resolucion"] = fields.Datetime.now() if status in {"resuelta", "cerrada"} else False
            incident.write(values)
            return self.build_response({"data": self.serialize_incidencia(incident)})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Incident owner update failed")
            return self.error_response(error, status=400)
