from odoo import http

from odoo.addons.condome_core.services.base_api_service import BaseApiService

service = BaseApiService()


class CondomeApiGatewayController(http.Controller):
    """Responde preflight global para el namespace histórico de la API."""

    @http.route("/condome_api/<path:anything>", type="http", auth="public", methods=["OPTIONS"], csrf=False, cors="http://localhost:3000")
    def options(self, **kwargs):
        return service.build_response({"ok": True})
