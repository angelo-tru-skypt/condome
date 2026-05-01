from odoo.http import request

class ApiSerializationCoreMixin:
    """Serializadores base para la estructura operativa del condominio."""

    def _safe_length(self, record, field_name, active_only=False):
        """Cuenta relaciones sin asumir que todos los módulos están instalados."""
        relation = getattr(record, field_name, None)
        if relation is None:
            return 0
        if active_only and hasattr(relation, "filtered"):
            return len(relation.filtered("activo"))
        return len(relation)

    def serialize_condominio(self, record):
        return {
            "id": record.id,
            "nombre": record.name,
            "tipo": record.tipo,
            "rnc": record.rnc or "",
            "direccion": record.direccion or "",
            "ciudad": record.ciudad or "",
            "pais": record.pais or "",
            "telefono": record.telefono or "",
            "email": record.email or "",
            "owner_user_id": record.owner_user_id.id,
            "admin_user_id": record.owner_user_id.id,
            "admin_user_name": record.owner_user_id.name if record.owner_user_id else "",
            "parking_spaces_total": int(getattr(record, "parking_spaces_total", 0) or 0),
            "parking_spaces_occupied": int(getattr(record, "parking_spaces_occupied", 0) or 0),
            "parking_spaces_available": int(getattr(record, "parking_spaces_available", 0) or 0),
            "parking_spaces_pending": int(getattr(record, "parking_spaces_pending", 0) or 0),
            "totales": {
                "edificios": self._safe_length(record, "edificio_ids"),
                "apartamentos": self._safe_length(record, "apartamento_ids"),
                "residentes": self._safe_length(record, "residente_ids", active_only=True),
            },
        }

    def serialize_edificio(self, record):
        return {
            "id": record.id,
            "nombre": record.name,
            "codigo": record.codigo or "",
            "niveles": record.niveles,
            "descripcion": record.descripcion or "",
            "condominio_id": record.condominio_id.id,
            "total_apartamentos": self._safe_length(record, "apartamento_ids"),
        }

    def serialize_apartamento(self, record):
        return {
            "id": record.id,
            "nombre": record.name,
            "piso": record.piso or "",
            "tipo_unidad": record.tipo_unidad,
            "metraje": record.metraje or 0,
            "estado": record.estado,
            "condominio_id": record.condominio_id.id,
            "edificio_id": record.edificio_id.id,
            "edificio_nombre": record.edificio_id.name,
            "residentes_count": self._safe_length(record, "residente_ids", active_only=True),
        }

    def serialize_residente(self, record):
        return {
            "id": record.id,
            "nombre": record.nombre,
            "apellido": record.apellido,
            "nombre_completo": record.name,
            "email": record.email or "",
            "telefono": record.telefono or "",
            "activo": record.activo,
            "fecha_ingreso": record.fecha_ingreso.isoformat() if record.fecha_ingreso else None,
            "apartamento_id": record.apartamento_id.id,
            "apartamento_nombre": record.apartamento_id.name,
            "edificio_id": record.edificio_id.id,
            "edificio_nombre": record.edificio_id.name,
            "condominio_id": record.condominio_id.id,
            "user_id": record.user_id.id if record.user_id else False,
            "login": record.user_id.login if record.user_id else "",
        }

    def serialize_visita(self, record):
        return {
            "id": record.id,
            "visitante_nombre": record.visitante_nombre,
            "visitante_documento": record.visitante_documento or "",
            "visitante_telefono": record.visitante_telefono or "",
            "fecha_visita": record.fecha_visita.isoformat() if record.fecha_visita else None,
            "hora_ingreso": record.hora_ingreso or "",
            "hora_salida": record.hora_salida or "",
            "cantidad_personas": record.cantidad_personas,
            "motivo": record.motivo or "",
            "estado": record.estado,
            "notas_propietario": record.notas_propietario or "",
            "fecha_decision": record.fecha_decision.isoformat() if record.fecha_decision else None,
            "residente_id": record.residente_id.id,
            "residente_nombre": record.residente_id.name,
            "apartamento_id": record.apartamento_id.id,
            "apartamento_nombre": record.apartamento_id.name,
            "edificio_id": record.edificio_id.id,
            "edificio_nombre": record.edificio_id.name,
            "condominio_id": record.condominio_id.id,
            "condominio_nombre": record.condominio_id.name,
        }

    def serialize_incidencia(self, record):
        return {
            "id": record.id,
            "titulo": record.titulo,
            "descripcion": record.descripcion,
            "ubicacion_tipo": record.ubicacion_tipo,
            "categoria": record.categoria,
            "prioridad": record.prioridad,
            "estado": record.estado,
            "ubicacion_detalle": record.ubicacion_detalle or "",
            "respuesta_propietario": record.respuesta_propietario or "",
            "fecha_reporte": record.create_date.isoformat() if record.create_date else None,
            "fecha_resolucion": record.fecha_resolucion.isoformat() if record.fecha_resolucion else None,
            "residente_id": record.residente_id.id,
            "residente_nombre": record.residente_id.name,
            "apartamento_id": record.apartamento_id.id,
            "apartamento_nombre": record.apartamento_id.name,
            "edificio_id": record.edificio_id.id,
            "edificio_nombre": record.edificio_id.name,
            "condominio_id": record.condominio_id.id,
            "condominio_nombre": record.condominio_id.name,
        }

    def serialize_resident_context(self, resident):
        buildings = request.env["condome.edificio"].sudo().search(
            [("condominio_id", "=", resident.condominio_id.id)],
            order="name asc",
        )
        return {
            "residente": self.serialize_residente(resident),
            "apartamento": self.serialize_apartamento(resident.apartamento_id),
            "edificio": self.serialize_edificio(resident.edificio_id),
            "condominio": self.serialize_condominio(resident.condominio_id),
            "edificios": [self.serialize_edificio(record) for record in buildings],
        }

