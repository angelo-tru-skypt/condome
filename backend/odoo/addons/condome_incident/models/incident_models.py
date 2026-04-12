from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class CondomeIncidencia(models.Model):
    _name = "condome.incidencia"
    _description = "Incidencia del condominio"
    _order = "create_date desc, id desc"
    _rec_name = "titulo"

    titulo = fields.Char(required=True)
    descripcion = fields.Text(required=True)
    ubicacion_tipo = fields.Selection(
        [
            ("apartamento", "Apartamento"),
            ("edificio", "Edificio"),
        ],
        default="apartamento",
        required=True,
    )
    categoria = fields.Selection(
        [
            ("mantenimiento", "Mantenimiento"),
            ("seguridad", "Seguridad"),
            ("limpieza", "Limpieza"),
            ("servicios", "Servicios"),
            ("otros", "Otros"),
        ],
        default="mantenimiento",
        required=True,
    )
    prioridad = fields.Selection(
        [
            ("baja", "Baja"),
            ("media", "Media"),
            ("alta", "Alta"),
            ("urgente", "Urgente"),
        ],
        default="media",
        required=True,
    )
    estado = fields.Selection(
        [
            ("reportada", "Reportada"),
            ("en_revision", "En revision"),
            ("resuelta", "Resuelta"),
            ("cerrada", "Cerrada"),
        ],
        default="reportada",
        required=True,
    )
    ubicacion_detalle = fields.Char()
    respuesta_propietario = fields.Text()
    fecha_resolucion = fields.Datetime()
    residente_id = fields.Many2one("condome.residente", required=True, ondelete="cascade")
    apartamento_id = fields.Many2one("condome.apartamento", required=True, ondelete="cascade")
    edificio_id = fields.Many2one("condome.edificio", required=True, ondelete="cascade")
    condominio_id = fields.Many2one(related="apartamento_id.condominio_id", store=True)
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="apartamento_id.company_id", store=True)

    @api.constrains("residente_id", "apartamento_id", "edificio_id", "ubicacion_tipo")
    def _check_incidencia_location(self):
        for record in self:
            if record.residente_id and record.apartamento_id and record.residente_id.apartamento_id != record.apartamento_id:
                raise ValidationError(_("La incidencia debe relacionarse con el apartamento del residente que la reporta."))
            if record.edificio_id and record.edificio_id.condominio_id != record.apartamento_id.condominio_id:
                raise ValidationError(_("El edificio seleccionado no pertenece al mismo condominio del residente."))
            if record.ubicacion_tipo == "edificio" and not record.edificio_id:
                raise ValidationError(_("Debes seleccionar un edificio para reportar una incidencia a nivel de edificio."))
