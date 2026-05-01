import logging

from odoo import _, http
from odoo.http import request

from .base_api_service import BaseApiService

_logger = logging.getLogger(__name__)
_mail_svc = None

def _mail():
    global _mail_svc
    if _mail_svc is None:
        try:
            from odoo.addons.condome_mail.services.email_service import CondomeEmailService
            _mail_svc = CondomeEmailService()
        except Exception:
            _logger.debug("condome_mail no disponible; correos de estructura deshabilitados.")
    return _mail_svc


class PropertyStructureService(BaseApiService):
    """Encapsula la gestión de condominios, edificios, apartamentos y residentes."""

    def _resolve_condominium_admin(self, acting_user, payload, current_record=None):
        if self.is_condominio_admin(acting_user):
            return acting_user

        admin_user_id = payload.get("admin_user_id") or payload.get("owner_user_id")
        if admin_user_id:
            return self.get_condominio_admin_user(admin_user_id)
        if current_record:
            return current_record.owner_user_id
        raise ValueError(_("Debes indicar un administrador de condominio válido"))

    def _condominium_plan_status(self, admin_user, excluding_condominio_id=None):
        if hasattr(admin_user, "get_condome_plan_config"):
            plan_config = admin_user.get_condome_plan_config()
        else:
            safe_plan = getattr(admin_user, "condome_plan", "free") or "free"
            plan_config = {
                "code": safe_plan,
                "label": safe_plan.title(),
                "max_condominios": 1,
            }

        domain = [("owner_user_id", "=", admin_user.id)]
        if excluding_condominio_id:
            domain.append(("id", "!=", excluding_condominio_id))

        current_count = request.env["condome.condominio"].sudo().search_count(domain)
        max_condominios = plan_config.get("max_condominios")
        return {
            "plan_code": plan_config.get("code", "free"),
            "plan_label": plan_config.get("label", "Free"),
            "current_count": current_count,
            "max_condominios": max_condominios,
            "allowed": max_condominios is None or current_count < max_condominios,
        }

    def _condominium_limit_message(self, status):
        plan_label = status.get("plan_label", "Free")
        max_condominios = status.get("max_condominios")
        current_count = status.get("current_count", 0)
        if max_condominios is None:
            return _("Tu plan actual no tiene límite de condominios.")
        if status.get("plan_code") == "pro":
            return _(
                "El plan %(plan)s permite hasta %(max)s condominios. Tu cuenta ya administra %(count)s. "
                "Actualiza a Premium para seguir agregando condominios."
            ) % {"plan": plan_label, "max": max_condominios, "count": current_count}
        return _(
            "El plan %(plan)s permite hasta %(max)s condominios. Tu cuenta ya administra %(count)s. "
            "Actualiza tu plan para continuar."
        ) % {"plan": plan_label, "max": max_condominios, "count": current_count}

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_condominiums(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            if request.httprequest.method == "GET":
                records = request.env["condome.condominio"].sudo().search(self.condominio_domain(user))
                data = [self.serialize_condominio(record) for record in records]
                return self.build_response({"data": data})

            user = self.require_owner_session()
            payload = self.read_payload()
            name = self.clean_str(payload.get("nombre"))
            address = self.clean_str(payload.get("direccion"))
            if not name or not address:
                return self.error_response(_("Nombre y direccion son requeridos"))

            company = request.env.company.sudo() or request.env["res.company"].sudo().search([], limit=1)
            admin_user = self._resolve_condominium_admin(user, payload)
            plan_status = self._condominium_plan_status(admin_user)
            if not plan_status["allowed"]:
                return self.error_response(self._condominium_limit_message(plan_status), status=403)

            record = request.env["condome.condominio"].sudo().create(
                {
                    "name": name,
                    "tipo": payload.get("tipo") or "residencial",
                    "rnc": self.clean_str(payload.get("rnc")),
                    "direccion": address,
                    "ciudad": self.clean_str(payload.get("ciudad")),
                    "pais": self.normalize_country_code(payload.get("pais")),
                    "telefono": self.clean_str(payload.get("telefono")),
                    "email": self.clean_str(payload.get("email")),
                    "parking_spaces_total": max(int(payload.get("parking_spaces_total") or payload.get("parkingSpacesTotal") or 0), 0),
                    "owner_user_id": admin_user.id,
                    "company_id": company.id if company else False,
                }
            )
            return self.build_response({"data": self.serialize_condominio(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property structure condominiums failed")
            return self.error_response(error, status=400)

    def handle_condominium_detail(self, condominio_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            if request.httprequest.method == "GET":
                user = self.require_session()
                record = self.get_condominio(condominio_id, user)
                return self.build_response({"data": self.serialize_condominio(record)})

            user = self.require_owner_session()
            record = self.get_condominio(condominio_id, user)

            if request.httprequest.method == "DELETE":
                record.unlink()
                return self.build_response({"ok": True})

            payload = self.read_payload()
            values = {
                "name": self.clean_str(payload.get("nombre")) or record.name,
                "tipo": payload.get("tipo", record.tipo),
                "rnc": self.clean_str(payload.get("rnc")) if "rnc" in payload else record.rnc,
                "direccion": self.clean_str(payload.get("direccion")) or record.direccion,
                "ciudad": self.clean_str(payload.get("ciudad")) if "ciudad" in payload else record.ciudad,
                "pais": self.normalize_country_code(payload.get("pais")) if "pais" in payload else record.pais,
                "telefono": self.clean_str(payload.get("telefono")) if "telefono" in payload else record.telefono,
                "email": self.clean_str(payload.get("email")) if "email" in payload else record.email,
                "parking_spaces_total": (
                    max(int(payload.get("parking_spaces_total") or payload.get("parkingSpacesTotal") or 0), 0)
                    if ("parking_spaces_total" in payload or "parkingSpacesTotal" in payload)
                    else record.parking_spaces_total
                ),
            }
            if ("admin_user_id" in payload or "owner_user_id" in payload) and self.is_system_owner(user):
                next_admin = self._resolve_condominium_admin(user, payload, current_record=record)
                plan_status = self._condominium_plan_status(next_admin, excluding_condominio_id=record.id)
                if not plan_status["allowed"]:
                    return self.error_response(self._condominium_limit_message(plan_status), status=403)
                values["owner_user_id"] = next_admin.id
            record.write(values)
            return self.build_response({"data": self.serialize_condominio(record)})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property structure condominium detail failed")
            return self.error_response(error, status=400)

    def handle_buildings(self, condominio_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            model = request.env["condome.edificio"].sudo()

            if request.httprequest.method == "GET":
                user = self.require_session()
                condominio = self.get_condominio(condominio_id, user)
                records = model.search([("condominio_id", "=", condominio.id)])
                return self.build_response({"data": [self.serialize_edificio(record) for record in records]})

            user = self.require_owner_session()
            condominio = self.get_condominio(condominio_id, user)
            payload = self.read_payload()
            name = self.clean_str(payload.get("nombre"))
            if not name:
                return self.error_response(_("El nombre del edificio es requerido"))

            record = model.create(
                {
                    "name": name,
                    "codigo": self.clean_str(payload.get("codigo")),
                    "niveles": int(payload.get("niveles") or 1),
                    "descripcion": self.clean_str(payload.get("descripcion")),
                    "condominio_id": condominio.id,
                }
            )
            return self.build_response({"data": self.serialize_edificio(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property structure buildings failed")
            return self.error_response(error, status=400)

    def handle_apartments(self, condominio_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            model = request.env["condome.apartamento"].sudo()

            if request.httprequest.method == "GET":
                user = self.require_session()
                condominio = self.get_condominio(condominio_id, user)
                building_id = request.httprequest.args.get("edificio_id")
                domain = [("condominio_id", "=", condominio.id)]
                if building_id:
                    domain.append(("edificio_id", "=", int(building_id)))
                records = model.search(domain)
                return self.build_response({"data": [self.serialize_apartamento(record) for record in records]})

            user = self.require_owner_session()
            condominio = self.get_condominio(condominio_id, user)
            payload = self.read_payload()
            name = self.clean_str(payload.get("nombre"))
            building_id = payload.get("edificio_id")
            if not name or not building_id:
                return self.error_response(_("Nombre y edificio son requeridos"))

            building = request.env["condome.edificio"].sudo().search(
                [("id", "=", int(building_id)), ("condominio_id", "=", condominio.id)],
                limit=1,
            )
            if not building:
                return self.error_response(_("El edificio seleccionado no existe"))

            record = model.create(
                {
                    "name": name,
                    "piso": self.clean_str(payload.get("piso")),
                    "tipo_unidad": payload.get("tipo_unidad") or "apartamento",
                    "metraje": float(payload.get("metraje") or 0),
                    "estado": payload.get("estado") or "disponible",
                    "condominio_id": condominio.id,
                    "edificio_id": building.id,
                }
            )
            return self.build_response({"data": self.serialize_apartamento(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property structure apartments failed")
            return self.error_response(error, status=400)

    def handle_residents(self, condominio_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            condominio = self.get_condominio(condominio_id, user)
            records = request.env["condome.residente"].sudo().search([("condominio_id", "=", condominio.id)])
            return self.build_response({"data": [self.serialize_residente(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property structure residents failed")
            return self.error_response(error, status=400)

    def handle_resident_creation(self, apartamento_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            apartment = self.get_apartamento(apartamento_id, user)
            payload = self.read_payload()
            first_name = self.clean_str(payload.get("nombre"))
            last_name = self.clean_str(payload.get("apellido"))
            email = self.clean_str(payload.get("email")).lower()
            if not first_name or not last_name:
                return self.error_response(_("Nombre y apellido son requeridos"))
            if not email:
                return self.error_response(_("El correo es requerido para crear el acceso del residente"))

            resident = request.env["condome.residente"].sudo().with_context(skip_user_account_creation=True).create(
                {
                    "nombre": first_name,
                    "apellido": last_name,
                    "email": email,
                    "telefono": self.clean_str(payload.get("telefono")),
                    "fecha_ingreso": payload.get("fecha_ingreso") or False,
                    "activo": payload.get("activo", True),
                    "apartamento_id": apartment.id,
                }
            )
            temporary_password = resident.ensure_user_account()
            apartment.sync_estado_ocupacion()
            # Enviar correo de bienvenida con credenciales al nuevo residente
            mail = _mail()
            if mail and temporary_password:
                try:
                    mail.send_welcome_credentials(
                        resident,
                        temporary_password=temporary_password,
                        login_url="http://localhost:3000/login",
                    )
                except Exception as exc:
                    _logger.debug("No se pudo enviar correo de bienvenida al residente: %s", exc)
            return self.build_response(
                {
                    "data": self.serialize_residente(resident),
                    "apartamento": self.serialize_apartamento(apartment),
                    "credenciales": {
                        "login": resident.user_id.login if resident.user_id else resident.email,
                        "password_temporal": temporary_password,
                    },
                },
                status=201,
            )
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property structure resident creation failed")
            return self.error_response(error, status=400)
