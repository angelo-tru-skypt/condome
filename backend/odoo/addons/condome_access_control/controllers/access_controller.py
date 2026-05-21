from odoo import http

from ..services.access_api_service import AccessApiService

service = AccessApiService()


class CondomeAccessController(http.Controller):
    """Rutas del dominio de control de acceso y operación de entrada."""

    @http.route("/condome_api/resident/visitas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False)
    def resident_visits(self, **kwargs):
        return service.handle_resident_visits()

    @http.route("/condome_api/owner/visitas/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False)
    def owner_visits(self, **kwargs):
        return service.handle_owner_visits()

    @http.route("/condome_api/owner/visitas/<int:visita_id>/decision", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False)
    def owner_visit_decision(self, visita_id, **kwargs):
        return service.handle_visit_decision(visita_id)

    @http.route("/condome_api/owner/notificaciones/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False)
    def owner_notifications(self, **kwargs):
        return service.handle_notifications()

    @http.route("/condome_api/owner/notificaciones/<int:notification_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False)
    def owner_notification_update(self, notification_id, **kwargs):
        return service.handle_notification_update(notification_id)

    @http.route("/condome_api/owner/notificaciones/<int:notification_id>/read", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False)
    def owner_notification_read(self, notification_id, **kwargs):
        return service.handle_notification_read(notification_id)

    @http.route("/condome_api/owner/acceso/politicas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False)
    def access_policies(self, **kwargs):
        return service.handle_access_policies()

    @http.route("/condome_api/owner/acceso/politicas/<int:policy_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False)
    def access_policy_update(self, policy_id, **kwargs):
        return service.handle_access_policy_update(policy_id)

    @http.route("/condome_api/owner/vehiculos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False)
    def vehicles(self, **kwargs):
        return service.handle_vehicles()

    @http.route("/condome_api/owner/vehiculos/<int:vehiculo_id>", type="http", auth="public", methods=["PUT", "OPTIONS"], csrf=False)
    def vehicle_update(self, vehiculo_id, **kwargs):
        return service.handle_vehicle_update(vehiculo_id)

