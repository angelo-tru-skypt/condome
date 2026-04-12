{
    "name": "Condome Access Control",
    "version": "1.0.0",
    "summary": "RF 13, 14 y 21: visitas, vehículos y control de acceso",
    "description": "Agrupa control de visitas, registro de vehículos y políticas de acceso del condominio.",
    "category": "Custom",
    "depends": ["base", "condome_auth", "condome_core", "condome_structure", "condome_directory", "condome_people"],
    "data": [
        "security/ir.model.access.csv",
    ],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
