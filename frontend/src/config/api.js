/**
 * config/api.js
 * =============
 * Configuración central de la API.
 * En desarrollo usamos proxy de Vite para evitar problemas de CORS con Odoo.
 * Si necesitas un backend remoto, define VITE_API_URL.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
export const API_PREFIX   = "/condome_api";
export const API_URL      = `${API_BASE_URL}${API_PREFIX}`;

export const DEFAULT_DB   = import.meta.env.VITE_DEFAULT_DB || "condome_db";
export const ENABLE_CONDOMINIO_API = import.meta.env.VITE_ENABLE_CONDOMINIO_API !== "false";
