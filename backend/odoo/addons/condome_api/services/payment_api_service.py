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

def _load_env_file():
    if not DOTENV_AVAILABLE:
        return
    current_dir = os.path.abspath(os.path.dirname(__file__))
    candidate_paths = [
        os.path.join(current_dir, "..", "..", "..", "..", ".env"),
        os.path.join(current_dir, "..", "..", "..", "..", "..", ".env"),
    ]
    for candidate in candidate_paths:
        env_path = os.path.abspath(candidate)
        if os.path.exists(env_path):
            load_dotenv(env_path)
            return

_load_env_file()

class PaymentApiService:
    """Servicio de lógica de negocio para pasarelas de pago (Stripe)."""

    PLAN_PRICES = {
        "pro": 1200,
        "premium": 6000,
    }

    @staticmethod
    def _plan_payment_mode():
        return (os.getenv("PLAN_PAYMENT_MODE") or "auto").strip().lower()

    @staticmethod
    def _stripe_secret_key():
        return (os.getenv("SECRET_KEY") or "").strip()

    @staticmethod
    def _stripe_published_key():
        return (os.getenv("PUBLISHED_KEY") or "").strip()

    @staticmethod
    def _stripe_config_error():
        if not STRIPE_AVAILABLE:
            return "La librería de Stripe no está instalada en el servidor."

        secret_key = PaymentApiService._stripe_secret_key()
        published_key = PaymentApiService._stripe_published_key()

        if not secret_key or not published_key:
            return (
                "Stripe no está configurado. Debes definir SECRET_KEY y PUBLISHED_KEY "
                "en backend/.env antes de iniciar el checkout."
            )

        if not secret_key.startswith("sk_"):
            return (
                "SECRET_KEY no tiene formato válido para Stripe. "
                "Debe comenzar con sk_ y corresponder al mismo entorno que la clave pública."
            )

        if not published_key.startswith("pk_"):
            return (
                "PUBLISHED_KEY no tiene formato válido para Stripe. "
                "Debe comenzar con pk_ y corresponder al mismo entorno que la clave secreta."
            )

        return None

    @staticmethod
    def _prepare_stripe_client():
        config_error = PaymentApiService._stripe_config_error()
        if config_error:
            _logger.warning("Stripe no disponible para checkout: %s", config_error)
            return config_error

        stripe.api_key = PaymentApiService._stripe_secret_key()
        return None

    @staticmethod
    def _normalize_stripe_error(error):
        message = str(error or "").strip()
        lowered = message.lower()

        if "invalid api key provided" in lowered:
            return (
                "Stripe rechazó la llave secreta configurada en el servidor. "
                "Revisa SECRET_KEY y PUBLISHED_KEY en backend/.env y usa un par válido del mismo modo de prueba o producción."
            )

        return message or "Stripe devolvió un error inesperado."

    @staticmethod
    def _stripe_metadata_to_dict(metadata):
        """Convierte metadata de Stripe a un dict nativo sin depender de su protocolo interno."""
        if metadata is None:
            return {}
        if isinstance(metadata, dict):
            return dict(metadata)

        to_dict_recursive = getattr(metadata, "to_dict_recursive", None)
        if callable(to_dict_recursive):
            converted = to_dict_recursive()
            return converted if isinstance(converted, dict) else {}

        to_dict = getattr(metadata, "to_dict", None)
        if callable(to_dict):
            converted = to_dict()
            return converted if isinstance(converted, dict) else {}

        items = getattr(metadata, "items", None)
        if callable(items):
            return {str(key): value for key, value in items()}

        return {}

    @staticmethod
    def _stripe_is_ready():
        return PaymentApiService._stripe_config_error() is None

    @staticmethod
    def _should_use_direct_plan_activation():
        return PaymentApiService._plan_payment_mode() == "direct"

    @staticmethod
    def _direct_plan_activation_response(user, plan_code, amount, message):
        PaymentApiService._activate_user_plan(user, plan_code)
        return {
            "ok": True,
            "provider": "internal",
            "checkout_mode": "direct_activation",
            "requires_payment_confirmation": False,
            "plan": plan_code,
            "amount": amount,
            "message": message,
            "has_completed_onboarding": True,
        }

    @staticmethod
    def _can_fallback_to_direct_activation(error=None):
        if PaymentApiService._plan_payment_mode() == "stripe":
            return False
        if PaymentApiService._should_use_direct_plan_activation():
            return True
        if error is None:
            return not PaymentApiService._stripe_is_ready()

        error_name = error.__class__.__name__.lower()
        error_message = str(error).lower()
        return (
            "invalid api key provided" in error_message
            or "authentication" in error_name
            or "authentication" in error_message
        )

    @staticmethod
    def _activate_user_plan(user, plan_code):
        if plan_code not in PaymentApiService.PLAN_PRICES:
            raise ValueError("Plan inválido.")
        user.sudo().write(
            {
                "condome_plan": plan_code,
                "has_completed_onboarding": True,
            }
        )
        return user

    @staticmethod
    def get_available_methods(env=None, condominio_id=None):
        """Retorna los métodos de pago configurados."""
        methods = []
        
        if PaymentApiService._stripe_is_ready():
            methods.append({
                "id": "stripe", 
                "name": "Tarjeta de Crédito / Débito (Stripe)", 
                "icon": "credit-card-fill",
                "published_key": PaymentApiService._stripe_published_key()
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
        stripe_error = PaymentApiService._prepare_stripe_client()
        if stripe_error:
            return {
                "ok": False,
                "error": stripe_error,
            }

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
                "payment_method_types": ["card"],
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
            return {"ok": False, "error": PaymentApiService._normalize_stripe_error(e)}

    @staticmethod
    def create_plan_stripe_intent(env, plan_id, user):
        amount = PaymentApiService.PLAN_PRICES.get(plan_id)
        if not amount:
            return {"ok": False, "error": "Plan inválido."}
        if getattr(user, "condome_plan", "free") == plan_id and getattr(user, "has_completed_onboarding", False):
            return {"ok": False, "error": "Tu cuenta ya tiene ese plan activo."}

        if PaymentApiService._can_fallback_to_direct_activation():
            _logger.warning(
                "Checkout de planes en modo directo. Activando plan %s para usuario %s.",
                plan_id,
                user.id,
            )
            return PaymentApiService._direct_plan_activation_response(
                user,
                plan_id,
                amount,
                "El checkout de planes está configurado en modo directo para este entorno.",
            )

        try:
            stripe_error = PaymentApiService._prepare_stripe_client()
            if stripe_error:
                return {"ok": False, "error": stripe_error}

            intent_args = {
                "amount": int(amount * 100),
                "currency": "dop",
                "payment_method_types": ["card"],
                "metadata": {
                    "upgrade_plan": plan_id,
                    "user_id": user.id,
                    "integration": "condome_v1"
                }
            }
            intent = stripe.PaymentIntent.create(**intent_args)
            return {
                "ok": True,
                "provider": "stripe",
                "checkout_mode": "stripe_payment_intent",
                "requires_payment_confirmation": True,
                "plan": plan_id,
                "client_secret": intent.client_secret,
                "published_key": PaymentApiService._stripe_published_key(),
                "amount": amount,
            }
        except Exception as e:
            if PaymentApiService._can_fallback_to_direct_activation(e):
                _logger.warning(
                    "Stripe no pudo iniciar el cobro del plan %s para usuario %s. Se activa el fallback directo. Error: %s",
                    plan_id,
                    user.id,
                    str(e),
                )
                return PaymentApiService._direct_plan_activation_response(
                    user,
                    plan_id,
                    amount,
                    "Stripe no pudo iniciar el cobro en este entorno. El plan fue activado directamente.",
                )
            _logger.error("Stripe Service Error (Plan): %s", str(e))
            return {"ok": False, "error": PaymentApiService._normalize_stripe_error(e)}

    @staticmethod
    def confirm_plan_payment(env, payment_intent_id, user):
        stripe_error = PaymentApiService._prepare_stripe_client()
        if stripe_error:
            return {
                "ok": False,
                "error": stripe_error,
            }
        if not payment_intent_id:
            return {"ok": False, "error": "Debes indicar un payment intent válido."}

        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            metadata = PaymentApiService._stripe_metadata_to_dict(getattr(intent, "metadata", None))
            status = getattr(intent, "status", "")
            plan_code = metadata.get("upgrade_plan")
            owner_user_id = int(metadata.get("user_id") or 0)

            # Validación más flexible: permitir si el usuario actual es el mismo
            # o si es el propietario del condominio asociado
            current_user_id = user.id
            is_same_user = owner_user_id == current_user_id
            
            # Si no coincide, verificar si el usuario actual tiene acceso
            if not is_same_user:
                # Verificar si el usuario actual es owner o admin
                user_is_owner = getattr(user, "share", True) == False
                if not user_is_owner:
                    _logger.warning(
                        "Confirmación de plan: usuario %s intenta confirmar pago de usuario %s",
                        current_user_id,
                        owner_user_id
                    )
                    return {"ok": False, "error": "El pago no corresponde al usuario autenticado."}
            
            if status != "succeeded":
                return {"ok": False, "error": "El pago todavía no ha sido confirmado por Stripe."}
            if plan_code not in PaymentApiService.PLAN_PRICES:
                return {"ok": False, "error": "El payment intent no contiene un plan válido."}

            # Obtener el usuario correcto para activar el plan
            target_user = env["res.users"].sudo().browse(owner_user_id)
            if not target_user.exists():
                target_user = user
            
            PaymentApiService._activate_user_plan(target_user, plan_code)
            _logger.info(
                "Confirmación manual Stripe: usuario %s actualizado al plan %s con intent %s",
                target_user.id,
                plan_code,
                payment_intent_id,
            )
            return {
                "ok": True,
                "plan": plan_code,
                "payment_intent_id": payment_intent_id,
                "has_completed_onboarding": True,
            }
        except Exception as e:
            _logger.error("Stripe Service Error (Plan confirm): %s - Type: %s", str(e), type(e).__name__)
            import traceback
            _logger.error("Traceback: %s", traceback.format_exc())
            return {"ok": False, "error": PaymentApiService._normalize_stripe_error(e)}

    @staticmethod
    def handle_stripe_webhook(env, event_data):
        """Procesa los eventos entrantes de Stripe para actualizar cargos o planes."""
        event_type = event_data.get("type")
        
        if event_type == "payment_intent.succeeded":
            intent = event_data.get("data", {}).get("object", {})
            metadata = intent.get("metadata", {})
            
            # Flujo de actualización de plan
            if "upgrade_plan" in metadata and "user_id" in metadata:
                user = env["res.users"].sudo().browse(int(metadata["user_id"]))
                if user.exists():
                    PaymentApiService._activate_user_plan(user, metadata["upgrade_plan"])
                    _logger.info("Webhook Stripe: Plan actualizado y onboarding completado para usuario %s a %s", user.id, metadata["upgrade_plan"])
                return True

            # Flujo normal de cargos
            charge_ids_raw = metadata.get("charge_ids", "")
            
            if charge_ids_raw:
                charge_ids = [int(x) for x in charge_ids_raw.split(",") if x.isdigit()]
                charges = env["condome.charge"].sudo().browse(charge_ids)
                
                for charge in charges:
                    if charge.state != "paid":
                        charge.action_confirm_payment(
                            method="tarjeta",
                            reference=f"STRP-{intent.get('id')}"
                        )
                        # Enviar correo de confirmación de pago
                        try:
                            from ...condome_mail.services.email_service import CondomeEmailService
                            mail_service = CondomeEmailService()
                            mail_service.send_payment_confirmation(
                                charge.residente_id,
                                charge.amount,
                                charge.currency_id.name,
                                charge.name or "Pago de Cuota",
                                fields.Date.to_string(fields.Date.today())
                            )
                        except Exception as me:
                            _logger.error("No se pudo enviar correo de confirmación: %s", str(me))

                _logger.info("Webhook Stripe: Cargos pagados exitosamente: %s", charge_ids)
                return True
        
        return False
