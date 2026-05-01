import logging
import os
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from .email_templates import EmailTemplateEngine

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    load_dotenv = None
    DOTENV_AVAILABLE = False

_logger = logging.getLogger(__name__)

def _load_env_file():
    if not DOTENV_AVAILABLE:
        return
    current_dir = os.path.abspath(os.path.dirname(__file__))
    candidate_paths = [
        os.path.join(current_dir, "..", "..", "..", "..", ".env"),
        os.path.join(current_dir, "..", "..", "..", "..", "..", ".env"),
    ]
    for candidate in candidate_paths:
        env_path = os.path.abspath(candidate)
        if os.path.exists(env_path):
            load_dotenv(env_path)
            return


def _env_flag(name, default=None):
    raw_value = os.getenv(name)
    if raw_value is None or str(raw_value).strip() == "":
        return default
    return str(raw_value).strip().lower() in {"1", "true", "yes", "on", "si", "sí"}


_load_env_file()

class CondomeEmailService:
    """Servicio SMTP de Condome para notificaciones automáticas."""

    INTERNAL_SMTP_HOSTS = {"mailhog", "localhost", "127.0.0.1"}

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_EMAIL", "condome3005@gmail.com")
        self.smtp_pass = os.getenv("APP_PASSWORD_SMTP", "")
        self.sender_email = self.smtp_user
        self.smtp_use_tls = _env_flag("SMTP_USE_TLS", None)
        self.smtp_use_auth = _env_flag("SMTP_USE_AUTH", None)
        self.smtp_timeout = float(os.getenv("SMTP_CONNECTION_TIMEOUT", "10"))
        self.smtp_fallback_host = (os.getenv("SMTP_FALLBACK_HOST", "mailhog") or "").strip()
        self.smtp_fallback_port = int(os.getenv("SMTP_FALLBACK_PORT", 1025))
        self.smtp_fallback_user = os.getenv("SMTP_FALLBACK_EMAIL", self.smtp_user)
        self.smtp_fallback_pass = os.getenv("SMTP_FALLBACK_PASSWORD", "")
        self.smtp_fallback_use_tls = _env_flag("SMTP_FALLBACK_USE_TLS", False)
        self.smtp_fallback_use_auth = _env_flag("SMTP_FALLBACK_USE_AUTH", False)
        self._last_delivery_report = {}
        self.templates = EmailTemplateEngine
        _logger.info(
            "✅ Servicio de correo Condome inicializado (SMTP: %s:%s)",
            self.smtp_host,
            self.smtp_port,
        )

    def _is_internal_transport(self, host):
        return (host or "").strip().lower() in self.INTERNAL_SMTP_HOSTS

    def _build_transport(self, host, port, user, password, use_tls=None, use_auth=None, label="primary"):
        normalized_host = (host or "").strip()
        internal_transport = self._is_internal_transport(normalized_host)
        resolved_use_tls = use_tls if use_tls is not None else (not internal_transport and int(port) == 587)
        resolved_use_auth = use_auth if use_auth is not None else not internal_transport
        sender_email = (user or self.sender_email or "no-reply@condome.local").strip()
        return {
            "label": label,
            "host": normalized_host,
            "port": int(port),
            "user": (user or "").strip(),
            "password": password or "",
            "use_tls": bool(resolved_use_tls),
            "use_auth": bool(resolved_use_auth),
            "sender_email": sender_email,
            "mode": "internal" if internal_transport else "external",
        }

    def _primary_transport(self):
        return self._build_transport(
            self.smtp_host,
            self.smtp_port,
            self.smtp_user,
            self.smtp_pass,
            use_tls=self.smtp_use_tls,
            use_auth=self.smtp_use_auth,
            label="primary",
        )

    def _fallback_transport(self):
        if not self.smtp_fallback_host:
            return None
        fallback = self._build_transport(
            self.smtp_fallback_host,
            self.smtp_fallback_port,
            self.smtp_fallback_user,
            self.smtp_fallback_pass,
            use_tls=self.smtp_fallback_use_tls,
            use_auth=self.smtp_fallback_use_auth,
            label="fallback",
        )
        primary = self._primary_transport()
        if (
            fallback["host"].lower(),
            fallback["port"],
        ) == (
            primary["host"].lower(),
            primary["port"],
        ):
            return None
        return fallback

    def transport_summary(self):
        primary = self._primary_transport()
        fallback = self._fallback_transport()
        summary = {
            "host": primary["host"],
            "port": primary["port"],
            "use_tls": primary["use_tls"],
            "use_auth": primary["use_auth"],
            "mode": primary["mode"],
        }
        if fallback:
            summary["fallback"] = {
                "host": fallback["host"],
                "port": fallback["port"],
                "use_tls": fallback["use_tls"],
                "use_auth": fallback["use_auth"],
                "mode": fallback["mode"],
            }
        return summary

    def last_delivery_report(self):
        return dict(self._last_delivery_report)

    def _update_last_delivery(self, **values):
        self._last_delivery_report = dict(values)

    def _send_via_transport(self, transport, to_email, subject, html_body):
        if not transport["host"]:
            raise ValueError("No hay un host SMTP configurado.")
        if transport["use_auth"] and not transport["password"]:
            raise ValueError(
                "El servidor SMTP requiere autenticación y no se encontró una contraseña configurada."
            )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Condome Platform <{transport['sender_email']}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(transport["host"], transport["port"], timeout=self.smtp_timeout) as server:
            server.ehlo()
            if transport["use_tls"]:
                server.starttls()
                server.ehlo()
            if transport["use_auth"]:
                server.login(transport["user"], transport["password"])
            server.sendmail(transport["sender_email"], [to_email], msg.as_string())

    def _send_raw(self, to_email, subject, html_body):
        """Envío síncrono de correo mediante SMTP."""
        transports = [self._primary_transport()]
        fallback = self._fallback_transport()
        if fallback:
            transports.append(fallback)

        last_error = None
        for index, transport in enumerate(transports):
            try:
                self._send_via_transport(transport, to_email, subject, html_body)
                self._update_last_delivery(
                    ok=True,
                    to_email=to_email,
                    subject=subject,
                    host=transport["host"],
                    port=transport["port"],
                    mode=transport["mode"],
                    used_fallback=(transport["label"] == "fallback"),
                    error="",
                )
                _logger.info(
                    "Correo enviado exitosamente a %s vía %s:%s (%s): %s",
                    to_email,
                    transport["host"],
                    transport["port"],
                    transport["mode"],
                    subject,
                )
                return True
            except Exception as error:
                last_error = error
                if index < len(transports) - 1:
                    next_transport = transports[index + 1]
                    _logger.warning(
                        "SMTP %s:%s falló al enviar a %s. Reintentando con %s:%s. Error: %s",
                        transport["host"],
                        transport["port"],
                        to_email,
                        next_transport["host"],
                        next_transport["port"],
                        str(error),
                    )
                    continue

        self._update_last_delivery(
            ok=False,
            to_email=to_email,
            subject=subject,
            host=transports[-1]["host"],
            port=transports[-1]["port"],
            mode=transports[-1]["mode"],
            used_fallback=(transports[-1]["label"] == "fallback"),
            error=str(last_error or "SMTP error"),
        )
        _logger.error("Error enviando correo a %s: %s", to_email, str(last_error))
        return False

    def _send_async(self, to_email, subject, html_body):
        """Envío asíncrono para no bloquear el hilo principal de Odoo."""
        self._update_last_delivery(
            ok=True,
            to_email=to_email,
            subject=subject,
            host="async",
            port=0,
            mode="queued",
            used_fallback=False,
            error="",
        )
        thread = threading.Thread(
            target=self._send_raw,
            args=(to_email, subject, html_body),
            daemon=True,
        )
        thread.start()
        return True

    def send_email(self, to_email, subject, html_body, async_send=True):
        if not to_email:
            return False
        if async_send:
            return self._send_async(to_email, subject, html_body)
        return self._send_raw(to_email, subject, html_body)

    def _condominio_name(self, person=None, condominio=None):
        if condominio:
            return condominio.name or "Condome"
        if person and getattr(person, "condominio_id", False):
            return person.condominio_id.name or "Condome"
        return "Condome"

    def _active_residents(self, condominio):
        if not condominio or not getattr(condominio, "env", False):
            return []
        return condominio.env["condome.residente"].sudo().search(
            [
                ("condominio_id", "=", condominio.id),
                ("activo", "=", True),
                ("email", "!=", False),
            ],
            order="apartamento_id asc, id asc",
        )

    def _iter_unique_people(self, people):
        seen = set()
        for person in people:
            email = (getattr(person, "email", "") or "").strip().lower()
            if not email or email in seen:
                continue
            seen.add(email)
            yield person

    def _send_bulk(self, people, builder):
        sent = 0
        for person in self._iter_unique_people(people):
            try:
                payload = builder(person)
                if not payload:
                    continue
                if self.send_email(
                    payload["email"],
                    payload["subject"],
                    payload["html"],
                    async_send=False,
                ):
                    sent += 1
            except Exception as exc:
                _logger.error("No se pudo enviar correo a %s: %s", getattr(person, "email", ""), exc)
        return sent

    # ── Notificaciones de Negocio ─────────────────────────────────────

    def send_payment_confirmation(self, resident, amount, currency, concept, payment_date, async_send=True):
        if not resident or not resident.email: return False
        html = EmailTemplateEngine.payment_confirmation(
            resident.name, amount, currency, concept, payment_date, 
            resident.condominio_id.name if resident.condominio_id else "Condome"
        )
        return self.send_email(resident.email, "Confirmación de Pago — Condome", html, async_send=async_send)

    def send_delinquency_notice(self, resident, amount, currency, concept, due_date, async_send=True):
        """Envía un aviso preventivo cuando faltan menos de dos días para vencer."""
        if not resident or not resident.email: return False
        html = EmailTemplateEngine.delinquency_notice(
            resident.name, amount, currency, concept, due_date,
            resident.condominio_id.name if resident.condominio_id else "Condome"
        )
        return self.send_email(resident.email, f"Recordatorio de Pago: {concept}", html, async_send=async_send)

    def send_overdue_notice(self, resident, amount, currency, concept, due_date, async_send=True):
        if not resident or not resident.email: return False
        html = EmailTemplateEngine.overdue_charge_notice(
            resident.name,
            amount,
            currency,
            concept,
            due_date,
            self._condominio_name(person=resident),
        )
        return self.send_email(resident.email, f"Morosidad: {concept}", html, async_send=async_send)

    def send_to_resident(self, resident, subject, title, message, severity="info", async_send=True):
        if not resident or not resident.email: return False
        html = EmailTemplateEngine.system_notice(
            resident.name,
            title,
            message,
            resident.condominio_id.name if resident.condominio_id else "Condome",
            severity=severity,
        )
        return self.send_email(resident.email, subject, html, async_send=async_send)

    # ── Seguridad y Accesos ───────────────────────────────────────────

    def send_welcome_credentials(self, resident, temporary_password, login_url="", async_send=True):
        if not resident or not resident.email: return False
        html = EmailTemplateEngine.welcome_credentials(
            resident.name, resident.email, temporary_password,
            resident.condominio_id.name if resident.condominio_id else "Condome",
            login_url
        )
        return self.send_email(resident.email, "Bienvenido a Condome — Tus credenciales", html, async_send=async_send)

    def send_login_confirmation(self, user, condominio_name="", ip_address="", async_send=True):
        if not user.login: return False
        html = EmailTemplateEngine.login_confirmation(
            user.name, user.login, condominio_name or "Condome",
            datetime.now().strftime("%d/%m/%Y %H:%M"), ip_address
        )
        return self.send_email(user.login, "Seguridad: Nuevo inicio de sesión detectado", html, async_send=async_send)

    def send_password_changed(self, user, async_send=True):
        if not user.login: return False
        html = EmailTemplateEngine.password_changed(
            user.name, user.login, datetime.now().strftime("%d/%m/%Y %H:%M")
        )
        return self.send_email(user.login, "Seguridad: Contraseña actualizada", html, async_send=async_send)

    # ── Envíos masivos por condominio ─────────────────────────────────

    def send_system_notice(self, condominio, title, message, severity="info"):
        residents = self._active_residents(condominio)
        return self._send_bulk(
            residents,
            lambda resident: {
                "email": resident.email,
                "subject": f"{title} — {self._condominio_name(condominio=condominio)}",
                "html": self.templates.system_notice(
                    resident.name,
                    title,
                    message,
                    self._condominio_name(condominio=condominio),
                    severity=severity,
                ),
            },
        )

    def send_broadcast(self, condominio, title, message, priority="media"):
        residents = self._active_residents(condominio)
        return self._send_bulk(
            residents,
            lambda resident: {
                "email": resident.email,
                "subject": f"{title} — {self._condominio_name(condominio=condominio)}",
                "html": self.templates.broadcast_announcement(
                    resident.name,
                    title,
                    message,
                    priority,
                    self._condominio_name(condominio=condominio),
                ),
            },
        )

    def send_payment_reminders(self, condominio, amount, currency, concept, due_date, resident=None):
        residents = [resident] if resident else self._active_residents(condominio)
        return self._send_bulk(
            residents,
            lambda target: {
                "email": target.email,
                "subject": f"Recordatorio de Pago: {concept}",
                "html": self.templates.delinquency_notice(
                    target.name,
                    amount,
                    currency,
                    concept,
                    due_date,
                    self._condominio_name(condominio=condominio, person=target),
                ),
            },
        )

    def send_email_verification(self, user, verification_url, condominio_name="Condome", async_send=True):
        if not user or not getattr(user, "login", ""):
            return False
        html = EmailTemplateEngine.email_verification(
            user.name or user.login,
            verification_url,
            condominio_name,
        )
        return self.send_email(
            user.login,
            "Verifica tu cuenta de Condome",
            html,
            async_send=async_send,
        )

    def send_incident_notification(
        self,
        condominio,
        incident_title="",
        incident_detail="",
        reporter_name="",
        async_send=True,
    ):
        if not condominio or not getattr(condominio, "owner_user_id", False):
            return 0

        recipient = condominio.owner_user_id.sudo()
        recipient_email = (getattr(recipient, "login", "") or "").strip()
        if not recipient_email:
            return 0

        condominio_name = self._condominio_name(condominio=condominio)
        title = "Nueva incidencia reportada"
        message_parts = []
        if reporter_name:
            message_parts.append(f"Reportada por <strong>{reporter_name}</strong>.")
        if incident_title:
            message_parts.append(f"Título: <strong>{incident_title}</strong>")
        if incident_detail:
            message_parts.append(incident_detail)

        html = self.templates.system_notice(
            recipient.name or "Administración",
            title,
            "<br><br>".join(message_parts) or "Se ha registrado una nueva incidencia en el condominio.",
            condominio_name,
            severity="warning",
        )
        subject = f"{title} — {condominio_name}"
        return 1 if self.send_email(recipient_email, subject, html, async_send=async_send) else 0

    def send_reservation_confirmation(self, *args, **kwargs): return True
