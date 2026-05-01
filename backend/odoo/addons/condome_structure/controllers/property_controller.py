from odoo import http

from ..services.property_api_service import PropertyApiService

service = PropertyApiService()


class CondomePropertyController(http.Controller):
    """Rutas del dominio estructural del condominio."""

    @http.route("/condome_api/condominios/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def condominiums(self, **kwargs):
        return service.handle_condominiums()

    @http.route("/condome_api/condominios/<int:condominio_id>", type="http", auth="public", methods=["GET", "PUT", "DELETE", "OPTIONS"], csrf=False, cors="*")
    def condominium_detail(self, condominio_id, **kwargs):
        return service.handle_condominium_detail(condominio_id)

    @http.route("/condome_api/condominios/<int:condominio_id>/edificios/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def buildings(self, condominio_id, **kwargs):
        return service.handle_buildings(condominio_id)

    @http.route("/condome_api/condominios/<int:condominio_id>/apartamentos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def apartments(self, condominio_id, **kwargs):
        return service.handle_apartments(condominio_id)
