from odoo import http

from ..services.dashboard_api_service import DashboardApiService

service = DashboardApiService()


class CondomeDashboardController(http.Controller):
    """Rutas agregadas para el dashboard administrativo."""

    @http.route("/condome_api/owner/dashboard/summary/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False)
    def summary(self, **kwargs):
        return service.handle_summary()

