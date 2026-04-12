/**
 * Sistema de Logging Centralizado
 * Registra todas las operaciones de API y eventos importantes
 */

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevels.INFO;
    this.enableConsole = options.enableConsole !== false;
    this.enableStorage = options.enableStorage !== false;
    this.maxStoredLogs = options.maxStoredLogs || 500;
    this.storageKey = "condome_app_logs";
    this.namespace = options.namespace || "App";

    // En producción, aumentar nivel de logs
    if (import.meta.env.PROD) {
      this.level = LogLevels.WARN;
    }
  }

  /**
   * Obtener timestamp en ISO
   */
  _getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Guardar log en localStorage
   */
  _saveTologStorage(log) {
    if (!this.enableStorage) return;

    try {
      const logs = this._getStoredLogs();
      logs.push(log);

      // Mantener solo los últimos N logs
      if (logs.length > this.maxStoredLogs) {
        logs.shift();
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (e) {
      // localStorage lleno, ignorar
      console.warn("No se pudieron guardar logs en localStorage", e);
    }
  }

  /**
   * Obtener logs almacenados
   */
  _getStoredLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Log interno
   */
  _log(levelName, message, data = null, levelValue) {
    if (levelValue < this.level) return;

    const log = {
      timestamp: this._getTimestamp(),
      level: levelName,
      namespace: this.namespace,
      message,
      data: data ? (typeof data === "object" ? JSON.stringify(data) : data) : undefined,
    };

    // Imprimir en consola
    if (this.enableConsole) {
      const consoleMethod = {
        DEBUG: "debug",
        INFO: "log",
        WARN: "warn",
        ERROR: "error",
      }[levelName];

      const logMessage = `[${log.timestamp}] [${this.namespace}/${levelName}] ${message}`;

      if (data) {
        console[consoleMethod](logMessage, data);
      } else {
        console[consoleMethod](logMessage);
      }
    }

    // Guardar en storage
    this._saveTologStorage(log);
  }

  debug(message, data) {
    this._log("DEBUG", message, data, LogLevels.DEBUG);
  }

  info(message, data) {
    this._log("INFO", message, data, LogLevels.INFO);
  }

  warn(message, data) {
    this._log("WARN", message, data, LogLevels.WARN);
  }

  error(message, data) {
    this._log("ERROR", message, data, LogLevels.ERROR);
  }

  /**
   * Log de solicitud API
   */
  logApiRequest(method, endpoint) {
    this.debug(`[API REQUEST] ${method} ${endpoint}`);
  }

  /**
   * Log de respuesta API
   */
  logApiResponse(method, endpoint, status, duration) {
    const statusColor = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
    this[statusColor](`[API RESPONSE] ${method} ${endpoint} [${status}${duration ? ` - ${duration}ms` : ""}]`);
  }

  /**
   * Log de error API
   */
  logApiError(method, endpoint, error) {
    this.error(`[API ERROR] ${method} ${endpoint}`, {
      message: error.message,
      status: error.status,
      endpoint: error.endpoint,
    });
  }

  /**
   * Limpiar logs
   */
  clearLogs() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      // Ignorar errores
    }
  }

  /**
   * Exportar logs
   */
  exportLogs(format = "json") {
    const logs = this._getStoredLogs();

    if (format === "csv") {
      const header = ["Timestamp", "Level", "Namespace", "Message", "Data"].join(",");
      const rows = logs.map((log) =>
        [log.timestamp, log.level, log.namespace, `"${log.message}"`, `"${log.data || ""}"`].join(",")
      );
      return [header, ...rows].join("\n");
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Descargar logs como archivo
   */
  downloadLogs(format = "json", filename = null) {
    const content = this.exportLogs(format);
    const mimeType = format === "csv" ? "text/csv" : "application/json";
    const defaultFilename = `condome-logs-${new Date().toISOString().slice(0, 10)}.${format}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || defaultFilename;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// Loggers específicos por módulo
export const apiLogger = new Logger({ namespace: "API" });
export const authLogger = new Logger({ namespace: "AUTH" });
export const stateLogger = new Logger({ namespace: "STATE" });
export const errorLogger = new Logger({ namespace: "ERROR" });

// Logger general
export const logger = new Logger({ namespace: "APP" });

export { logger as default, LogLevels };
