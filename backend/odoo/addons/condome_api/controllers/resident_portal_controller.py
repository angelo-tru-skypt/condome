from odoo import http

from ..services.resident_portal_service import ResidentPortalService

service = ResidentPortalService()


class ResidentPortalController(http.Controller):
    """Controlador delgado para las acciones del residente autenticado."""

    @http.route("/condome_api/resident/context/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def context(self, **kwargs):
        return service.handle_context()

    @http.route("/condome_api/resident/visitas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def visits(self, **kwargs):
        return service.handle_visits()

    @http.route("/condome_api/resident/incidencias/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def incidents(self, **kwargs):
        return service.handle_incidents()
