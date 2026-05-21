import logging
from dateutil.relativedelta import relativedelta

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class CondomeReportExport(models.Model):
    """Stores administrative report export requests."""

    _name = "condome.report.export"
    _description = "Condominium report export request"
    _order = "requested_at desc, id desc"

    REPORT_LABELS = {
        "operativo": "Operational Report",
        "comunidad": "Community Report",
        "cobros": "Financial Report",
        "auditoria": "Audit Report",
    }

    REPORT_SUBTITLES = {
        "operativo": "Structure, occupancy and apartment inventory.",
        "comunidad": "Residents, owners and community footprint.",
        "cobros": "Collections, balances and payment activity.",
        "auditoria": "Recent incidents, visits and governance activity.",
    }

    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    company_id = fields.Many2one(
        "res.company",
        related="condominio_id.company_id",
        store=True,
        readonly=True,
    )
    requested_by = fields.Many2one(
        "res.users",
        required=True,
        ondelete="restrict",
        default=lambda self: self.env.user,
    )
    requested_at = fields.Datetime(default=fields.Datetime.now, required=True)
    generated_at = fields.Datetime()
    report_type = fields.Selection(
        [
            ("operativo", "Operativo"),
            ("comunidad", "Comunidad"),
            ("cobros", "Cobros"),
            ("auditoria", "Auditoria"),
        ],
        required=True,
        default="operativo",
    )
    export_format = fields.Selection(
        [
            ("pdf", "PDF"),
            ("xlsx", "Excel"),
            ("csv", "CSV"),
        ],
        required=True,
        default="pdf",
    )
    state = fields.Selection(
        [
            ("requested", "Solicitado"),
            ("ready", "Listo"),
            ("failed", "Fallido"),
        ],
        required=True,
        default="requested",
    )
    generation_mode = fields.Selection(
        [
            ("manual", "Manual"),
            ("automatic", "Automático"),
        ],
        required=True,
        default="manual",
    )
    file_name = fields.Char()
    download_url = fields.Char(compute="_compute_download_url")
    filters_json = fields.Text()
    note = fields.Text()
    owner_user_id = fields.Many2one(
        related="condominio_id.owner_user_id",
        store=True,
        readonly=True,
    )
    owner_plan = fields.Selection(
        related="owner_user_id.condome_plan",
        store=True,
        readonly=True,
    )
    owner_report_day = fields.Integer(
        related="owner_user_id.condome_report_day",
        store=True,
        readonly=True,
    )

    def _compute_download_url(self):
        for record in self:
            record.download_url = (
                f"/condome_api/report/download/{record.id}" if record.state == "ready" else False
            )

    @api.model
    def create(self, vals):
        record = super().create(vals)
        record.action_generate_report()
        return record

    def action_generate_report(self):
        """Marks the export as ready and prepares its file metadata."""
        for record in self:
            try:
                timestamp = fields.Datetime.context_timestamp(
                    record,
                    record.requested_at or fields.Datetime.now(),
                )
                scope_slug = record._slugify(record.condominio_id.name or "condome")
                report_slug = record._slugify(record.report_type)
                extension = record.export_format
                record.write(
                    {
                        "state": "ready",
                        "file_name": (
                            f"{scope_slug}-{report_slug}-"
                            f"{timestamp.strftime('%Y%m%d-%H%M%S')}.{extension}"
                        ),
                        "generated_at": fields.Datetime.now(),
                    }
                )
            except Exception:
                record.write({"state": "failed"})

    def _slugify(self, value):
        normalized = "".join(char.lower() if char.isalnum() else "-" for char in (value or ""))
        compact = "-".join(part for part in normalized.split("-") if part)
        return compact or "condome"

    def _fallback(self, value, default="-"):
        text = str(value or "").strip()
        return text or default

    def _format_money(self, amount):
        currency = self.condominio_id.company_id.currency_id or self.env.company.currency_id
        symbol = currency.symbol or "$"
        return f"{symbol}{float(amount or 0.0):,.2f}"

    def _format_percent(self, current, total):
        if not total:
            return "0%"
        return f"{(float(current or 0.0) / float(total)) * 100:,.1f}%"

    def _numeric_percent(self, current, total):
        if not total:
            return 0
        return round((float(current or 0.0) / float(total)) * 100, 1)

    def _format_date(self, value):
        if not value:
            return "-"
        return fields.Date.to_date(value).strftime("%d %b %Y")

    def _format_datetime(self, value):
        if not value:
            return "-"
        return fields.Datetime.to_datetime(value).strftime("%d %b %Y %I:%M %p")

    def _selection_label(self, record, field_name, value):
        field = record._fields.get(field_name)
        if not field:
            return self._fallback(value)
        return dict(field.selection).get(value, self._fallback(value))

    def _summary_card(self, label, value, helper):
        return {
            "label": label,
            "value": value,
            "helper": helper,
        }

    def _billed_party_name(self, charge):
        self.ensure_one()
        return (
            charge.residente_id.name
            or charge.propietario_id.name
            or charge.partner_id.name
            or "-"
        )

    def _amount_summary(self, charge):
        self.ensure_one()
        total = self._format_money(charge.amount)
        residual = float(charge.amount_residual or 0.0)
        if residual <= 0.01:
            return total
        return f"{total} / saldo {self._format_money(residual)}"

    def _base_payload(self):
        self.ensure_one()
        return {
            "title": self.REPORT_LABELS.get(self.report_type, "Administrative Report"),
            "subtitle": self.REPORT_SUBTITLES.get(
                self.report_type,
                "Condominium operational overview.",
            ),
            "scopeName": self.condominio_id.name or self.env.company.name or "Condome",
            "address": self._fallback(self.condominio_id.direccion),
            "email": self._fallback(self.condominio_id.email),
            "phone": self._fallback(self.condominio_id.telefono),
            "requestedBy": self._fallback(self.requested_by.name, "System"),
            "requestedAt": self._format_datetime(self.requested_at),
            "generatedAt": self._format_datetime(self.generated_at),
            "formatLabel": (self.export_format or "pdf").upper(),
            "note": self._fallback(self.note, "No additional notes."),
            "cards": [],
            "columns": [],
            "rows": [],
            "analysisSectionTitle": "Financial analysis and operating status.",
            "analysisLeftTitle": "Flow summary",
            "analysisRightTitle": "Operational compliance",
            "chart_income_label": "Income",
            "chart_income_val": self._format_money(0.0),
            "chart_income_pct": "0%",
            "chart_income_width": 0,
            "chart_expense_label": "Outstanding",
            "chart_expense_val": self._format_money(0.0),
            "chart_expense_pct": "0%",
            "chart_expense_width": 0,
            "chart_reserve_label": "Reserve",
            "chart_reserve_val": self._format_money(0.0),
            "chart_reserve_pct": "0%",
            "chart_reserve_width": 0,
            "chart_status_center": "0%",
            "chart_status_center_label": "Current status",
            "chart_paid_pct": "0%",
            "chart_paid_label": "On track",
            "chart_unpaid_pct": "0%",
            "chart_unpaid_label": "At risk",
            "footerNote": (
                "Generated by Condome. This report is intended for administrative use inside the selected condominium."
            ),
        }

    def _financial_report_payload(self):
        self.ensure_one()
        payload = self._base_payload()
        charge_model = self.env["condome.charge"]
        charges = charge_model.search(
            [
                ("condominio_id", "=", self.condominio_id.id),
                ("state", "not in", ["cancelled", "rolledover"]),
            ],
            order="due_date desc, id desc",
        )
        today = fields.Date.context_today(self)
        stale_pending = charges.filtered(
            lambda charge: charge.state == "pending"
            and charge.due_date
            and fields.Date.to_date(charge.due_date) < today
        )
        if stale_pending:
            stale_pending.write({"state": "overdue"})
            charges = charge_model.search(
                [
                    ("condominio_id", "=", self.condominio_id.id),
                    ("state", "not in", ["cancelled", "rolledover"]),
                ],
                order="due_date desc, id desc",
            )

        paid_charges = charges.filtered(lambda charge: charge.state == "paid")
        overdue_charges = charges.filtered(lambda charge: charge.state == "overdue")
        open_charges = charges.filtered(lambda charge: charge.state in ("draft", "pending", "overdue"))
        total_expected = sum(charges.mapped("amount"))
        total_collected = sum(charges.mapped("amount_paid"))
        total_open_balance = sum(open_charges.mapped("amount_residual"))
        total_overdue_balance = sum(overdue_charges.mapped("amount_residual"))
        total_charge_count = len(charges)
        current_charge_count = max(total_charge_count - len(overdue_charges), 0)

        payload["cards"] = [
            self._summary_card("Collected", self._format_money(total_collected), "Confirmed money already credited."),
            self._summary_card("Open Balance", self._format_money(total_open_balance), "Pending and overdue balance still open."),
            self._summary_card("Overdue Charges", str(len(overdue_charges)), "Payments that already exceeded the due date."),
            self._summary_card(
                "Collection Rate",
                self._format_percent(total_collected, total_expected),
                "Collected amount against expected billing.",
            ),
        ]
        payload.update(
            {
                "analysisSectionTitle": "Payment status and receivables",
                "analysisLeftTitle": "Collection summary",
                "analysisRightTitle": "Charge health",
                "chart_income_label": "Collected",
                "chart_income_val": self._format_money(total_collected),
                "chart_income_pct": self._format_percent(total_collected, total_expected),
                "chart_income_width": self._numeric_percent(total_collected, total_expected),
                "chart_expense_label": "Open balance",
                "chart_expense_val": self._format_money(total_open_balance),
                "chart_expense_pct": self._format_percent(total_open_balance, total_expected),
                "chart_expense_width": self._numeric_percent(total_open_balance, total_expected),
                "chart_reserve_label": "Overdue balance",
                "chart_reserve_val": self._format_money(total_overdue_balance),
                "chart_reserve_pct": self._format_percent(total_overdue_balance, total_expected),
                "chart_reserve_width": self._numeric_percent(total_overdue_balance, total_expected),
                "chart_status_center": self._format_percent(current_charge_count, total_charge_count),
                "chart_status_center_label": "Charges still on time",
                "chart_paid_pct": self._format_percent(current_charge_count, total_charge_count),
                "chart_paid_label": "Current",
                "chart_unpaid_pct": self._format_percent(len(overdue_charges), total_charge_count),
                "chart_unpaid_label": "Overdue",
            }
        )
        payload["columns"] = [
            {"key": "charge", "label": "Charge"},
            {"key": "unit", "label": "Unit"},
            {"key": "responsible", "label": "Responsible"},
            {"key": "status", "label": "Status"},
            {"key": "due_date", "label": "Due"},
            {"key": "paid_at", "label": "Paid"},
            {"key": "amount", "label": "Amount / Balance"},
        ]
        payload["rows"] = [
            {
                "charge": self._fallback(charge.name),
                "unit": self._fallback(charge.apartamento_id.name),
                "responsible": self._billed_party_name(charge),
                "status": self._selection_label(charge, "state", charge.state),
                "due_date": self._format_date(charge.due_date),
                "paid_at": self._format_datetime(charge.paid_at),
                "amount": self._amount_summary(charge),
            }
            for charge in charges[:18]
        ]
        return payload

    def _operational_report_payload(self):
        self.ensure_one()
        payload = self._base_payload()
        buildings = self.env["condome.edificio"].search([("condominio_id", "=", self.condominio_id.id)])
        apartments = self.env["condome.apartamento"].search(
            [("condominio_id", "=", self.condominio_id.id)],
            order="edificio_id asc, name asc",
        )
        occupied = apartments.filtered(lambda apartment: apartment.estado == "ocupado")
        available = apartments.filtered(lambda apartment: apartment.estado == "disponible")

        payload["cards"] = [
            self._summary_card("Buildings", str(len(buildings)), "Managed structures in this condominium."),
            self._summary_card("Apartments", str(len(apartments)), "Registered units across all buildings."),
            self._summary_card("Occupied", str(len(occupied)), "Units currently in use."),
            self._summary_card("Available", str(len(available)), "Units ready for assignment."),
        ]
        payload["columns"] = [
            {"key": "unit", "label": "Unit"},
            {"key": "building", "label": "Building"},
            {"key": "status", "label": "Status"},
            {"key": "type", "label": "Type"},
            {"key": "floor", "label": "Floor"},
            {"key": "size", "label": "Size"},
        ]
        payload["rows"] = [
            {
                "unit": self._fallback(apartment.name),
                "building": self._fallback(apartment.edificio_id.name),
                "status": self._selection_label(apartment, "estado", apartment.estado),
                "type": self._selection_label(apartment, "tipo_unidad", apartment.tipo_unidad),
                "floor": self._fallback(apartment.piso),
                "size": f"{float(apartment.metraje or 0.0):,.0f} m2" if apartment.metraje else "-",
            }
            for apartment in apartments[:16]
        ]
        return payload

    def _community_report_payload(self):
        self.ensure_one()
        payload = self._base_payload()
        owners = self.env["condome.propietario"].search(
            [("condominio_id", "=", self.condominio_id.id)],
            order="name asc, id asc",
        )
        residents = self.env["condome.residente"].search(
            [("condominio_id", "=", self.condominio_id.id)],
            order="name asc, id asc",
        )
        portal_people = owners.filtered("portal_access")
        active_residents = residents.filtered("activo")

        payload["cards"] = [
            self._summary_card("Owners", str(len(owners)), "Apartment owners linked to the condominium."),
            self._summary_card("Residents", str(len(residents)), "Residents with active records."),
            self._summary_card("Portal Access", str(len(portal_people) + len(active_residents)), "People able to enter the platform."),
            self._summary_card("Active Residents", str(len(active_residents)), "Residents currently marked as active."),
        ]
        payload["columns"] = [
            {"key": "person", "label": "Person"},
            {"key": "role", "label": "Role"},
            {"key": "unit", "label": "Unit"},
            {"key": "email", "label": "Email"},
            {"key": "phone", "label": "Phone"},
            {"key": "status", "label": "Status"},
        ]
        owner_rows = [
            {
                "person": self._fallback(owner.name),
                "role": "Owner",
                "unit": self._fallback(owner.apartamento_id.name),
                "email": self._fallback(owner.email),
                "phone": self._fallback(owner.telefono),
                "status": self._selection_label(owner, "estado", owner.estado),
            }
            for owner in owners[:8]
        ]
        resident_rows = [
            {
                "person": self._fallback(resident.name),
                "role": "Resident",
                "unit": self._fallback(resident.apartamento_id.name),
                "email": self._fallback(resident.email),
                "phone": self._fallback(resident.telefono),
                "status": "Active" if resident.activo else "Inactive",
            }
            for resident in residents[:8]
        ]
        payload["rows"] = owner_rows + resident_rows
        return payload

    def _audit_report_payload(self):
        self.ensure_one()
        payload = self._base_payload()
        incidents = self.env["condome.incidencia"].search(
            [("condominio_id", "=", self.condominio_id.id)],
            order="create_date desc, id desc",
        )
        visits = self.env["condome.visita"].search(
            [("condominio_id", "=", self.condominio_id.id)],
            order="fecha_visita desc, id desc",
        )
        reservations = self.env["condome.area.reservation"].search(
            [("condominio_id", "=", self.condominio_id.id)],
            order="fecha_reserva desc, id desc",
        )
        audit_entries = []
        if self.env.registry.get("condome.audit.entry"):
            audit_entries = self.env["condome.audit.entry"].search(
                [("condominio_id", "=", self.condominio_id.id)],
                order="create_date desc, id desc",
            )

        payload["cards"] = [
            self._summary_card(
                "Open Incidents",
                str(len(incidents.filtered(lambda item: item.estado in ("reportada", "en_revision")))),
                "Cases that still need follow-up.",
            ),
            self._summary_card(
                "Pending Visits",
                str(len(visits.filtered(lambda item: item.estado == "pendiente"))),
                "Visitor requests awaiting a decision.",
            ),
            self._summary_card(
                "Pending Reservations",
                str(len(reservations.filtered(lambda item: item.estado == "pending"))),
                "Common area reservations pending approval.",
            ),
            self._summary_card("Audit Entries", str(len(audit_entries)), "Registered governance events."),
        ]
        payload["columns"] = [
            {"key": "category", "label": "Category"},
            {"key": "title", "label": "Title"},
            {"key": "actor", "label": "Actor"},
            {"key": "severity", "label": "Severity"},
            {"key": "date", "label": "Date"},
        ]
        payload["rows"] = [
            {
                "category": self._fallback(entry.categoria),
                "title": self._fallback(entry.titulo),
                "actor": self._fallback(entry.actor),
                "severity": self._selection_label(entry, "severidad", entry.severidad),
                "date": self._format_datetime(entry.create_date),
            }
            for entry in audit_entries[:14]
        ]
        return payload

    def get_report_payload(self):
        self.ensure_one()
        builder_map = {
            "cobros": self._financial_report_payload,
            "operativo": self._operational_report_payload,
            "comunidad": self._community_report_payload,
            "auditoria": self._audit_report_payload,
        }
        builder = builder_map.get(self.report_type, self._financial_report_payload)
        return builder()

    @api.model
    def _eligible_automatic_condominiums(self):
        condos = self.env["condome.condominio"].search([])
        return condos.filtered(
            lambda condo: getattr(condo.owner_user_id, "condome_plan", "free") in ("pro", "premium")
        )

    @api.model
    def _automatic_report_already_exists(self, condo, report_type, month_start, next_month_start):
        return bool(
            self.search(
                [
                    ("condominio_id", "=", condo.id),
                    ("report_type", "=", report_type),
                    ("generation_mode", "=", "automatic"),
                    ("requested_at", ">=", fields.Datetime.to_string(month_start)),
                    ("requested_at", "<", fields.Datetime.to_string(next_month_start)),
                ],
                limit=1,
            )
        )

    @api.model
    def cron_generate_monthly_reports(self):
        """Generates monthly financial reports on the configured fixed day for paid plans."""
        today = fields.Date.context_today(self)
        month_start = today.replace(day=1)
        next_month_start = month_start + relativedelta(months=1)
        condos = self._eligible_automatic_condominiums()
        _logger.info("Executing monthly automated reports for %d paid condominiums", len(condos))
        for condo in condos:
            try:
                report_day = getattr(condo.owner_user_id, "get_condome_report_day", lambda: 1)()
                if today.day != report_day:
                    continue
                if self._automatic_report_already_exists(condo, "cobros", month_start, next_month_start):
                    _logger.info(
                        "Skipping automatic monthly report for condominium %s because one already exists in %s",
                        condo.name,
                        month_start.strftime("%Y-%m"),
                    )
                    continue
                self.create({
                    "condominio_id": condo.id,
                    "report_type": "cobros",
                    "export_format": "pdf",
                    "generation_mode": "automatic",
                    "note": "Automated monthly financial report (System Generated).",
                    "requested_by": condo.owner_user_id.id or self.env.ref("base.user_admin").id
                })
            except Exception as e:
                _logger.error("Failed to generate monthly report for condo %s: %s", condo.name, e)
