from odoo import fields, models


class CondomeCondominioGovernanceLinks(models.Model):
    _inherit = "condome.condominio"

    documento_ids = fields.One2many("condome.documento", "condominio_id")
    configuracion_ids = fields.One2many("condome.configuracion", "condominio_id")
    notification_rule_ids = fields.One2many("condome.notification.rule", "condominio_id")
    comunicado_ids = fields.One2many("condome.comunicado", "condominio_id")
    audit_entry_ids = fields.One2many("condome.audit.entry", "condominio_id")
