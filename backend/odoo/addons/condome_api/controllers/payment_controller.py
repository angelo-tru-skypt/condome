import json
import logging
from odoo import http
from odoo.http import request
from ..services.payment_api_service import PaymentApiService

_logger = logging.getLogger(__name__)

class PaymentController(http.Controller):
    """Controlador que delega la gestión de pagos al servicio dedicado."""

    @http.route("/condome_api/payments/methods", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def get_payment_methods(self, **kwargs):
        """Retorna los métodos de pago disponibles incluyento Stripe."""
        if request.httprequest.method == "OPTIONS":
            return request.make_response("", headers=[
                ("Access-Control-Allow-Origin", "http://localhost:3000"),
                ("Access-Control-Allow-Methods", "GET, OPTIONS"),
                ("Access-Control-Allow-Headers", "Content-Type, Authorization")
            ])

        condominio_id = request.httprequest.args.get("condominio_id")
        methods = PaymentApiService.get_available_methods(request.env, condominio_id)
        return request.make_response(
            json.dumps({"ok": True, "data": methods}),
            headers=[("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "http://localhost:3000")]
        )

    @http.route("/condome_api/payments/initiate", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def initiate_payment(self, **kwargs):
        """Inicia un proceso de pago delegando al servicio."""
        if request.httprequest.method == "OPTIONS":
            return request.make_response("", headers=[
                ("Access-Control-Allow-Origin", "http://localhost:3000"),
                ("Access-Control-Allow-Methods", "POST, OPTIONS"),
                ("Access-Control-Allow-Headers", "Content-Type, Authorization")
            ])

        try:
            data = json.loads(request.httprequest.data)
        except:
            data = {}
            
        charge_ids = data.get("charge_ids", [])
        method = data.get("method", "stripe")
        
        result = {}
        if method == "stripe":
            result = PaymentApiService.create_stripe_intent(request.env, charge_ids, request.env.user)
        else:
            # Fallback para métodos manuales
            charges = request.env["condome.charge"].sudo().browse(charge_ids)
            total = sum(charges.mapped("amount"))
            result = {
                "ok": True,
                "provider": "manual",
                "instructions": "Realice el pago a la cuenta central y registre la referencia.",
                "amount": total,
            }
            
        return request.make_response(
            json.dumps(result),
            headers=[("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "http://localhost:3000")]
        )

    @http.route("/condome_api/payments/webhook/stripe", type="http", auth="public", methods=["POST"], csrf=False)
    def stripe_webhook(self, **kwargs):
        """Webhook para recibir confirmaciones de Stripe."""
        try:
            data = json.loads(request.httprequest.data)
            PaymentApiService.handle_stripe_webhook(request.env, data)
        except Exception as e:
            _logger.error("Error en Webhook Stripe: %s", str(e))
            return request.make_response(json.dumps({"status": "error", "message": str(e)}), status=400)
            
        return request.make_response(json.dumps({"status": "success"}), headers=[("Content-Type", "application/json")])
