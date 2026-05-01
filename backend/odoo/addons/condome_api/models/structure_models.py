import secrets
import string

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class CondomeCondominio(models.Model):
    _inherit = "condome.condominio"
    _description = "Condominio"
    _order = "id desc"

    name = fields.Char(required=True)
    tipo = fields.Selection(
        [
            ("residencial", "Residencial"),
            ("comercial", "Comercial"),
            ("mixto", "Mixto"),
        ],
        default="residencial",
        required=True,
    )
    rnc = fields.Char()
    direccion = fields.Char(required=True)
    ciudad = fields.Char()
    pais = fields.Char()
    telefono = fields.Char()
    email = fields.Char()
    owner_user_id = fields.Many2one("res.users", required=True, default=lambda self: self.env.user)
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    parking_spaces_total = fields.Integer(
        string="Espacios de Estacionamiento",
        default=0,
        help="Cantidad total de espacios de estacionamiento administrados por el condominio.",
    )
    parking_spaces_occupied = fields.Integer(
        string="Espacios Ocupados",
        compute="_compute_parking_metrics",
    )
    parking_spaces_available = fields.Integer(
        string="Espacios Disponibles",
        compute="_compute_parking_metrics",
    )
    parking_spaces_pending = fields.Integer(
        string="Solicitudes Pendientes",
        compute="_compute_parking_metrics",
    )
    edificio_ids = fields.One2many("condome.edificio", "condominio_id")
    apartamento_ids = fields.One2many("condome.apartamento", "condominio_id")
    residente_ids = fields.One2many("condome.residente", "condominio_id")
    visita_ids = fields.One2many("condome.visita", "condominio_id")
    incidencia_ids = fields.One2many("condome.incidencia", "condominio_id")

    @api.depends("parking_spaces_total", "vehiculo_ids.estado")
    def _compute_parking_metrics(self):
        vehicle_model = self.env["condome.vehiculo"].sudo()
        for condominio in self:
            occupied = vehicle_model.search_count(
                [("condominio_id", "=", condominio.id), ("estado", "=", "activo")]
            )
            pending = vehicle_model.search_count(
                [("condominio_id", "=", condominio.id), ("estado", "=", "pendiente")]
            )
            total = max(int(condominio.parking_spaces_total or 0), 0)
            condominio.parking_spaces_occupied = occupied
            condominio.parking_spaces_pending = pending
            condominio.parking_spaces_available = max(total - occupied, 0)

    @api.constrains("parking_spaces_total")
    def _check_parking_spaces_total(self):
        for condominio in self:
            total = int(condominio.parking_spaces_total or 0)
            if total < 0:
                raise ValidationError(_("La cantidad de espacios de estacionamiento no puede ser negativa."))
            if total < int(condominio.parking_spaces_occupied or 0):
                raise ValidationError(
                    _(
                        "No puedes registrar menos espacios que los ya ocupados. "
                        "Primero libera vehículos o aumenta la capacidad."
                    )
                )

    def ensure_parking_slot_available(self, excluding_vehicle=None):
        self.ensure_one()
        if int(self.parking_spaces_total or 0) <= 0:
            raise ValidationError(
                _(
                    "Este condominio no tiene espacios de estacionamiento configurados. "
                    "Define la capacidad antes de aprobar vehículos."
                )
            )

        domain = [("condominio_id", "=", self.id), ("estado", "=", "activo")]
        if excluding_vehicle and excluding_vehicle.id:
            domain.append(("id", "!=", excluding_vehicle.id))

        occupied = self.env["condome.vehiculo"].sudo().search_count(domain)
        if occupied >= int(self.parking_spaces_total or 0):
            raise ValidationError(_("No hay espacios de estacionamiento disponibles en este condominio."))


class CondomeEdificio(models.Model):
    _inherit = "condome.edificio"
    _description = "Edificio"
    _order = "name asc, id asc"

    name = fields.Char(required=True)
    codigo = fields.Char()
    niveles = fields.Integer(default=1)
    descripcion = fields.Text()
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
    apartamento_ids = fields.One2many("condome.apartamento", "edificio_id")
    incidencia_ids = fields.One2many("condome.incidencia", "edificio_id")


class CondomeApartamento(models.Model):
    _inherit = "condome.apartamento"
    _description = "Apartamento"
    _order = "edificio_id asc, name asc"

    name = fields.Char(required=True)
    piso = fields.Char()
    tipo_unidad = fields.Selection(
        [
            ("apartamento", "Apartamento"),
            ("penthouse", "Penthouse"),
            ("estudio", "Estudio"),
            ("local", "Local"),
        ],
        default="apartamento",
        required=True,
    )
    metraje = fields.Float()
    estado = fields.Selection(
        [
            ("disponible", "Disponible"),
            ("ocupado", "Ocupado"),
            ("mantenimiento", "Mantenimiento"),
            ("inactivo", "Inactivo"),
        ],
        default="disponible",
        required=True,
    )
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    edificio_id = fields.Many2one("condome.edificio", required=True, ondelete="cascade")
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
    residente_ids = fields.One2many("condome.residente", "apartamento_id")
    visita_ids = fields.One2many("condome.visita", "apartamento_id")
    incidencia_ids = fields.One2many("condome.incidencia", "apartamento_id")

    @api.constrains("edificio_id", "condominio_id")
    def _check_same_condominio(self):
        for record in self:
            if record.edificio_id and record.edificio_id.condominio_id != record.condominio_id:
                raise ValidationError("El edificio no pertenece al condominio seleccionado.")

    def sync_estado_ocupacion(self):
        for apartment in self:
            active_residents = apartment.residente_ids.filtered("activo")
            if active_residents:
                apartment.estado = "ocupado"
            elif apartment.estado == "ocupado":
                apartment.estado = "disponible"

