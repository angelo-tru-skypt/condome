from odoo import fields, models


class CondomeCondominioReservationLinks(models.Model):
    _inherit = "condome.condominio"

    common_area_ids = fields.One2many("condome.common.area", "condominio_id")
    reserva_area_ids = fields.One2many("condome.area.reservation", "condominio_id")
