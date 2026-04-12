from odoo import http

from ..services.owner_workflow_service import OwnerWorkflowService

service = OwnerWorkflowService()


class OwnerWorkflowController(http.Controller):
    """Controlador delgado para decisiones del owner sobre operación diaria."""

    @http.route("/condome_api/owner/visitas/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def visits(self, **kwargs):
        return service.handle_visits()

    @http.route("/condome_api/owner/visitas/<int:visita_id>/decision", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def visit_decision(self, visita_id, **kwargs):
        return service.handle_visit_decision(visita_id)

    @http.route("/condome_api/owner/incidencias/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def incidents(self, **kwargs):
        return service.handle_incidents()

    @http.route("/condome_api/owner/incidencias/<int:incidencia_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def incident_update(self, incidencia_id, **kwargs):
        return service.handle_incident_update(incidencia_id)

    @http.route("/condome_api/owner/notificaciones/<int:notification_id>/read", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def mark_notification_read(self, notification_id, **kwargs):
        return service.handle_notification_read(notification_id)
