FROM odoo:17.0

USER root
COPY requirements.txt /requirements.txt
RUN python3 -m pip install --no-cache-dir -r /requirements.txt
USER odoo
