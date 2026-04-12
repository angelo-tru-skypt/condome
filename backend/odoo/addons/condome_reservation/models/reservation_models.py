from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class CondomeCommonArea(models.Model):
    _name = "condome.common.area"
    _description = "Area comun"
    _order = "name asc, id asc"

    name = fields.Char(required=True)
    capacidad = fields.Integer(default=0)
    horario = fields.Char()
    reglas = fields.Text()
    active = fields.Boolean(default=True)
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
    reservation_ids = fields.One2many("condome.area.reservation", "area_id")


class CondomeAreaReservation(models.Model):
    _name = "condome.area.reservation"
    _description = "Reserva de area comun"
    _order = "fecha_reserva desc, id desc"

    name = fields.Char(compute="_compute_name", store=True)
    area_id = fields.Many2one("condome.common.area", required=True, ondelete="cascade")
    residente_id = fields.Many2one("condome.residente", required=True, ondelete="cascade")
    apartamento_id = fields.Many2one(related="residente_id.apartamento_id", store=True)
    edificio_id = fields.Many2one(related="residente_id.edificio_id", store=True)
    condominio_id = fields.Many2one(related="residente_id.condominio_id", store=True)
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
    fecha_reserva = fields.Date(required=True, default=fields.Date.context_today)
    rango_horario = fields.Char(required=True)
    asistentes = fields.Integer(default=1)
    motivo = fields.Text()
    estado = fields.Selection(
        [
            ("pending", "Pendiente"),
            ("approved", "Aprobada"),
            ("rejected", "Rechazada"),
            ("cancelled", "Cancelada"),
        ],
        default="pending",
        required=True,
    )
    nota_decision = fields.Text()
    fecha_decision = fields.Datetime()
    aprobado_por_id = fields.Many2one("res.users", ondelete="set null")

    @api.depends("area_id.name", "residente_id.name", "fecha_reserva")
    def _compute_name(self):
        for record in self:
            parts = [record.area_id.name, record.residente_id.name]
            record.name = " - ".join(part for part in parts if part).strip()

    @api.constrains("area_id", "residente_id")
    def _check_same_condominio(self):
        for record in self:
            if record.area_id and record.residente_id and record.area_id.condominio_id != record.residente_id.condominio_id:
                raise ValidationError(_("La reserva debe asociar un residente y un area del mismo condominio."))
