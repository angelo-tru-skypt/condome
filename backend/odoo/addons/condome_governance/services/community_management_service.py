import logging

from odoo import _
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class CommunityManagementService(BaseApiService):
    """Gestiona documentos, configuración general y reglas automáticas."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_documents(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.documento"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_documento(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            title = self.clean_str(payload.get("title") or payload.get("titulo"))
            if not title:
                return self.error_response(_("El titulo del documento es requerido"))

            record = model.create(
                {
                    "name": title,
                    "categoria": self.clean_str(payload.get("category") or payload.get("categoria")) or "general",
                    "audiencia": self.clean_str(payload.get("audience") or payload.get("audiencia")) or "todos",
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "vigente",
                    "origen": self.clean_str(payload.get("source") or payload.get("origen")),
                    "descripcion": self.clean_str(payload.get("description") or payload.get("descripcion")),
                    "condominio_id": condominio.id,
                }
            )
            self.create_audit_entry(condominio, "documentos", _("Documento registrado"), record.name, actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_documento(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance documents failed")
            return self.error_response(error, status=400)

    def handle_document_update(self, documento_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_documento(documento_id, user)
            payload = self.read_payload()
            record.write(
                {
                    "name": self.clean_str(payload.get("title") or payload.get("titulo")) or record.name,
                    "categoria": self.clean_str(payload.get("category") or payload.get("categoria")) or record.categoria,
                    "audiencia": self.clean_str(payload.get("audience") or payload.get("audiencia")) or record.audiencia,
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or record.estado,
                    "origen": self.clean_str(payload.get("source") or payload.get("origen")) if ("source" in payload or "origen" in payload) else record.origen,
                    "descripcion": self.clean_str(payload.get("description") or payload.get("descripcion")) if ("description" in payload or "descripcion" in payload) else record.descripcion,
                }
            )
            self.create_audit_entry(record.condominio_id, "documentos", _("Documento actualizado"), record.name, actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_documento(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance document update failed")
            return self.error_response(error, status=400)

    def handle_settings(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            condominio_id = request.httprequest.args.get("condominio_id")
            payload = self.read_payload() if request.httprequest.method == "PUT" else {}
            condominio = self.resolve_condominio(user, condominio_id or payload.get("condominio_id"))
            settings = self.get_or_create_configuracion(condominio)

            if request.httprequest.method == "GET":
                return self.build_response({"data": self.serialize_configuracion(settings)})

            settings.write(
                {
                    "currency": self.clean_str(payload.get("currency")) or settings.currency,
                    "timezone": self.clean_str(payload.get("timezone")) or settings.timezone,
                    "language": self.clean_str(payload.get("language")) or settings.language,
                    "reservation_lead_hours": int(payload.get("reservationLeadHours") or settings.reservation_lead_hours),
                    "reservation_window_days": int(payload.get("reservationWindowDays") or settings.reservation_window_days),
                    "incident_sla_hours": int(payload.get("incidentSlaHours") or settings.incident_sla_hours),
                    "late_fee_grace_days": int(payload.get("lateFeeGraceDays") or settings.late_fee_grace_days),
                    "support_email": self.clean_str(payload.get("supportEmail")) if "supportEmail" in payload else settings.support_email,
                    "automatic_access_validation": payload.get("automaticAccessValidation", settings.automatic_access_validation),
                }
            )
            self.create_audit_entry(condominio, "configuracion", _("Configuracion general actualizada"), _("Se ajustaron parametros operativos del condominio."), actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_configuracion(settings)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance settings failed")
            return self.error_response(error, status=400)

    def handle_notification_rules(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.notification.rule"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="write_date desc, id desc")
                return self.build_response({"data": [self.serialize_notification_rule(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            name = self.clean_str(payload.get("name"))
            template = self.clean_str(payload.get("template"))
            if not name or not template:
                return self.error_response(_("El nombre de la regla y la plantilla son requeridos"))

            record = model.create(
                {
                    "name": name,
                    "trigger": self.clean_str(payload.get("trigger")) or "manual",
                    "channel": self.clean_str(payload.get("channel")) or "panel",
                    "audience": self.clean_str(payload.get("audience")) or "owner",
                    "enabled": payload.get("enabled", True),
                    "template": template,
                    "condominio_id": condominio.id,
                }
            )
            self.create_audit_entry(condominio, "notificaciones", _("Regla automatica creada"), record.name, actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_notification_rule(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance notification rules failed")
            return self.error_response(error, status=400)

    def handle_notification_rule_update(self, rule_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = self.get_owner_notification_rule(rule_id, user)
            payload = self.read_payload()
            values = {}
            if "name" in payload:
                values["name"] = self.clean_str(payload.get("name")) or record.name
            if "trigger" in payload:
                values["trigger"] = self.clean_str(payload.get("trigger")) or record.trigger
            if "channel" in payload:
                values["channel"] = self.clean_str(payload.get("channel")) or record.channel
            if "audience" in payload:
                values["audience"] = self.clean_str(payload.get("audience")) or record.audience
            if "enabled" in payload:
                values["enabled"] = payload.get("enabled")
            if "template" in payload:
                values["template"] = self.clean_str(payload.get("template")) or record.template
            record.write(values)
            self.create_audit_entry(record.condominio_id, "notificaciones", _("Regla automatica actualizada"), record.name, actor=self.clean_str(user.name or user.login))
            return self.build_response({"data": self.serialize_notification_rule(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Governance notification rule update failed")
            return self.error_response(error, status=400)
