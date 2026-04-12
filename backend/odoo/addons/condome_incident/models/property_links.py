from odoo import fields, models


class CondomeCondominioIncidentLinks(models.Model):
    _inherit = "condome.condominio"

    incidencia_ids = fields.One2many("condome.incidencia", "condominio_id")


class CondomeEdificioIncidentLinks(models.Model):
    _inherit = "condome.edificio"

    incidencia_ids = fields.One2many("condome.incidencia", "edificio_id")


class CondomeApartamentoIncidentLinks(models.Model):
    _inherit = "condome.apartamento"

    incidencia_ids = fields.One2many("condome.incidencia", "apartamento_id")
