/**
 * Servicio de Condominio
 * Refactorizado para usar ApiClient centralizado
 */

import apiClient from "./ApiClient.js";
import { ADMIN_ENDPOINTS, CONDOMINIO_ENDPOINTS, buildUrl } from "./API_ENDPOINTS.js";
import { DEFAULT_DB } from "../config/api.js";

const condominioService = {
  // ── Condominios ────────────────────────────────────────────────────────────

  /**
   * Crear condominio
   */
  async crear(formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.post(CONDOMINIO_ENDPOINTS.create, {
        ...formData,
        db,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear condominio");
    }
  },

  /**
   * Listar condominios
   */
  async listar(db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.list, { db });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar condominios");
    }
  },

  /**
   * Obtener condominio por ID
   */
  async obtener(id, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.get(id), { db });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener condominio");
    }
  },

  /**
   * Actualizar condominio
   */
  async actualizar(id, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.put(CONDOMINIO_ENDPOINTS.update(id), {
        ...formData,
        db,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar condominio");
    }
  },

  /**
   * Eliminar condominio
   */
  async eliminar(id, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.delete(id), { db });
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar condominio");
    }
  },

  // ── Edificios ──────────────────────────────────────────────────────────────

  /**
   * Listar edificios de un condominio
   */
  async listarEdificios(condominioId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.listEdificios(condominioId), { db });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar edificios");
    }
  },

  /**
   * Crear edificio
   */
  async crearEdificio(condominioId, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.post(CONDOMINIO_ENDPOINTS.createEdificio(condominioId), {
        ...formData,
        db,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear edificio");
    }
  },

  /**
   * Obtener edificio
   */
  async obtenerEdificio(condominioId, edificioId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.getEdificio(condominioId, edificioId), { db });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener edificio");
    }
  },

  /**
   * Actualizar edificio
   */
  async actualizarEdificio(condominioId, edificioId, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.put(
        CONDOMINIO_ENDPOINTS.updateEdificio(condominioId, edificioId),
        {
          ...formData,
          db,
        }
      );
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar edificio");
    }
  },

  /**
   * Eliminar edificio
   */
  async eliminarEdificio(condominioId, edificioId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.deleteEdificio(condominioId, edificioId), {
        db,
      });
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar edificio");
    }
  },

  // ── Apartamentos ───────────────────────────────────────────────────────────

  /**
   * Listar apartamentos
   */
  async listarApartamentos(condominioId, edificioId = null, db = DEFAULT_DB) {
    try {
      const params = { db };
      if (edificioId) {
        params.edificio_id = edificioId;
      }
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.listApartamentos(condominioId), params);
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar apartamentos");
    }
  },

  /**
   * Crear apartamento
   */
  async crearApartamento(condominioId, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.post(
        CONDOMINIO_ENDPOINTS.createApartamento(condominioId),
        {
          ...formData,
          db,
        }
      );
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear apartamento");
    }
  },

  /**
   * Obtener apartamento
   */
  async obtenerApartamento(condominioId, apartamentoId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.getApartamento(condominioId, apartamentoId), {
        db,
      });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener apartamento");
    }
  },

  /**
   * Actualizar apartamento
   */
  async actualizarApartamento(condominioId, apartamentoId, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.put(
        CONDOMINIO_ENDPOINTS.updateApartamento(condominioId, apartamentoId),
        {
          ...formData,
          db,
        }
      );
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar apartamento");
    }
  },

  /**
   * Eliminar apartamento
   */
  async eliminarApartamento(condominioId, apartamentoId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.deleteApartamento(condominioId, apartamentoId), { db });
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar apartamento");
    }
  },

  // ── Residentes ─────────────────────────────────────────────────────────────

  /**
   * Listar residentes
   */
  async listarResidentes(condominioId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.listResidentes(condominioId), { db });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al listar residentes");
    }
  },

  /**
   * Crear residente
   */
  async crearResidente(apartamentoId, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.post(CONDOMINIO_ENDPOINTS.createResidente(apartamentoId), {
        ...formData,
        db,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear residente");
    }
  },

  /**
   * Obtener residente
   */
  async obtenerResidente(residenteId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.getResidente(residenteId), { db });
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al obtener residente");
    }
  },

  /**
   * Actualizar residente
   */
  async actualizarResidente(residenteId, formData, db = DEFAULT_DB) {
    try {
      const response = await apiClient.put(CONDOMINIO_ENDPOINTS.updateResidente(residenteId), {
        ...formData,
        db,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al actualizar residente");
    }
  },

  /**
   * Eliminar residente
   */
  async eliminarResidente(residenteId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.deleteResidente(residenteId), { db });
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al eliminar residente");
    }
  },

  /**
   * Reenviar credenciales residente
   */
  async reenviarCredencialesResidente(residenteId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(CONDOMINIO_ENDPOINTS.resendResidenteCredentials(residenteId), { db });
      const response = await apiClient.post(endpoint, { db });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al reenviar credenciales");
    }
  },

  /**
   * Reenviar credenciales propietario
   */
  async reenviarCredencialesPropietario(propietarioId, db = DEFAULT_DB) {
    try {
      const endpoint = buildUrl(ADMIN_ENDPOINTS.resendPropietarioCredentials(propietarioId), { db });
      const response = await apiClient.post(endpoint, { db });
      return response;
    } catch (error) {
      throw new Error(error.message || "Error al reenviar credenciales");
    }
  },
};

export default condominioService;
