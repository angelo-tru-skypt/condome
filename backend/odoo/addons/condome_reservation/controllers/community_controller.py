from odoo import http

from ..services.community_operations_service import CommunityOperationsService

service = CommunityOperationsService()


class CondomeReservationController(http.Controller):
    """Rutas del RF de reservas de áreas comunes."""

    @http.route("/condome_api/owner/areas-comunes/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def common_areas(self, **kwargs):
        return service.handle_common_areas()

    @http.route("/condome_api/owner/areas-comunes/<int:area_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def common_area_update(self, area_id, **kwargs):
        return service.handle_common_area_update(area_id)

    @http.route("/condome_api/owner/reservas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def reservations(self, **kwargs):
        return service.handle_reservations()

    @http.route("/condome_api/owner/reservas/<int:reservation_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def reservation_update(self, reservation_id, **kwargs):
        return service.handle_reservation_update(reservation_id)
