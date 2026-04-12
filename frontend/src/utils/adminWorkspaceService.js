/**
 * Servicio Admin Workspace
 * Refactorizado para usar ApiClient centralizado
 * IMPORTANTE: Este servicio ahora conecta directamente con la API
 * (Antes solo usaba localStorage)
 */

import apiClient from "./ApiClient.js";
import { ADMIN_ENDPOINTS, buildUrl } from "./API_ENDPOINTS.js";

const adminWorkspaceService = {
  // ── Comunicados ────────────────────────────────────────────────────────────

  async listCommunications(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.comunicados, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar comunicados");
    }
  },

  async createCommunication(condominioId, payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.comunicados, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear comunicado");
    }
  },

  async updateCommunicationStatus(condominioId, communicationId, status) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getComunicado(communicationId), {
        status,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar comunicado");
    }
  },

  async deleteCommunication(condominioId, communicationId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.comunicados}${communicationId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar comunicado");
    }
  },

  // ── Áreas Comunes ──────────────────────────────────────────────────────────

  async listCommonAreas(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.areasComunes, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar áreas comunes");
    }
  },

  async createCommonArea(condominioId, payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.areasComunes, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear área común");
    }
  },

  async updateCommonArea(areaId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getAreaComun(areaId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar área común");
    }
  },

  async deleteCommonArea(areaId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.areasComunes}${areaId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar área común");
    }
  },

  // ── Reservas ───────────────────────────────────────────────────────────────

  async listReservations(condominioId, extra = {}) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.reservas, {
        condominio_id: condominioId,
        ...extra,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar reservas");
    }
  },

  async createReservation(condominioId, payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.reservas, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear reserva");
    }
  },

  async updateReservationStatus(reservationId, status) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getReserva(reservationId), {
        status,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar reserva");
    }
  },

  async deleteReservation(reservationId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.reservas}${reservationId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar reserva");
    }
  },

  // ── Políticas de Acceso ────────────────────────────────────────────────────

  async listAccessPolicies(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.accesoPolíticas, {
        condominio_id: condominioId,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar políticas de acceso");
    }
  },

  async saveAccessPolicy(condominioId, payload) {
    try {
      // Si tiene ID, es una actualización
      if (payload.id) {
        const response = await apiClient.put(ADMIN_ENDPOINTS.getAccesoPolítica(payload.id), {
          ...payload,
          condominio_id: condominioId,
        });
        return response;
      }

      // Si no tiene ID, es una creación
      const response = await apiClient.post(ADMIN_ENDPOINTS.accesoPolíticas, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al guardar política de acceso");
    }
  },

  async deleteAccessPolicy(policyId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.accesoPolíticas}${policyId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar política de acceso");
    }
  },

  // ── Propietarios ───────────────────────────────────────────────────────────

  async listOwners(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.propietarios, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar propietarios");
    }
  },

  async saveOwner(condominioId, payload) {
    try {
      // Si tiene ID, es una actualización
      if (payload.id) {
        const response = await apiClient.put(ADMIN_ENDPOINTS.getPropietario(payload.id), {
          ...payload,
          condominio_id: condominioId,
        });
        return response;
      }

      // Si no tiene ID, es una creación
      const response = await apiClient.post(ADMIN_ENDPOINTS.propietarios, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al guardar propietario");
    }
  },

  async updateOwnerStatus(ownerId, status) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getPropietario(ownerId), {
        status,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar propietario");
    }
  },

  async deleteOwner(ownerId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.propietarios}${ownerId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar propietario");
    }
  },

  // ── Documentos ─────────────────────────────────────────────────────────────

  async listDocuments(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.documentos, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar documentos");
    }
  },

  async saveDocument(condominioId, payload) {
    try {
      // Si tiene ID, es una actualización
      if (payload.id) {
        const response = await apiClient.put(ADMIN_ENDPOINTS.getDocumento(payload.id), {
          ...payload,
          condominio_id: condominioId,
        });
        return response;
      }

      // Si no tiene ID, es una creación
      const response = await apiClient.post(ADMIN_ENDPOINTS.documentos, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al guardar documento");
    }
  },

  async updateDocumentStatus(documentId, status) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getDocumento(documentId), {
        status,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar documento");
    }
  },

  async deleteDocument(documentId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.documentos}${documentId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar documento");
    }
  },

  // ── Reglas de Notificación ─────────────────────────────────────────────────

  async listNotificationRules(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.notificacionesReglas, {
        condominio_id: condominioId,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar reglas de notificación");
    }
  },

  async saveNotificationRule(condominioId, payload) {
    try {
      // Si tiene ID, es una actualización
      if (payload.id) {
        const endpoint = `${ADMIN_ENDPOINTS.notificacionesReglas}${payload.id}/`;
        const response = await apiClient.put(endpoint, {
          ...payload,
          condominio_id: condominioId,
        });
        return response;
      }

      // Si no tiene ID, es una creación
      const response = await apiClient.post(ADMIN_ENDPOINTS.notificacionesReglas, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al guardar regla de notificación");
    }
  },

  async updateNotificationRule(ruleId, changes) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.notificacionesReglas}${ruleId}/`;
      const response = await apiClient.put(endpoint, changes);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar regla de notificación");
    }
  },

  async deleteNotificationRule(ruleId) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.notificacionesReglas}${ruleId}/`;
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar regla de notificación");
    }
  },

  // ── Configuración ──────────────────────────────────────────────────────────

  async getSettings(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.configuracion, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener configuración");
    }
  },

  async saveSettings(condominioId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.configuracion, {
        ...payload,
        condominio_id: condominioId,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al guardar configuración");
    }
  },

  // ── Auditoría ──────────────────────────────────────────────────────────────

  async listAuditEntries(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.auditoria, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar auditoría");
    }
  },
};

export default adminWorkspaceService;
