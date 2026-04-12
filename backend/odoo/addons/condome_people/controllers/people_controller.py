from odoo import http

from ..services.people_api_service import PeopleApiService

service = PeopleApiService()


class CondomePeopleController(http.Controller):
    """Rutas para residentes y propietarios."""

    @http.route("/condome_api/resident/context/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def resident_context(self, **kwargs):
        return service.handle_resident_context()

    @http.route("/condome_api/condominios/<int:condominio_id>/residentes/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def residents(self, condominio_id, **kwargs):
        return service.handle_residents(condominio_id)

    @http.route("/condome_api/apartamentos/<int:apartamento_id>/residentes/", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def create_resident(self, apartamento_id, **kwargs):
        return service.handle_resident_creation(apartamento_id)

    @http.route("/condome_api/owner/propietarios/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def owners(self, **kwargs):
        return service.handle_owners()

    @http.route("/condome_api/owner/propietarios/<int:propietario_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def owner_update(self, propietario_id, **kwargs):
        return service.handle_owner_update(propietario_id)
