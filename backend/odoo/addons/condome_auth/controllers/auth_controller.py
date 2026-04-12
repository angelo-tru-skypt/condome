import logging

from odoo import http

from ..services.auth_api_service import AuthApiService

_logger = logging.getLogger(__name__)
service = AuthApiService()


class CondomeAuthController(http.Controller):
    """Controlador delgado de autenticación y perfil."""

    @http.route("/condome_auth/<path:anything>", type="http", auth="none", methods=["OPTIONS"], csrf=False, cors="http://localhost:3000")
    def auth_options(self, **kwargs):
        return service.handle_options()

    @http.route("/condome_auth/authenticate", type="http", auth="none", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def authenticate(self, **kwargs):
        return service.handle_authenticate()

    @http.route("/condome_auth/session_info", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def session_info(self, **kwargs):
        return service.handle_session_info()

    @http.route("/condome_auth/profile", type="http", auth="public", methods=["GET", "PUT", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def profile(self, **kwargs):
        return service.handle_profile()

    @http.route("/condome_auth/change_password", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def change_password(self, **kwargs):
        return service.handle_change_password()

    @http.route("/condome_auth/register", type="http", auth="none", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def register(self, **kwargs):
        return service.handle_register()

    @http.route("/condome_auth/logout", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def logout(self, **kwargs):
        return service.handle_logout()

    @http.route("/condome_auth/validate_token", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False, cors="http://localhost:3000")
    def validate_token(self, **kwargs):
        return service.handle_validate_token()
