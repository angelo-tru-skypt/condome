"""Motor de plantillas HTML para correos de Condome.

Genera correos con diseño profesional y consistente con la marca,
reutilizando un layout base que envuelve el contenido de cada tipo de mensaje.
"""


class EmailTemplateEngine:
    """Genera HTML listo para enviar por correo según el tipo de evento."""

    # ── Paleta de colores "Arquitectónica" ──────────────────────────
    COLOR_PRIMARY = "#D94F10"  # Condome Orange
    COLOR_DARK = "#121110"     # Ink Black
    COLOR_BG = "#F6F2EC"       # Lobby Ivory
    COLOR_CARD = "#FFFFFF"     # Clean White
    COLOR_TEXT = "#1E1A17"     # Deep Charcoal
    COLOR_MUTED = "#8C8076"    # Stone Grey
    COLOR_BORDER = "#E9E1D8"   # Soft Border

    # ── Layout base inspirado en JSX/React Email ─────────────────────

    @classmethod
    def _base_layout(cls, title, body_html, footer_text=""):
        """Envuelve *body_html* en el layout estándar de Condome."""
        footer = footer_text or "Has recibido este correo porque formas parte de un condominio gestionado por Condome."
        return f"""\
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
    body {{ margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table {{ border-collapse: collapse !important; }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:{cls.COLOR_BG};font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{cls.COLOR_BG};">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="max-width:560px;width:100%;background-color:{cls.COLOR_CARD};
                      border-radius:24px;overflow:hidden;
                      box-shadow:0 12px 40px rgba(30,26,23,0.06);">
          <!-- Logo Section -->
          <tr>
            <td style="padding:48px 48px 32px;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:{cls.COLOR_PRIMARY};padding:10px;border-radius:12px;">
                    <div style="width:20px;height:20px;background-color:white;border-radius:4px;"></div>
                  </td>
                  <td style="padding-left:14px;">
                    <span style="font-family:'Playfair Display', serif;font-size:22px;font-weight:700;color:{cls.COLOR_DARK};letter-spacing:-0.5px;">Condome</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding:0 48px 48px;">
              {body_html}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding:32px 48px;background-color:#FAF9F7;border-top:1px solid {cls.COLOR_BORDER};">
              <p style="margin:0;font-size:12px;color:{cls.COLOR_MUTED};line-height:1.8;font-weight:500;">
                {footer}
              </p>
              <table role="presentation" width="100%" style="margin-top:24px;">
                <tr>
                  <td style="font-size:11px;color:{cls.COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                    &copy; 2026 CONDOME PLATFORM
                  </td>
                  <td align="right">
                    <a href="#" style="font-size:11px;color:{cls.COLOR_PRIMARY};text-decoration:none;font-weight:600;">CENTRO DE AYUDA</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    # ── Componentes Atómicos (JSX Style) ──────────────────────────────

    @classmethod
    def _h1(cls, text):
        return f'<h1 style="margin:0 0 20px;font-family:\'Playfair Display\', serif;font-size:32px;font-weight:700;color:{cls.COLOR_DARK};line-height:1.2;letter-spacing:-0.8px;">{text}</h1>'

    @classmethod
    def _p(cls, text, bold=False):
        weight = "600" if bold else "400"
        return f'<p style="margin:0 0 18px;font-size:16px;color:{cls.COLOR_TEXT};line-height:1.6;font-weight:{weight};">{text}</p>'

    @classmethod
    def _button(cls, text, url):
        return f"""
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 40px;">
          <tr>
            <td>
              <a href="{url}" target="_blank"
                 style="display:inline-block;padding:16px 36px;background-color:{cls.COLOR_PRIMARY};
                        color:#FFFFFF;text-decoration:none;border-radius:14px;font-size:15px;
                        font-weight:600;letter-spacing:0.5px;box-shadow:0 8px 20px rgba(217,79,16,0.2);">
                {text}
              </a>
            </td>
          </tr>
        </table>"""

    @classmethod
    def _data_box(cls, rows):
        rows_html = ""
        for label, value in rows:
            rows_html += f"""
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid {cls.COLOR_BORDER};font-size:13px;color:{cls.COLOR_MUTED};text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">{label}</td>
              <td align="right" style="padding:12px 0;border-bottom:1px solid {cls.COLOR_BORDER};font-size:14px;color:{cls.COLOR_DARK};font-weight:600;">{value}</td>
            </tr>"""
        
        return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">{rows_html}</table>'

    @classmethod
    def _accent_box(cls, text):
        return f"""
        <div style="background-color:{cls.COLOR_BG};border-radius:16px;padding:24px;margin:24px 0;border:1px solid {cls.COLOR_BORDER};">
          <p style="margin:0;font-size:14px;color:{cls.COLOR_DARK};line-height:1.7;font-weight:500;">{text}</p>
        </div>"""

    # ══════════════════════════════════════════════════════════════════
    # Plantillas Públicas
    # ══════════════════════════════════════════════════════════════════

    @classmethod
    def email_verification(cls, resident_name, verification_url, condominio_name="Condome"):
        """Correo de verificación premium."""
        body = cls._h1("Confirma tu identidad")
        body += cls._p(f"Hola {resident_name},")
        body += cls._p("Para activar tu acceso a la plataforma de gestión de tu condominio, necesitamos verificar tu dirección de correo electrónico.")
        body += cls._button("Verificar mi cuenta", verification_url)
        body += cls._p("Si no solicitaste este acceso, puedes ignorar este mensaje de forma segura.")
        
        footer = f"Estás recibiendo esto como parte del alta en el condominio <strong>{condominio_name}</strong>."
        return cls._base_layout("Verifica tu cuenta — Condome", body, footer)

    @classmethod
    def login_confirmation(cls, resident_name, email, condominio_name, login_time, ip_address=""):
        """Aviso de seguridad por inicio de sesión."""
        body = cls._h1("Acceso detectado")
        body += cls._p(f"Se ha registrado un inicio de sesión en tu cuenta de {condominio_name}.")
        
        data = [
            ("CUENTA", email),
            ("FECHA", login_time),
        ]
        if ip_address:
            data.append(("UBICACIÓN IP", ip_address))
            
        body += cls._data_box(data)
        body += cls._accent_box("Si no has sido tú, te recomendamos bloquear tu cuenta y cambiar tu contraseña inmediatamente desde el panel de seguridad.")
        
        return cls._base_layout("Seguridad: Inicio de sesión detectado", body)

    @classmethod
    def broadcast_announcement(cls, resident_name, title, message, priority, condominio_name):
        """Comunicado oficial del condominio."""
        priority_label = "AVISO IMPORTANTE" if priority == "alta" else "AVISO COMUNITARIO"
        
        body = f'<p style="color:{cls.COLOR_PRIMARY};font-size:12px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">{priority_label}</p>'
        body += cls._h1(title)
        body += cls._p(f"Estimado residente {resident_name},")
        body += cls._accent_box(message)
        body += cls._p(f"Atentamente,<br><strong>Administración de {condominio_name}</strong>")
        
        return cls._base_layout(title, body)

    @classmethod
    def system_notice(cls, resident_name, title, message, condominio_name, severity="info"):
        """Notificación operativa con tono según severidad."""
        severity_label_map = {
            "success": "NOTIFICACION CONFIRMADA",
            "warning": "AVISO OPERATIVO",
            "danger": "ATENCION IMPORTANTE",
        }
        severity_label = severity_label_map.get(severity, "NOTIFICACION DEL SISTEMA")

        body = f'<p style="color:{cls.COLOR_PRIMARY};font-size:12px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">{severity_label}</p>'
        body += cls._h1(title)
        body += cls._p(f"Hola {resident_name},")
        body += cls._accent_box(message)
        body += cls._p(f"Administración de <strong>{condominio_name}</strong>")

        return cls._base_layout(title, body)

    @classmethod
    def payment_confirmation(cls, resident_name, amount, currency, concept, payment_date, condominio_name):
        """Comprobante de pago electrónico."""
        body = cls._h1("Pago recibido")
        body += cls._p(f"Hemos procesado correctamente tu pago para {condominio_name}.")
        
        body += cls._data_box([
            ("CONCEPTO", concept),
            ("FECHA", payment_date),
            ("IMPORTE", f"{currency} {amount:,.2f}"),
            ("ESTADO", "CONCILIADO")
        ])
        
        body += cls._p("Puedes descargar tu recibo oficial directamente desde el portal de residentes.")
        
        return cls._base_layout("Confirmación de Pago — Condome", body)

    @classmethod
    def password_changed(cls, resident_name, email, change_time):
        """Confirmación de cambio de credenciales."""
        body = cls._h1("Seguridad actualizada")
        body += cls._p("Tu contraseña ha sido modificada con éxito.")
        body += cls._data_box([
            ("CUENTA", email),
            ("FECHA", change_time)
        ])
        body += cls._p("Si no realizaste este cambio, contacta a soporte técnico de inmediato.")
        
        return cls._base_layout("Contraseña Actualizada — Condome", body)

    @classmethod
    def welcome_credentials(cls, resident_name, email, temporary_password, condominio_name, login_url=""):
        """Bienvenida con credenciales temporales."""
        body = cls._h1("Bienvenido a bordo")
        body += cls._p(f"Se ha creado tu perfil de residente para <strong>{condominio_name}</strong>.")
        body += cls._p("Utiliza los siguientes datos para tu primer acceso:")
        
        body += cls._data_box([
            ("USUARIO", email),
            ("CLAVE TEMPORAL", f'<span style="color:{cls.COLOR_PRIMARY};">{temporary_password}</span>')
        ])
        
        if login_url:
            body += cls._button("Acceder al Portal", login_url)
            
        body += cls._accent_box("Por razones de seguridad, se te pedirá definir una nueva contraseña al entrar por primera vez.")
        
        return cls._base_layout("Bienvenido a Condome", body)

    @classmethod
    def delinquency_notice(cls, resident_name, amount, currency, concept, due_date, condominio_name):
        """Aviso preventivo de morosidad."""
        body = cls._h1("Recordatorio de pago")
        body += cls._p(f"Estimado(a) {resident_name},")
        body += cls._p(f"Te recordamos que tienes una cuota próxima a vencer en <strong>{condominio_name}</strong>.")
        
        body += cls._data_box([
            ("CONCEPTO", concept),
            ("FECHA LÍMITE", due_date),
            ("MONTO", f"{currency} {amount:,.2f}")
        ])
        
        body += cls._accent_box("Evita recargos por mora realizando tu pago antes de la fecha límite. Puedes pagar en línea a través de nuestra plataforma.")
        
        return cls._base_layout(f"Recordatorio de Pago: {concept}", body)

    @classmethod
    def overdue_charge_notice(cls, resident_name, amount, currency, concept, due_date, condominio_name):
        """Aviso de cargo vencido para residentes morosos."""
        body = cls._h1("Cargo vencido")
        body += cls._p(f"Estimado(a) {resident_name},")
        body += cls._p(f"Tu cuota en <strong>{condominio_name}</strong> ya venció y sigue pendiente de pago.")

        body += cls._data_box([
            ("CONCEPTO", concept),
            ("FECHA DE VENCIMIENTO", due_date),
            ("SALDO", f"{currency} {amount:,.2f}"),
            ("ESTADO", "EN MORA"),
        ])

        body += cls._accent_box("Si no regularizas el pago, el saldo se acumulará a la próxima cuota y la administración podrá tomar medidas sobre tu permanencia en el sistema.")

        return cls._base_layout(f"Morosidad: {concept}", body)
