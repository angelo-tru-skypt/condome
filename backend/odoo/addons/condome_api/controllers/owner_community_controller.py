from odoo import http
from odoo.http import request

from ..services.owner_community_service import OwnerCommunityService

service = OwnerCommunityService()


class OwnerCommunityController(http.Controller):
    """Controlador delgado para comunidad, reservas y auditoría."""

    @http.route("/condome_api/owner/comunicados/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def announcements(self, **kwargs):
        return service.handle_announcements()

    @http.route("/condome_api/owner/comunicados/<int:comunicado_id>", type="http", auth="public", methods=["PUT", "DELETE", "OPTIONS"], csrf=False, cors="*")
    def announcement_update(self, comunicado_id, **kwargs):
        if request.httprequest.method == "DELETE":
            return service.handle_announcement_delete(comunicado_id)
        return service.handle_announcement_update(comunicado_id)

    @http.route("/condome_api/owner/areas-comunes/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def common_areas(self, **kwargs):
        return service.handle_common_areas()

    @http.route("/condome_api/owner/areas-comunes/<int:area_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def common_area_update(self, area_id, **kwargs):
        return service.handle_common_area_update(area_id)

    @http.route("/condome_api/owner/reservas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def reservations(self, **kwargs):
        return service.handle_reservations()

    @http.route("/condome_api/owner/reservas/<int:reservation_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def reservation_update(self, reservation_id, **kwargs):
        return service.handle_reservation_update(reservation_id)

    @http.route("/condome_api/owner/auditoria/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="*")
    def audit_entries(self, **kwargs):
        return service.handle_audit_entries()
