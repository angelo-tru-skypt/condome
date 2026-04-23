from odoo import api, fields, models


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
    file_name = fields.Char()
    download_url = fields.Char(compute="_compute_download_url")
    filters_json = fields.Text()
    note = fields.Text()
    owner_user_id = fields.Many2one(
        related="condominio_id.owner_user_id",
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
            "footerNote": (
                "Generated by Condome. This report is intended for administrative use inside the selected condominium."
            ),
        }

    def _financial_report_payload(self):
        self.ensure_one()
        payload = self._base_payload()
        charges = self.env["condome.charge"].search(
            [
                ("condominio_id", "=", self.condominio_id.id),
                ("state", "!=", "cancelled"),
            ],
            order="due_date desc, id desc",
        )
        paid_charges = charges.filtered(lambda charge: charge.state == "paid")
        open_charges = charges.filtered(lambda charge: charge.state in ("draft", "pending", "overdue"))
        total_expected = sum(charges.mapped("amount"))
        total_collected = sum(paid_charges.mapped("amount"))

        payload["cards"] = [
            self._summary_card("Collected", self._format_money(total_collected), "Payments already confirmed."),
            self._summary_card("Expected", self._format_money(total_expected), "Total amount billed in scope."),
            self._summary_card("Open Charges", str(len(open_charges)), "Draft, pending or overdue charges."),
            self._summary_card(
                "Collection Rate",
                self._format_percent(total_collected, total_expected),
                "Collected amount against expected billing.",
            ),
        ]
        payload["columns"] = [
            {"key": "charge", "label": "Charge"},
            {"key": "unit", "label": "Unit"},
            {"key": "resident", "label": "Resident"},
            {"key": "status", "label": "Status"},
            {"key": "due_date", "label": "Due"},
            {"key": "paid_at", "label": "Paid"},
            {"key": "amount", "label": "Amount"},
        ]
        payload["rows"] = [
            {
                "charge": self._fallback(charge.name),
                "unit": self._fallback(charge.apartamento_id.name),
                "resident": self._fallback(charge.residente_id.name),
                "status": self._selection_label(charge, "state", charge.state),
                "due_date": self._format_date(charge.due_date),
                "paid_at": self._format_datetime(charge.paid_at),
                "amount": self._format_money(charge.amount),
            }
            for charge in charges[:14]
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
