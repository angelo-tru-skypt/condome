from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class CondomeFeeTemplate(models.Model):
    """Plantilla base para cuotas mensuales u otras obligaciones recurrentes."""

    _name = "condome.fee.template"
    _description = "Plantilla de cuota del condominio"

    name = fields.Char(required=True)
    active = fields.Boolean(default=True)
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    apartamento_id = fields.Many2one("condome.apartamento", ondelete="set null")
    propietario_id = fields.Many2one("condome.propietario", ondelete="set null")
    residente_id = fields.Many2one("condome.residente", ondelete="set null")
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    currency_id = fields.Many2one("res.currency", required=True, default=lambda self: self.env.company.currency_id)
    amount = fields.Monetary(required=True, currency_field="currency_id")
    due_day = fields.Integer(default=5)
    frequency = fields.Selection(
        [
            ("monthly", "Mensual"),
            ("quarterly", "Trimestral"),
            ("annual", "Anual"),
        ],
        default="monthly",
        required=True,
    )
    note = fields.Text()
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True, readonly=True)

    @api.constrains("condominio_id", "apartamento_id", "propietario_id", "residente_id")
    def _check_same_condominio(self):
        for record in self:
            if record.apartamento_id and record.apartamento_id.condominio_id != record.condominio_id:
                raise ValidationError(_("La plantilla debe referenciar un apartamento del mismo condominio."))
            if record.propietario_id and record.propietario_id.condominio_id != record.condominio_id:
                raise ValidationError(_("La plantilla debe referenciar un propietario del mismo condominio."))
            if record.residente_id and record.residente_id.condominio_id != record.condominio_id:
                raise ValidationError(_("La plantilla debe referenciar un residente del mismo condominio."))


class CondomeCharge(models.Model):
    """Representa un cargo puntual o generado desde una plantilla de cuota."""

    _name = "condome.charge"
    _description = "Cargo del condominio"
    _order = "due_date desc, id desc"

    name = fields.Char(required=True, default="Cargo")
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    apartamento_id = fields.Many2one("condome.apartamento", ondelete="set null")
    propietario_id = fields.Many2one("condome.propietario", ondelete="set null")
    residente_id = fields.Many2one("condome.residente", ondelete="set null")
    partner_id = fields.Many2one("res.partner", ondelete="set null")
    fee_template_id = fields.Many2one("condome.fee.template", ondelete="set null")
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    currency_id = fields.Many2one("res.currency", required=True, default=lambda self: self.env.company.currency_id)
    amount = fields.Monetary(required=True, currency_field="currency_id")
    period_label = fields.Char()
    due_date = fields.Date(required=True)
    state = fields.Selection(
        [
            ("draft", "Borrador"),
            ("pending", "Pendiente"),
            ("paid", "Pagado"),
            ("overdue", "Vencido"),
            ("cancelled", "Cancelado"),
        ],
        default="pending",
        required=True,
    )
    move_id = fields.Many2one("account.move", ondelete="set null")
    payment_id = fields.Many2one("account.payment", ondelete="set null")
    payment_method = fields.Selection(
        [
            ("transferencia", "Transferencia"),
            ("tarjeta", "Tarjeta"),
            ("efectivo", "Efectivo"),
            ("portal", "Portal"),
            ("stripe", "Stripe / Tarjeta"),
        ],
        default=False,
    )
    payment_reference = fields.Char()
    # payment_provider = fields.Selection(
    #     [
    #         ("manual", "Manual"),
    #         ("stripe", "Stripe"),
    #         ("paypal", "PayPal"),
    #     ],
    #     default="manual"
    # )
    # stripe_payment_intent = fields.Char(string="Stripe Payment Intent ID")
    paid_at = fields.Datetime()
    note = fields.Text()
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True, readonly=True)

    @api.constrains("condominio_id", "apartamento_id", "propietario_id", "residente_id", "fee_template_id")
    def _check_same_condominio(self):
        for record in self:
            if record.apartamento_id and record.apartamento_id.condominio_id != record.condominio_id:
                raise ValidationError(_("El cargo debe referenciar un apartamento del mismo condominio."))
            if record.propietario_id and record.propietario_id.condominio_id != record.condominio_id:
                raise ValidationError(_("El cargo debe referenciar un propietario del mismo condominio."))
            if record.residente_id and record.residente_id.condominio_id != record.condominio_id:
                raise ValidationError(_("El cargo debe referenciar un residente del mismo condominio."))
            if record.fee_template_id and record.fee_template_id.condominio_id != record.condominio_id:
                raise ValidationError(_("El cargo debe referenciar una plantilla del mismo condominio."))

    @api.constrains("payment_reference", "condominio_id")
    def _check_unique_reference(self):
        for record in self:
            if record.payment_reference:
                # Buscar otros pagos con la misma referencia en el mismo condominio
                duplicate = self.search([
                    ("id", "!=", record.id),
                    ("condominio_id", "=", record.condominio_id.id),
                    ("payment_reference", "=", record.payment_reference),
                    ("state", "=", "paid")
                ], limit=1)
                if duplicate:
                    raise ValidationError(_("Esta referencia de pago ya ha sido registrada anteriormente."))

    def action_confirm_payment(self, method=None, reference=None):
        """Metodo para confirmar un pago desde la API o interfaz."""
        self.ensure_one()
        if self.state == "paid":
            return True
        self.write({
            "state": "paid",
            "payment_method": method or self.payment_method,
            "payment_reference": reference or self.payment_reference,
            "paid_at": fields.Datetime.now()
        })
        return True
