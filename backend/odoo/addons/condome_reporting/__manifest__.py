{
    "name": "Condome Reporting",
    "version": "1.0.0",
    "summary": "RF 18 y 24: reportes y exportaciones administrativas",
    "description": "Centraliza solicitudes de exportacion y vistas resumidas para analitica operativa del condominio.",
    "category": "Custom",
    "depends": ["base", "condome_auth", "condome_core", "condome_structure", "condome_directory", "condome_billing", "condome_dashboard"],
    "data": [
        "security/ir.model.access.csv",
        "data/ir_cron_data.xml",
        "reports/report_financial_templates.xml",
    ],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
