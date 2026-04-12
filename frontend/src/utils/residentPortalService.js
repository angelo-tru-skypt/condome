/**
 * Servicio Portal de Residentes
 * Refactorizado para usar ApiClient centralizado
 */

import apiClient from "./ApiClient.js";
import { RESIDENT_ENDPOINTS } from "./API_ENDPOINTS.js";

const residentPortalService = {
  // ── Contexto ───────────────────────────────────────────────────────────────

  async getResidentContext() {
    try {
      const response = await apiClient.get(RESIDENT_ENDPOINTS.context);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener contexto de residente");
    }
  },

  // ── Visitas Residentes ─────────────────────────────────────────────────────

  async listResidentVisits() {
    try {
      const response = await apiClient.get(RESIDENT_ENDPOINTS.residentsVisits);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar visitas");
    }
  },

  async createResidentVisit(payload) {
    try {
      const response = await apiClient.post(RESIDENT_ENDPOINTS.createVisit, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear visita");
    }
  },

  // ── Visitas Propietarios ───────────────────────────────────────────────────

  async listOwnerVisits() {
    try {
      const response = await apiClient.get(RESIDENT_ENDPOINTS.ownerVisits);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar visitas del propietario");
    }
  },

  async decideVisit(visitId, payload) {
    try {
      const response = await apiClient.put(RESIDENT_ENDPOINTS.decideVisit(visitId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al decidir sobre la visita");
    }
  },

  // ── Incidencias Residentes ─────────────────────────────────────────────────

  async listResidentIncidents() {
    try {
      const response = await apiClient.get(RESIDENT_ENDPOINTS.incidencias);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar incidencias");
    }
  },

  async createResidentIncident(payload) {
    try {
      const response = await apiClient.post(RESIDENT_ENDPOINTS.createIncident, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear incidencia");
    }
  },

  // ── Incidencias Propietarios ───────────────────────────────────────────────

  async listOwnerIncidents() {
    try {
      const response = await apiClient.get(RESIDENT_ENDPOINTS.ownerIncidencias);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar incidencias del propietario");
    }
  },

  async updateIncident(incidentId, payload) {
    try {
      const response = await apiClient.put(RESIDENT_ENDPOINTS.updateIncidencia(incidentId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar incidencia");
    }
  },

  // ── Notificaciones ─────────────────────────────────────────────────────────

  async listOwnerNotifications() {
    try {
      const response = await apiClient.get(RESIDENT_ENDPOINTS.notifications);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar notificaciones");
    }
  },

  async markNotificationRead(notificationId) {
    try {
      const response = await apiClient.put(RESIDENT_ENDPOINTS.markNotificationRead(notificationId), {});
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al marcar notificación como leída");
    }
  },
};

export default residentPortalService;
