import logging

from odoo import _
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class CommunityOperationsService(BaseApiService):
    """Gestiona avisos y auditoría institucional."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_announcements(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.comunicado"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="write_date desc, id desc")
                return self.build_response({"data": [self.serialize_comunicado(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            title = self.clean_str(payload.get("title") or payload.get("titulo"))
            message = self.clean_str(payload.get("message") or payload.get("mensaje"))
            if not title or not message:
                return self.error_response(_("El titulo y el mensaje son requeridos"))

            record = model.create(
                {
                    "name": title,
                    "mensaje": message,
                    "prioridad": self.clean_str(payload.get("priority") or payload.get("prioridad")) or "media",
                    "alcance": self.clean_str(payload.get("scope") or payload.get("alcance")) or "general",
                    "canal": self.clean_str(payload.get("channel") or payload.get("canal")) or "panel",
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "draft",
                    "target_label": self.clean_str(payload.get("targetLabel") or payload.get("target_label")) or "Todo el condominio",
                    "scheduled_for": self.normalize_datetime_value(payload.get("scheduledFor") or payload.get("scheduled_for")),
                    "condominio_id": condominio.id,
                }
            )
            self.create_audit_entry(condominio, "avisos", _("Comunicado creado"), record.name, actor=self.clean_str(user.name or user.login))
            if self.should_send_announcement_email(record.estado, record.canal):
                self.send_comunicado_email(
                    condominio,
                    title=record.name,
                    message=record.mensaje or "",
                    priority=record.prioridad or "media",
                )
            return self.build_response({"data": self.serialize_comunicado(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance announcements failed")
            return self.error_response(error, status=400)

    def handle_announcement_update(self, comunicado_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_comunicado(comunicado_id, user)
            payload = self.read_payload()
            values = {}
            if "title" in payload or "titulo" in payload:
                values["name"] = self.clean_str(payload.get("title") or payload.get("titulo")) or record.name
            if "message" in payload or "mensaje" in payload:
                values["mensaje"] = self.clean_str(payload.get("message") or payload.get("mensaje")) or record.mensaje
            if "priority" in payload or "prioridad" in payload:
                values["prioridad"] = self.clean_str(payload.get("priority") or payload.get("prioridad")) or record.prioridad
            if "scope" in payload or "alcance" in payload:
                values["alcance"] = self.clean_str(payload.get("scope") or payload.get("alcance")) or record.alcance
            if "channel" in payload or "canal" in payload:
                values["canal"] = self.clean_str(payload.get("channel") or payload.get("canal")) or record.canal
            if "status" in payload or "estado" in payload:
                values["estado"] = self.clean_str(payload.get("status") or payload.get("estado")) or record.estado
            if "targetLabel" in payload or "target_label" in payload:
                values["target_label"] = self.clean_str(payload.get("targetLabel") or payload.get("target_label")) or record.target_label
            if "scheduledFor" in payload or "scheduled_for" in payload:
                values["scheduled_for"] = self.normalize_datetime_value(payload.get("scheduledFor") or payload.get("scheduled_for"))
            previous_status = record.estado
            previous_channel = record.canal
            record.write(values)
            self.create_audit_entry(record.condominio_id, "avisos", _("Comunicado actualizado"), record.name, actor=self.clean_str(user.name or user.login))
            email_related_fields = {"name", "mensaje", "prioridad", "canal", "estado"}
            if self.should_send_announcement_email(record.estado, record.canal) and (
                previous_status != "published"
                or previous_channel != record.canal
                or bool(email_related_fields.intersection(values))
            ):
                self.send_comunicado_email(
                    record.condominio_id,
                    title=record.name,
                    message=record.mensaje or "",
                    priority=record.prioridad or "media",
                )
            return self.build_response({"data": self.serialize_comunicado(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance announcement update failed")
            return self.error_response(error, status=400)

    def handle_audit_entries(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            condominio_id = request.httprequest.args.get("condominio_id")
            domain = self.owner_domain(user)
            if condominio_id:
                domain.append(("condominio_id", "=", int(condominio_id)))
            records = request.env["condome.audit.entry"].sudo().search(domain, order="create_date desc, id desc")
            return self.build_response({"data": [self.serialize_audit_entry(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance audit listing failed")
            return self.error_response(error, status=400)
