import json
import logging

from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class OwnerReportingApiService(BaseApiService):
    """Resumen y exportaciones solicitadas por administradores (owner/propietario).

    El nombre deja claro que este servicio atiende rutas bajo el prefijo
    owner/ y facilita distinguir recursos owner-only cuando se requiera.
    """

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
            "downloadUrl": record.download_url or "",
            "requestedAt": record.requested_at.isoformat() if record.requested_at else None,
            "generatedAt": record.generated_at.isoformat() if record.generated_at else None,
            "requestedBy": record.requested_by.name if record.requested_by else "",
            "note": record.note or "",
        }

    def handle_report_download(self, export_id):
        """Simula la descarga de un reporte."""
        try:
            user = self.require_owner_session()
            export = request.env["condome.report.export"].sudo().browse(export_id)
            if not export.exists():
                return self.error_response("Reporte no encontrado", status=404)
            
            # En un entorno real aqui devolveriamos el contenido binario del reporte
            # Para esta simulacion, devolvemos un JSON que simula la respuesta de descarga
            # o redirigimos a una accion de Odoo.
            return self.build_response({
                "ok": True, 
                "message": "Simulacion de descarga de PDF exitosa",
                "fileName": export.file_name,
                "data": export.get_financial_data()
            })
        except Exception as error:
            return self.error_response(error, status=400)

    def _selected_condominios(self, user):
        domain = list(self.condominio_domain(user))
        condominio_id = request.httprequest.args.get("condominio_id")
        if condominio_id:
            domain.append(("id", "=", int(condominio_id)))
        return request.env["condome.condominio"].sudo().search(domain)

    def handle_reports_summary(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            # Permitir dos modos:
            # - Si se solicita un `condominio_id` específico, permitir acceso
            #   a administradores del condominio (propietario) o owners.
            # - Si no se especifica condominio, la acción es global y
            #   requiere administrador del sistema (owner).
            condominio_id = request.httprequest.args.get("condominio_id")
            if condominio_id:
                user = self.require_owner_session()
                # Validar y obtener el condominio solicitado (control de dominio)
                cond = self.get_condominio(int(condominio_id), user)
                condominios = request.env["condome.condominio"].sudo().search([("id", "=", cond.id)])
            else:
                user = self.require_system_owner_session()
                condominios = self._selected_condominios(user)

            condominio_ids = condominios.ids

            def count(model_name, extra_domain=None):
                domain = list(extra_domain or [])
                if condominio_ids:
                    domain.append(("condominio_id", "in", condominio_ids))
                return request.env[model_name].sudo().search_count(domain)

            payload = {
                "cards": [
                    {
                        "key": "estructura",
                        "label": "Estructura",
                        "value": count("condome.apartamento"),
                        "description": "Apartamentos y unidades disponibles para reportes operativos.",
                    },
                    {
                        "key": "comunidad",
                        "label": "Comunidad",
                        "value": count("condome.residente") + count("condome.propietario"),
                        "description": "Personas activas vinculadas al condominio.",
                    },
                    {
                        "key": "incidencias",
                        "label": "Incidencias",
                        "value": count("condome.incidencia", [("estado", "in", ["reportada", "en_revision"]) ]),
                        "description": "Casos abiertos que requieren seguimiento.",
                    },
                    {
                        "key": "cobros",
                        "label": "Cobros",
                        "value": count("condome.charge"),
                        "description": "Cargos registrados para control y conciliacion.",
                    },
                ],
                "exports": count("condome.report.export"),
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

            # GET: listar exportaciones. Si se pasa condominio_id como query,
            # permitir a propietarios ver solo las exportaciones de su condominio.
            if request.httprequest.method == "GET":
                cond_query = request.httprequest.args.get("condominio_id")
                if cond_query:
                    user = self.require_owner_session()
                    cond = self.get_condominio(int(cond_query), user)
                    records = model.search([("condominio_id", "=", cond.id)])
                else:
                    user = self.require_system_owner_session()
                    records = model.search([("condominio_id", "in", self._selected_condominios(user).ids)])
                return self.build_response({"data": [self.serialize_export(record) for record in records]})

            # POST: crear solicitud de exportacion para un condominio específico.
            payload = self.read_payload()
            # Requerir que el solicitante sea administrador del condominio (propietario)
            # o administrador del sistema (owner). get_condominio validará el dominio.
            user = self.require_owner_session()
            condominio = self.get_condominio(int(payload.get("condominio_id")), user)
            report_type = payload.get("reportType") or "operativo"
            export_format = payload.get("exportFormat") or "xlsx"
            record = model.create(
                {
                    "condominio_id": condominio.id,
                    "requested_by": user.id,
                    "report_type": report_type,
                    "export_format": export_format,
                    # Dejamos el archivo pendiente para la capa que realmente genere binarios.
                    "file_name": f"{condominio.name}-{report_type}.{export_format}",
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
