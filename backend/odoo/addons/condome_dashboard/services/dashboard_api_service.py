import logging

from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class DashboardApiService(BaseApiService):
    """Construye un resumen administrativo sin duplicar lógica de negocio."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_summary(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()

            # Permitir filtrar por `condominio_id` vía query string cuando se pase.
            condominio_id = request.httprequest.args.get("condominio_id")
            if condominio_id:
                try:
                    condominio = self.get_condominio(int(condominio_id), user)
                    condominios = request.env["condome.condominio"].sudo().browse([condominio.id])
                except Exception:
                    # Fallback a dominio por permisos si no se encuentra o no tiene acceso
                    condominios = request.env["condome.condominio"].sudo().search(self.condominio_domain(user))
            else:
                condominios = request.env["condome.condominio"].sudo().search(self.condominio_domain(user))

            condominio_ids = condominios.ids

            def count(model_name, extra_domain=None):
                domain = list(extra_domain or [])
                if condominio_ids:
                    domain.append(("condominio_id", "in", condominio_ids))
                return request.env[model_name].sudo().search_count(domain)

            payload = {
                "totals": {
                    "condominios": len(condominios),
                    "edificios": count("condome.edificio"),
                    "apartamentos": count("condome.apartamento"),
                    "residentes": count("condome.residente"),
                    "propietarios": count("condome.propietario"),
                    "vehiculos": count("condome.vehiculo"),
                    "documentos": count("condome.documento"),
                    "areas_comunes": count("condome.common.area"),
                },
                "queues": {
                    "visitas_pendientes": count("condome.visita", [("estado", "=", "pendiente")]),
                    "incidencias_abiertas": count("condome.incidencia", [("estado", "in", ["reportada", "en_revision"])]),
                    "reservas_pendientes": count("condome.area.reservation", [("estado", "=", "pending")]),
                    "notificaciones_no_leidas": count("condome.notification", [("read", "=", False)]),
                },
                "condominios": [self.serialize_condominio(record) for record in condominios],
            }
            return self.build_response({"data": payload})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Dashboard summary failed")
            return self.error_response(error, status=400)
