import logging

from odoo import _
from odoo.http import request

_logger = logging.getLogger(__name__)

_mail_svc = None


def _mail():
    global _mail_svc
    if _mail_svc is None:
        try:
            from odoo.addons.condome_mail.services.email_service import CondomeEmailService
            _mail_svc = CondomeEmailService()
        except Exception:
            _logger.debug("condome_mail no disponible; correos de eventos deshabilitados.")
    return _mail_svc


class ApiEventMixin:
    """Eventos internos reutilizables para notificaciones y auditoría."""

    def create_incident_notification(self, resident, incident):
        owner = resident.condominio_id.owner_user_id
        if not owner:
            return False
        message = _("Incidencia reportada por %s: %s") % (resident.name, incident.titulo)
        notification = request.env["condome.notification"].sudo().create(
            {
                "message": message,
                "residente_id": resident.id,
                "incidencia_id": incident.id,
                "owner_user_id": owner.id,
                "condominio_id": resident.condominio_id.id,
            }
        )
        mail = _mail()
        if mail and resident.condominio_id:
            try:
                mail.send_incident_notification(
                    resident.condominio_id,
                    incident_title=incident.titulo or "",
                    incident_detail=incident.descripcion or "",
                    reporter_name=resident.name or "",
                )
            except Exception as exc:
                _logger.debug("No se pudo enviar correo de incidencia: %s", exc)
        return notification

    def create_audit_entry(self, condominio, category, title, detail="", actor="Sistema", severity="info"):
        if not condominio:
            return False
        return request.env["condome.audit.entry"].sudo().create(
            {
                "categoria": self.clean_str(category) or "general",
                "titulo": self.clean_str(title) or _("Evento administrativo"),
                "detalle": self.clean_str(detail),
                "actor": self.clean_str(actor) or "Sistema",
                "severidad": self.clean_str(severity) or "info",
                "condominio_id": condominio.id,
            }
        )

    def channel_supports_email(self, channel):
        safe_channel = (self.clean_str(channel) or "").lower()
        return safe_channel in {"email", "todos", "panel-email"}

    def should_send_announcement_email(self, status, channel):
        return (self.clean_str(status) or "").lower() == "published" and self.channel_supports_email(channel)

    def send_notification_email(
        self,
        condominio,
        message,
        resident=False,
        title="",
        subject="",
        severity="info",
        channel="panel",
    ):
        mail = _mail()
        safe_message = self.clean_str(message)
        if not mail or not condominio or not safe_message:
            return 0

        safe_title = self.clean_str(title) or _("Notificación del condominio")
        safe_severity = self.clean_str(severity) or "info"
        safe_subject = self.clean_str(subject) or _("%s — %s") % (
            safe_title,
            condominio.name or "Condome",
        )

        try:
            if resident:
                return (
                    1
                    if mail.send_to_resident(
                        resident,
                        safe_subject,
                        safe_title,
                        safe_message,
                        severity=safe_severity,
                        async_send=False,
                    )
                    else 0
                )
            if not self.channel_supports_email(channel):
                return 0
            return mail.send_system_notice(condominio, safe_title, safe_message, severity=safe_severity)
        except Exception as exc:
            _logger.debug("No se pudo enviar notificación por correo: %s", exc)
            return 0

    def send_comunicado_email(self, condominio, title, message, priority="media"):
        """Envía un comunicado por correo a todos los residentes del condominio."""
        mail = _mail()
        if mail and condominio:
            try:
                return mail.send_broadcast(condominio, title, message, priority=priority)
            except Exception as exc:
                _logger.debug("No se pudo enviar comunicado por correo: %s", exc)
        return 0
