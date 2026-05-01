/**
 * Servicio de Correo Electrónico
 * Permite enviar emails masivos y notificaciones individuales a residentes
 * a través del servidor SMTP del sistema.
 */

import apiClient from "./ApiClient.js";
import { MAIL_ENDPOINTS, buildUrl } from "./API_ENDPOINTS.js";

const mailService = {
  /**
   * Envía un aviso del sistema a todos los residentes del condominio.
   * @param {object} payload - { condominio_id, title, message, severity }
   * severity: "info" | "success" | "warning" | "danger"
   */
  async sendSystemNotice({ condominio_id, title, message, severity = "info" }) {
    try {
      const response = await apiClient.post(MAIL_ENDPOINTS.systemNotice, {
        condominio_id,
        title,
        message,
        severity,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al enviar aviso del sistema");
    }
  },

  /**
   * Envía un comunicado masivo a todos los residentes del condominio.
   * @param {object} payload - { condominio_id, title, message, priority }
   * priority: "alta" | "media" | "baja"
   */
  async sendBroadcast({ condominio_id, title, message, priority = "media" }) {
    try {
      const response = await apiClient.post(MAIL_ENDPOINTS.broadcast, {
        condominio_id,
        title,
        message,
        priority,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al enviar comunicado");
    }
  },

  /**
   * Envía recordatorio de pago a todos los residentes del condominio.
   * @param {object} payload - { condominio_id, amount, currency, concept, due_date }
   */
  async sendPaymentReminder({ condominio_id, charge_id, amount, currency = "DOP", concept, due_date }) {
    try {
      const response = await apiClient.post(MAIL_ENDPOINTS.paymentReminder, {
        condominio_id,
        charge_id,
        amount,
        currency,
        concept,
        due_date,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al enviar recordatorio de pago");
    }
  },

  /**
   * Envía una notificación a un residente específico.
   * @param {object} payload - { condominio_id, residente_id, subject, title, message, severity }
   */
  async notifyResident({ condominio_id, residente_id, subject, title, message, severity = "info" }) {
    try {
      const response = await apiClient.post(MAIL_ENDPOINTS.notifyResident, {
        condominio_id,
        residente_id,
        subject,
        title,
        message,
        severity,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al enviar notificación al residente");
    }
  },

  /**
   * Envía un correo de prueba para verificar la configuración SMTP.
   * @param {string} email - Correo de destino (opcional, usa el del usuario por defecto)
   */
  async testSmtp(email = "") {
    try {
      const response = await apiClient.post(MAIL_ENDPOINTS.testSmtp, { email });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al enviar correo de prueba SMTP");
    }
  },
};

export default mailService;
