from calendar import monthrange
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
import logging

_logger = logging.getLogger(__name__)


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
            ("rolledover", "Acumulado"),
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
    amount_paid = fields.Monetary(string="Monto Pagado", currency_field="currency_id", default=0.0)
    rolled_amount = fields.Monetary(string="Monto Acumulado", currency_field="currency_id", default=0.0)
    amount_residual = fields.Monetary(string="Saldo Pendiente", compute="_compute_residual", store=True, currency_field="currency_id")
    note = fields.Text()
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True, readonly=True)
    reminder_sent = fields.Boolean(default=False, string="Recordatorio enviado")
    delinquency_notified_at = fields.Datetime(string="Aviso de morosidad enviado")
    rolled_into_charge_id = fields.Many2one("condome.charge", string="Cargo destino acumulado", ondelete="set null", readonly=True)
    origin_charge_id = fields.Many2one("condome.charge", string="Cargo origen", ondelete="set null", readonly=True)

    @api.depends("amount", "amount_paid", "rolled_amount")
    def _compute_residual(self):
        for record in self:
            residual = record.amount - record.amount_paid - record.rolled_amount
            record.amount_residual = residual if residual > 0 else 0.0
            if record.state not in ["paid", "cancelled", "rolledover"] and record.amount_paid > 0:
                if record.amount_residual <= 0:
                    record.state = "paid"
                else:
                    # Opcionalmente podrías añadir un estado 'parcial'
                    pass

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

    def action_confirm_payment(self, method=None, reference=None, amount=0.0):
        """Metodo para confirmar un pago (total o parcial) desde la API o interfaz."""
        self.ensure_one()
        if self.state in ["paid", "rolledover", "cancelled"]:
            return True
        
        # Si no se especifica monto, se asume pago total
        pay_amount = amount if amount > 0 else self.amount_residual
        
        vals = {
            "payment_method": method or self.payment_method,
            "payment_reference": reference or self.payment_reference,
            "paid_at": fields.Datetime.now()
        }
        
        # Incrementar monto pagado
        new_total_paid = self.amount_paid + pay_amount
        vals["amount_paid"] = new_total_paid
        
        # Si el saldo es cero o menor, marcar como pagado
        if (self.amount - new_total_paid) <= 0.01:
            vals["state"] = "paid"
            
        self.write(vals)
        return True

    def _concat_note(self, current_note, extra_note):
        notes = [part for part in [current_note, extra_note] if part]
        return "\n\n".join(notes)

    def _frequency_delta(self):
        self.ensure_one()
        frequency = self.fee_template_id.frequency if self.fee_template_id else "monthly"
        if frequency == "annual":
            return relativedelta(years=1)
        if frequency == "quarterly":
            return relativedelta(months=3)
        return relativedelta(months=1)

    def _next_due_date(self):
        self.ensure_one()
        base_date = fields.Date.to_date(self.due_date or fields.Date.context_today(self))
        next_date = base_date + self._frequency_delta()
        target_day = self.fee_template_id.due_day if self.fee_template_id else next_date.day
        last_day = monthrange(next_date.year, next_date.month)[1]
        return next_date.replace(day=min(max(int(target_day or 1), 1), last_day))

    def _next_period_label(self, next_due_date):
        target_date = fields.Date.to_date(next_due_date)
        return target_date.strftime("%m/%Y")

    def _rollover_target(self, next_due_date):
        self.ensure_one()
        month_start = next_due_date.replace(day=1)
        next_month_start = month_start + relativedelta(months=1)
        domain = [
            ("id", "!=", self.id),
            ("condominio_id", "=", self.condominio_id.id),
            ("state", "in", ["draft", "pending", "overdue"]),
            ("due_date", ">=", fields.Date.to_string(month_start)),
            ("due_date", "<", fields.Date.to_string(next_month_start)),
        ]
        if self.fee_template_id:
            domain.append(("fee_template_id", "=", self.fee_template_id.id))
        if self.residente_id:
            domain.append(("residente_id", "=", self.residente_id.id))
        elif self.propietario_id:
            domain.append(("propietario_id", "=", self.propietario_id.id))
        elif self.apartamento_id:
            domain.append(("apartamento_id", "=", self.apartamento_id.id))
        else:
            domain.append(("name", "=", self.name))
        return self.search(domain, limit=1)

    def action_rollover_balance(self):
        self.ensure_one()
        if self.state not in ["pending", "overdue"]:
            raise ValidationError(_("Solo los cargos pendientes o vencidos pueden acumularse."))

        residual = float(self.amount_residual or 0.0)
        if residual <= 0.01:
            raise ValidationError(_("El cargo no tiene saldo pendiente para acumular."))

        next_due_date = self._next_due_date()
        rollover_detail = _(
            "Incluye saldo acumulado del cargo '%(charge)s' vencido el %(due)s por %(amount).2f."
        ) % {
            "charge": self.name or _("Cargo"),
            "due": fields.Date.to_string(self.due_date) if self.due_date else "-",
            "amount": residual,
        }

        target = self._rollover_target(next_due_date)
        if target:
            target.write(
                {
                    "amount": target.amount + residual,
                    "note": self._concat_note(target.note, rollover_detail),
                }
            )
        else:
            base_amount = residual
            charge_name = self.name
            charge_note = rollover_detail
            if self.fee_template_id:
                base_amount += float(self.fee_template_id.amount or 0.0)
                charge_name = self.fee_template_id.name or self.name
                charge_note = self._concat_note(self.fee_template_id.note, rollover_detail)

            target = self.create(
                {
                    "name": charge_name,
                    "condominio_id": self.condominio_id.id,
                    "apartamento_id": self.apartamento_id.id if self.apartamento_id else False,
                    "propietario_id": self.propietario_id.id if self.propietario_id else False,
                    "residente_id": self.residente_id.id if self.residente_id else False,
                    "partner_id": self.partner_id.id if self.partner_id else False,
                    "fee_template_id": self.fee_template_id.id if self.fee_template_id else False,
                    "company_id": self.company_id.id if self.company_id else self.env.company.id,
                    "currency_id": self.currency_id.id if self.currency_id else self.env.company.currency_id.id,
                    "amount": base_amount,
                    "period_label": self._next_period_label(next_due_date),
                    "due_date": fields.Date.to_string(next_due_date),
                    "state": "pending",
                    "note": charge_note,
                    "origin_charge_id": self.id,
                }
            )

        self.write(
            {
                "rolled_amount": self.rolled_amount + residual,
                "rolled_into_charge_id": target.id,
                "state": "rolledover",
                "note": self._concat_note(
                    self.note,
                    _("Saldo acumulado al cargo %(target)s con vencimiento %(due)s.")
                    % {
                        "target": target.name or _("Próxima cuota"),
                        "due": fields.Date.to_string(target.due_date) if target.due_date else "-",
                    },
                ),
            }
        )
        return target

    def action_remove_resident_from_system(self):
        self.ensure_one()
        resident = self.residente_id
        if not resident:
            raise ValidationError(_("El cargo seleccionado no está vinculado a un residente activo."))

        removal_note = _(
            "Residente eliminado del sistema por decisión administrativa relacionada con morosidad."
        )
        related_charges = self.search(
            [
                ("residente_id", "=", resident.id),
                ("state", "in", ["draft", "pending", "overdue", "rolledover", "cancelled"]),
            ]
        )
        for charge in related_charges:
            charge.write({"note": charge._concat_note(charge.note, removal_note)})

        resident_name = resident.name
        resident.unlink()
        return resident_name

    def write(self, vals):
        res = super(CondomeCharge, self).write(vals)
        return res

    @api.model
    def cron_send_payment_reminders(self):
        """Busca cargos pendientes con menos de dos días para vencer y envía recordatorios."""
        today = fields.Date.context_today(self)
        target_date = today + timedelta(days=1)
        charges = self.search([
            ("state", "=", "pending"),
            ("due_date", ">=", today),
            ("due_date", "<=", target_date),
            ("reminder_sent", "=", False),
            "|",
            ("residente_id", "!=", False),
            ("propietario_id", "!=", False),
        ])
        
        if not charges:
            return True
            
        try:
            from odoo.addons.condome_mail.services.email_service import CondomeEmailService
            mail_service = CondomeEmailService()
        except Exception as e:
            _logger.error("No se pudo cargar el servicio de correo para recordatorios: %s", str(e))
            return False

        sent_count = 0
        for charge in charges:
            billed_person = charge.residente_id or charge.propietario_id
            if billed_person and billed_person.email:
                success = mail_service.send_delinquency_notice(
                    billed_person,
                    charge.amount_residual,
                    charge.currency_id.name,
                    charge.name or "Cuota de Mantenimiento",
                    fields.Date.to_string(charge.due_date),
                    async_send=False,
                )
                if success:
                    charge.write(
                        {
                            "reminder_sent": True,
                            "delinquency_notified_at": fields.Datetime.now(),
                        }
                    )
                    sent_count += 1

        _logger.info("Cron de recordatorios: %s correos enviados para cargos entre %s y %s", sent_count, today, target_date)
        return True

    @api.model
    def cron_process_overdue_charges(self):
        """Marca cargos vencidos para que la administración decida si acumular o remover al residente."""
        today = fields.Date.context_today(self)
        overdue_pending = self.search(
            [
                ("state", "=", "pending"),
                ("due_date", "!=", False),
                ("due_date", "<", today),
            ]
        )
        if overdue_pending:
            overdue_pending.write({"state": "overdue"})

        sent_count = 0
        if overdue_pending:
            try:
                from odoo.addons.condome_mail.services.email_service import CondomeEmailService
                mail_service = CondomeEmailService()
            except Exception as e:
                _logger.error("No se pudo cargar el servicio de correo para morosidad vencida: %s", str(e))
                mail_service = False

            if mail_service:
                for charge in overdue_pending:
                    billed_person = charge.residente_id or charge.propietario_id
                    if not billed_person or not billed_person.email:
                        continue

                    success = mail_service.send_overdue_notice(
                        billed_person,
                        charge.amount_residual,
                        charge.currency_id.name,
                        charge.name or "Cuota de Mantenimiento",
                        fields.Date.to_string(charge.due_date),
                        async_send=False,
                    )
                    if success:
                        charge.write(
                            {
                                "reminder_sent": True,
                                "delinquency_notified_at": fields.Datetime.now(),
                            }
                        )
                        sent_count += 1

        _logger.info(
            "Cron de morosidad: %s cargos marcados como vencidos y %s correos enviados.",
            len(overdue_pending),
            sent_count,
        )
        return True
