from odoo import fields, models


class CondomeCondominioPeople(models.Model):
    _inherit = "condome.condominio"

    residente_ids = fields.One2many("condome.residente", "condominio_id")
    propietario_ids = fields.One2many("condome.propietario", "condominio_id")


class CondomeApartamentoPeople(models.Model):
    _inherit = "condome.apartamento"

    residente_ids = fields.One2many("condome.residente", "apartamento_id")
    propietario_ids = fields.One2many("condome.propietario", "apartamento_id")
