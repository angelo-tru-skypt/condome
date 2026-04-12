/**
 * Servicio Admin (renombrado desde ownerAdminService)
 * Refactorizado para usar ApiClient centralizado
 */

import apiClient from "./ApiClient.js";
import { ADMIN_ENDPOINTS, buildUrl } from "./API_ENDPOINTS.js";

const adminService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboardSummary(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.getDashboard, {
        condominio_id: condominioId,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener resumen del dashboard");
    }
  },

  // ── Roles ──────────────────────────────────────────────────────────────────

  async listRoles(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.roles, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar roles");
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

  async createOwner(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.propietarios, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear propietario");
    }
  },

  async updateOwner(ownerId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getPropietario(ownerId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar propietario");
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

  async createDocument(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.documentos, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear documento");
    }
  },

  async updateDocument(documentId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getDocumento(documentId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar documento");
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

  async updateSettings(payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.configuracion, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar configuración");
    }
  },

  // ── Notificaciones Reglas ──────────────────────────────────────────────────

  async listNotificationRules(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.notificacionesReglas, {
        condominio_id: condominioId,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar reglas de notificaciones");
    }
  },

  async createNotificationRule(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.notificacionesReglas, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear regla de notificación");
    }
  },

  async updateNotificationRule(ruleId, payload) {
    try {
      const endpoint = `${ADMIN_ENDPOINTS.notificacionesReglas}${ruleId}/`;
      const response = await apiClient.put(endpoint, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar regla de notificación");
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

  async createAccessPolicy(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.accesoPolíticas, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear política de acceso");
    }
  },

  async updateAccessPolicy(policyId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getAccesoPolítica(policyId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar política de acceso");
    }
  },

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

  async createCommunication(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.comunicados, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear comunicado");
    }
  },

  async updateCommunication(communicationId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getComunicado(communicationId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar comunicado");
    }
  },

  // ── Cuotas (facturación) ───────────────────────────────────────────────────

  async getBillingSummary(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.cuotasResumen, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener resumen de cuotas");
    }
  },

  async listFeeTemplates(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.cuotasPlantillas, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar plantillas de cuotas");
    }
  },

  async createFeeTemplate(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.cuotasPlantillas, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear plantilla de cuota");
    }
  },

  async updateFeeTemplate(templateId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getCuotaPlantilla(templateId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar plantilla de cuota");
    }
  },

  async listCharges(condominioId, extra = {}) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.cuotasCargos, {
        condominio_id: condominioId,
        ...extra,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar cargos");
    }
  },

  async createCharge(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.cuotasCargos, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear cargo");
    }
  },

  async updateCharge(chargeId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getCuotaCargo(chargeId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar cargo");
    }
  },

  // ── Pagos ──────────────────────────────────────────────────────────────────

  async listPayments(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.pagos, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar pagos");
    }
  },

  async listPaymentHistory(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.historialpagos, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar historial de pagos");
    }
  },

  // ── Morosidad ──────────────────────────────────────────────────────────────

  async getDelinquency(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.morosidad, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener morosidad");
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

  async createCommonArea(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.areasComunes, payload);
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

  async createReservation(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.reservas, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear reserva");
    }
  },

  async updateReservation(reservationId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getReserva(reservationId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar reserva");
    }
  },

  // ── Visitas ────────────────────────────────────────────────────────────────

  async listVisits(extra = {}) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.visitas, extra);
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar visitas");
    }
  },

  async decideVisit(visitId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.decideVisita(visitId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar la visita");
    }
  },

  // ── Incidencias ────────────────────────────────────────────────────────────

  async listIncidents(extra = {}) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.incidencias, extra);
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar incidencias");
    }
  },

  async updateIncident(incidentId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getIncidencia(incidentId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar incidencia");
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

  // ── Reportes ───────────────────────────────────────────────────────────────

  async getReportsSummary(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.reportes, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener reportes");
    }
  },

  async listReportExports(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.reportesExportaciones, {
        condominio_id: condominioId,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar exportaciones");
    }
  },

  async createReportExport(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.reportesExportaciones, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear exportación");
    }
  },

  // ── Notificaciones ─────────────────────────────────────────────────────────

  async listNotifications(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.notificaciones, { condominio_id: condominioId });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar notificaciones");
    }
  },

  async createNotification(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.notificaciones, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear notificación");
    }
  },

  async updateNotification(notificationId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getNotificacion(notificationId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar notificación");
    }
  },

  // ── Vehículos ──────────────────────────────────────────────────────────────

  async listVehicles(condominioId, extra = {}) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.vehiculos, {
        condominio_id: condominioId,
        ...extra,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar vehículos");
    }
  },

  async createVehicle(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.vehiculos, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear vehículo");
    }
  },

  async updateVehicle(vehicleId, payload) {
    try {
      const response = await apiClient.put(ADMIN_ENDPOINTS.getVehiculo(vehicleId), payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar vehículo");
    }
  },

  // ── Pasarelas de Pago ──────────────────────────────────────────────────────

  async getPaymentMethods(condominioId) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.paymentMethods, {
        condominio_id: condominioId,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener métodos de pago");
    }
  },

  async initiatePayment(payload) {
    try {
      const response = await apiClient.post(ADMIN_ENDPOINTS.initiatePayment, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al iniciar el pago");
    }
  },
};

export default adminService;
