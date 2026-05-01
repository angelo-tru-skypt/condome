from odoo import http

from ..services.property_structure_service import PropertyStructureService

service = PropertyStructureService()


class PropertyStructureController(http.Controller):
    """Controlador delgado para la estructura principal del condominio."""

    @http.route("/condome_api/<path:anything>", type="http", auth="public", methods=["OPTIONS"], csrf=False, cors="*")
    def options(self, **kwargs):
        return service.handle_options()

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

    @http.route("/condome_api/condominios/<int:condominio_id>/residentes/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="*")
    def residents(self, condominio_id, **kwargs):
        return service.handle_residents(condominio_id)

    @http.route("/condome_api/apartamentos/<int:apartamento_id>/residentes/", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="*")
    def create_resident(self, apartamento_id, **kwargs):
        return service.handle_resident_creation(apartamento_id)
