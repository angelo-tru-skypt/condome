from odoo import fields, models


class CondomeCondominioCommunityLinks(models.Model):
    _inherit = "condome.condominio"

    incidencia_ids = fields.One2many("condome.incidencia", "condominio_id")
    documento_ids = fields.One2many("condome.documento", "condominio_id")
    configuracion_ids = fields.One2many("condome.configuracion", "condominio_id")
    notification_rule_ids = fields.One2many("condome.notification.rule", "condominio_id")
    comunicado_ids = fields.One2many("condome.comunicado", "condominio_id")
    common_area_ids = fields.One2many("condome.common.area", "condominio_id")
    reserva_area_ids = fields.One2many("condome.area.reservation", "condominio_id")
    audit_entry_ids = fields.One2many("condome.audit.entry", "condominio_id")


class CondomeEdificioCommunityLinks(models.Model):
    _inherit = "condome.edificio"

    incidencia_ids = fields.One2many("condome.incidencia", "edificio_id")


class CondomeApartamentoCommunityLinks(models.Model):
    _inherit = "condome.apartamento"

    incidencia_ids = fields.One2many("condome.incidencia", "apartamento_id")
