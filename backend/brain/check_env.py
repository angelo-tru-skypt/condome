import os
from pathlib import Path
from dotenv import load_dotenv

# Simular la lógica de email_service.py
_env_path = Path("/opt/odoo/addons/condome_mail/services/email_service.py").parents[4] / ".env"
print(f"Buscando .env en: {_env_path}")
print(f"Existe? {os.path.exists(_env_path)}")

if os.path.exists(_env_path):
    load_dotenv(_env_path, override=True)
    print(f"SMTP_HOST actual: {os.getenv('SMTP_HOST')}")
    print(f"SMTP_PORT actual: {os.getenv('SMTP_PORT')}")
else:
    # Buscar en el directorio actual y padres
    print("Directorio actual:", os.getcwd())
    print("Contenido:", os.listdir("."))
