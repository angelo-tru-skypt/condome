import json
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class PaymentController(http.Controller):
    """Controlador para gestionar flujos de pago desde el frontend."""

    @http.route("/condome_api/payments/methods", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def get_payment_methods(self, **kwargs):
        """Retorna los métodos de pago disponibles para el condominio."""
        if request.httprequest.method == "OPTIONS":
            return request.make_response("", headers=[("Access-Control-Allow-Origin", "http://localhost:3000"), ("Access-Control-Allow-Methods", "GET, OPTIONS"), ("Access-Control-Allow-Headers", "Content-Type")])

        # Opciones manuales configuradas para la cuenta central
        methods = [
            {"id": "transferencia", "name": "Transferencia Bancaria (Manual)", "icon": "bank"},
            {"id": "efectivo", "name": "Efectivo / Oficina Central", "icon": "cash-stack"},
        ]
        return request.make_response(
            json.dumps({"ok": True, "data": methods}),
            headers=[("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "http://localhost:3000")]
        )

    @http.route("/condome_api/payments/initiate", type="json", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def initiate_payment(self, **kwargs):
        """Inicia un proceso de pago. Por ahora redirige al flujo manual de Odoo."""
        data = request.jsonrequest
        charge_ids = data.get("charge_ids", [])
        
        charges = request.env["condome.charge"].sudo().browse(charge_ids)
        if not charges:
            return {"ok": False, "error": "No se encontraron cargos válidos."}

        total = sum(charges.mapped("amount"))
        
        # En esta fase, solo soportamos flujo de reporte manual para Odoo
        return {
            "ok": True,
            "provider": "manual",
            "instructions": "Realice el pago a la cuenta central y registre la referencia en el portal.",
            "amount": total,
        }

    @http.route("/condome_api/payments/webhook/stripe", type="json", auth="public", methods=["POST"], csrf=False)
    def stripe_webhook(self, **kwargs):
        """Webhook para recibir confirmaciones de Stripe."""
        data = request.jsonrequest
        # Lógica de validación de firma y actualización de cargos
        _logger.info("Recibido webhook de Stripe: %s", data)
        return {"status": "success"}
