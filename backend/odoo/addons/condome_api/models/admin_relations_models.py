import secrets
import string

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class CondomeCondominioOwnerAdmin(models.Model):
    _inherit = "condome.condominio"

    propietario_ids = fields.One2many("condome.propietario", "condominio_id")
    documento_ids = fields.One2many("condome.documento", "condominio_id")
    configuracion_ids = fields.One2many("condome.configuracion", "condominio_id")
    notification_rule_ids = fields.One2many("condome.notification.rule", "condominio_id")
    access_policy_ids = fields.One2many("condome.access.policy", "condominio_id")
    comunicado_ids = fields.One2many("condome.comunicado", "condominio_id")
    common_area_ids = fields.One2many("condome.common.area", "condominio_id")
    reserva_area_ids = fields.One2many("condome.area.reservation", "condominio_id")
    audit_entry_ids = fields.One2many("condome.audit.entry", "condominio_id")
    vehiculo_ids = fields.One2many("condome.vehiculo", "condominio_id")


class CondomeApartamentoOwnerAdmin(models.Model):
    _inherit = "condome.apartamento"

    propietario_ids = fields.One2many("condome.propietario", "apartamento_id")

