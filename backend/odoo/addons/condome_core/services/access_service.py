from odoo import _
from odoo.addons.condome_auth.jwt_utils import TokenError, verify_token
from odoo.http import request

class ApiAccessMixin:
    """Centraliza validaciones de sesión y búsquedas con control de acceso."""

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
            raise PermissionError(_("Debes iniciar sesion para continuar"))
        return request.env.user.sudo()

    def is_owner_user(self, user):
        return user.has_group("condome_auth.group_condome_owner")

    def is_propietario_user(self, user):
        return user.has_group("condome_auth.group_condome_propietario")

    def is_system_owner(self, user):
        return self.is_owner_user(user)

    def is_condominio_admin(self, user):
        return self.is_propietario_user(user)

    def _system_owner_condominio_ids(self):
        return request.env["condome.condominio"].sudo().search([]).ids

    def _condominio_admin_condominio_ids(self, user):
        return request.env["condome.condominio"].sudo().search([("owner_user_id", "=", user.id)]).ids

    def _resident_condominio_ids(self, user):
        if not request.env.registry.get("condome.residente"):
            return []
        return request.env["condome.residente"].sudo().search([("user_id", "=", user.id)]).mapped("condominio_id.id")

    def _admin_condominio_ids(self, user):
        if self.is_system_owner(user):
            return self._system_owner_condominio_ids()
        if self.is_condominio_admin(user):
            return self._condominio_admin_condominio_ids(user)
        return []

    def _all_user_condominio_ids(self, user):
        condominio_ids = self._admin_condominio_ids(user)
        condominio_ids.extend(self._resident_condominio_ids(user))
        return sorted(set(condominio_ids))

    def condominio_domain(self, user):
        if self.is_system_owner(user):
            return []
        condominio_ids = self._all_user_condominio_ids(user)
        return [("id", "in", condominio_ids)] if condominio_ids else [("id", "=", -1)]

    def get_condominio(self, condominio_id, user):
        condominio = request.env["condome.condominio"].sudo().search(
            [("id", "=", condominio_id)] + self.condominio_domain(user),
            limit=1,
        )
        if not condominio:
            raise ValueError(_("Condominio no encontrado"))
        return condominio

    def get_apartamento(self, apartamento_id, user):
        domain = [("id", "=", apartamento_id)]
        if self.is_system_owner(user):
            pass
        elif self.is_condominio_admin(user):
            admin_condominio_ids = self._admin_condominio_ids(user)
            if admin_condominio_ids:
                domain.append(("condominio_id", "in", admin_condominio_ids))
            else:
                domain.append(("id", "=", -1))
        else:
            resident_condominio_ids = self._resident_condominio_ids(user)
            if resident_condominio_ids:
                domain.append(("condominio_id", "in", resident_condominio_ids))
            else:
                domain.append(("id", "=", -1))
        apartment = request.env["condome.apartamento"].sudo().search(domain, limit=1)
        if not apartment:
            raise ValueError(_("Apartamento no encontrado"))
        return apartment

    def resident_for_user(self, user):
        resident = request.env["condome.residente"].sudo().search([("user_id", "=", user.id)], limit=1)
        if not resident:
            raise PermissionError(_("Este usuario no tiene un perfil de residente asociado"))
        return resident

    def owner_domain(self, user, owner_field="owner_user_id"):
        if self.is_system_owner(user):
            return []
        if self.is_condominio_admin(user):
            admin_condominio_ids = self._admin_condominio_ids(user)
            return [("condominio_id", "in", admin_condominio_ids)] if admin_condominio_ids else [("id", "=", -1)]
        return [(owner_field, "=", user.id)]

    def require_owner_session(self):
        user = self.require_session()
        if not (self.is_system_owner(user) or self.is_condominio_admin(user)):
            raise PermissionError(_("No tienes permisos para gestionar este recurso"))
        return user

    def require_system_owner_session(self):
        """Requiere sesión de administrador del sistema (owner) exclusivamente."""
        user = self.require_session()
        if not self.is_owner_user(user):
            raise PermissionError(_("Este recurso está reservado a administradores del sistema"))
        return user

    def resolve_condominio(self, user, condominio_id=None):
        if condominio_id:
            return self.get_condominio(int(condominio_id), user)
        condominio = request.env["condome.condominio"].sudo().search(
            self.condominio_domain(user),
            order="id asc",
            limit=1,
        )
        if not condominio:
            raise ValueError(_("No hay condominios disponibles para este usuario"))
        return condominio

    def find_apartamento(self, user, apartment_id=None, apartment_name=None, building_name=None, condominio=None):
        domain = []
        if apartment_id:
            domain.append(("id", "=", int(apartment_id)))
        elif apartment_name:
            domain.append(("name", "=", self.clean_str(apartment_name)))
        else:
            raise ValueError(_("Debes indicar un apartamento valido"))

        if condominio:
            domain.append(("condominio_id", "=", condominio.id))
        if building_name:
            domain.append(("edificio_id.name", "=", self.clean_str(building_name)))
        if self.is_system_owner(user):
            pass
        elif self.is_condominio_admin(user):
            admin_condominio_ids = self._admin_condominio_ids(user)
            if admin_condominio_ids:
                domain.append(("condominio_id", "in", admin_condominio_ids))
            else:
                domain.append(("id", "=", -1))
        else:
            resident_condominio_ids = self._resident_condominio_ids(user)
            if resident_condominio_ids:
                domain.append(("condominio_id", "in", resident_condominio_ids))
            else:
                domain.append(("id", "=", -1))

        apartment = request.env["condome.apartamento"].sudo().search(domain, limit=1)
        if not apartment:
            raise ValueError(_("No se encontro el apartamento indicado"))
        return apartment

    def get_owner_visita(self, visita_id, user):
        visita = request.env["condome.visita"].sudo().search(
            [("id", "=", visita_id)] + self.owner_domain(user),
            limit=1,
        )
        if not visita:
            raise ValueError(_("Solicitud de visita no encontrada"))
        return visita

    def get_owner_incidencia(self, incidencia_id, user):
        incidencia = request.env["condome.incidencia"].sudo().search(
            [("id", "=", incidencia_id)] + self.owner_domain(user),
            limit=1,
        )
        if not incidencia:
            raise ValueError(_("Incidencia no encontrada"))
        return incidencia

    def get_owner_propietario(self, propietario_id, user):
        propietario = request.env["condome.propietario"].sudo().search(
            [("id", "=", propietario_id)] + self.owner_domain(user),
            limit=1,
        )
        if not propietario:
            raise ValueError(_("Propietario no encontrado"))
        return propietario

    def get_owner_documento(self, documento_id, user):
        documento = request.env["condome.documento"].sudo().search(
            [("id", "=", documento_id)] + self.owner_domain(user),
            limit=1,
        )
        if not documento:
            raise ValueError(_("Documento no encontrado"))
        return documento

    def get_owner_notification_rule(self, rule_id, user):
        rule = request.env["condome.notification.rule"].sudo().search(
            [("id", "=", rule_id)] + self.owner_domain(user),
            limit=1,
        )
        if not rule:
            raise ValueError(_("Regla automatica no encontrada"))
        return rule

    def get_owner_access_policy(self, policy_id, user):
        policy = request.env["condome.access.policy"].sudo().search(
            [("id", "=", policy_id)] + self.owner_domain(user),
            limit=1,
        )
        if not policy:
            raise ValueError(_("Politica de acceso no encontrada"))
        return policy

    def get_owner_comunicado(self, comunicado_id, user):
        comunicado = request.env["condome.comunicado"].sudo().search(
            [("id", "=", comunicado_id)] + self.owner_domain(user),
            limit=1,
        )
        if not comunicado:
            raise ValueError(_("Comunicado no encontrado"))
        return comunicado

    def get_owner_common_area(self, area_id, user):
        area = request.env["condome.common.area"].sudo().search(
            [("id", "=", area_id)] + self.owner_domain(user),
            limit=1,
        )
        if not area:
            raise ValueError(_("Area comun no encontrada"))
        return area

    def get_owner_area_reservation(self, reservation_id, user):
        reservation = request.env["condome.area.reservation"].sudo().search(
            [("id", "=", reservation_id)] + self.owner_domain(user),
            limit=1,
        )
        if not reservation:
            raise ValueError(_("Reserva no encontrada"))
        return reservation

    def find_resident(self, user, resident_id=None, resident_name=None, apartment=None, condominio=None):
        domain = []
        if resident_id:
            domain.append(("id", "=", int(resident_id)))
        elif resident_name:
            domain.append(("name", "=", self.clean_str(resident_name)))
        else:
            raise ValueError(_("Debes indicar un residente valido"))

        if apartment:
            domain.append(("apartamento_id", "=", apartment.id))
        if condominio:
            domain.append(("condominio_id", "=", condominio.id))
        if self.is_system_owner(user):
            pass
        elif self.is_condominio_admin(user):
            admin_condominio_ids = self._admin_condominio_ids(user)
            if admin_condominio_ids:
                domain.append(("condominio_id", "in", admin_condominio_ids))
            else:
                domain.append(("id", "=", -1))
        else:
            resident_condominio_ids = self._resident_condominio_ids(user)
            if resident_condominio_ids:
                domain.append(("condominio_id", "in", resident_condominio_ids))
            else:
                domain.append(("id", "=", -1))

        resident = request.env["condome.residente"].sudo().search(domain, limit=1)
        if not resident:
            raise ValueError(_("No se encontro el residente indicado"))
        return resident

    def get_condominio_admin_user(self, user_id):
        user = request.env["res.users"].sudo().search([("id", "=", int(user_id))], limit=1)
        if not user:
            raise ValueError(_("Administrador del condominio no encontrado"))
        if not self.is_condominio_admin(user):
            raise ValueError(_("El usuario indicado no es un administrador de condominio"))
        return user

    def get_or_create_configuracion(self, condominio):
        settings = request.env["condome.configuracion"].sudo().search(
            [("condominio_id", "=", condominio.id)],
            limit=1,
        )
        if settings:
            return settings
        return request.env["condome.configuracion"].sudo().create(
            {
                "condominio_id": condominio.id,
                "support_email": condominio.email or "",
            }
        )

