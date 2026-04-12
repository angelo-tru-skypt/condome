/**
 * Servicio de Heartbeat y Validación de Sesión
 * Mantiene la sesión activa y valida tokens periódicamente
 */

import authService from "./AuthService.js";

class SessionValidator {
  constructor(options = {}) {
    this.interval = options.interval || 300000; // 5 minutos por defecto
    this.heartbeatInterval = options.heartbeatInterval || 600000; // 10 minutos
    this.isValidating = false;
    this.heartbeatTimer = null;
    this.validationTimer = null;
    this.onSessionExpired = options.onSessionExpired || null;
    this.onSessionsValidated = options.onSessionValidated || null;
  }

  /**
   * Iniciar validación periódica de sesión
   */
  start() {
    if (this.validationTimer) return; // Ya está corriendo

    console.log("[SessionValidator] Iniciando validación periódica de sesión");

    // Validar inmediatamente
    this._validateSession();

    // Configurar validación periódica
    this.validationTimer = setInterval(() => {
      this._validateSession();
    }, this.interval);

    // Configurar heartbeat
    this.heartbeatTimer = setInterval(() => {
      this._sendHeartbeat();
    }, this.heartbeatInterval);
  }

  /**
   * Detener validación periódica
   */
  stop() {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    console.log("[SessionValidator] Validación detrenida");
  }

  /**
   * Validar sesión actual
   */
  async _validateSession() {
    if (this.isValidating) return;

    this.isValidating = true;

    try {
      // Usar getSessionInfo para validar que la sesión aún es válida
      const user = await authService.getSessionInfo();

      if (!user) {
        console.warn("[SessionValidator] Sesión expirada detectada");
        this.stop();

        if (this.onSessionExpired) {
          this.onSessionExpired();
        }

        authService.clearSession();
        return;
      }

      if (this.onSessionsValidated) {
        this.onSessionsValidated(true);
      }
    } catch (error) {
      console.warn("[SessionValidator] Error validando sesión", error);

      // Si no se puede validar, asumir que expiró
      this.stop();
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
      authService.clearSession();
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Enviar heartbeat al servidor
   */
  async _sendHeartbeat() {
    try {
      const result = await authService.getSessionInfo();
      if (result) {
        console.log("[SessionValidator] Heartbeat enviado exitosamente");
      }
    } catch (error) {
      // No es crítico si falla el heartbeat
      console.debug("[SessionValidator] Heartbeat fallido (no crítico)", error?.message);
    }
  }

  /**
   * Refrescar validación inmediatamente
   */
  async refreshNow() {
    await this._validateSession();
  }
}

// Instancia global del validador de sesión
const sessionValidator = new SessionValidator({
  interval: 300000, // Validar cada 5 minutos
  heartbeatInterval: 600000, // Heartbeat cada 10 minutos
  onSessionExpired: () => {
    console.warn("[SessionValidator] Sesión expirada - redirigiendo a login");
    localStorage.removeItem("authData");
    window.location.href = "/login?session-expired=true";
  },
});

export { SessionValidator, sessionValidator as default };
