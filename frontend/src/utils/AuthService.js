/**
 * Servicio de Autenticación
 * Refactorizado para usar ApiClient centralizado
 */

import apiClient from "./ApiClient.js";
import { AUTH_ENDPOINTS } from "./API_ENDPOINTS.js";
import { DEFAULT_DB } from "../config/api.js";

const authService = {
  /**
   * Iniciar sesión
   */
  async login({ email, password }) {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.authenticate, {
        db: DEFAULT_DB,
        login: email,
        password,
      });

      // Guardar token
      if (response?.token) {
        localStorage.setItem(
          "authData",
          JSON.stringify({
            token: response.token,
            user: response.user,
            timestamp: Date.now(),
          })
        );
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "No se pudo iniciar sesión");
    }
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      await apiClient.post(AUTH_ENDPOINTS.logout);
      localStorage.removeItem("authData");
      return { success: true };
    } catch (error) {
      // Limpiar localmente incluso si falla
      localStorage.removeItem("authData");
      throw new Error(error.message || "Error al cerrar la sesión");
    }
  },

  /**
   * Obtener información de sesión
   */
  async getSessionInfo() {
    try {
      const data = await apiClient.get(AUTH_ENDPOINTS.sessionInfo);
      return data?.user || null;
    } catch (error) {
      throw new Error(error.message || "No se pudo obtener la sesión");
    }
  },

  /**
   * Obtener perfil del usuario
   */
  async getProfile() {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.profile);
      return response;
    } catch (error) {
      throw new Error(error.message || "No se pudo obtener el perfil");
    }
  },

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(payload) {
    try {
      const response = await apiClient.put(AUTH_ENDPOINTS.updateProfile, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "No se pudo actualizar el perfil");
    }
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(payload) {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.changePassword, payload);
      return response;
    } catch (error) {
      throw new Error(error.message || "No se pudo cambiar la contraseña");
    }
  },

  /**
   * Registrar nuevo usuario
   */
  async register(payload) {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.register, {
        ...payload,
        db: DEFAULT_DB,
      });

      // Guardar token si se devuelve
      if (response?.token) {
        localStorage.setItem(
          "authData",
          JSON.stringify({
            token: response.token,
            user: response.user,
            timestamp: Date.now(),
          })
        );
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Error al crear la cuenta");
    }
  },

  /**
   * Validar token
   * Nota: Este método es un fallback. Si el endpoint no existe o falla,
   * asumimos que la sesión es válida (getSessionInfo la validará si realmente expiró).
   */
  async validateToken() {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.validateToken);
      return response?.valid === true;
    } catch (error) {
      // Si el endpoint no existe o hay error de red, asumir que es válido
      // La sesión realmente expirada será detectada por getSessionInfo
      console.debug("[AuthService] validateToken fallback (asumiendo válido)", error?.message);
      return true;
    }
  },

  /**
   * Obtener token almacenado
   */
  getStoredToken() {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token || null;
      }
    } catch (e) {
      console.error("Error al obtener token almacenado", e);
    }
    return null;
  },

  /**
   * Limpiar sesión localmente
   */
  clearSession() {
    localStorage.removeItem("authData");
  },
};

export default authService;
