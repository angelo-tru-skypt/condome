import json

from odoo import _, fields
from odoo.http import request

class ApiEventMixin:
    """Eventos internos reutilizables para notificaciones y auditoría."""

    def create_incident_notification(self, resident, incident):
        owner = resident.condominio_id.owner_user_id
        if not owner:
            return False
        message = _("Incidencia reportada por %s: %s") % (resident.name, incident.titulo)
        return request.env["condome.notification"].sudo().create(
            {
                "message": message,
                "residente_id": resident.id,
                "incidencia_id": incident.id,
                "owner_user_id": owner.id,
                "condominio_id": resident.condominio_id.id,
            }
        )

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

