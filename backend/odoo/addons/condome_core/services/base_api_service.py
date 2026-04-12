from .access_service import ApiAccessMixin
from .event_service import ApiEventMixin
from .response_service import ApiResponseMixin
from .serialization_admin import ApiSerializationAdminMixin
from .serialization_core import ApiSerializationCoreMixin


class BaseApiService(
    ApiResponseMixin,
    ApiAccessMixin,
    ApiSerializationCoreMixin,
    ApiEventMixin,
    ApiSerializationAdminMixin,
):
    """Servicio base reutilizable por los addons funcionales de Condome."""

    def is_preflight_request(self):
        """Centraliza la detección de preflight para no repetirla en cada flujo."""
        from odoo.http import request

        return request.httprequest.method == "OPTIONS"
