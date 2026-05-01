import logging

from odoo import _, http
from odoo.http import request

from .base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class OwnerManagementService(BaseApiService):
    """Agrupa catálogos administrativos del owner: propietarios, documentos y reglas."""

    def handle_owners(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            model = request.env["condome.propietario"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_propietario(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            apartment = self.find_apartamento(
                user,
                apartment_id=payload.get("apartamento_id") or payload.get("apartmentId"),
                apartment_name=payload.get("apartmentName") or payload.get("apartamento_nombre"),
                building_name=payload.get("buildingName") or payload.get("edificio_nombre"),
                condominio=condominio,
            )
            owner_name = self.clean_str(payload.get("name") or payload.get("nombre"))
            if not owner_name:
                return self.error_response(_("El nombre del propietario es requerido"))

            record = model.with_context(skip_user_account_creation=True).create(
                {
                    "name": owner_name,
                    "email": self.clean_str(payload.get("email")).lower(),
                    "telefono": self.clean_str(payload.get("phone") or payload.get("telefono")),
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "active",
                    "portal_access": payload.get("portalAccess", payload.get("portal_access", True)),
                    "notas": self.clean_str(payload.get("notes") or payload.get("notas")),
                    "apartamento_id": apartment.id,
                }
            )
            temporary_password = record.ensure_user_account()
            self.create_audit_entry(
                condominio,
                "propietarios",
                _("Propietario registrado"),
                _("%s · %s") % (record.name, record.apartamento_id.name),
                actor=self.clean_str(user.name or user.login) or "Administracion",
            )
            response = {"data": self.serialize_propietario(record)}
            if temporary_password:
                response["credenciales"] = {
                    "login": record.user_id.login if record.user_id else record.email,
                    "password_temporal": temporary_password,
                }
            return self.build_response(response, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management owners failed")
            return self.error_response(error, status=400)

    def handle_owner_update(self, propietario_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            record = self.get_owner_propietario(propietario_id, user)
            payload = self.read_payload()
            values = {
                "name": self.clean_str(payload.get("name") or payload.get("nombre")) or record.name,
                "email": self.clean_str(payload.get("email")).lower() if "email" in payload else record.email,
                "telefono": self.clean_str(payload.get("phone") or payload.get("telefono")) if ("phone" in payload or "telefono" in payload) else record.telefono,
                "estado": self.clean_str(payload.get("status") or payload.get("estado")) or record.estado,
                "notas": self.clean_str(payload.get("notes") or payload.get("notas")) if ("notes" in payload or "notas" in payload) else record.notas,
            }
            if "portalAccess" in payload or "portal_access" in payload:
                values["portal_access"] = payload.get("portalAccess", payload.get("portal_access"))

            apartment_id = payload.get("apartamento_id") or payload.get("apartmentId")
            apartment_name = payload.get("apartmentName") or payload.get("apartamento_nombre")
            building_name = payload.get("buildingName") or payload.get("edificio_nombre")
            if apartment_id or apartment_name:
                condominio = self.resolve_condominio(user, payload.get("condominio_id") or record.condominio_id.id)
                apartment = self.find_apartamento(
                    user,
                    apartment_id=apartment_id,
                    apartment_name=apartment_name,
                    building_name=building_name,
                    condominio=condominio,
                )
                values["apartamento_id"] = apartment.id

            record.write(values)
            self.create_audit_entry(
                record.condominio_id,
                "propietarios",
                _("Propietario actualizado"),
                _("%s · Estado %s") % (record.name, record.estado),
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="success" if record.estado == "active" else "warning",
            )
            return self.build_response({"data": self.serialize_propietario(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management owner update failed")
            return self.error_response(error, status=400)

    def handle_documents(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                condominio,
                "documentos",
                _("Documento registrado"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
            )
            return self.build_response({"data": self.serialize_documento(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management documents failed")
            return self.error_response(error, status=400)

    def handle_document_update(self, documento_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                record.condominio_id,
                "documentos",
                _("Documento actualizado"),
                _("%s · %s") % (record.name, record.estado),
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if record.estado == "archivado" else "success",
            )
            return self.build_response({"data": self.serialize_documento(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management document update failed")
            return self.error_response(error, status=400)

    def handle_settings(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
                    "bank_name": self.clean_str(payload.get("bankName")) if "bankName" in payload else settings.bank_name,
                    "bank_account_number": self.clean_str(payload.get("bankAccountNumber")) if "bankAccountNumber" in payload else settings.bank_account_number,
                    "bank_account_type": self.clean_str(payload.get("bankAccountType")) if "bankAccountType" in payload else settings.bank_account_type,
                    "bank_account_holder": self.clean_str(payload.get("bankAccountHolder")) if "bankAccountHolder" in payload else settings.bank_account_holder,
                    "automatic_access_validation": payload.get("automaticAccessValidation", settings.automatic_access_validation),
                }
            )
            self.create_audit_entry(
                condominio,
                "configuracion",
                _("Configuracion general actualizada"),
                _("Se ajustaron parametros operativos del condominio."),
                actor=self.clean_str(user.name or user.login) or "Administracion",
            )
            return self.build_response({"data": self.serialize_configuracion(settings)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management settings failed")
            return self.error_response(error, status=400)

    def handle_notification_rules(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                condominio,
                "notificaciones",
                _("Regla automatica creada"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="success" if record.enabled else "info",
            )
            return self.build_response({"data": self.serialize_notification_rule(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management notification rules failed")
            return self.error_response(error, status=400)

    def handle_notification_rule_update(self, rule_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

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
            self.create_audit_entry(
                record.condominio_id,
                "notificaciones",
                _("Regla automatica actualizada"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if not record.enabled else "success",
            )
            return self.build_response({"data": self.serialize_notification_rule(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management notification rule update failed")
            return self.error_response(error, status=400)

    def handle_access_policies(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            model = request.env["condome.access.policy"].sudo()

            if request.httprequest.method == "GET":
                condominio_id = request.httprequest.args.get("condominio_id")
                domain = self.owner_domain(user)
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="write_date desc, id desc")
                return self.build_response({"data": [self.serialize_access_policy(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            name = self.clean_str(payload.get("name"))
            description = self.clean_str(payload.get("description") or payload.get("descripcion"))
            applies_to = self.clean_str(payload.get("appliesTo") or payload.get("applies_to"))
            if not name or not description or not applies_to:
                return self.error_response(_("Nombre, ubicacion y descripcion son requeridos"))

            record = model.create(
                {
                    "name": name,
                    "tipo": self.clean_str(payload.get("type") or payload.get("tipo")) or "visita",
                    "applies_to": applies_to,
                    "descripcion": description,
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "active",
                    "condominio_id": condominio.id,
                }
            )
            self.create_audit_entry(
                condominio,
                "acceso",
                _("Politica de acceso registrada"),
                record.name,
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if record.estado == "blocked" else "info",
            )
            return self.build_response({"data": self.serialize_access_policy(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management access policies failed")
            return self.error_response(error, status=400)

    def handle_access_policy_update(self, policy_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            record = self.get_owner_access_policy(policy_id, user)
            payload = self.read_payload()
            values = {}
            if "name" in payload:
                values["name"] = self.clean_str(payload.get("name")) or record.name
            if "type" in payload or "tipo" in payload:
                values["tipo"] = self.clean_str(payload.get("type") or payload.get("tipo")) or record.tipo
            if "appliesTo" in payload or "applies_to" in payload:
                values["applies_to"] = self.clean_str(payload.get("appliesTo") or payload.get("applies_to")) or record.applies_to
            if "description" in payload or "descripcion" in payload:
                values["descripcion"] = self.clean_str(payload.get("description") or payload.get("descripcion")) or record.descripcion
            if "status" in payload or "estado" in payload:
                values["estado"] = self.clean_str(payload.get("status") or payload.get("estado")) or record.estado
            record.write(values)
            self.create_audit_entry(
                record.condominio_id,
                "acceso",
                _("Politica de acceso actualizada"),
                _("%s · %s") % (record.name, record.estado),
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if record.estado == "blocked" else "success",
            )
            return self.build_response({"data": self.serialize_access_policy(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management access policy update failed")
            return self.error_response(error, status=400)

    def handle_notifications(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            model = request.env["condome.notification"].sudo()

            if request.httprequest.method == "GET":
                domain = self.owner_domain(user)
                condominio_id = request.httprequest.args.get("condominio_id")
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_notification(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            message = self.clean_str(payload.get("message") or payload.get("mensaje"))
            if not message:
                return self.error_response(_("El mensaje es requerido"))
            title = self.clean_str(payload.get("title") or payload.get("titulo")) or _("Notificación del condominio")
            subject = self.clean_str(payload.get("subject") or payload.get("asunto"))
            severity = self.clean_str(payload.get("severity")) or "info"
            channel = self.clean_str(payload.get("channel") or payload.get("canal")) or "panel"

            target_residente_id = payload.get("residente_id")
            target_resident = False
            if target_residente_id:
                target_resident = self.find_resident(
                    user,
                    resident_id=target_residente_id,
                    condominio=condominio,
                )
            record = model.create(
                {
                    "message": message,
                    "condominio_id": condominio.id,
                    "owner_user_id": user.id,
                    "residente_id": target_resident.id if target_resident else False,
                }
            )
            emails_sent = self.send_notification_email(
                condominio,
                message,
                resident=target_resident,
                title=title,
                subject=subject,
                severity=severity,
                channel=channel,
            )
            return self.build_response(
                {
                    "data": self.serialize_notification(record),
                    "emailSent": bool(emails_sent),
                    "emailsSent": emails_sent,
                },
                status=201,
            )
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management notifications failed")
            return self.error_response(error, status=400)

    def handle_notification_update(self, notification_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            model = request.env["condome.notification"].sudo()
            record = model.search(
                [("id", "=", notification_id)] + self.owner_domain(user),
                limit=1,
            )
            if not record:
                raise ValueError(_("Notificacion no encontrada"))

            payload = self.read_payload()
            if "read" in payload:
                record.mark_as_read(user)
            return self.build_response({"data": self.serialize_notification(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management notification update failed")
            return self.error_response(error, status=400)

    def handle_vehicles(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            model = request.env["condome.vehiculo"].sudo()

            if request.httprequest.method == "GET":
                domain = self.owner_domain(user)
                condominio_id = request.httprequest.args.get("condominio_id")
                residente_id = request.httprequest.args.get("residente_id")
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                if residente_id:
                    domain.append(("residente_id", "=", int(residente_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_vehiculo(record) for record in records]})

            payload = self.read_payload()
            residente_id = payload.get("residente_id") or payload.get("residenteId")
            placa = self.clean_str(payload.get("placa") or payload.get("license_plate"))
            marca = self.clean_str(payload.get("marca") or payload.get("brand"))
            if not residente_id or not placa or not marca:
                return self.error_response(_("Residente, placa y marca son requeridos"))

            resident = self.find_resident(user, resident_id=residente_id)

            record = model.create(
                {
                    "placa": placa,
                    "marca": marca,
                    "modelo": self.clean_str(payload.get("modelo") or payload.get("model")),
                    "color": self.clean_str(payload.get("color")),
                    "ano": int(payload.get("ano") or payload.get("year") or 0) if payload.get("ano") or payload.get("year") else False,
                    "tipo": self.clean_str(payload.get("tipo") or payload.get("type")) or "auto",
                    "estado": self.clean_str(payload.get("estado") or payload.get("status")) or "pendiente",
                    "propietario_documento": self.clean_str(payload.get("propietario_documento") or payload.get("ownerDocument")),
                    "propietario_nombre": self.clean_str(payload.get("propietario_nombre") or payload.get("ownerName")),
                    "propietario_telefono": self.clean_str(payload.get("propietario_telefono") or payload.get("ownerPhone")),
                    "residente_id": int(residente_id),
                    "notas": self.clean_str(payload.get("notas") or payload.get("notes")),
                }
            )
            self.create_audit_entry(
                record.condominio_id,
                "vehiculos",
                _("Vehículo registrado"),
                _("%s · Estado %s") % (record.placa, record.estado),
                actor=self.clean_str(user.name or user.login) or "Administracion",
            )
            return self.build_response({"data": self.serialize_vehiculo(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management vehicles failed")
            return self.error_response(error, status=400)

    def handle_vehicle_update(self, vehiculo_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_owner_session()
            model = request.env["condome.vehiculo"].sudo()
            record = model.search(
                [("id", "=", vehiculo_id)] + self.owner_domain(user),
                limit=1,
            )
            if not record:
                raise ValueError(_("Vehiculo no encontrado"))

            payload = self.read_payload()
            values = {}
            if "placa" in payload:
                values["placa"] = self.clean_str(payload.get("placa") or payload.get("license_plate")) or record.placa
            if "marca" in payload or "brand" in payload:
                values["marca"] = self.clean_str(payload.get("marca") or payload.get("brand")) or record.marca
            if "modelo" in payload or "model" in payload:
                values["modelo"] = self.clean_str(payload.get("modelo") or payload.get("model")) or record.modelo
            if "color" in payload:
                values["color"] = self.clean_str(payload.get("color")) or record.color
            if "ano" in payload or "year" in payload:
                ano = payload.get("ano") or payload.get("year")
                values["ano"] = int(ano) if ano else record.ano
            if "tipo" in payload or "type" in payload:
                values["tipo"] = self.clean_str(payload.get("tipo") or payload.get("type")) or record.tipo
            if "estado" in payload or "status" in payload:
                values["estado"] = self.clean_str(payload.get("estado") or payload.get("status")) or record.estado
            if "propietario_documento" in payload or "ownerDocument" in payload:
                values["propietario_documento"] = self.clean_str(payload.get("propietario_documento") or payload.get("ownerDocument")) or record.propietario_documento
            if "propietario_nombre" in payload or "ownerName" in payload:
                values["propietario_nombre"] = self.clean_str(payload.get("propietario_nombre") or payload.get("ownerName")) or record.propietario_nombre
            if "propietario_telefono" in payload or "ownerPhone" in payload:
                values["propietario_telefono"] = self.clean_str(payload.get("propietario_telefono") or payload.get("ownerPhone")) or record.propietario_telefono
            if "notas" in payload or "notes" in payload:
                values["notas"] = self.clean_str(payload.get("notas") or payload.get("notes")) or record.notas

            if values:
                record.write(values)
                self.create_audit_entry(
                    record.condominio_id,
                    "vehiculos",
                    _("Vehículo actualizado"),
                    _("%s · Estado %s") % (record.placa, record.estado),
                    actor=self.clean_str(user.name or user.login) or "Administracion",
                    severity="success" if record.estado == "activo" else "info",
                )
            return self.build_response({"data": self.serialize_vehiculo(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management vehicle update failed")
            return self.error_response(error, status=400)

    def handle_communications(self):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
            model = request.env["condome.comunicado"].sudo()

            if request.httprequest.method == "GET":
                domain = self.owner_domain(user)
                condominio_id = request.httprequest.args.get("condominio_id")
                if condominio_id:
                    domain.append(("condominio_id", "=", int(condominio_id)))
                records = model.search(domain, order="create_date desc, id desc")
                return self.build_response({"data": [self.serialize_comunicado(record) for record in records]})

            payload = self.read_payload()
            condominio = self.resolve_condominio(user, payload.get("condominio_id"))
            title = self.clean_str(payload.get("title") or payload.get("titulo"))
            message = self.clean_str(payload.get("message") or payload.get("mensaje"))
            if not title or not message:
                return self.error_response(_("Titulo y mensaje son requeridos"))

            record = model.create(
                {
                    "name": title,
                    "mensaje": message,
                    "prioridad": self.clean_str(payload.get("priority") or payload.get("prioridad")) or "media",
                    "alcance": self.clean_str(payload.get("scope") or payload.get("alcance")) or "general",
                    "canal": self.clean_str(payload.get("channel") or payload.get("canal")) or "panel",
                    "estado": self.clean_str(payload.get("status") or payload.get("estado")) or "draft",
                    "condominio_id": condominio.id,
                }
            )
            if self.should_send_announcement_email(record.estado, record.canal):
                self.send_comunicado_email(condominio, title, message, priority=record.prioridad)
            return self.build_response({"data": self.serialize_comunicado(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management communications failed")
            return self.error_response(error, status=400)

    def handle_communication_update(self, comunicado_id):
        try:
            if self.is_preflight_request():
                return self.build_response({"ok": True})

            user = self.require_session()
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

            if values:
                previous_status = record.estado
                previous_channel = record.canal
                record.write(values)
                email_related_fields = {"name", "mensaje", "prioridad", "canal", "estado"}
                if self.should_send_announcement_email(record.estado, record.canal) and (
                    previous_status != "published"
                    or previous_channel != record.canal
                    or bool(email_related_fields.intersection(values))
                ):
                    self.send_comunicado_email(record.condominio_id, record.name, record.mensaje, priority=record.prioridad)

            self.create_audit_entry(
                record.condominio_id,
                "comunicados",
                _("Comunicado actualizado"),
                _("%s · %s") % (record.name, record.estado),
                actor=self.clean_str(user.name or user.login) or "Administracion",
                severity="warning" if record.estado == "published" else "info",
            )
            return self.build_response({"data": self.serialize_comunicado(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Owner management communication update failed")
            return self.error_response(error, status=400)
