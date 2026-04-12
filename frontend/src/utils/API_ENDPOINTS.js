/**
 * Constantes de Endpoints de API
 * Centraliza todas las rutas para fácil mantenimiento y versionado
 */

// Versión de API
const API_VERSION = "v1";

// Prefijos de servicios
const AUTH_PREFIX = `/condome_auth`;
const API_PREFIX = `/condome_api`;

/**
 * Endpoints de Autenticación
 */
export const AUTH_ENDPOINTS = {
  authenticate: `${AUTH_PREFIX}/authenticate`,
  logout: `${AUTH_PREFIX}/logout`,
  sessionInfo: `${AUTH_PREFIX}/session_info`,
  profile: `${AUTH_PREFIX}/profile`,
  updateProfile: `${AUTH_PREFIX}/profile`,
  changePassword: `${AUTH_PREFIX}/change_password`,
  register: `${AUTH_PREFIX}/register`,
  refresh: `${AUTH_PREFIX}/refresh`,
  validateToken: `${AUTH_PREFIX}/validate_token`,
};

/**
 * Endpoints de Condominio (Admin)
 */
export const CONDOMINIO_ENDPOINTS = {
  list: `${API_PREFIX}/condominios/`,
  create: `${API_PREFIX}/condominios/`,
  get: (id) => `${API_PREFIX}/condominios/${id}`,
  update: (id) => `${API_PREFIX}/condominios/${id}`,
  delete: (id) => `${API_PREFIX}/condominios/${id}`,

  // Edificios
  listEdificios: (condominioId) => `${API_PREFIX}/condominios/${condominioId}/edificios/`,
  createEdificio: (condominioId) => `${API_PREFIX}/condominios/${condominioId}/edificios/`,
  getEdificio: (condominioId, edificioId) => `${API_PREFIX}/condominios/${condominioId}/edificios/${edificioId}`,
  updateEdificio: (condominioId, edificioId) =>
    `${API_PREFIX}/condominios/${condominioId}/edificios/${edificioId}`,
  deleteEdificio: (condominioId, edificioId) =>
    `${API_PREFIX}/condominios/${condominioId}/edificios/${edificioId}`,

  // Apartamentos
  listApartamentos: (condominioId) => `${API_PREFIX}/condominios/${condominioId}/apartamentos/`,
  createApartamento: (condominioId) => `${API_PREFIX}/condominios/${condominioId}/apartamentos/`,
  getApartamento: (condominioId, apartamentoId) =>
    `${API_PREFIX}/condominios/${condominioId}/apartamentos/${apartamentoId}`,
  updateApartamento: (condominioId, apartamentoId) =>
    `${API_PREFIX}/condominios/${condominioId}/apartamentos/${apartamentoId}`,
  deleteApartamento: (condominioId, apartamentoId) =>
    `${API_PREFIX}/condominios/${condominioId}/apartamentos/${apartamentoId}`,

  // Residentes
  listResidentes: (condominioId) => `${API_PREFIX}/condominios/${condominioId}/residentes/`,
  createResidente: (apartamentoId) => `${API_PREFIX}/apartamentos/${apartamentoId}/residentes/`,
  getResidente: (residenteId) => `${API_PREFIX}/residentes/${residenteId}`,
  updateResidente: (residenteId) => `${API_PREFIX}/residentes/${residenteId}`,
  deleteResidente: (residenteId) => `${API_PREFIX}/residentes/${residenteId}`,
};

/**
 * Endpoints de Admin/Owner
 */
export const ADMIN_ENDPOINTS = {
  // Dashboard
  getDashboard: `${API_PREFIX}/owner/summary/`,
  // Roles
  roles: `${API_PREFIX}/owner/roles/`,

  // Propietarios
  propietarios: `${API_PREFIX}/owner/propietarios/`,
  getPropietario: (id) => `${API_PREFIX}/owner/propietarios/${id}`,

  // Documentos
  documentos: `${API_PREFIX}/owner/documentos/`,
  getDocumento: (id) => `${API_PREFIX}/owner/documentos/${id}`,

  // Configuración
  configuracion: `${API_PREFIX}/owner/configuracion/`,

  // Notificaciones
  notificaciones: `${API_PREFIX}/owner/notificaciones/`,
  getNotificacion: (id) => `${API_PREFIX}/owner/notificaciones/${id}`,
  notificacionesReglas: `${API_PREFIX}/owner/notificaciones/reglas/`,
  markNotificationRead: (id) => `${API_PREFIX}/owner/notificaciones/${id}/read`,

  // Control de Acceso
  accesoPolíticas: `${API_PREFIX}/owner/acceso/politicas/`,
  getAccesoPolítica: (id) => `${API_PREFIX}/owner/acceso/politicas/${id}`,

  // Comunicados
  comunicados: `${API_PREFIX}/owner/comunicados/`,
  getComunicado: (id) => `${API_PREFIX}/owner/comunicados/${id}`,

  // Áreas Comunes
  areasComunes: `${API_PREFIX}/owner/areas-comunes/`,
  getAreaComun: (id) => `${API_PREFIX}/owner/areas-comunes/${id}`,

  // Reservas
  reservas: `${API_PREFIX}/owner/reservas/`,
  getReserva: (id) => `${API_PREFIX}/owner/reservas/${id}`,

  // Cuotas (facturación)
  cuotasResumen: `${API_PREFIX}/owner/cuotas/resumen/`,
  cuotasPlantillas: `${API_PREFIX}/owner/cuotas/plantillas/`,
  getCuotaPlantilla: (id) => `${API_PREFIX}/owner/cuotas/plantillas/${id}`,
  cuotasCargos: `${API_PREFIX}/owner/cuotas/cargos/`,
  getCuotaCargo: (id) => `${API_PREFIX}/owner/cuotas/cargos/${id}`,

  // Pagos
  pagos: `${API_PREFIX}/owner/pagos/`,
  historialpagos: `${API_PREFIX}/owner/historial-pagos/`,
  morosidad: `${API_PREFIX}/owner/morosidad/`,

  // Auditoría
  auditoria: `${API_PREFIX}/owner/auditoria/`,

  // Reportes
  reportes: `${API_PREFIX}/owner/reportes/`,
  reportesExportaciones: `${API_PREFIX}/owner/reportes/exportaciones/`,

  // Vehículos
  vehiculos: `${API_PREFIX}/owner/vehiculos/`,
  getVehiculo: (id) => `${API_PREFIX}/owner/vehiculos/${id}`,

  // Visitas (owner workflow)
  visitas: `${API_PREFIX}/owner/visitas/`,
  getVisita: (id) => `${API_PREFIX}/owner/visitas/${id}`,
  decideVisita: (id) => `${API_PREFIX}/owner/visitas/${id}/decision`,

  // Pagos y Pasarelas
  paymentMethods: `${API_PREFIX}/payments/methods`,
  initiatePayment: `${API_PREFIX}/payments/initiate`,

  // Incidencias (owner workflow)
  incidencias: `${API_PREFIX}/owner/incidencias/`,
  getIncidencia: (id) => `${API_PREFIX}/owner/incidencias/${id}`,
};

/**
 * Endpoints del Portal de Residentes
 */
export const RESIDENT_ENDPOINTS = {
  // Contexto
  context: `${API_PREFIX}/resident/context/`,

  // Visitas
  residentsVisits: `${API_PREFIX}/resident/visitas/`,
  createVisit: `${API_PREFIX}/resident/visitas/`,
  ownerVisits: `${API_PREFIX}/owner/visitas/`,
  getOwnerVisit: (id) => `${API_PREFIX}/owner/visitas/${id}`,
  decideVisit: (id) => `${API_PREFIX}/owner/visitas/${id}/decision`,

  // Incidencias
  incidencias: `${API_PREFIX}/resident/incidencias/`,
  createIncident: `${API_PREFIX}/resident/incidencias/`,
  ownerIncidencias: `${API_PREFIX}/owner/incidencias/`,
  getIncidencia: (id) => `${API_PREFIX}/resident/incidencias/${id}`,
  updateIncidencia: (id) => `${API_PREFIX}/owner/incidencias/${id}`,

  // Notificaciones
  notifications: `${API_PREFIX}/owner/notificaciones/`,
  getNotification: (id) => `${API_PREFIX}/owner/notificaciones/${id}`,
  markNotificationRead: (id) => `${API_PREFIX}/owner/notificaciones/${id}/read`,
};

/**
 * Endpoints del Portal de Facturación
 */
export const BILLING_ENDPOINTS = {
  // Propietario
  ownerPagos: `${API_PREFIX}/propietario/pagos/`,
  createOwnerPago: `${API_PREFIX}/propietario/pagos/`,
  ownerHistorialPagos: `${API_PREFIX}/propietario/historial-pagos/`,

  // Residente
  residentPagos: `${API_PREFIX}/resident/pagos/`,
  createResidentPago: `${API_PREFIX}/resident/pagos/`,
  residentHistorialPagos: `${API_PREFIX}/resident/historial-pagos/`,
};

/**
 * Utilidad para construir URLs con parámetros de query
 */
export function buildUrl(endpoint, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

export default {
  AUTH_ENDPOINTS,
  CONDOMINIO_ENDPOINTS,
  ADMIN_ENDPOINTS,
  RESIDENT_ENDPOINTS,
  BILLING_ENDPOINTS,
  buildUrl,
};
