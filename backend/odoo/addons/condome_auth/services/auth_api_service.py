import json
import logging
import uuid

from odoo import _, fields
from odoo.exceptions import AccessDenied, MissingError, UserError
from odoo.http import request

from ..jwt_utils import TokenError, build_tokens, verify_token

_logger = logging.getLogger(__name__)

# Inicialización diferida del servicio de correo para evitar imports circulares.
_mail_service = None


def _get_mail_service():
    global _mail_service
    if _mail_service is None:
        try:
            from odoo.addons.condome_mail.services.email_service import CondomeEmailService
            _mail_service = CondomeEmailService()
        except Exception:
            _logger.debug("condome_mail no disponible; los correos de auth estarán deshabilitados.")
    return _mail_service


class AuthApiService:
    """Centraliza la lógica HTTP y de negocio de autenticación para no recargar el controller."""

    def cors_headers(self):
        origin = request.httprequest.headers.get("Origin")
        headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin or "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Vary": "Origin",
        }
        if origin:
            headers["Access-Control-Allow-Credentials"] = "true"
        return headers

    def build_response(self, payload, status=200):
        response = request.make_response(json.dumps(payload), headers=self.cors_headers())
        response.status_code = status
        return response

    def error_response(self, message, status=400):
        return self.build_response({"error": {"message": str(message)}}, status=status)

    def is_preflight_request(self):
        return request.httprequest.method == "OPTIONS"

    def read_payload(self):
        payload = request.httprequest.get_json(silent=True)
        if isinstance(payload, dict):
            return payload
        raw = request.httprequest.data or b""
        if not raw:
            return {}
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (TypeError, ValueError):
            return {}
        return parsed if isinstance(parsed, dict) else {}

    def clean_str(self, value):
        return (value or "").strip()

    def require_session(self):
        if not request.session.uid:
            auth_header = request.httprequest.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
                try:
                    payload = verify_token(token, expected_type="access")
                    user_id = payload.get("sub")
                    user = request.env["res.users"].sudo().browse(user_id)
                    if user.exists():
                        return user
                except TokenError:
                    pass
            raise AccessDenied(_("No hay una sesión activa"))
        return request.env.user.sudo()

    def serialize_user(self, user):
        if not user:
            return {}
        role = "guest"
        if user.has_group("condome_auth.group_condome_owner"):
            role = "owner"
        elif user.has_group("condome_auth.group_condome_propietario"):
            role = "propietario"
        elif user.has_group("condome_auth.group_condome_encargado"):
            role = "encargado"
        elif user.has_group("condome_auth.group_condome_residente"):
            role = "residente"
        plan_details = self.serialize_plan(user)
        return {
            "id": user.id,
            "name": user.name,
            "email": user.login,
            "role": role,
            "db": request.db,
            "plan": getattr(user, "condome_plan", "free"),
            "plan_details": plan_details,
            "email_verified": self.is_email_verified(user),
            "has_completed_onboarding": getattr(user, "has_completed_onboarding", False),
        }

    def serialize_plan(self, user):
        plan_code = getattr(user, "condome_plan", "free") or "free"
        if hasattr(user, "get_condome_plan_config"):
            config = user.get_condome_plan_config()
        else:
            config = {
                "code": plan_code,
                "label": plan_code.title(),
                "monthly_price_dop": 0,
                "max_condominios": 1,
                "is_paid": False,
                "automatic_reports": False,
                "feature_summary": [],
            }
        max_condominios = config.get("max_condominios")
        return {
            "code": config.get("code", plan_code),
            "label": config.get("label", plan_code.title()),
            "monthly_price_dop": config.get("monthly_price_dop", 0),
            "max_condominios": max_condominios,
            "is_paid": bool(config.get("is_paid")),
            "supports_automatic_reports": bool(config.get("automatic_reports")),
            "supports_multi_condominio": max_condominios is None or max_condominios > 1,
            "feature_summary": list(config.get("feature_summary") or []),
        }

    def resident_record_for_user(self, user):
        if not request.env.registry.get("condome.residente"):
            return False
        return request.env["condome.residente"].sudo().search([("user_id", "=", user.id)], limit=1)

    def serialize_profile(self, user):
        resident = self.resident_record_for_user(user)
        first_name = user.name.split(" ")[0] if user.name else ""
        last_name = " ".join(user.name.split(" ")[1:]).strip() if user.name else ""
        profile = {
            "nombre": resident.nombre if resident else first_name,
            "apellido": resident.apellido if resident else last_name,
            "email": user.login or user.partner_id.email or "",
            "telefono": resident.telefono if resident else (user.partner_id.phone or ""),
            "role": self.serialize_user(user)["role"],
        }
        if resident:
            profile.update(
                {
                    "residente_id": resident.id,
                    "apartamento": resident.apartamento_id.name,
                    "edificio": resident.edificio_id.name,
                    "condominio": resident.condominio_id.name,
                    "billing_name": resident.billing_name or "",
                    "tax_id": resident.tax_id or "",
                    "billing_address": resident.billing_address or "",
                }
            )
        return profile

    def ensure_unique_login(self, login, current_user):
        if not login:
            raise UserError(_("El correo es requerido"))
        existing_user = request.env["res.users"].sudo().search([("login", "=", login)], limit=1)
        if existing_user and existing_user != current_user:
            raise UserError(_("Ya existe un usuario con ese correo"))

    def authenticate_credentials(self, db, login, password):
        try:
            request.session.authenticate(db, login, password)
        except (AccessDenied, MissingError, UserError):
            return False
        return True

    def find_country(self, code):
        if not code:
            return False
        return request.env["res.country"].sudo().search([("code", "=", code)], limit=1)

    def default_company(self):
        company = request.env.company.sudo()
        if company:
            return company
        return request.env["res.company"].sudo().search([], limit=1)

    def is_email_verified(self, user):
        verification_token = getattr(user, "email_verification_token", False)
        return bool(getattr(user, "email_verified", False) or not verification_token)

    def _frontend_base_url(self):
        configured = (
            request.env["ir.config_parameter"].sudo().get_param("condome.frontend_base_url")
            or ""
        ).strip()
        if configured:
            return configured.rstrip("/")

        origin = (request.httprequest.headers.get("Origin") or "").strip()
        if origin:
            return origin.rstrip("/")

        host_url = (request.httprequest.host_url or "").strip().rstrip("/")
        if host_url:
            return host_url
        return "http://localhost:3000"

    def _resolve_condominio_name(self, user):
        resident = self.resident_record_for_user(user)
        if resident and resident.condominio_id:
            return resident.condominio_id.name

        condominio = request.env["condome.condominio"].sudo().search(
            [("owner_user_id", "=", user.id)],
            limit=1,
        )
        if condominio:
            return condominio.name
        return "Condome"

    def _verification_url(self, token):
        return f"{self._frontend_base_url()}/verify-email?token={token}"

    def _issue_verification_token(self, user):
        token = uuid.uuid4().hex
        user.sudo().write({"email_verification_token": token})
        return token

    def _send_verification_email(self, user, force_new_token=False):
        if not user or not user.login:
            return False

        token = getattr(user, "email_verification_token", False)
        if force_new_token or not token:
            token = self._issue_verification_token(user)

        mail = _get_mail_service()
        if not mail:
            return False

        return bool(
            mail.send_email_verification(
                user,
                verification_url=self._verification_url(token),
                condominio_name=self._resolve_condominio_name(user),
            )
        )

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_authenticate(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            payload = self.read_payload()
            db = payload.get("db") or request.db
            login = self.clean_str(payload.get("login"))
            password = payload.get("password") or ""
            if not login or not password:
                return self.error_response(_("Email y contraseña son requeridos"))
            if not self.authenticate_credentials(db, login, password):
                return self.error_response(_("Correo o contraseña inválidos"), status=401)

            user = request.env.user.sudo()
            tokens = build_tokens(user)

            # Enviar correo de confirmación de login (async, no bloquea la respuesta)
            mail = _get_mail_service()
            if mail:
                ip = request.httprequest.remote_addr or ""
                condo_name = ""
                try:
                    resident = self.resident_record_for_user(user)
                    if resident and resident.condominio_id:
                        condo_name = resident.condominio_id.name
                except Exception:
                    pass
                mail.send_login_confirmation(user, condominio_name=condo_name, ip_address=ip)

            return self.build_response(
                {
                    "user": self.serialize_user(user),
                    "token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"],
                }
            )
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_session_info(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()
            # Aceptar tanto sesión de Odoo como JWT Bearer token
            if request.session.uid:
                return self.build_response({"user": self.serialize_user(request.env.user.sudo())})
            # Intentar con JWT
            try:
                user = self.require_session()
                return self.build_response({"user": self.serialize_user(user)})
            except Exception:
                return self.error_response(_("No hay una sesión activa"), status=401)
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_profile(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            if request.httprequest.method == "GET":
                return self.build_response({"user": self.serialize_user(user), "profile": self.serialize_profile(user)})

            payload = self.read_payload()
            resident = self.resident_record_for_user(user)
            if resident:
                email = self.clean_str(payload.get("email")).lower() or resident.email
                self.ensure_unique_login(email, resident.user_id or user)
                resident.write(
                    {
                        "nombre": self.clean_str(payload.get("nombre")) or resident.nombre,
                        "apellido": self.clean_str(payload.get("apellido")) or resident.apellido,
                        "email": email,
                        "telefono": self.clean_str(payload.get("telefono")) or resident.telefono,
                        "billing_name": self.clean_str(payload.get("billing_name")) or resident.billing_name,
                        "tax_id": self.clean_str(payload.get("tax_id")) or resident.tax_id,
                        "billing_address": self.clean_str(payload.get("billing_address")) or resident.billing_address,
                    }
                )
                user = resident.user_id.sudo() or user
            else:
                first_name = self.clean_str(payload.get("nombre"))
                last_name = self.clean_str(payload.get("apellido"))
                email = self.clean_str(payload.get("email")).lower() or user.login
                self.ensure_unique_login(email, user)
                name = " ".join(part for part in [first_name, last_name] if part).strip() or user.name
                user_vals = {"name": name, "login": email}
                partner_vals = {"name": name, "email": email}
                phone = self.clean_str(payload.get("telefono"))
                if phone:
                    partner_vals["phone"] = phone
                user.sudo().write(user_vals)
                if user.partner_id:
                    user.partner_id.sudo().write(partner_vals)

            return self.build_response({"user": self.serialize_user(user), "profile": self.serialize_profile(user)})
        except AccessDenied as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_change_password(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            payload = self.read_payload()
            current_password = payload.get("currentPassword") or ""
            new_password = payload.get("newPassword") or ""
            confirm_password = payload.get("confirmPassword") or ""
            if not current_password:
                return self.error_response(_("La contraseña actual es requerida"))
            if not new_password or len(new_password) < 8:
                return self.error_response(_("La nueva contraseña debe tener al menos 8 caracteres"))
            if new_password != confirm_password:
                return self.error_response(_("Las contraseñas nuevas no coinciden"))
            if not self.authenticate_credentials(request.db, user.login, current_password):
                return self.error_response(_("La contraseña actual no es válida"), status=401)

            user.sudo().write({"password": new_password})

            # Notificar cambio de contraseña por correo
            mail = _get_mail_service()
            if mail:
                mail.send_password_changed(user)

            return self.build_response({"ok": True})
        except AccessDenied as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_register(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            payload = self.read_payload()
            first_name = self.clean_str(payload.get("nombre"))
            last_name = self.clean_str(payload.get("apellido"))
            email = self.clean_str(payload.get("email")).lower()
            phone = self.clean_str(payload.get("telefono"))
            country_code = payload.get("pais")
            password = payload.get("password") or ""
            confirm = payload.get("confirmPassword") or ""
            if not first_name or not last_name:
                return self.error_response(_("Nombre y apellido son requeridos"))
            if not email:
                return self.error_response(_("Correo es requerido"))
            if not password or len(password) < 8:
                return self.error_response(_("La contraseña debe tener al menos 8 caracteres"))
            if password != confirm:
                return self.error_response(_("Las contraseñas no coinciden"))

            users = request.env["res.users"].sudo().search([("login", "=", email)])
            if users:
                return self.error_response(_("Ya existe un usuario con ese correo"), status=409)

            full_name = f"{first_name} {last_name}".strip()
            company = self.default_company()
            partner_vals = {"name": full_name, "email": email, "phone": phone}
            if company:
                partner_vals["company_id"] = company.id
            
            country = self.find_country(country_code)
            if country:
                partner_vals["country_id"] = country.id
            
            partner = request.env["res.partner"].sudo().create(partner_vals)
            group = request.env.ref("condome_auth.group_condome_propietario", raise_if_not_found=False)
            
            user_vals = {
                "name": full_name,
                "partner_id": partner.id,
                "login": email,
                "password": password,
                "email_verified": True,
                "has_completed_onboarding": False,
            }
            if company:
                user_vals["company_id"] = company.id
                user_vals["company_ids"] = [(6, 0, [company.id])]
            
            user = request.env["res.users"].sudo().create(user_vals)
            if group:
                user.sudo().write({"groups_id": [(4, group.id)]})

            # Asegurar que los cambios se guarden antes de intentar autenticar
            request.env.cr.flush()

            # Autenticar automáticamente al registrarse
            try:
                request.session.authenticate(request.db, email, password)
            except Exception as auth_err:
                _logger.warning(f"Error en auto-autenticación tras registro: {auth_err}")

            # Devolver también tokens JWT para que el frontend pueda guardar la sesión
            tokens = build_tokens(user)
            return self.build_response({
                "user": self.serialize_user(user),
                "token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
            })
        except Exception as error:  # pragma: no cover
            _logger.exception("Error crítico durante el registro de usuario")
            return self.error_response(str(error), status=400)

    def handle_logout(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()
            request.session.logout(keep_db=True)
            return self.build_response({"ok": True})
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_validate_token(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()
            user = self.require_session()
            return self.build_response({"valid": bool(user)})
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_verify_email(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            payload = self.read_payload()
            token = self.clean_str(payload.get("token") or request.httprequest.args.get("token"))
            if not token:
                return self.error_response(_("El token de verificación es requerido"))

            user = request.env["res.users"].sudo().search(
                [("email_verification_token", "=", token)],
                limit=1,
            )
            if not user:
                return self.error_response(_("El enlace de verificación ya no es válido"), status=404)

            user.sudo().write(
                {
                    "email_verified": True,
                    "email_verified_at": fields.Datetime.now(),
                    "email_verification_token": False,
                }
            )
            tokens = build_tokens(user)
            return self.build_response(
                {
                    "ok": True,
                    "user": self.serialize_user(user),
                    "token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"],
                }
            )
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_resend_verification(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            payload = self.read_payload()
            email = self.clean_str(payload.get("email")).lower()
            if not email:
                return self.error_response(_("El correo es requerido"))

            user = request.env["res.users"].sudo().search([("login", "=", email)], limit=1)
            if not user:
                return self.error_response(_("No existe una cuenta registrada con ese correo"), status=404)

            if self.is_email_verified(user):
                return self.build_response(
                    {
                        "ok": True,
                        "message": _("Tu cuenta ya está verificada. Puedes iniciar sesión normalmente."),
                        "user": self.serialize_user(user),
                    }
                )

            sent = self._send_verification_email(user, force_new_token=True)
            if not sent:
                return self.build_response(
                    {
                        "ok": False,
                        "message": _(
                            "No se pudo enviar el correo de verificación en este momento. "
                            "Verifica la configuración SMTP e inténtalo de nuevo."
                        ),
                    },
                    status=503,
                )

            return self.build_response(
                {
                    "ok": True,
                    "message": _("Te reenviamos el correo de verificación. Revisa tu bandeja de entrada."),
                }
            )
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_complete_onboarding(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()
            
            user = self.require_session()
            user.sudo().write({"has_completed_onboarding": True})
            return self.build_response({"ok": True, "user": self.serialize_user(user)})
        except AccessDenied as error:
            return self.error_response(error, status=401)
        except Exception as error:
            return self.error_response(str(error), status=400)
