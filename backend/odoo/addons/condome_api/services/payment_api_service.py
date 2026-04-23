import logging
import os
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None
    STRIPE_AVAILABLE = False

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    load_dotenv = None
    DOTENV_AVAILABLE = False
from odoo import fields

_logger = logging.getLogger(__name__)

# Cargar variables de entorno
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env")
if DOTENV_AVAILABLE:
    load_dotenv(ENV_PATH)

if STRIPE_AVAILABLE:
    stripe.api_key = os.getenv("SECRET_KEY")

class PaymentApiService:
    """Servicio de lógica de negocio para pasarelas de pago (Stripe)."""

    @staticmethod
    def get_available_methods(env=None, condominio_id=None):
        """Retorna los métodos de pago configurados."""
        methods = []
        
        if STRIPE_AVAILABLE:
            methods.append({
                "id": "stripe", 
                "name": "Tarjeta de Crédito / Débito (Stripe)", 
                "icon": "credit-card-fill",
                "published_key": os.getenv("PUBLISHED_KEY")
            })
            
        # Buscar info bancaria si tenemos contexto
        bank_info = {}
        if env and condominio_id:
            config = env["condome.configuracion"].sudo().search([("condominio_id", "=", int(condominio_id))], limit=1)
            if config:
                bank_info = {
                    "bank_name": config.bank_name or "Banco no configurado",
                    "account_number": config.bank_account_number or "",
                    "account_type": config.bank_account_type or "",
                    "account_holder": config.bank_account_holder or ""
                }

        methods.extend([
            {
                "id": "transferencia", 
                "name": "Transferencia Bancaria", 
                "icon": "bank",
                "bank_info": bank_info
            },
            {"id": "efectivo", "name": "Efectivo / Oficina", "icon": "cash-stack"},
        ])
        return methods

    @staticmethod
    def create_stripe_intent(env, charge_ids, user):
        """Crea un PaymentIntent en Stripe para un conjunto de cargos."""
        if not STRIPE_AVAILABLE:
            return {"ok": False, "error": "La librería de Stripe no está instalada en el servidor. Contacte al administrador."}

        charges = env["condome.charge"].sudo().browse(charge_ids)
        if not charges:
            return {"ok": False, "error": "No se encontraron cargos válidos."}

        total = sum(charges.mapped("amount"))
        
        # Intentar obtener o crear cliente de Stripe
        stripe_customer_id = None
        residente = env["condome.residente"].sudo().search([("user_id", "=", user.id)], limit=1)
        
        if residente and STRIPE_AVAILABLE:
            if residente.stripe_customer_id:
                stripe_customer_id = residente.stripe_customer_id
            else:
                try:
                    customer = stripe.Customer.create(
                        email=residente.email or user.login,
                        name=residente.name,
                        metadata={"residente_id": residente.id}
                    )
                    stripe_customer_id = customer.id
                    residente.write({"stripe_customer_id": stripe_customer_id})
                except Exception as ce:
                    _logger.warning("Error creating Stripe customer: %s", str(ce))

        try:
            # Crear Intent con la versión instalada (15.0.1)
            intent_args = {
                "amount": int(total * 100),
                "currency": "usd",
                "metadata": {
                    "charge_ids": ",".join(map(str, charge_ids)),
                    "condominio_id": charges[0].condominio_id.id,
                    "user_id": user.id if user else 0,
                    "integration": "condome_v1"
                }
            }
            if stripe_customer_id:
                intent_args["customer"] = stripe_customer_id
                intent_args["setup_future_usage"] = "off_session"

            intent = stripe.PaymentIntent.create(**intent_args)
            return {
                "ok": True,
                "provider": "stripe",
                "client_secret": intent.client_secret,
                "amount": total,
            }
        except Exception as e:
            _logger.error("Stripe Service Error: %s", str(e))
            return {"ok": False, "error": str(e)}

    @staticmethod
    def handle_stripe_webhook(env, event_data):
        """Procesa los eventos entrantes de Stripe para actualizar cargos."""
        event_type = event_data.get("type")
        
        if event_type == "payment_intent.succeeded":
            intent = event_data.get("data", {}).get("object", {})
            charge_ids_raw = intent.get("metadata", {}).get("charge_ids", "")
            
            if charge_ids_raw:
                charge_ids = [int(x) for x in charge_ids_raw.split(",") if x.isdigit()]
                charges = env["condome.charge"].sudo().browse(charge_ids)
                
                for charge in charges:
                    if charge.state != "paid":
                        charge.action_confirm_payment(
                            method="tarjeta",
                            reference=f"STRP-{intent.get('id')}"
                        )
                _logger.info("Webhook Stripe: Cargos pagados exitosamente: %s", charge_ids)
                return True
        
        return False
