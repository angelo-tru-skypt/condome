{
    "name": "Condome Billing",
    "version": "1.0.0",
    "summary": "RF 7, 8, 9 y 10: cuotas, pagos e indicadores de morosidad",
    "description": "Prepara la capa financiera del condominio aprovechando el ecosistema contable de Odoo.",
    "category": "Custom",
    "depends": ["base", "account", "condome_auth", "condome_core", "condome_structure", "condome_directory"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
