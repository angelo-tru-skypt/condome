from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class CondomeCondominioAccess(models.Model):
    _inherit = "condome.condominio"

    visita_ids = fields.One2many("condome.visita", "condominio_id")
    vehiculo_ids = fields.One2many("condome.vehiculo", "condominio_id")
    access_policy_ids = fields.One2many("condome.access.policy", "condominio_id")


class CondomeApartamentoAccess(models.Model):
    _inherit = "condome.apartamento"

    visita_ids = fields.One2many("condome.visita", "apartamento_id")


class CondomeVisita(models.Model):
    _name = "condome.visita"
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


class CondomeNotification(models.Model):
    _name = "condome.notification"
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


class CondomeAccessPolicy(models.Model):
    _name = "condome.access.policy"
    _description = "Política de control de acceso"
    _order = "write_date desc, id desc"

    name = fields.Char(required=True)
    tipo = fields.Selection(
        [
            ("visita", "Visita"),
            ("vehiculo", "Vehiculo"),
            ("proveedor", "Proveedor"),
            ("emergencia", "Emergencia"),
        ],
        default="visita",
        required=True,
    )
    applies_to = fields.Char(required=True)
    descripcion = fields.Text(required=True)
    estado = fields.Selection(
        [
            ("active", "Activa"),
            ("review", "En revision"),
            ("blocked", "Bloqueada"),
        ],
        default="active",
        required=True,
    )
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)


class CondomeVehiculo(models.Model):
    _name = "condome.vehiculo"
    _description = "Vehículo registrado en el condominio"
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
            ("activo", "Activo"),
            ("inactivo", "Inactivo"),
            ("suspendido", "Suspendido"),
        ],
        default="activo",
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
                    raise ValidationError(_("Ya existe un vehículo registrado con la placa %s en este condominio.") % record.placa)
