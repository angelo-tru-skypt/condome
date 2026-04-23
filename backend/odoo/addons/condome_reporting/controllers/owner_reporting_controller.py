from odoo import http

from ..services.owner_reporting_api_service import OwnerReportingApiService

service = OwnerReportingApiService()


class OwnerReportingController(http.Controller):
    """Entrega resumenes y solicitudes de exportacion bajo prefijo owner/."""

    @http.route("/condome_api/owner/reportes/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def reports_summary(self, **kwargs):
        return service.handle_reports_summary()

    @http.route("/condome_api/owner/reportes/exportaciones/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def report_exports(self, **kwargs):
        return service.handle_export_requests()

    @http.route("/condome_api/owner/reportes/exportaciones/<int:export_id>", type="http", auth="public", methods=["DELETE", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def report_exports_delete(self, export_id, **kwargs):
        return service.handle_export_delete(export_id)

    @http.route("/condome_api/report/download/<int:export_id>", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def download_report(self, export_id, **kwargs):
        return service.handle_report_download(export_id)
