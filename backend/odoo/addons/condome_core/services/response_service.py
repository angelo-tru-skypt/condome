import json

from odoo.http import request

from .cors_service import build_cors_headers

class ApiResponseMixin:
    """Utilidades HTTP compartidas para respuestas JSON y lectura de payload."""

    def cors_headers(self):
        return build_cors_headers()

    def clean_str(self, value):
        return (value or "").strip()

    def normalize_country_code(self, value):
        return self.clean_str(value).upper()

    def normalize_datetime_value(self, value):
        normalized = self.clean_str(value)
        if not normalized:
            return False
        normalized = normalized.replace("T", " ")
        if len(normalized) == 16:
            normalized = f"{normalized}:00"
        return normalized

    def build_response(self, payload, status=200):
        response = request.make_response(json.dumps(payload), headers=self.cors_headers())
        response.status_code = status
        return response

    def error_response(self, message, status=400):
        return self.build_response({"error": {"message": str(message)}}, status=status)

    def read_payload(self):
        payload = request.httprequest.get_json(silent=True)
        if isinstance(payload, dict):
            return payload
        raw = request.httprequest.data or b""
        if not raw:
            return {}
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (TypeError, ValueError):
            return {}
        return parsed if isinstance(parsed, dict) else {}

