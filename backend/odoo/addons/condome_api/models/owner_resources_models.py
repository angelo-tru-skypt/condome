import secrets
import string

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

class CondomeDocumento(models.Model):
    _inherit = "condome.documento"
    _description = "Documento del condominio"
    _order = "create_date desc, id desc"

    name = fields.Char(required=True)
    categoria = fields.Selection(
        [
            ("reglamento", "Reglamento"),
            ("acta", "Acta"),
            ("contrato", "Contrato"),
            ("finanzas", "Finanzas"),
            ("manual", "Manual"),
            ("general", "General"),
        ],
        default="general",
        required=True,
    )
    audiencia = fields.Selection(
        [
            ("todos", "Todos"),
            ("propietarios", "Propietarios"),
            ("residentes", "Residentes"),
            ("admin", "Administracion"),
        ],
        default="todos",
        required=True,
    )
    estado = fields.Selection(
        [
            ("vigente", "Vigente"),
            ("revision", "En revision"),
            ("archivado", "Archivado"),
        ],
        default="vigente",
        required=True,
    )
    origen = fields.Char()
    descripcion = fields.Text()
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)


class CondomeConfiguracion(models.Model):
    _inherit = "condome.configuracion"
    _description = "Configuracion general del condominio"
    _order = "id desc"

    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
    currency = fields.Selection(
        [
            ("DOP", "DOP"),
            ("USD", "USD"),
            ("EUR", "EUR"),
        ],
        default="DOP",
        required=True,
    )
    timezone = fields.Char(default="America/Santo_Domingo")
    language = fields.Selection(
        [
            ("es-DO", "Espanol (DO)"),
            ("es-ES", "Espanol (ES)"),
            ("en-US", "English (US)"),
        ],
        default="es-DO",
        required=True,
    )
    reservation_lead_hours = fields.Integer(default=24)
    reservation_window_days = fields.Integer(default=30)
    incident_sla_hours = fields.Integer(default=24)
    late_fee_grace_days = fields.Integer(default=5)
    support_email = fields.Char()
    automatic_access_validation = fields.Boolean(default=True)

    _sql_constraints = [
        ("condome_config_unique_condominio", "unique(condominio_id)", "Solo puede existir una configuracion por condominio."),
    ]


class CondomeNotificationRule(models.Model):
    _inherit = "condome.notification.rule"
    _description = "Regla de notificacion automatica"
    _order = "write_date desc, id desc"

    name = fields.Char(required=True)
    trigger = fields.Selection(
        [
            ("incidencia_reportada", "Incidencia reportada"),
            ("reserva_pendiente", "Reserva pendiente"),
            ("visita_pendiente", "Visita pendiente"),
            ("documento_publicado", "Documento publicado"),
            ("manual", "Manual"),
        ],
        default="manual",
        required=True,
    )
    channel = fields.Selection(
        [
            ("panel", "Panel"),
            ("panel-email", "Panel + email"),
            ("panel-sms", "Panel + SMS"),
        ],
        default="panel",
        required=True,
    )
    audience = fields.Selection(
        [
            ("owner", "Administracion"),
            ("propietarios", "Propietarios"),
            ("residentes", "Residentes"),
            ("todos", "Todos"),
        ],
        default="owner",
        required=True,
    )
    enabled = fields.Boolean(default=True)
    template = fields.Text(required=True)
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)


class CondomeAccessPolicy(models.Model):
    _inherit = "condome.access.policy"
    _description = "Politica de control de acceso"
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


