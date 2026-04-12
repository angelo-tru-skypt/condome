from odoo import fields, models


class CondomeComunicado(models.Model):
    _name = "condome.comunicado"
    _description = "Aviso o comunicado del condominio"
    _order = "create_date desc, id desc"

    name = fields.Char(required=True)
    mensaje = fields.Text(required=True)
    prioridad = fields.Selection(
        [
            ("baja", "Baja"),
            ("media", "Media"),
            ("alta", "Alta"),
        ],
        default="media",
        required=True,
    )
    alcance = fields.Selection(
        [
            ("general", "Todo el condominio"),
            ("edificio", "Edificio especifico"),
            ("residentes", "Solo residentes"),
            ("propietarios", "Solo propietarios"),
        ],
        default="general",
        required=True,
    )
    canal = fields.Selection(
        [
            ("panel", "Panel"),
            ("panel-email", "Panel + email"),
            ("panel-sms", "Panel + SMS"),
        ],
        default="panel",
        required=True,
    )
    estado = fields.Selection(
        [
            ("draft", "Borrador"),
            ("published", "Publicado"),
            ("scheduled", "Programado"),
            ("archived", "Archivado"),
        ],
        default="draft",
        required=True,
    )
    target_label = fields.Char(default="Todo el condominio")
    scheduled_for = fields.Datetime()
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)


class CondomeAuditEntry(models.Model):
    _name = "condome.audit.entry"
    _description = "Entrada de auditoria"
    _order = "create_date desc, id desc"

    categoria = fields.Char(required=True)
    titulo = fields.Char(required=True)
    detalle = fields.Text()
    actor = fields.Char(default="Sistema")
    severidad = fields.Selection(
        [
            ("info", "Informacion"),
            ("success", "Exito"),
            ("warning", "Advertencia"),
            ("error", "Error"),
        ],
        default="info",
        required=True,
    )
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True)
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
