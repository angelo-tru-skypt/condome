import json
import logging
from odoo import http
from odoo.http import request
from odoo.addons.condome_core.services.base_api_service import BaseApiService
from ..services.payment_api_service import PaymentApiService

_logger = logging.getLogger(__name__)
gateway = BaseApiService()

class PaymentController(http.Controller):
    """Controlador que delega la gestión de pagos al servicio dedicado."""

    @http.route("/condome_api/payments/methods", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="*")
    def get_payment_methods(self, **kwargs):
        """Retorna los métodos de pago disponibles incluyento Stripe."""
        if request.httprequest.method == "OPTIONS":
            return gateway.build_response({"ok": True})
        try:
            condominio_id = request.httprequest.args.get("condominio_id")
            methods = PaymentApiService.get_available_methods(request.env, condominio_id)
            return gateway.build_response({"ok": True, "data": methods})
        except Exception as error:  # pragma: no cover
            return gateway.error_response(str(error), status=400)

    @http.route("/condome_api/payments/initiate", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="*")
    def initiate_payment(self, **kwargs):
        """Inicia un proceso de pago delegando al servicio."""
        if request.httprequest.method == "OPTIONS":
            return gateway.build_response({"ok": True})

        try:
            user = gateway.require_session()
            data = gateway.read_payload()
            charge_ids = data.get("charge_ids", [])
            template_id = data.get("template_id")
            method = data.get("method", "stripe")

            if template_id:
                from odoo import fields
                template = request.env["condome.fee.template"].sudo().browse(int(template_id))
                if template.exists():
                    charge = request.env["condome.charge"].sudo().create({
                        "name": f"Cobro Cuota: {template.name}",
                        "condominio_id": template.condominio_id.id,
                        "apartamento_id": template.apartamento_id.id,
                        "propietario_id": template.propietario_id.id,
                        "residente_id": template.residente_id.id,
                        "partner_id": template.propietario_id.partner_id.id or template.residente_id.partner_id.id or user.partner_id.id,
                        "fee_template_id": template.id,
                        "amount": template.amount,
                        "due_date": fields.Date.today(),
                        "state": "pending",
                    })
                    charge_ids = [charge.id]

            if method == "stripe":
                result = PaymentApiService.create_stripe_intent(request.env, charge_ids, user)
                if charge_ids and result.get("ok"):
                    result["charge_id"] = charge_ids[0]
            else:
                charges = request.env["condome.charge"].sudo().browse(charge_ids)
                total = sum(charges.mapped("amount"))
                result = {
                    "ok": True,
                    "provider": "manual",
                    "instructions": "Realice el pago a la cuenta central y registre la referencia.",
                    "amount": total,
                }
                if charge_ids:
                    result["charge_id"] = charge_ids[0]

            status = 200 if result.get("ok") else 400
            return gateway.build_response(result, status=status)
        except PermissionError as error:
            return gateway.error_response(str(error), status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Payment initiation failed")
            return gateway.error_response(str(error), status=400)

    @http.route("/condome_api/payments/webhook/stripe", type="http", auth="public", methods=["POST"], csrf=False)
    def stripe_webhook(self, **kwargs):
        """Webhook para recibir confirmaciones de Stripe."""
        try:
            data = json.loads(request.httprequest.data)
            PaymentApiService.handle_stripe_webhook(request.env, data)
        except Exception as e:
            _logger.error("Error en Webhook Stripe: %s", str(e))
            return gateway.build_response({"status": "error", "message": str(e)}, status=400)

        return gateway.build_response({"status": "success"})

    @http.route("/condome_api/payments/plan/initiate", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="*")
    def initiate_plan_payment(self, **kwargs):
        if request.httprequest.method == "OPTIONS":
            return gateway.build_response({"ok": True})

        try:
            user = gateway.require_session()
            data = gateway.read_payload()
            plan_id = data.get("plan_id")
            result = PaymentApiService.create_plan_stripe_intent(request.env, plan_id, user)
            status = 200 if result.get("ok") else 400
            return gateway.build_response(result, status=status)
        except PermissionError as error:
            return gateway.error_response(str(error), status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Plan payment initiation failed")
            return gateway.error_response(str(error), status=400)

    @http.route("/condome_api/payments/plan/confirm", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="*")
    def confirm_plan_payment(self, **kwargs):
        if request.httprequest.method == "OPTIONS":
            return gateway.build_response({"ok": True})

        try:
            user = gateway.require_session()
            data = gateway.read_payload()
            payment_intent_id = data.get("payment_intent_id")
            result = PaymentApiService.confirm_plan_payment(request.env, payment_intent_id, user)
            status = 200 if result.get("ok") else 400
            return gateway.build_response(result, status=status)
        except PermissionError as error:
            return gateway.error_response(str(error), status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Plan payment confirmation failed")
            return gateway.error_response(str(error), status=400)
