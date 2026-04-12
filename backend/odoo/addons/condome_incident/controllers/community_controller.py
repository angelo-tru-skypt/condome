from odoo import http

from ..services.owner_incident_service import OwnerIncidentService
from ..services.resident_incident_service import ResidentIncidentService

resident_incident_service = ResidentIncidentService()
owner_incident_service = OwnerIncidentService()


class CondomeIncidentController(http.Controller):
    """Rutas del RF de incidencias y sus estados."""

    @http.route("/condome_api/resident/incidencias/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def resident_incidents(self, **kwargs):
        return resident_incident_service.handle_incidents()

    @http.route("/condome_api/owner/incidencias/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def owner_incidents(self, **kwargs):
        return owner_incident_service.handle_incidents()

    @http.route("/condome_api/owner/incidencias/<int:incidencia_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def owner_incident_update(self, incidencia_id, **kwargs):
        return owner_incident_service.handle_incident_update(incidencia_id)
