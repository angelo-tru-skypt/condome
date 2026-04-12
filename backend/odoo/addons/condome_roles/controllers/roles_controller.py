from odoo import http

from ..services.role_api_service import RoleApiService

service = RoleApiService()


class CondomeRolesController(http.Controller):
    """Expone un catalogo simple de roles y permisos visibles para el admin."""

    @http.route("/condome_api/owner/roles/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def roles_catalog(self, **kwargs):
        return service.handle_roles_catalog()
