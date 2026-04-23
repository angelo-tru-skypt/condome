from odoo import http

from ..services.billing_api_service import BillingApiService

service = BillingApiService()


class CondomeBillingController(http.Controller):
    """Agrupa rutas financieras sin contaminar otros dominios del sistema."""

    @http.route("/condome_api/owner/cuotas/plantillas/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def fee_templates(self, **kwargs):
        return service.handle_fee_templates()

    @http.route("/condome_api/owner/cuotas/plantillas/<int:template_id>", type="http", auth="public", methods=["PUT", "DELETE", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def fee_template_update(self, template_id, **kwargs):
        if request.httprequest.method == "DELETE":
            return service.handle_fee_template_delete(template_id)
        return service.handle_fee_template_update(template_id)

    @http.route("/condome_api/owner/cuotas/cargos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def charges(self, **kwargs):
        return service.handle_charges()

    @http.route("/condome_api/owner/cuotas/cargos/<int:charge_id>", type="http", auth="public", methods=["PUT", "DELETE", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def charge_update(self, charge_id, **kwargs):
        if request.httprequest.method == "DELETE":
            return service.handle_charge_delete(charge_id)
        return service.handle_charge_update(charge_id)

    @http.route("/condome_api/owner/cuotas/resumen/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def billing_summary(self, **kwargs):
        return service.handle_billing_summary()

    @http.route("/condome_api/owner/pagos/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def payments(self, **kwargs):
        return service.handle_payments()

    @http.route("/condome_api/owner/historial-pagos/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def payment_history(self, **kwargs):
        return service.handle_payment_history()

    @http.route("/condome_api/owner/morosidad/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def delinquency(self, **kwargs):
        return service.handle_delinquency()

    @http.route("/condome_api/propietario/pagos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def property_owner_payments(self, **kwargs):
        return service.handle_property_owner_payments()

    @http.route("/condome_api/propietario/historial-pagos/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def property_owner_payment_history(self, **kwargs):
        return service.handle_property_owner_payment_history()

    @http.route("/condome_api/resident/pagos/", type="http", auth="public", methods=["GET", "POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def resident_payments(self, **kwargs):
        return service.handle_resident_payments()

    @http.route("/condome_api/resident/historial-pagos/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def resident_payment_history(self, **kwargs):
        return service.handle_resident_payment_history()

    @http.route("/condome_api/resident/cuotas/plantillas/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def resident_templates(self, **kwargs):
        return service.handle_resident_templates()

    @http.route("/condome_api/propietario/cuotas/plantillas/", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def property_owner_templates(self, **kwargs):
        return service.handle_property_owner_templates()
