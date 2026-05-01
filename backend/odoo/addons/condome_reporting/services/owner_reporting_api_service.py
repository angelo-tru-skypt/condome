import csv
import json
import io
import logging
import zipfile
from datetime import datetime
from xml.sax.saxutils import escape

from odoo import _
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class OwnerReportingApiService(BaseApiService):
    """Administrative reporting endpoints for system owners and condominium admins."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def serialize_export(self, record):
        return {
            "id": record.id,
            "condominioId": record.condominio_id.id,
            "condominioNombre": record.condominio_id.name,
            "reportType": record.report_type,
            "exportFormat": record.export_format,
            "state": record.state,
            "fileName": record.file_name or "",
            "requestedAt": record.requested_at.isoformat() if record.requested_at else None,
            "generatedAt": record.generated_at.isoformat() if record.generated_at else None,
            "requestedBy": record.requested_by.name if record.requested_by else "",
            "downloadUrl": record.download_url or "",
            "note": record.note or "",
            "generationMode": record.generation_mode or "manual",
            "generatedAutomatically": record.generation_mode == "automatic",
            "planCode": record.owner_plan or getattr(record.owner_user_id, "condome_plan", "free"),
        }

    def _selected_condominios(self, user):
        domain = list(self.condominio_domain(user))
        condominio_id = request.httprequest.args.get("condominio_id")
        if condominio_id:
            domain.append(("id", "=", int(condominio_id)))
        return request.env["condome.condominio"].sudo().search(domain)

    def _resolve_automation_owner(self, user, condominio_id):
        condominio = self.get_condominio(int(condominio_id), user)
        plan_owner = condominio.owner_user_id.sudo()
        if not plan_owner:
            raise ValueError(_("El condominio no tiene un administrador asignado"))
        if not getattr(plan_owner, "supports_automatic_reports", lambda: False)():
            raise PermissionError(_("Los reportes automáticos mensuales solo están disponibles con planes Pro o Premium"))
        return condominio, plan_owner

    def _download_headers(self, filename, content_type):
        origin = request.httprequest.headers.get("Origin")
        # Asegurar que el filename tenga la extensión si falta
        if "." not in filename:
            ext = "pdf" if content_type == "application/pdf" else "csv"
            filename = f"{filename}.{ext}"

        headers = [
            ("Content-Type", content_type),
            ("Content-Disposition", f'attachment; filename="{filename}"'),
            ("Access-Control-Expose-Headers", "Content-Disposition, Content-Type"),
            ("Vary", "Origin"),
        ]
        if origin:
            headers.extend(
                [
                    ("Access-Control-Allow-Origin", origin),
                    ("Access-Control-Allow-Credentials", "true"),
                ]
            )
        else:
            headers.append(("Access-Control-Allow-Origin", "*"))
        return headers

    def _get_export_for_download(self, export_id, user):
        model = request.env["condome.report.export"].sudo()
        record = model.search([("id", "=", export_id)] + self.owner_domain(user), limit=1)
        if not record or record.state != "ready":
            raise ValueError("Report not found or not ready")
        return record

    def _payload_table_rows(self, payload):
        rows = []
        rows.append([payload.get("title", "Report")])
        rows.append([payload.get("subtitle", "")])
        rows.append([])
        rows.append(["Condominium", payload.get("scopeName", "-")])
        rows.append(["Address", payload.get("address", "-")])
        rows.append(["Email", payload.get("email", "-")])
        rows.append(["Phone", payload.get("phone", "-")])
        rows.append(["Requested by", payload.get("requestedBy", "-")])
        rows.append(["Requested at", payload.get("requestedAt", "-")])
        rows.append(["Generated at", payload.get("generatedAt", "-")])
        rows.append(["Format", payload.get("formatLabel", "-")])
        rows.append(["Note", payload.get("note", "-")])
        rows.append([])
        rows.append(["Summary"])
        for card in payload.get("cards", []):
            rows.append([card.get("label", ""), card.get("value", ""), card.get("helper", "")])
        rows.append([])
        columns = payload.get("columns", [])
        if columns:
            rows.append([column.get("label", "") for column in columns])
            for row in payload.get("rows", []):
                rows.append([row.get(column.get("key"), "") for column in columns])
        return rows

    def _build_csv_content(self, record):
        payload = record.get_report_payload()
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        for row in self._payload_table_rows(payload):
            writer.writerow(row)
        return buffer.getvalue().encode("utf-8")

    def _xlsx_cell_ref(self, column_index, row_index):
        column_name = ""
        while column_index >= 0:
            column_name = chr((column_index % 26) + 65) + column_name
            column_index = (column_index // 26) - 1
        return f"{column_name}{row_index}"

    def _build_sheet_xml(self, rows):
        lines = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
            "<sheetData>",
        ]
        for row_index, row in enumerate(rows, start=1):
            lines.append(f'<row r="{row_index}">')
            for column_index, value in enumerate(row):
                text = escape(str(value or ""))
                cell_ref = self._xlsx_cell_ref(column_index, row_index)
                lines.append(
                    (
                        f'<c r="{cell_ref}" t="inlineStr">'
                        f"<is><t>{text}</t></is>"
                        "</c>"
                    )
                )
            lines.append("</row>")
        lines.extend(["</sheetData>", "</worksheet>"])
        return "".join(lines)

    def _build_xlsx_content(self, record):
        rows = self._payload_table_rows(record.get_report_payload())
        workbook_buffer = io.BytesIO()
        created_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        files = {
            "[Content_Types].xml": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                '<Default Extension="xml" ContentType="application/xml"/>'
                '<Override PartName="/xl/workbook.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                '<Override PartName="/xl/worksheets/sheet1.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                '<Override PartName="/xl/styles.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                '<Override PartName="/docProps/core.xml" '
                'ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
                '<Override PartName="/docProps/app.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
                "</Types>"
            ),
            "_rels/.rels": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
                'Target="xl/workbook.xml"/>'
                '<Relationship Id="rId2" '
                'Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" '
                'Target="docProps/core.xml"/>'
                '<Relationship Id="rId3" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" '
                'Target="docProps/app.xml"/>'
                "</Relationships>"
            ),
            "docProps/app.xml": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
                'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
                "<Application>Condome</Application>"
                "</Properties>"
            ),
            "docProps/core.xml": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
                'xmlns:dc="http://purl.org/dc/elements/1.1/" '
                'xmlns:dcterms="http://purl.org/dc/terms/" '
                'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
                "<dc:title>Condome Report</dc:title>"
                "<dc:creator>Condome</dc:creator>"
                f'<dcterms:created xsi:type="dcterms:W3CDTF">{created_at}</dcterms:created>'
                f'<dcterms:modified xsi:type="dcterms:W3CDTF">{created_at}</dcterms:modified>'
                "</cp:coreProperties>"
            ),
            "xl/workbook.xml": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                '<sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets>'
                "</workbook>"
            ),
            "xl/_rels/workbook.xml.rels": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                'Target="worksheets/sheet1.xml"/>'
                '<Relationship Id="rId2" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
                'Target="styles.xml"/>'
                "</Relationships>"
            ),
            "xl/styles.xml": (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
                '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
                '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
                '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
                '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
                "</styleSheet>"
            ),
            "xl/worksheets/sheet1.xml": self._build_sheet_xml(rows),
        }

        with zipfile.ZipFile(workbook_buffer, "w", zipfile.ZIP_DEFLATED) as workbook:
            for path, content in files.items():
                workbook.writestr(path, content)
        return workbook_buffer.getvalue()

    def handle_reports_summary(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            if request.httprequest.method == "PUT":
                user = self.require_owner_session()
                payload = self.read_payload()
                condominio_id = payload.get("condominio_id") or request.httprequest.args.get("condominio_id")
                if not condominio_id:
                    return self.error_response(_("Debes indicar un condominio para configurar la automatización"))

                condominio, plan_owner = self._resolve_automation_owner(user, condominio_id)
                scheduled_day = int(payload.get("scheduledDay") or payload.get("scheduled_day") or 0)
                if not 1 <= scheduled_day <= 28:
                    return self.error_response(_("El día programado debe estar entre 1 y 28"))

                plan_owner.sudo().write({"condome_report_day": scheduled_day})
                self.create_audit_entry(
                    condominio,
                    "reportes",
                    _("Programación automática actualizada"),
                    _("El reporte financiero mensual se generará el día %s de cada mes.") % scheduled_day,
                    actor=self.clean_str(user.name or user.login) or "Administracion",
                )
                return self.build_response(
                    {
                        "data": {
                            "enabled": True,
                            "scheduledDay": plan_owner.get_condome_report_day(),
                            "planCode": getattr(plan_owner, "condome_plan", "free"),
                            "message": _(
                                "La generación automática quedó configurada correctamente."
                            ),
                        }
                    }
                )

            condominio_id = request.httprequest.args.get("condominio_id")
            if condominio_id:
                user = self.require_owner_session()
                condominio = self.get_condominio(int(condominio_id), user)
                condominios = request.env["condome.condominio"].sudo().search([("id", "=", condominio.id)])
            else:
                user = self.require_system_owner_session()
                condominios = self._selected_condominios(user)

            condominio_ids = condominios.ids
            plan_owner = condominios[:1].owner_user_id if len(condominios) == 1 else False

            def count(model_name, extra_domain=None):
                domain = list(extra_domain or [])
                if condominio_ids:
                    domain.append(("condominio_id", "in", condominio_ids))
                return request.env[model_name].sudo().search_count(domain)

            payload = {
                "cards": [
                    {
                        "key": "estructura",
                        "label": "Structure",
                        "value": count("condome.apartamento"),
                        "description": "Apartments and units available for operational reports.",
                    },
                    {
                        "key": "comunidad",
                        "label": "Community",
                        "value": count("condome.residente") + count("condome.propietario"),
                        "description": "People linked to the selected condominium.",
                    },
                    {
                        "key": "incidencias",
                        "label": "Incidents",
                        "value": count("condome.incidencia", [("estado", "in", ["reportada", "en_revision"])]),
                        "description": "Open cases that still need action.",
                    },
                    {
                        "key": "cobros",
                        "label": "Charges",
                        "value": count("condome.charge"),
                        "description": "Billing records ready for reconciliation.",
                    },
                ],
                "exports": count("condome.report.export"),
                "automaticExports": count("condome.report.export", [("generation_mode", "=", "automatic")]),
                "automation": {
                    "enabled": bool(plan_owner and getattr(plan_owner, "supports_automatic_reports", lambda: False)()),
                    "planCode": getattr(plan_owner, "condome_plan", "free") if plan_owner else None,
                    "scheduledDay": (
                        plan_owner.get_condome_report_day()
                        if plan_owner and hasattr(plan_owner, "get_condome_report_day")
                        else None
                    ),
                    "planLabel": (
                        plan_owner.get_condome_plan_config().get("label")
                        if plan_owner and hasattr(plan_owner, "get_condome_plan_config")
                        else None
                    ),
                    "message": (
                        "Tu plan genera automáticamente un reporte financiero mensual por condominio en un día fijo de cada mes."
                        if plan_owner and getattr(plan_owner, "supports_automatic_reports", lambda: False)()
                        else "Los reportes automáticos mensuales se activan con Pro o Premium."
                    ),
                },
            }
            return self.build_response({"data": payload})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Reports summary failed")
            return self.error_response(error, status=400)

    def handle_export_requests(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()
            model = request.env["condome.report.export"].sudo()

            if request.httprequest.method == "GET":
                condominio_query = request.httprequest.args.get("condominio_id")
                if condominio_query:
                    user = self.require_owner_session()
                    condominio = self.get_condominio(int(condominio_query), user)
                    records = model.search([("condominio_id", "=", condominio.id)])
                else:
                    user = self.require_system_owner_session()
                    records = model.search([("condominio_id", "in", self._selected_condominios(user).ids)])
                return self.build_response({"data": [self.serialize_export(record) for record in records]})

            payload = self.read_payload()
            user = self.require_owner_session()
            condominio = self.get_condominio(int(payload.get("condominio_id")), user)
            record = model.create(
                {
                    "condominio_id": condominio.id,
                    "requested_by": user.id,
                    "report_type": payload.get("reportType") or "operativo",
                    "export_format": payload.get("exportFormat") or "pdf",
                    "filters_json": json.dumps(payload.get("filters") or {}),
                    "note": self.clean_str(payload.get("note")),
                }
            )
            return self.build_response({"data": self.serialize_export(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Report export request failed")
            return self.error_response(error, status=400)

    def handle_export_delete(self, export_id):
        try:
            if self.is_preflight_request(): return self.handle_options()
            user = self.require_owner_session()
            model = request.env["condome.report.export"].sudo()
            record = model.search([("id", "=", export_id)] + self.owner_domain(user), limit=1)
            if not record:
                return self.error_response(_("Exportación no encontrada"), status=404)
            record.unlink()
            return self.build_response({"data": {"id": export_id}})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Report export delete failed")
            return self.error_response(error, status=400)


    def handle_report_download(self, export_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self._get_export_for_download(export_id, user)
            filename = record.file_name or f"condome-report-{record.id}.{record.export_format}"

            if record.export_format == "pdf":
                report_action = request.env.ref("condome_reporting.action_report_financial").sudo()
                # Odoo 17: _render_qweb_pdf(report_ref, res_ids)
                content, _content_type = report_action._render_qweb_pdf(
                    "condome_reporting.report_financial_document", record.ids
                )
                if not content:
                    raise ValueError("No se pudo generar el contenido del PDF")

                response = request.make_response(
                    content,
                    headers=self._download_headers(filename, "application/pdf"),
                )
            elif record.export_format == "xlsx":
                response = request.make_response(
                    self._build_xlsx_content(record),
                    headers=self._download_headers(
                        filename,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ),
                )
            else:
                response = request.make_response(
                    self._build_csv_content(record),
                    headers=self._download_headers(filename, "text/csv; charset=utf-8"),
                )

            response.status_code = 200
            return response
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:
            _logger.exception("Report download failed")
            return self.error_response(error, status=400)
