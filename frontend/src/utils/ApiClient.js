/**
 * ApiClient Centralizado
 * Maneja:
 * - Timeouts y retry logic
 * - Token refresh automático
 * - Logging centralizado
 * - Manejo coherente de errores
 * - Validación de respuestas
 */

import { apiLogger } from "./Logger.js";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const DEFAULT_TIMEOUT = 30000; // 30 segundos
const DEFAULT_RETRIES = 3;

class ApiError extends Error {
  constructor({ status, message, data, endpoint }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.endpoint = endpoint;
  }
}

class TokenExpiredError extends ApiError {
  constructor(message = "Token expirado") {
    super({ status: 401, message, data: null, endpoint: null });
    this.name = "TokenExpiredError";
  }
}

class ApiClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || API_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries || DEFAULT_RETRIES;
    this.interceptors = {
      request: options.requestInterceptor || null,
      response: options.responseInterceptor || null,
      error: options.errorInterceptor || null,
    };
    this.log = options.log !== false; // Log habilitado por defecto
    this.onTokenExpired = options.onTokenExpired || null;
    this.requestQueue = [];
    this.isRefreshingToken = false;
  }

  /**
   * Centralizado logging
   */
  _log(level, message, data = {}) {
    if (!this.log) return;

    // Usar el logger centralizado
    if (level === "error") {
      apiLogger.error(message, data);
    } else if (level === "warn") {
      apiLogger.warn(message, data);
    } else {
      apiLogger.info(message, data);
    }
  }

  /**
   * Obtener el token de autenticación desde localStorage
   */
  _getToken() {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token || null;
      }
    } catch (e) {
      this._log("error", "Error al obtener token", e);
    }
    return null;
  }

  /**
   * Establecer el token en localStorage
   */
  _setToken(token) {
    try {
      const authData = localStorage.getItem("authData");
      const parsed = authData ? JSON.parse(authData) : {};
      parsed.token = token;
      localStorage.setItem("authData", JSON.stringify(parsed));
    } catch (e) {
      this._log("error", "Error al guardar token", e);
    }
  }

  /**
   * Ejecutar solicitud con reintentos
   */
  async _executeWithRetry(fn, endpoint, retryCount = 0) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable =
        error.status >= 500 || // Errores del servidor
        error.timeout || // Timeout
        (error instanceof TypeError && error.message.includes("network")); // Errores de red

      if (isRetryable && retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        this._log("warn", `Reintentando ${endpoint} en ${delay}ms (intento ${retryCount + 1})`, {
          reason: error.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this._executeWithRetry(fn, endpoint, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Refrescar token
   */
  async _refreshToken() {
    if (this.isRefreshingToken) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isRefreshingToken) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.isRefreshingToken = true;

    try {
      // El backend no provee un endpoint /refresh; usar validate_token
      // como verificación. Si la sesión sigue siendo válida no hay token
      // nuevo que obtener; en caso contrario notificar expiración.
      const response = await this._makeRequest("/condome_auth/validate_token", {
        method: "GET",
        skipTokenRefresh: true,
      });

      this.isRefreshingToken = false;

      if (response && response.valid) {
        // No hay token nuevo; devolver el token almacenado (si existe)
        return this._getToken();
      }

      if (this.onTokenExpired) this.onTokenExpired();
      throw new TokenExpiredError();
    } catch (error) {
      this.isRefreshingToken = false;
      this._log("error", "Error al intentar validar/refresh token", error);
      if (this.onTokenExpired) this.onTokenExpired();
      throw new TokenExpiredError();
    }
  }

  /**
   * Hacer request HTTP con todos los interceptores
   */
  async _makeRequest(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers = {},
      timeout = this.timeout,
      skipTokenRefresh = false,
      validateStatus = null,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Request interceptor
      let requestConfig = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
        signal: controller.signal,
      };

      // Agregar token si existe
      const token = this._getToken();
      if (token) {
        requestConfig.headers["Authorization"] = `Bearer ${token}`;
      }

      if (body) {
        requestConfig.body = JSON.stringify(body);
      }

      if (this.interceptors.request) {
        requestConfig = this.interceptors.request(requestConfig) || requestConfig;
      }

      this._log("info", `${method} ${endpoint}`);

      const response = await fetch(url, requestConfig);

      clearTimeout(timeoutId);

      // Si recibimos 401 no intentamos llamar a un endpoint de "refresh"
      // (el backend no expone /condome_auth/refresh). En su lugar
      // notificamos expiración y lanzamos TokenExpiredError para que
      // la capa superior maneje la redirección/limpieza de sesión.
      if (response.status === 401) {
        this._log("warn", "401 Unauthorized recibido", { endpoint });
        if (this.onTokenExpired) {
          try {
            this.onTokenExpired();
          } catch (err) {
            this._log("error", "onTokenExpired lanzó un error", { err });
          }
        }
        throw new TokenExpiredError();
      }

      // Parsear respuesta
      let data = null;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (response.ok && response.status !== 204) {
        data = await response.text();
      }

      // Response interceptor
      if (this.interceptors.response) {
        data = this.interceptors.response({ status: response.status, data, endpoint }) || data;
      }

      // Validación de estado
      if (validateStatus) {
        if (!validateStatus(response.status)) {
          throw new ApiError({
            status: response.status,
            message: data?.detail || data?.error?.message || `Error HTTP ${response.status}`,
            data,
            endpoint,
          });
        }
      } else if (!response.ok) {
        throw new ApiError({
          status: response.status,
          message: data?.detail || data?.error?.message || `Error HTTP ${response.status}`,
          data,
          endpoint,
        });
      }

      this._log("info", `✓ ${method} ${endpoint} [${response.status}]`);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Detectar timeout
      if (error.name === "AbortError") {
        const timeoutError = new ApiError({
          status: 408,
          message: `Timeout después de ${timeout}ms`,
          data: null,
          endpoint,
        });
        timeoutError.timeout = true;
        error = timeoutError;
      }

      // Error interceptor
      if (this.interceptors.error) {
        this.interceptors.error(error);
      }

      this._log("error", `✗ ${method} ${endpoint}`, {
        status: error.status,
        message: error.message,
      });

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this._executeWithRetry(
      () => this._makeRequest(endpoint, { ...options, method: "GET" }),
      endpoint
    );
  }

  /**
   * POST request
   */
  async post(endpoint, body = null, options = {}) {
    return this._executeWithRetry(
      () => this._makeRequest(endpoint, { ...options, method: "POST", body }),
      endpoint
    );
  }

  /**
   * PUT request
   */
  async put(endpoint, body = null, options = {}) {
    return this._executeWithRetry(
      () => this._makeRequest(endpoint, { ...options, method: "PUT", body }),
      endpoint
    );
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body = null, options = {}) {
    return this._executeWithRetry(
      () => this._makeRequest(endpoint, { ...options, method: "PATCH", body }),
      endpoint
    );
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this._executeWithRetry(
      () => this._makeRequest(endpoint, { ...options, method: "DELETE" }),
      endpoint
    );
  }

  /**
   * Agregar parámetros de query a una URL
   */
  buildQueryString(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }

  /**
   * Construir URL con parámetros de query
   */
  buildUrl(endpoint, params = {}) {
    const queryString = this.buildQueryString(params);
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  _extractFilename(contentDisposition, fallback = "download") {
    if (!contentDisposition) return fallback;
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);
    return match?.[1] || fallback;
  }

  async download(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers = {},
      timeout = this.timeout,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestConfig = {
        method,
        headers: {
          ...headers,
        },
        credentials: "include",
        signal: controller.signal,
      };

      const token = this._getToken();
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      if (body) {
        requestConfig.headers["Content-Type"] = "application/json";
        requestConfig.body = JSON.stringify(body);
      }

      this._log("info", `DOWNLOAD ${endpoint}`);

      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      if (response.status === 401) {
        if (this.onTokenExpired) {
          this.onTokenExpired();
        }
        throw new TokenExpiredError();
      }

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}`;
        try {
          const data = await response.json();
          errorMessage = data?.detail || data?.error?.message || errorMessage;
        } catch (_error) {
          // Keep the fallback message for non-JSON responses.
        }
        throw new ApiError({
          status: response.status,
          message: errorMessage,
          data: null,
          endpoint,
        });
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const contentType = response.headers.get("Content-Type") || blob.type;

      return {
        blob,
        contentType,
        filename: this._extractFilename(contentDisposition),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        const timeoutError = new ApiError({
          status: 408,
          message: `Timeout después de ${timeout}ms`,
          data: null,
          endpoint,
        });
        timeoutError.timeout = true;
        throw timeoutError;
      }
      throw error;
    }
  }
}

export { ApiClient, ApiError, TokenExpiredError };

/**
 * Instancia global del ApiClient
 */
const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  maxRetries: DEFAULT_RETRIES,
  onTokenExpired: () => {
    // Notificar al usuario que la sesión expiró
    localStorage.removeItem("authData");
    window.location.href = "/login?session-expired=true";
  },
});

export default apiClient;
