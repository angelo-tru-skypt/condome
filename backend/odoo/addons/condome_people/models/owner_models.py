import secrets
import string

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class CondomePropietario(models.Model):
    _name = "condome.propietario"
    _description = "Propietario"
    _order = "create_date desc, id desc"

    name = fields.Char(required=True)
    email = fields.Char()
    telefono = fields.Char()
    estado = fields.Selection(
        [
            ("active", "Activo"),
            ("inactive", "Inactivo"),
            ("pending", "Pendiente"),
        ],
        default="active",
        required=True,
    )
    portal_access = fields.Boolean(default=True)
    notas = fields.Text()
    partner_id = fields.Many2one("res.partner", ondelete="set null")
    user_id = fields.Many2one("res.users", ondelete="set null")
    apartamento_id = fields.Many2one("condome.apartamento", required=True, ondelete="cascade")
    edificio_id = fields.Many2one(related="apartamento_id.edificio_id", store=True)
    condominio_id = fields.Many2one(related="apartamento_id.condominio_id", store=True)
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="apartamento_id.company_id", store=True)

    def _clean_str(self, value):
        return (value or "").strip()

    def _normalized_email(self):
        self.ensure_one()
        return self._clean_str(self.email).lower()

    def _generate_temporary_password(self):
        alphabet = string.ascii_uppercase + string.digits
        token = "".join(secrets.choice(alphabet) for _ in range(6))
        return f"Prop-{token}!"

    def _portal_group(self):
        return self.env.ref("base.group_portal", raise_if_not_found=False)

    def _propietario_group(self):
        # Apartment owners use the resident portal role.
        # The propietario group is reserved for condominium administrators.
        return self.env.ref("condome_auth.group_condome_residente", raise_if_not_found=False)

    def _find_existing_user_by_login(self, login):
        return self.env["res.users"].sudo().search([("login", "=", login)], limit=1)

    def _ensure_unique_login(self, login):
        self.ensure_one()
        if not login:
            raise ValidationError(_("El propietario debe tener un correo para crear su acceso."))
        existing_user = self._find_existing_user_by_login(login)
        if existing_user and existing_user != self.user_id:
            raise ValidationError(_("Ya existe un usuario con el correo %s.") % login)

    def _portal_user_active(self):
        self.ensure_one()
        return bool(self.portal_access and self.estado != "inactive")

    def _partner_values(self):
        self.ensure_one()
        values = {
            "name": self._clean_str(self.name),
            "phone": self._clean_str(self.telefono),
        }
        email = self._normalized_email()
        if email:
            values["email"] = email
        return values

    def _ensure_partner(self):
        self.ensure_one()
        partner = self.partner_id.sudo()
        partner_vals = self._partner_values()
        if not partner:
            partner = self.env["res.partner"].sudo().create(partner_vals)
        else:
            partner.write(partner_vals)
        return partner

    def ensure_user_account(self):
        self.ensure_one()
        partner = self._ensure_partner()
        if not self.portal_access:
            self.with_context(skip_owner_account_sync=True).sudo().write({"partner_id": partner.id})
            if self.user_id:
                self.user_id.sudo().write({"active": False})
            return None

        login = self._normalized_email()
        self._ensure_unique_login(login)
        portal_group = self._portal_group()
        propietario_group = self._propietario_group()
        group_ids = [group.id for group in [portal_group, propietario_group] if group]

        user_vals = {
            "name": self._clean_str(self.name),
            "login": login,
            "partner_id": partner.id,
            "active": self._portal_user_active(),
        }
        if self.company_id:
            user_vals["company_id"] = self.company_id.id
            user_vals["company_ids"] = [(6, 0, [self.company_id.id])]

        if self.user_id:
            self.user_id.sudo().write(user_vals)
            if group_ids:
                self.user_id.sudo().write({"groups_id": [(4, group_id) for group_id in group_ids]})
            self.with_context(skip_owner_account_sync=True).sudo().write({"partner_id": partner.id})
            return None

        temporary_password = self._generate_temporary_password()
        if group_ids:
            user_vals["groups_id"] = [(6, 0, group_ids)]
        user_vals["password"] = temporary_password

        user = self.env["res.users"].sudo().with_context(no_reset_password=True).create(user_vals)
        self.with_context(skip_owner_account_sync=True).sudo().write({"partner_id": partner.id, "user_id": user.id})
        return temporary_password

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        if not self.env.context.get("skip_user_account_creation"):
            for owner in records:
                owner.provision_access_bundle(send_welcome=True)
        return records

    def provision_access_bundle(self, send_welcome=True):
        self.ensure_one()
        temporary_password = self.ensure_user_account()
        email_sent = False
        if temporary_password and send_welcome:
            email_sent = bool(self._send_welcome_email(self, temporary_password))
        return {
            "login": self.user_id.login if self.user_id else self.email,
            "temporary_password": temporary_password,
            "email_sent": email_sent,
        }

    @staticmethod
    def _send_welcome_email(owner, temporary_password):
        """Envía correo de bienvenida con credenciales al nuevo propietario."""
        try:
            from odoo.addons.condome_mail.services.email_service import CondomeEmailService
            mail = CondomeEmailService()
            return bool(mail.send_welcome_credentials(owner, temporary_password, async_send=False))
        except Exception as exc:
            import logging
            logging.getLogger(__name__).debug("No se pudo enviar el correo de bienvenida al propietario: %s", exc)
            return False

    def write(self, vals):
        result = super().write(vals)
        if self.env.context.get("skip_owner_account_sync"):
            return result
        for owner in self:
            if owner.portal_access:
                owner.ensure_user_account()
            elif owner.user_id:
                owner.user_id.sudo().write({"active": False})
            else:
                owner._ensure_partner()
        return result

    def unlink(self):
        linked_users = self.mapped("user_id")
        result = super().unlink()
        if linked_users:
            linked_users.sudo().write({"active": False})
        return result
