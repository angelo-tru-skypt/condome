from odoo import api, fields, models
from odoo.exceptions import ValidationError

class ResUsers(models.Model):
    _inherit = "res.users"

    CONDOME_PLAN_FEATURES = {
        "free": {
            "label": "Free",
            "monthly_price_dop": 0,
            "max_condominios": 1,
            "is_paid": False,
            "automatic_reports": False,
            "feature_summary": [
                "1 condominio",
                "Gestión base de residentes",
                "Cobros manuales",
            ],
        },
        "pro": {
            "label": "Pro",
            "monthly_price_dop": 1200,
            "max_condominios": 3,
            "is_paid": True,
            "automatic_reports": True,
            "feature_summary": [
                "Hasta 3 condominios",
                "Reportes automáticos mensuales",
                "Soporte prioritario",
            ],
        },
        "premium": {
            "label": "Premium",
            "monthly_price_dop": 6000,
            "max_condominios": None,
            "is_paid": True,
            "automatic_reports": True,
            "feature_summary": [
                "Condominios ilimitados",
                "Reportes automáticos mensuales",
                "Cobertura multi-condominio completa",
            ],
        },
    }

    condome_plan = fields.Selection(
        [
            ("free", "Free"),
            ("pro", "Pro"),
            ("premium", "Premium"),
        ],
        default="free",
        string="Plan Condome"
    )
    condome_report_day = fields.Integer(
        string="Día Fijo de Reporte Automático",
        default=1,
        help="Día del mes en que se generan los reportes automáticos para planes Pro y Premium.",
    )
    
    email_verified = fields.Boolean(string="Email Verificado", default=False)
    email_verified_at = fields.Datetime(string="Fecha de Verificación")
    email_verification_token = fields.Char(string="Token de Verificación")
    has_completed_onboarding = fields.Boolean(string="Onboarding Completado", default=False)

    @api.constrains("condome_report_day")
    def _check_condome_report_day(self):
        for user in self:
            if user.condome_report_day and not 1 <= user.condome_report_day <= 28:
                raise ValidationError("El día fijo de reporte debe estar entre 1 y 28.")

    def get_condome_plan_config(self):
        self.ensure_one()
        plan_code = self.condome_plan or "free"
        fallback = dict(self.CONDOME_PLAN_FEATURES["free"])
        config = dict(self.CONDOME_PLAN_FEATURES.get(plan_code, fallback))
        config["code"] = plan_code
        return config

    def get_condome_plan_limit(self):
        self.ensure_one()
        return self.get_condome_plan_config().get("max_condominios")

    def has_paid_condome_plan(self):
        self.ensure_one()
        return bool(self.get_condome_plan_config().get("is_paid"))

    def supports_automatic_reports(self):
        self.ensure_one()
        return bool(self.get_condome_plan_config().get("automatic_reports"))

    def get_condome_report_day(self):
        self.ensure_one()
        day = int(self.condome_report_day or 1)
        return min(max(day, 1), 28)
