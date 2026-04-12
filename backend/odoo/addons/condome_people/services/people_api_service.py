import logging

from odoo import _
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class PeopleApiService(BaseApiService):
    """Gestiona personas y sus vínculos con apartamentos y condominios."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_resident_context(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            resident = self.resident_for_user(user)
            return self.build_response({"data": self.serialize_resident_context(resident)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("People API resident context failed")
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
            _logger.exception("People API residents failed")
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
            _logger.exception("People API resident creation failed")
            return self.error_response(error, status=400)

    def handle_owners(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.propietario"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_propietario(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            apartment = self.find_apartamento(
                user,
                apartment_id=payload.get("apartamento_id") or payload.get("apartmentId"),
                apartment_name=payload.get("apartmentName") or payload.get("apartamento_nombre"),
                building_name=payload.get("buildingName") or payload.get("edificio_nombre"),
                condominio=condominio,
            )
            owner_name = self.clean_str(payload.get("name") or payload.get("nombre"))
            if not owner_name:
                return self.error_response(_("El nombre del propietario es requerido"))

            record = model.with_context(skip_user_account_creation=True).create(
                {
                    "name": owner_name,
                    "email": self.clean_str(payload.get("email")).lower(),
                    "telefono": self.clean_str(payload.get("phone") or payload.get("telefono")),
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "active",
                    "portal_access": payload.get("portalAccess", payload.get("portal_access", True)),
                    "notas": self.clean_str(payload.get("notes") or payload.get("notas")),
                    "apartamento_id": apartment.id,
                }
            )
            temporary_password = record.ensure_user_account()
            response = {"data": self.serialize_propietario(record)}
            if temporary_password:
                response["credenciales"] = {
                    "login": record.user_id.login if record.user_id else record.email,
                    "password_temporal": temporary_password,
                }
            return self.build_response(response, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("People API owners failed")
            return self.error_response(error, status=400)

    def handle_owner_update(self, propietario_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_propietario(propietario_id, user)
            payload = self.read_payload()
            values = {
                "name": self.clean_str(payload.get("name") or payload.get("nombre")) or record.name,
                "email": self.clean_str(payload.get("email")).lower() if "email" in payload else record.email,
                "telefono": self.clean_str(payload.get("phone") or payload.get("telefono")) if ("phone" in payload or "telefono" in payload) else record.telefono,
                "estado": self.clean_str(payload.get("status") or payload.get("estado")) or record.estado,
                "notas": self.clean_str(payload.get("notes") or payload.get("notas")) if ("notes" in payload or "notas" in payload) else record.notas,
            }
            if "portalAccess" in payload or "portal_access" in payload:
                values["portal_access"] = payload.get("portalAccess", payload.get("portal_access"))

            apartment_id = payload.get("apartamento_id") or payload.get("apartmentId")
            apartment_name = payload.get("apartmentName") or payload.get("apartamento_nombre")
            building_name = payload.get("buildingName") or payload.get("edificio_nombre")
            if apartment_id or apartment_name:
                condominio = self.resolve_condominio(user, payload.get("condominio_id") or record.condominio_id.id)
                apartment = self.find_apartamento(
                    user,
                    apartment_id=apartment_id,
                    apartment_name=apartment_name,
                    building_name=building_name,
                    condominio=condominio,
                )
                values["apartamento_id"] = apartment.id

            record.write(values)
            return self.build_response({"data": self.serialize_propietario(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("People API owner update failed")
            return self.error_response(error, status=400)
