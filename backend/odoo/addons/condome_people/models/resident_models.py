import secrets
import string

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class CondomeResidente(models.Model):
    _name = "condome.residente"
    _description = "Residente"
    _order = "fecha_ingreso desc, id desc"

    name = fields.Char(compute="_compute_name", store=True)
    nombre = fields.Char(required=True)
    apellido = fields.Char(required=True)
    email = fields.Char()
    telefono = fields.Char()
    activo = fields.Boolean(default=True)
    fecha_ingreso = fields.Date(default=fields.Date.context_today)
    partner_id = fields.Many2one("res.partner", ondelete="set null")
    user_id = fields.Many2one("res.users", ondelete="set null")
    apartamento_id = fields.Many2one("condome.apartamento", required=True, ondelete="cascade")
    edificio_id = fields.Many2one(related="apartamento_id.edificio_id", store=True)
    condominio_id = fields.Many2one(related="apartamento_id.condominio_id", store=True)
    company_id = fields.Many2one(related="apartamento_id.company_id", store=True)

    @api.depends("nombre", "apellido")
    def _compute_name(self):
        for resident in self:
            resident.name = " ".join(part for part in [resident.nombre, resident.apellido] if part).strip()

    def _clean_str(self, value):
        return (value or "").strip()

    def _normalized_email(self):
        self.ensure_one()
        return self._clean_str(self.email).lower()

    def _full_name(self):
        self.ensure_one()
        return " ".join(part for part in [self._clean_str(self.nombre), self._clean_str(self.apellido)] if part).strip()

    def _generate_temporary_password(self):
        alphabet = string.ascii_uppercase + string.digits
        token = "".join(secrets.choice(alphabet) for _ in range(6))
        return f"Resi-{token}!"

    def _resident_group(self):
        return self.env.ref("condome_auth.group_condome_residente", raise_if_not_found=False)

    def _portal_group(self):
        return self.env.ref("base.group_portal", raise_if_not_found=False)

    def _find_existing_user_by_login(self, login):
        return self.env["res.users"].sudo().search([("login", "=", login)], limit=1)

    def _ensure_unique_login(self, login):
        self.ensure_one()
        if not login:
            raise ValidationError(_("El residente debe tener un correo para crear su acceso."))
        existing_user = self._find_existing_user_by_login(login)
        if existing_user and existing_user != self.user_id:
            raise ValidationError(_("Ya existe un usuario con el correo %s.") % login)

    def ensure_user_account(self):
        self.ensure_one()
        if self.user_id:
            self._sync_linked_user()
            return None

        login = self._normalized_email()
        self._ensure_unique_login(login)

        partner = self.partner_id.sudo()
        if not partner:
            partner = self.env["res.partner"].sudo().create(
                {
                    "name": self._full_name(),
                    "email": login,
                    "phone": self._clean_str(self.telefono),
                }
            )
        else:
            partner.write(
                {
                    "name": self._full_name(),
                    "email": login,
                    "phone": self._clean_str(self.telefono),
                }
            )

        temporary_password = self._generate_temporary_password()
        portal_group = self._portal_group()
        resident_group = self._resident_group()
        group_ids = [group.id for group in [portal_group, resident_group] if group]

        user_vals = {
            "name": self._full_name(),
            "login": login,
            "partner_id": partner.id,
            "password": temporary_password,
            "active": self.activo,
        }
        if self.company_id:
            user_vals["company_id"] = self.company_id.id
            user_vals["company_ids"] = [(6, 0, [self.company_id.id])]
        if group_ids:
            user_vals["groups_id"] = [(6, 0, group_ids)]

        user = self.env["res.users"].sudo().with_context(no_reset_password=True).create(user_vals)
        self.sudo().write({"partner_id": partner.id, "user_id": user.id})
        return temporary_password

    def _sync_linked_user(self):
        for resident in self:
            login = resident._normalized_email()
            if resident.user_id and login:
                resident._ensure_unique_login(login)

            partner_vals = {
                "name": resident._full_name(),
                "phone": resident._clean_str(resident.telefono),
            }
            if login:
                partner_vals["email"] = login

            if resident.partner_id:
                resident.partner_id.sudo().write(partner_vals)
            elif resident.user_id and resident.user_id.partner_id:
                resident.user_id.partner_id.sudo().write(partner_vals)

            if resident.user_id:
                user_vals = {
                    "name": resident._full_name(),
                    "active": resident.activo,
                }
                if login:
                    user_vals["login"] = login
                resident.user_id.sudo().write(user_vals)

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        if not self.env.context.get("skip_user_account_creation"):
            for resident in records:
                resident.ensure_user_account()
        records.mapped("apartamento_id").sync_estado_ocupacion()
        return records

    def write(self, vals):
        apartments_before = self.mapped("apartamento_id")
        result = super().write(vals)
        for resident in self:
            if resident.user_id or resident.email:
                resident.ensure_user_account()
            else:
                resident._sync_linked_user()
        (apartments_before | self.mapped("apartamento_id")).sync_estado_ocupacion()
        return result

    def unlink(self):
        apartments = self.mapped("apartamento_id")
        linked_users = self.mapped("user_id")
        result = super().unlink()
        if linked_users:
            linked_users.sudo().write({"active": False})
        apartments.sync_estado_ocupacion()
        return result


