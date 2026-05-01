from odoo import http

from ..services.community_management_service import CommunityManagementService
from ..services.community_operations_service import CommunityOperationsService

management_service = CommunityManagementService()
operations_service = CommunityOperationsService()


class CondomeGovernanceController(http.Controller):
    """Rutas de gobierno, comunicación, auditoría y configuración."""

    @http.route("/condome_api/owner/documentos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def documents(self, **kwargs):
        return management_service.handle_documents()

    @http.route("/condome_api/owner/documentos/<int:documento_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def document_update(self, documento_id, **kwargs):
        return management_service.handle_document_update(documento_id)

    @http.route("/condome_api/owner/configuracion/", type="http", auth="public", methods=["GET", "PUT", "OPTIONS"], csrf=False, cors="*")
    def settings(self, **kwargs):
        return management_service.handle_settings()

    @http.route("/condome_api/owner/notificaciones/reglas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def notification_rules(self, **kwargs):
        return management_service.handle_notification_rules()

    @http.route("/condome_api/owner/notificaciones/reglas/<int:rule_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def notification_rule_update(self, rule_id, **kwargs):
        return management_service.handle_notification_rule_update(rule_id)

    @http.route("/condome_api/owner/comunicados/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def communications(self, **kwargs):
        return operations_service.handle_announcements()

    @http.route("/condome_api/owner/comunicados/<int:comunicado_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def communication_update(self, comunicado_id, **kwargs):
        return operations_service.handle_announcement_update(comunicado_id)

    @http.route("/condome_api/owner/auditoria/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="*")
    def audit_entries(self, **kwargs):
        return operations_service.handle_audit_entries()
