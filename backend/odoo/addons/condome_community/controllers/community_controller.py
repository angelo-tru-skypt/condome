from odoo import http

from ..services.community_management_service import CommunityManagementService
from ..services.community_operations_service import CommunityOperationsService
from ..services.owner_incident_service import OwnerIncidentService
from ..services.resident_incident_service import ResidentIncidentService

resident_incident_service = ResidentIncidentService()
owner_incident_service = OwnerIncidentService()
community_management_service = CommunityManagementService()
community_operations_service = CommunityOperationsService()


class CondomeCommunityController(http.Controller):
    """Rutas del dominio comunitario y administrativo no financiero."""

    @http.route("/condome_api/resident/incidencias/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def resident_incidents(self, **kwargs):
        return resident_incident_service.handle_incidents()

    @http.route("/condome_api/owner/incidencias/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def owner_incidents(self, **kwargs):
        return owner_incident_service.handle_incidents()

    @http.route("/condome_api/owner/incidencias/<int:incidencia_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def owner_incident_update(self, incidencia_id, **kwargs):
        return owner_incident_service.handle_incident_update(incidencia_id)

    @http.route("/condome_api/owner/documentos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def documents(self, **kwargs):
        return community_management_service.handle_documents()

    @http.route("/condome_api/owner/documentos/<int:documento_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def document_update(self, documento_id, **kwargs):
        return community_management_service.handle_document_update(documento_id)

    @http.route("/condome_api/owner/configuracion/", type="http", auth="public", methods=["GET", "PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def settings(self, **kwargs):
        return community_management_service.handle_settings()

    @http.route("/condome_api/owner/notificaciones/reglas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def notification_rules(self, **kwargs):
        return community_management_service.handle_notification_rules()

    @http.route("/condome_api/owner/notificaciones/reglas/<int:rule_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def notification_rule_update(self, rule_id, **kwargs):
        return community_management_service.handle_notification_rule_update(rule_id)

    @http.route("/condome_api/owner/comunicados/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def communications(self, **kwargs):
        return community_operations_service.handle_announcements()

    @http.route("/condome_api/owner/comunicados/<int:comunicado_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def communication_update(self, comunicado_id, **kwargs):
        return community_operations_service.handle_announcement_update(comunicado_id)

    @http.route("/condome_api/owner/areas-comunes/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def common_areas(self, **kwargs):
        return community_operations_service.handle_common_areas()

    @http.route("/condome_api/owner/areas-comunes/<int:area_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def common_area_update(self, area_id, **kwargs):
        return community_operations_service.handle_common_area_update(area_id)

    @http.route("/condome_api/owner/reservas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def reservations(self, **kwargs):
        return community_operations_service.handle_reservations()

    @http.route("/condome_api/owner/reservas/<int:reservation_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def reservation_update(self, reservation_id, **kwargs):
        return community_operations_service.handle_reservation_update(reservation_id)

    @http.route("/condome_api/owner/auditoria/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def audit_entries(self, **kwargs):
        return community_operations_service.handle_audit_entries()
