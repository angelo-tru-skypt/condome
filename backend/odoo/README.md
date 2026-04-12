Esta carpeta mantiene solo lo necesario para que el contenedor Odoo se conecte con los módulos que vamos creando.
- `odoo.conf`: archivo de configuración que apunta al `addons` local y usa el usuario `odoo`.
- `addons/`: aquí van tus módulos personalizados (cada módulo es un subdirectorio con `__manifest__.py`, `models`, `controllers`, etc.).

Cuando pruebes módulos nuevos, créalos dentro de `backend/odoo/addons` y Odoo los detectará gracias al volumen montado en el `docker-compose.yml`.
