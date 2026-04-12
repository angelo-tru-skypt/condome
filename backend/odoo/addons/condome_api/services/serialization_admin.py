import json

from odoo import _, fields
from odoo.http import request

class ApiSerializationAdminMixin:
    """Serializadores orientados a módulos administrativos del owner."""

    def serialize_notification(self, record):
        return {
            "id": record.id,
            "message": record.message,
            "read": record.read,
            "fecha_creacion": record.create_date.isoformat() if record.create_date else None,
            "condominio_id": record.condominio_id.id if record.condominio_id else False,
            "condominio_nombre": record.condominio_id.name if record.condominio_id else "",
            "residente_id": record.residente_id.id if record.residente_id else False,
            "residente_nombre": record.residente_id.name if record.residente_id else "",
            "incidencia_id": record.incidencia_id.id if record.incidencia_id else False,
            "incidencia_titulo": record.incidencia_id.titulo if record.incidencia_id else "",
            "mark_read_by": record.mark_read_by.id if record.mark_read_by else False,
        }

    def serialize_propietario(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "email": record.email or "",
            "phone": record.telefono or "",
            "status": record.estado,
            "portalAccess": record.portal_access,
            "notes": record.notas or "",
            "apartmentId": record.apartamento_id.id,
            "apartmentName": record.apartamento_id.name,
            "buildingId": record.edificio_id.id,
            "buildingName": record.edificio_id.name,
            "condominioId": record.condominio_id.id,
            "userId": record.user_id.id if record.user_id else False,
            "login": record.user_id.login if record.user_id else "",
            "createdAt": record.create_date.isoformat() if record.create_date else None,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_documento(self, record):
        return {
            "id": record.id,
            "title": record.name,
            "category": record.categoria,
            "audience": record.audiencia,
            "status": record.estado,
            "source": record.origen or "",
            "description": record.descripcion or "",
            "condominioId": record.condominio_id.id,
            "createdAt": record.create_date.isoformat() if record.create_date else None,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_configuracion(self, record):
        return {
            "id": record.id,
            "condominioId": record.condominio_id.id,
            "currency": record.currency,
            "timezone": record.timezone or "",
            "language": record.language,
            "reservationLeadHours": record.reservation_lead_hours,
            "reservationWindowDays": record.reservation_window_days,
            "incidentSlaHours": record.incident_sla_hours,
            "lateFeeGraceDays": record.late_fee_grace_days,
            "supportEmail": record.support_email or "",
            "automaticAccessValidation": record.automatic_access_validation,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_notification_rule(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "trigger": record.trigger,
            "channel": record.channel,
            "audience": record.audience,
            "enabled": record.enabled,
            "template": record.template or "",
            "condominioId": record.condominio_id.id,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_access_policy(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "type": record.tipo,
            "appliesTo": record.applies_to or "",
            "description": record.descripcion or "",
            "status": record.estado,
            "condominioId": record.condominio_id.id,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_comunicado(self, record):
        return {
            "id": record.id,
            "title": record.name,
            "message": record.mensaje or "",
            "priority": record.prioridad,
            "scope": record.alcance,
            "channel": record.canal,
            "status": record.estado,
            "targetLabel": record.target_label or "",
            "scheduledFor": record.scheduled_for.isoformat() if record.scheduled_for else "",
            "condominioId": record.condominio_id.id,
            "createdAt": record.create_date.isoformat() if record.create_date else None,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_common_area(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "capacity": record.capacidad or 0,
            "schedule": record.horario or "",
            "rules": record.reglas or "",
            "active": record.active,
            "condominioId": record.condominio_id.id,
            "createdAt": record.create_date.isoformat() if record.create_date else None,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_area_reservation(self, record):
        return {
            "id": record.id,
            "areaId": record.area_id.id,
            "areaName": record.area_id.name,
            "residentId": record.residente_id.id,
            "residentName": record.residente_id.name,
            "apartmentId": record.apartamento_id.id,
            "apartmentName": record.apartamento_id.name,
            "buildingId": record.edificio_id.id,
            "buildingName": record.edificio_id.name,
            "condominioId": record.condominio_id.id,
            "date": record.fecha_reserva.isoformat() if record.fecha_reserva else None,
            "timeRange": record.rango_horario or "",
            "attendees": record.asistentes,
            "purpose": record.motivo or "",
            "status": record.estado,
            "decisionNote": record.nota_decision or "",
            "decisionAt": record.fecha_decision.isoformat() if record.fecha_decision else None,
            "createdAt": record.create_date.isoformat() if record.create_date else None,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }

    def serialize_audit_entry(self, record):
        return {
            "id": record.id,
            "category": record.categoria,
            "title": record.titulo,
            "detail": record.detalle or "",
            "actor": record.actor or "Sistema",
            "severity": record.severidad,
            "condominioId": record.condominio_id.id,
            "createdAt": record.create_date.isoformat() if record.create_date else None,
        }

    def serialize_vehiculo(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "placa": record.placa,
            "marca": record.marca,
            "modelo": record.modelo or "",
            "color": record.color or "",
            "ano": record.ano or 0,
            "tipo": record.tipo,
            "estado": record.estado,
            "propietario_documento": record.propietario_documento or "",
            "propietario_nombre": record.propietario_nombre or "",
            "propietario_telefono": record.propietario_telefono or "",
            "residente_id": record.residente_id.id,
            "residente_nombre": record.residente_id.name,
            "apartamento_id": record.apartamento_id.id if record.apartamento_id else False,
            "apartamento_nombre": record.apartamento_id.name if record.apartamento_id else "",
            "edificio_id": record.edificio_id.id if record.edificio_id else False,
            "edificio_nombre": record.edificio_id.name if record.edificio_id else "",
            "condominio_id": record.condominio_id.id,
            "condominio_nombre": record.condominio_id.name,
            "notas": record.notas or "",
            "createdAt": record.create_date.isoformat() if record.create_date else None,
            "updatedAt": record.write_date.isoformat() if record.write_date else None,
        }
