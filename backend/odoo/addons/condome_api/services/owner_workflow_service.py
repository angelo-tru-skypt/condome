import logging

from odoo import _, fields, http
from odoo.http import request

from .base_api_service import BaseApiService

_logger = logging.getLogger(__name__)

# Inicialización diferida del servicio de correo.
_mail_svc = None


def _mail():
    global _mail_svc
    if _mail_svc is None:
        try:
            from odoo.addons.condome_mail.services.email_service import CondomeEmailService
            _mail_svc = CondomeEmailService()
        except Exception:
            _logger.debug("condome_mail no disponible; correos de workflow deshabilitados.")
    return _mail_svc


class OwnerWorkflowService(BaseApiService):
    """Gestiona las decisiones operativas del owner sobre visitas e incidencias."""

    def handle_visits(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            status_filter = self.clean_str(request.httprequest.args.get("estado"))
            domain = self.owner_domain(user)
            if status_filter:
                domain.append(("estado", "=", status_filter))
            records = request.env["condome.visita"].sudo().search(domain, order="fecha_visita asc, id desc")
            return self.build_response({"data": [self.serialize_visita(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner workflow visits failed")
            return self.error_response(error, status=400)

    def handle_visit_decision(self, visita_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            visit = self.get_owner_visita(visita_id, user)
            payload = self.read_payload()
            status = self.clean_str(payload.get("estado")) or visit.estado
            if status not in {"aprobada", "rechazada", "cancelada", "pendiente"}:
                return self.error_response(_("El estado de la solicitud no es valido"))

            visit.write(
                {
                    "estado": status,
                    "notas_propietario": self.clean_str(payload.get("notas_propietario")),
                    "fecha_decision": fields.Datetime.now(),
                    "aprobado_por_id": user.id,
                }
            )
            return self.build_response({"data": self.serialize_visita(visit)})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner workflow visit decision failed")
            return self.error_response(error, status=400)

    def handle_incidents(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            status_filter = self.clean_str(request.httprequest.args.get("estado"))
            domain = self.owner_domain(user)
            if status_filter:
                domain.append(("estado", "=", status_filter))
            records = request.env["condome.incidencia"].sudo().search(domain, order="create_date desc, id desc")
            return self.build_response({"data": [self.serialize_incidencia(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner workflow incidents failed")
            return self.error_response(error, status=400)

    def handle_incident_update(self, incidencia_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            incident = self.get_owner_incidencia(incidencia_id, user)
            payload = self.read_payload()
            status = self.clean_str(payload.get("estado")) or incident.estado
            if status not in {"reportada", "en_revision", "resuelta", "cerrada"}:
                return self.error_response(_("El estado indicado no es valido"))

            values = {
                "estado": status,
                "respuesta_propietario": self.clean_str(payload.get("respuesta_propietario")),
            }
            values["fecha_resolucion"] = fields.Datetime.now() if status in {"resuelta", "cerrada"} else False
            incident.write(values)
            # Notificar al residente cuando su incidencia es resuelta o cerrada
            if status in {"resuelta", "cerrada"}:
                mail = _mail()
                if mail:
                    try:
                        resident = incident.residente_id
                        if resident and resident.email:
                            mail.send_to_resident(
                                resident,
                                subject=f"Incidencia {status}: {incident.titulo} — Condome",
                                title=f"Tu incidencia ha sido {status}",
                                message=(
                                    f"La incidencia <strong>{incident.titulo}</strong> ha sido marcada como "
                                    f"<strong>{status}</strong>."
                                    + (f"<br><br><em>{incident.respuesta_propietario}</em>" if incident.respuesta_propietario else "")
                                ),
                                severity="success" if status == "resuelta" else "info",
                            )
                    except Exception as exc:
                        _logger.debug("No se pudo enviar correo de resolución de incidencia: %s", exc)
            return self.build_response({"data": self.serialize_incidencia(incident)})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner workflow incident update failed")
            return self.error_response(error, status=400)

    def handle_notifications(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            domain = self.owner_domain(user, owner_field="owner_user_id")
            records = request.env["condome.notification"].sudo().search(domain, order="create_date desc")
            return self.build_response({"data": [self.serialize_notification(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner workflow notifications failed")
            return self.error_response(error, status=400)

    def handle_notification_read(self, notification_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            domain = self.owner_domain(user, owner_field="owner_user_id") + [("id", "=", notification_id)]
            notification = request.env["condome.notification"].sudo().search(domain, limit=1)
            if not notification:
                raise ValueError(_("Notificacion no encontrada"))
            notification.mark_as_read(user)
            return self.build_response({"data": self.serialize_notification(notification)})
        except PermissionError as error:
            return self.error_response(error, status=401)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner workflow notification read failed")
            return self.error_response(error, status=400)
