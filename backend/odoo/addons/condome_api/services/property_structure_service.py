import logging

from odoo import _, http
from odoo.http import request

from .base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


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

            user = self.require_session()
            record = self.get_condominio(condominio_id, user)

            if request.httprequest.method == "GET":
                return self.build_response({"data": self.serialize_condominio(record)})

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
            }
            if ("admin_user_id" in payload or "owner_user_id" in payload) and self.is_system_owner(user):
                values["owner_user_id"] = self._resolve_condominium_admin(user, payload, current_record=record).id
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

            user = self.require_session()
            condominio = self.get_condominio(condominio_id, user)
            model = request.env["condome.edificio"].sudo()

            if request.httprequest.method == "GET":
                records = model.search([("condominio_id", "=", condominio.id)])
                return self.build_response({"data": [self.serialize_edificio(record) for record in records]})

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

            user = self.require_session()
            condominio = self.get_condominio(condominio_id, user)
            model = request.env["condome.apartamento"].sudo()

            if request.httprequest.method == "GET":
                building_id = request.httprequest.args.get("edificio_id")
                domain = [("condominio_id", "=", condominio.id)]
                if building_id:
                    domain.append(("edificio_id", "=", int(building_id)))
                records = model.search(domain)
                return self.build_response({"data": [self.serialize_apartamento(record) for record in records]})

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

            user = self.require_session()
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
