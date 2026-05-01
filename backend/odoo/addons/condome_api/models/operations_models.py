import secrets
import string

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class CondomeVisita(models.Model):
    _inherit = "condome.visita"
    _description = "Solicitud de visita"
    _order = "fecha_visita desc, hora_ingreso asc, id desc"

    name = fields.Char(compute="_compute_name", store=True)
    visitante_nombre = fields.Char(required=True)
    visitante_documento = fields.Char()
    visitante_telefono = fields.Char()
    fecha_visita = fields.Date(default=fields.Date.context_today, required=True)
    hora_ingreso = fields.Char(required=True)
    hora_salida = fields.Char()
    cantidad_personas = fields.Integer(default=1)
    motivo = fields.Text()
    estado = fields.Selection(
        [
            ("pendiente", "Pendiente"),
            ("aprobada", "Aprobada"),
            ("rechazada", "Rechazada"),
            ("cancelada", "Cancelada"),
        ],
        default="pendiente",
        required=True,
    )
    notas_propietario = fields.Text()
    fecha_decision = fields.Datetime()
    residente_id = fields.Many2one("condome.residente", required=True, ondelete="cascade")
    apartamento_id = fields.Many2one("condome.apartamento", required=True, ondelete="cascade")
    edificio_id = fields.Many2one(related="apartamento_id.edificio_id", store=True)
    condominio_id = fields.Many2one(related="apartamento_id.condominio_id", store=True)
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    aprobado_por_id = fields.Many2one("res.users", ondelete="set null")
    company_id = fields.Many2one(related="apartamento_id.company_id", store=True)

    @api.depends("visitante_nombre", "apartamento_id.name", "fecha_visita")
    def _compute_name(self):
        for record in self:
            parts = [record.visitante_nombre, record.apartamento_id.name]
            record.name = " - ".join(part for part in parts if part).strip()

    @api.constrains("residente_id", "apartamento_id")
    def _check_resident_apartment(self):
        for record in self:
            if record.residente_id and record.apartamento_id and record.residente_id.apartamento_id != record.apartamento_id:
                raise ValidationError(_("La visita debe estar asociada al apartamento del residente que la solicita."))


class CondomeIncidencia(models.Model):
    _inherit = "condome.incidencia"
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


class CondomeNotification(models.Model):
    _inherit = "condome.notification"
    _description = "Notificación operativa"
    _order = "create_date desc"

    message = fields.Char(required=True)
    read = fields.Boolean(default=False)
    residente_id = fields.Many2one("condome.residente", ondelete="cascade")
    incidencia_id = fields.Many2one("condome.incidencia", ondelete="set null")
    owner_user_id = fields.Many2one("res.users", ondelete="cascade")
    condominio_id = fields.Many2one("condome.condominio", ondelete="cascade")
    mark_read_by = fields.Many2one("res.users", ondelete="set null")

    def mark_as_read(self, user):
        self.write({"read": True, "mark_read_by": user.id})

    @api.constrains("condominio_id", "residente_id", "incidencia_id")
    def _check_same_condominio(self):
        for record in self:
            if record.condominio_id and record.residente_id and record.residente_id.condominio_id != record.condominio_id:
                raise ValidationError(_("La notificación debe estar vinculada a un residente del mismo condominio."))
            if record.condominio_id and record.incidencia_id and record.incidencia_id.condominio_id != record.condominio_id:
                raise ValidationError(_("La notificación debe estar vinculada a una incidencia del mismo condominio."))


class CondomeVehiculo(models.Model):
    _inherit = "condome.vehiculo"
    _description = "Vehiculo registrado en el condominio"
    _order = "create_date desc, id desc"

    name = fields.Char(compute="_compute_name", store=True)
    placa = fields.Char(required=True)
    marca = fields.Char(required=True)
    modelo = fields.Char()
    color = fields.Char()
    ano = fields.Integer()
    tipo = fields.Selection(
        [
            ("auto", "Automóvil"),
            ("moto", "Motocicleta"),
            ("bicicleta", "Bicicleta"),
            ("otro", "Otro"),
        ],
        default="auto",
        required=True,
    )
    estado = fields.Selection(
        [
            ("pendiente", "Pendiente"),
            ("activo", "Activo"),
            ("restringido", "Restringido"),
            ("inactivo", "Inactivo"),
            ("suspendido", "Suspendido"),
        ],
        default="pendiente",
        required=True,
    )
    propietario_documento = fields.Char()
    propietario_nombre = fields.Char()
    propietario_telefono = fields.Char()
    residente_id = fields.Many2one("condome.residente", required=True, ondelete="cascade")
    apartamento_id = fields.Many2one(related="residente_id.apartamento_id", store=True)
    edificio_id = fields.Many2one(related="residente_id.edificio_id", store=True)
    condominio_id = fields.Many2one(related="residente_id.condominio_id", store=True)
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="residente_id.company_id", store=True)
    notas = fields.Text()

    @api.depends("placa", "marca", "modelo")
    def _compute_name(self):
        for record in self:
            parts = [record.placa, record.marca, record.modelo]
            record.name = " - ".join(part for part in parts if part).strip() or f"Vehiculo {record.id}"

    @api.constrains("placa", "condominio_id")
    def _check_unique_placa(self):
        for record in self:
            if record.placa and record.condominio_id:
                existing = self.search(
                    [("placa", "=", record.placa), ("condominio_id", "=", record.condominio_id.id), ("id", "!=", record.id)],
                    limit=1,
                )
                if existing:
                    raise ValidationError(_("Ya existe un vhículo registrado con la placa %s en este condominio.") % record.placa)

    @api.model
    def _normalize_estado(self, value):
        safe_value = (value or "").strip().lower()
        aliases = {
            "aprobado": "activo",
            "liberado": "inactivo",
            "suspendido": "restringido",
        }
        return aliases.get(safe_value, safe_value or "pendiente")

    @api.model_create_multi
    def create(self, vals_list):
        normalized_vals_list = []
        for values in vals_list:
            current_values = dict(values)
            estado = self._normalize_estado(current_values.get("estado"))
            current_values["estado"] = estado
            residente_id = current_values.get("residente_id")
            if estado == "activo" and residente_id:
                resident = self.env["condome.residente"].sudo().browse(int(residente_id))
                if resident.exists() and resident.condominio_id:
                    resident.condominio_id.ensure_parking_slot_available()
            normalized_vals_list.append(current_values)
        return super().create(normalized_vals_list)

    def write(self, vals):
        updated_vals = dict(vals)
        if "estado" in updated_vals:
            updated_vals["estado"] = self._normalize_estado(updated_vals.get("estado"))

        for record in self:
            next_resident = record.residente_id
            if updated_vals.get("residente_id"):
                next_resident = self.env["condome.residente"].sudo().browse(int(updated_vals["residente_id"]))
            next_condominio = next_resident.condominio_id if next_resident else record.condominio_id
            next_estado = updated_vals.get("estado", record.estado)

            if next_estado == "activo" and record.estado != "activo" and next_condominio:
                next_condominio.ensure_parking_slot_available(excluding_vehicle=record)

        return super().write(updated_vals)
