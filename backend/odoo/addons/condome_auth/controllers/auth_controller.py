import logging

from odoo import http

from ..services.auth_api_service import AuthApiService

_logger = logging.getLogger(__name__)
service = AuthApiService()


class CondomeAuthController(http.Controller):
    """Controlador delgado de autenticación y perfil."""

    @http.route("/condome_auth/<path:anything>", type="http", auth="none", methods=["OPTIONS"], csrf=False)
    def auth_options(self, **kwargs):
        return service.handle_options()

    @http.route("/condome_auth/authenticate", type="http", auth="none", methods=["POST", "OPTIONS"], csrf=False)
    def authenticate(self, **kwargs):
        return service.handle_authenticate()

    @http.route("/condome_auth/session_info", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False)
    def session_info(self, **kwargs):
        return service.handle_session_info()

    @http.route("/condome_auth/profile", type="http", auth="public", methods=["GET", "PUT", "OPTIONS"], csrf=False)
    def profile(self, **kwargs):
        return service.handle_profile()

    @http.route("/condome_auth/change_password", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False)
    def change_password(self, **kwargs):
        return service.handle_change_password()

    @http.route("/condome_auth/register", type="http", auth="none", methods=["POST", "OPTIONS"], csrf=False)
    def register(self, **kwargs):
        return service.handle_register()

    @http.route("/condome_auth/verify_email", type="http", auth="none", methods=["POST", "GET", "OPTIONS"], csrf=False)
    def verify_email(self, **kwargs):
        return service.handle_verify_email()

    @http.route("/condome_auth/resend_verification", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False)
    def resend_verification(self, **kwargs):
        return service.handle_resend_verification()

    @http.route("/condome_auth/logout", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False)
    def logout(self, **kwargs):
        return service.handle_logout()

    @http.route("/condome_auth/validate_token", type="http", auth="public", methods=["GET", "OPTIONS"], csrf=False)
    def validate_token(self, **kwargs):
        return service.handle_validate_token()

    @http.route("/condome_auth/complete_onboarding", type="http", auth="public", methods=["POST", "OPTIONS"], csrf=False)
    def complete_onboarding(self, **kwargs):
        return service.handle_complete_onboarding()

