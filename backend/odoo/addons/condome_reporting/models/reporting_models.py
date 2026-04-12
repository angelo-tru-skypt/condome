from odoo import fields, models


class CondomeReportExport(models.Model):
    """Guarda el historial de exportaciones pedidas desde el dashboard administrativo."""

    _name = "condome.report.export"
    _description = "Solicitud de exportacion del condominio"
    _order = "requested_at desc, id desc"

    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    requested_by = fields.Many2one("res.users", required=True, ondelete="restrict", default=lambda self: self.env.user)
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
        default="xlsx",
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
    owner_user_id = fields.Many2one(related="condominio_id.owner_user_id", store=True, readonly=True)

    def _compute_download_url(self):
        for record in self:
            if record.state == "ready":
                record.download_url = f"/condome_api/report/download/{record.id}"
            else:
                record.download_url = False

    @api.model
    def create(self, vals):
        record = super(CondomeReportExport, self).create(vals)
        record.action_generate_report()
        return record

    def action_generate_report(self):
        """Simula la generacion del reporte y actualiza el estado."""
        for record in self:
            try:
                # En un entorno real aqui se llamaria a:
                # self.env.ref('condome_reporting.action_report_financial')._render_qweb_pdf([record.id])
                
                # Para esta integracion, marcamos como listo y asignamos nombre
                timestamp = record.requested_at.strftime("%Y%m%d_%H%M%S")
                ext = record.export_format
                record.write({
                    "state": "ready",
                    "file_name": f"Reporte_{record.report_type}_{timestamp}.{ext}",
                    "generated_at": fields.Datetime.now()
                })
            except Exception:
                record.write({"state": "failed"})

    def get_financial_data(self):
        """Calcula los datos financieros para el reporte."""
        self.ensure_one()
        Charge = self.env["condome.charge"]
        
        if self.report_type == "cobros":
            # Si es el reporte de cobros (financiero)
            if not self.condominio_id:
                # Caso Admin Global
                condos = self.env["condome.condominio"].search([])
                data = []
                for condo in condos:
                    charges = Charge.search([("condominio_id", "=", condo.id), ("state", "!=", "cancelled")])
                    generado = sum(charges.filtered(lambda c: c.state == "paid").mapped("amount"))
                    esperado = sum(charges.mapped("amount"))
                    data.append({
                        "id": condo.id,
                        "name": condo.name,
                        "generado": generado,
                        "esperado": esperado,
                        "total": esperado, 
                    })
                return {"condominios": data}
            else:
                # Caso Específico (Propietario/Condominio)
                charges = Charge.search([
                    ("condominio_id", "=", self.condominio_id.id),
                    ("state", "!=", "cancelled")
                ])
                
                # Desglose de pagos residentes
                pagos_residentes = []
                for charge in charges.filtered(lambda c: c.state == "paid"):
                    pagos_residentes.append({
                        "residente": charge.residente_id.name or "N/A",
                        "apartamento": charge.apartamento_id.name or "N/A",
                        "monto": charge.amount,
                        "fecha": charge.paid_at,
                        "referencia": charge.payment_reference,
                    })
                
                total_generado = sum(charges.filtered(lambda c: c.state == "paid").mapped("amount"))
                total_esperado = sum(charges.mapped("amount"))
                
                return {
                    "condominio": self.condominio_id.name,
                    "pagos": pagos_residentes,
                    "total_generado": total_generado,
                    "total_esperado": total_esperado,
                }
        return {}
