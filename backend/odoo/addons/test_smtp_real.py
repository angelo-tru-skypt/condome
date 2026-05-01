import os
import sys

# Simular entorno Odoo
sys.path.append("/usr/lib/python3/dist-packages")
sys.path.append("/mnt/extra-addons")

# Mock de logging y odoo para que el servicio no falle al importar
class MockLogger:
    def info(self, msg, *args): print(f"INFO: {msg % args if args else msg}")
    def error(self, msg, *args): print(f"ERROR: {msg % args if args else msg}")
    def warning(self, msg, *args): print(f"WARNING: {msg % args if args else msg}")
    def exception(self, msg, *args): print(f"EXCEPTION: {msg % args if args else msg}")
    def debug(self, msg, *args): print(f"DEBUG: {msg % args if args else msg}")

import logging
logging.getLogger("odoo.addons.condome_mail.services.email_service").addHandler(logging.StreamHandler())

from odoo.addons.condome_mail.services.email_service import CondomeEmailService

mail = CondomeEmailService()
print(f"SMTP HOST configurado: {mail.smtp_host}")
print(f"SMTP PORT configurado: {mail.smtp_port}")
print(f"SENDER EMAIL: {mail.sender_email}")

success = mail._send_raw(
    "mancebo996@gmail.com", 
    "Prueba Técnica de Conexión — Condome", 
    "<h1>¡Conexión Exitosa!</h1><p>Este correo confirma que el servidor de Condome ya está enviando correos reales a través de Gmail.</p>"
)

if success:
    print("✅ EL CORREO SE ENVIÓ CORRECTAMENTE POR GMAIL")
else:
    print("❌ EL CORREO FALLÓ. Revisa la configuración.")
