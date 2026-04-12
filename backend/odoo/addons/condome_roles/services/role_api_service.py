import logging

from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class RoleApiService(BaseApiService):
    """Sirve una vista legible de roles sin duplicar grupos de seguridad."""

    ROLE_CATALOG = (
        {
            "key": "owner",
            "label": "System Owner",
            "xmlid": "condome_auth.group_condome_owner",
            "description": "Monitors the whole platform and manages global system configuration.",
            "permissions": [
                "global monitoring",
                "system configuration",
                "cross-condominium reporting",
                "condominium assignment",
            ],
        },
        {
            "key": "propietario",
            "label": "Condominium Admin",
            "xmlid": "condome_auth.group_condome_propietario",
            "description": "Manages the day-to-day operation of the condominium assigned to the user.",
            "permissions": [
                "structure",
                "owners",
                "residents",
                "announcements",
                "reservations",
                "access",
                "audit",
                "billing",
            ],
        },
        {
            "key": "residente",
            "label": "Residente",
            "xmlid": "condome_auth.group_condome_residente",
            "description": "Solicita visitas, reporta incidencias y consulta su contexto de residencia.",
            "permissions": [
                "solicitar visitas",
                "reportar incidencias",
                "consultar avisos",
                "consultar documentos",
                "pagos",
            ],
        },
    )

    def handle_options(self):
        return self.build_response({"ok": True})

    def handle_roles_catalog(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            self.require_system_owner_session()
            roles = []
            for item in self.ROLE_CATALOG:
                group = request.env.ref(item["xmlid"], raise_if_not_found=False)
                users = 0
                if group:
                    users = request.env["res.users"].sudo().search_count([("groups_id", "in", group.id)])
                roles.append(
                    {
                        "key": item["key"],
                        "label": item["label"],
                        "description": item["description"],
                        "permissions": item["permissions"],
                        "users": users,
                    }
                )
            return self.build_response({"data": roles})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Roles catalog failed")
            return self.error_response(error, status=400)
