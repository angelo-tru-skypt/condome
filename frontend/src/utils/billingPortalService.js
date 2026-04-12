/**
 * Servicio Portal de Facturación
 * Refactorizado para usar ApiClient centralizado
 */

import apiClient from "./ApiClient.js";
import { BILLING_ENDPOINTS } from "./API_ENDPOINTS.js";

const billingPortalService = {
  // ── Pagos Propietario ──────────────────────────────────────────────────────

  async listPropertyOwnerPayments() {
    try {
      const response = await apiClient.get(BILLING_ENDPOINTS.ownerPagos);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar pagos");
    }
  },

  async registerPropertyOwnerPayment(payload) {
    try {
      const response = await apiClient.post(BILLING_ENDPOINTS.createOwnerPago, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al registrar pago");
    }
  },

  async listPropertyOwnerPaymentHistory() {
    try {
      const response = await apiClient.get(BILLING_ENDPOINTS.ownerHistorialPagos);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar historial de pagos");
    }
  },

  // ── Pagos Residente ────────────────────────────────────────────────────────

  async listResidentPayments() {
    try {
      const response = await apiClient.get(BILLING_ENDPOINTS.residentPagos);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar pagos");
    }
  },

  async registerResidentPayment(payload) {
    try {
      const response = await apiClient.post(BILLING_ENDPOINTS.createResidentPago, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al registrar pago");
    }
  },

  async listResidentPaymentHistory() {
    try {
      const response = await apiClient.get(BILLING_ENDPOINTS.residentHistorialPagos);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar historial de pagos");
    }
  },
};

export default billingPortalService;
