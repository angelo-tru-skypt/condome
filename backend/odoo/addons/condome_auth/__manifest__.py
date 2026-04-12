{
    "name": "Condome Auth",
    "version": "1.0.0",
    "summary": "Autenticación JWT para Condome",
    "description": "Provee login/registro/refresh/logout basado en JWT y un rol propietario.",
    "category": "Custom",
    "depends": ["base"],
    "data": [
        "security/condome_groups.xml",
    ],
    "installable": True,
    "application": False,
    "post_init_hook": "post_init_condome_auth",
    "license": "LGPL-3",
}
