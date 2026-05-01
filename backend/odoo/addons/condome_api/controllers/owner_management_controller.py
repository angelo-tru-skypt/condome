from odoo import http

from ..services.owner_management_service import OwnerManagementService

service = OwnerManagementService()


class OwnerManagementController(http.Controller):
    """Controlador delgado para catálogos administrativos del owner."""

    @http.route("/condome_api/owner/<path:anything>", type="http", auth="public", methods=["OPTIONS"], csrf=False, cors="*")
    def options(self, **kwargs):
        return service.build_response({"ok": True})

    @http.route("/condome_api/owner/propietarios/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def owners(self, **kwargs):
        return service.handle_owners()

    @http.route("/condome_api/owner/propietarios/<int:propietario_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def owner_update(self, propietario_id, **kwargs):
        return service.handle_owner_update(propietario_id)

    @http.route("/condome_api/owner/documentos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def documents(self, **kwargs):
        return service.handle_documents()

    @http.route("/condome_api/owner/documentos/<int:documento_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def document_update(self, documento_id, **kwargs):
        return service.handle_document_update(documento_id)

    @http.route("/condome_api/owner/configuracion/", type="http", auth="public", methods=["GET", "PUT", "OPTIONS"], csrf=False, cors="*")
    def settings(self, **kwargs):
        return service.handle_settings()

    @http.route("/condome_api/owner/notificaciones/reglas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def notification_rules(self, **kwargs):
        return service.handle_notification_rules()

    @http.route("/condome_api/owner/notificaciones/reglas/<int:rule_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def notification_rule_update(self, rule_id, **kwargs):
        return service.handle_notification_rule_update(rule_id)

    @http.route("/condome_api/owner/acceso/politicas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def access_policies(self, **kwargs):
        return service.handle_access_policies()

    @http.route("/condome_api/owner/acceso/politicas/<int:policy_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def access_policy_update(self, policy_id, **kwargs):
        return service.handle_access_policy_update(policy_id)

    @http.route("/condome_api/owner/notificaciones/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def notifications(self, **kwargs):
        return service.handle_notifications()

    @http.route("/condome_api/owner/notificaciones/<int:notification_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def notification_update(self, notification_id, **kwargs):
        return service.handle_notification_update(notification_id)

    @http.route("/condome_api/owner/vehiculos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="*")
    def vehicles(self, **kwargs):
        return service.handle_vehicles()

    @http.route("/condome_api/owner/vehiculos/<int:vehiculo_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False, cors="*")
    def vehicle_update(self, vehiculo_id, **kwargs):
        return service.handle_vehicle_update(vehiculo_id)
