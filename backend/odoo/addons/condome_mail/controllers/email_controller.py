"""Controlador HTTP para envío de correos desde la API de Condome.

Expone endpoints para enviar correos masivos (avisos, comunicados) y
correos individuales (notificaciones puntuales) a los residentes de un
condominio determinado.
"""

import logging

from odoo import _, fields, http
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService
from odoo.addons.condome_mail.services.email_service import CondomeEmailService

_logger = logging.getLogger(__name__)

_api = BaseApiService()
_mail = CondomeEmailService()


class CondomeEmailController(http.Controller):
    """Endpoints de correo electrónico para el sistema Condome."""

    # ── Preflight global ─────────────────────────────────────────────

    @http.route(
        "/condome_api/mail/<path:anything>",
        type="http",
        auth="public",
        methods=["OPTIONS"],
        csrf=False,
        cors="*",
    )
    def options(self, **kwargs):
        return _api.build_response({"ok": True})

    # ── Enviar aviso del sistema a todo el condominio ─────────────────

    @http.route(
        "/condome_api/mail/system-notice/",
        type="http",
        auth="public",
        methods=["POST", "OPTIONS"],
        csrf=False,
        cors="*",
    )
    def system_notice(self, **kwargs):
        """POST — Envía un aviso del sistema a todos los residentes del condominio.

        Body JSON::

            {
                "condominio_id": 1,
                "title": "Mantenimiento programado",
                "message": "El servicio de agua estará suspendido…",
                "severity": "warning"          // info | success | warning | danger
            }
        """
        try:
            user = _api.require_owner_session()
            payload = _api.read_payload()

            title = _api.clean_str(payload.get("title") or payload.get("titulo"))
            message = _api.clean_str(payload.get("message") or payload.get("mensaje"))
            if not title or not message:
                return _api.error_response(_("Título y mensaje son requeridos"))

            condominio = _api.resolve_condominio(user, payload.get("condominio_id"))
            severity = _api.clean_str(payload.get("severity")) or "info"

            sent = _mail.send_system_notice(condominio, title, message, severity=severity)
            return _api.build_response(
                {"ok": True, "sent": sent, "message": _("Aviso enviado a %d residentes") % sent},
                status=200,
            )
        except PermissionError as error:
            return _api.error_response(error, status=403)
        except Exception as error:
            _logger.exception("Email system-notice failed")
            return _api.error_response(error, status=400)

    # ── Enviar comunicado / broadcast ────────────────────────────────

    @http.route(
        "/condome_api/mail/broadcast/",
        type="http",
        auth="public",
        methods=["POST", "OPTIONS"],
        csrf=False,
        cors="*",
    )
    def broadcast(self, **kwargs):
        """POST — Envía un comunicado a todos los residentes del condominio.

        Body JSON::

            {
                "condominio_id": 1,
                "title": "Asamblea General",
                "message": "Se convoca a todos los residentes…",
                "priority": "alta"             // alta | media | baja
            }
        """
        try:
            user = _api.require_owner_session()
            payload = _api.read_payload()

            title = _api.clean_str(payload.get("title") or payload.get("titulo"))
            message = _api.clean_str(payload.get("message") or payload.get("mensaje"))
            if not title or not message:
                return _api.error_response(_("Título y mensaje son requeridos"))

            condominio = _api.resolve_condominio(user, payload.get("condominio_id"))
            priority = _api.clean_str(payload.get("priority") or payload.get("prioridad")) or "media"

            sent = _mail.send_broadcast(condominio, title, message, priority=priority)
            return _api.build_response(
                {"ok": True, "sent": sent, "message": _("Comunicado enviado a %d residentes") % sent},
                status=200,
            )
        except PermissionError as error:
            return _api.error_response(error, status=403)
        except Exception as error:
            _logger.exception("Email broadcast failed")
            return _api.error_response(error, status=400)

    # ── Enviar recordatorio de pago a todo el condominio ─────────────

    @http.route(
        "/condome_api/mail/payment-reminder/",
        type="http",
        auth="public",
        methods=["POST", "OPTIONS"],
        csrf=False,
        cors="*",
    )
    def payment_reminder(self, **kwargs):
        """POST — Envía recordatorio de pago a todos los residentes.

        Body JSON::

            {
                "condominio_id": 1,
                "amount": 5000.00,
                "currency": "DOP",
                "concept": "Cuota de mantenimiento — Mayo 2026",
                "due_date": "31/05/2026"
            }
        """
        try:
            user = _api.require_owner_session()
            payload = _api.read_payload()

            amount = payload.get("amount") or payload.get("monto")
            concept = _api.clean_str(payload.get("concept") or payload.get("concepto"))
            due_date = _api.clean_str(payload.get("due_date") or payload.get("fecha_limite"))
            if not amount or not concept or not due_date:
                return _api.error_response(_("Monto, concepto y fecha límite son requeridos"))

            condominio = _api.resolve_condominio(user, payload.get("condominio_id"))
            currency = _api.clean_str(payload.get("currency") or payload.get("moneda")) or "DOP"
            charge_id = payload.get("charge_id")
            sent = 0
            if charge_id:
                charge = request.env["condome.charge"].sudo().search(
                    [
                        ("id", "=", int(charge_id)),
                        ("condominio_id", "=", condominio.id),
                    ],
                    limit=1,
                )
                if not charge:
                    return _api.error_response(_("Cargo no encontrado"), status=404)
                resident = charge.residente_id or charge.propietario_id
                if resident and getattr(resident, "email", False):
                    sent = 1 if _mail.send_payment_reminders(
                        condominio,
                        float(charge.amount_residual or amount),
                        currency,
                        charge.name or concept,
                        fields.Date.to_string(charge.due_date) if charge.due_date else due_date,
                        resident=resident,
                    ) else 0
                    if sent:
                        charge.write(
                            {
                                "reminder_sent": True,
                                "delinquency_notified_at": fields.Datetime.now(),
                            }
                        )
            else:
                sent = _mail.send_payment_reminders(
                    condominio,
                    float(amount),
                    currency,
                    concept,
                    due_date,
                )
            return _api.build_response(
                {"ok": True, "sent": sent, "message": _("Recordatorio enviado a %d residentes") % sent},
                status=200,
            )
        except PermissionError as error:
            return _api.error_response(error, status=403)
        except Exception as error:
            _logger.exception("Email payment-reminder failed")
            return _api.error_response(error, status=400)

    # ── Enviar correo a un residente específico ──────────────────────

    @http.route(
        "/condome_api/mail/notify-resident/",
        type="http",
        auth="public",
        methods=["POST", "OPTIONS"],
        csrf=False,
        cors="*",
    )
    def notify_resident(self, **kwargs):
        """POST — Envía una notificación por correo a un residente específico.

        Body JSON::

            {
                "condominio_id": 1,
                "residente_id": 5,
                "subject": "Paquete en recepción",
                "title": "Tienes un paquete",
                "message": "Se ha recibido un paquete a tu nombre…",
                "severity": "info"
            }
        """
        try:
            user = _api.require_owner_session()
            payload = _api.read_payload()

            residente_id = payload.get("residente_id")
            subject = _api.clean_str(payload.get("subject") or payload.get("asunto"))
            title = _api.clean_str(payload.get("title") or payload.get("titulo"))
            message = _api.clean_str(payload.get("message") or payload.get("mensaje"))

            if not residente_id or not title or not message:
                return _api.error_response(_("Residente, título y mensaje son requeridos"))

            condominio = _api.resolve_condominio(user, payload.get("condominio_id"))
            resident = _api.find_resident(user, resident_id=residente_id, condominio=condominio)
            severity = _api.clean_str(payload.get("severity")) or "info"
            email_subject = subject or f"{title} — Condome"

            sent = _mail.send_to_resident(resident, email_subject, title, message, severity=severity)
            return _api.build_response(
                {"ok": sent, "message": _("Correo enviado a %s") % resident.email if sent else _("El residente no tiene correo registrado")},
                status=200,
            )
        except PermissionError as error:
            return _api.error_response(error, status=403)
        except Exception as error:
            _logger.exception("Email notify-resident failed")
            return _api.error_response(error, status=400)

    # ── Test / Verificar configuración SMTP ──────────────────────────

    @http.route(
        "/condome_api/mail/test/",
        type="http",
        auth="public",
        methods=["POST", "OPTIONS"],
        csrf=False,
        cors="*",
    )
    def test_smtp(self, **kwargs):
        """POST — Envía un correo de prueba al administrador para verificar la configuración SMTP.

        Body JSON::

            {
                "email": "admin@example.com"   // opcional, por defecto usa el del usuario
            }
        """
        try:
            user = _api.require_owner_session()
            payload = _api.read_payload()

            to_email = _api.clean_str(payload.get("email")) or (user.login or "").strip()
            if not to_email:
                return _api.error_response(_("No se encontró un correo de destino"))

            html = _mail.templates.system_notice(
                resident_name=(user.name or "Admin").split(" ")[0],
                title="Prueba de Correo SMTP",
                message="¡Felicidades! La configuración SMTP de Condome está funcionando correctamente. "
                "Los correos se enviarán desde esta cuenta del sistema.",
                condominio_name="Condome — Test",
                severity="success",
            )
            success = _mail.send_email(to_email, "Prueba SMTP — Condome", html, async_send=False)
            if success:
                return _api.build_response(
                    {
                        "ok": True,
                        "message": _("Correo de prueba enviado a %s") % to_email,
                        "transport": _mail.last_delivery_report() or _mail.transport_summary(),
                    }
                )
            return _api.error_response(
                _("No se pudo enviar el correo. Verifica la configuración SMTP activa en el servidor."),
                status=500,
            )
        except PermissionError as error:
            return _api.error_response(error, status=403)
        except Exception as error:
            _logger.exception("Email test failed")
            return _api.error_response(error, status=400)
