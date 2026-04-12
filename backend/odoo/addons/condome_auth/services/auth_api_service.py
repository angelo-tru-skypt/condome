import json

from odoo import _
from odoo.exceptions import AccessDenied, MissingError, UserError
from odoo.http import request


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
        return {
            "id": user.id,
            "name": user.name,
            "email": user.login,
            "role": role,
            "db": request.db,
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

            return self.build_response({"user": self.serialize_user(request.env.user.sudo())})
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)

    def handle_session_info(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()
            if not request.session.uid:
                return self.error_response(_("No hay una sesión activa"), status=401)
            return self.build_response({"user": self.serialize_user(request.env.user.sudo())})
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
            partner_vals = {"name": full_name, "email": email, "phone": phone}
            country = self.find_country(country_code)
            if country:
                partner_vals["country_id"] = country.id

            partner = request.env["res.partner"].sudo().create(partner_vals)
            group = request.env.ref("condome_auth.group_condome_propietario", raise_if_not_found=False)
            company = self.default_company()
            user_vals = {
                "name": full_name,
                "partner_id": partner.id,
                "login": email,
                "password": password,
            }
            if company:
                user_vals["company_id"] = company.id
                user_vals["company_ids"] = [(6, 0, [company.id])]
            user = request.env["res.users"].sudo().create(user_vals)
            if group:
                user.write({"groups_id": [(4, group.id)]})
            return self.build_response({"user": self.serialize_user(user)})
        except Exception as error:  # pragma: no cover
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
            return self.build_response({"valid": bool(request.session.uid)})
        except Exception as error:  # pragma: no cover
            return self.error_response(str(error), status=400)
