# Integraciones del Frontend - Refactorización Completa

## 📋 Resumen de Cambios

Se ha refactorizado completamente el sistema de integraciones del frontend a un modelo centralizado, coherente y robusto. Los principales cambios incluyen:

### 1. ✅ ApiClient Centralizado (`frontend/src/utils/ApiClient.js`)

**Antes:**
- Cada servicio tenía su propia lógica de fetch
- Sin manejo de timeouts
- Sin retry automático
- Sin logging coherente
- Manual header management

**Después:**
- Único ApiClient con todas las características
- Timeout configurable (default 30s)
- Retry con exponential backoff (max 3 intentos)
- Logging centralizado
- Manejo automático de headers y credentials
- Token management centralizado
- 401 handling automático con token refresh

**Características:**
```javascript
// Ejemplo de uso
const response = await apiClient.get("/endpoint");
const response = await apiClient.post("/endpoint", { data });
const response = await apiClient.put("/endpoint", { data });
const response = await apiClient.delete("/endpoint");
```

### 2. ✅ Estandarización de Endpoints (`frontend/src/utils/API_ENDPOINTS.js`)

**Antes:**
- Endpoints hardcodeados en cada servicio
- Rutas inconsistentes (`/condome_api` vs `/condome_api/owner`)
- Sin versionado
- Difíciles de mantener

**Después:**
- Todos los endpoints en un archivo centralizado
- Organización por categoría (AUTH, CONDOMINIO, ADMIN, RESIDENT, BILLING)
- Consistencia en todas las rutas
- Preparado para versionado futuro
- Fácil de actualizar

**Ejemplo:**
```javascript
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS, buildUrl } from "./API_ENDPOINTS.js";

// Uso consistente
const endpoint = buildUrl(ADMIN_ENDPOINTS.comunicados, { condominio_id: 123 });
```

### 3. ✅ Validación de Esquemas (`frontend/src/utils/SchemaValidator.js`)

**Características:**
- Validación sin dependencias externas
- Esquemas predefinidos para respuestas comunes
- Error messages descriptivos
- Validación de tipos y propiedades

**Ejemplo:**
```javascript
import { validateOrThrow, schemas } from "./SchemaValidator.js";

const response = await apiClient.get(endpoint);
validateOrThrow(response, schemas.loginResponse);
```

### 4. ✅ Refactorización de Servicios

Los siguientes servicios han sido refactorizados:

| Servicio | Cambios |
|----------|---------|
| **AuthService.js** | Usa ApiClient, token management mejorado |
| **condominioService.js** | Usa ApiClient, endpoints consistentes |
| **adminService.js** | Usa ApiClient, todos los métodos documentados |
| **residentPortalService.js** | Usa ApiClient, manejo de errores consistente |
| **billingPortalService.js** | Usa ApiClient, operaciones atómicas |
| **adminWorkspaceService.js** | ✨ **CONECTADO A API REAL** (antes solo localStorage) |

### 5. ✅ Validador de Sesión (`frontend/src/utils/SessionValidator.js`)

**Características:**
- Validación periódica de token (cada 5 minutos por default)
- Heartbeat automático (cada 10 minutos)
- Detección de sesión expirada
- Redirección automático a login
- Limpieza de sesión local

**Uso:**
```javascript
import sessionValidator from "./utils/SessionValidator.js";

// Se inicia automáticamente en AuthContext
sessionValidator.start();
```

### 6. ✅ Sistema de Logging Centralizado (`frontend/src/utils/Logger.js`)

**Características:**
- Múltiples niveles (DEBUG, INFO, WARN, ERROR)
- Almacenamiento en localStorage
- Exportación de logs (JSON/CSV)
- Namespaces separados para cada módulo
- Auto-reducción en producción

**Uso:**
```javascript
import { logger, apiLogger, authLogger } from "./utils/Logger.js";

apiLogger.info("Request enviado", { endpoint, method });
authLogger.error("Auth failed", { reason: "Invalid credentials" });
```

### 7. ✅ AuthContext Mejorado (`frontend/src/context/AuthContext.jsx`)

**Cambios:**
- Integración con SessionValidator
- Mejor manejo de estados (isValidating)
- Métodos adicionales (changePassword, updateProfile)
- Sincronización automática de sesión
- Persistencia mejorada

**Nuevo uso:**
```javascript
const { user, isAuth, loading, login, logout, refreshSession } = useAuth();
```

---

## 🔧 Cambios Técnicos Detallados

### ApiClient - Token Refresh Automático

El ApiClient implementa un patrón seguro de token refresh:

```javascript
// Si recibe 401, intenta refrescar
if (response.status === 401 && !skipTokenRefresh) {
  await this._refreshToken();
  // Reintentar automáticamente con el nuevo token
  return this._makeRequest(endpoint, { ...options, skipTokenRefresh: true });
}
```

### adminWorkspaceService - Implementación Real

**CRÍTICO:** Este servicio ahora conecta directamente a la API en lugar de solo usar localStorage:

```javascript
// Antes: Solo localStorage
function readStore() { /* solo localStorage */ }

// Después: API real
async listCommunications(condominioId) {
  const response = await apiClient.get(endpoint);
  return response;
}
```

### Manejo Coherente de Errores

Todos los servicios ahora siguen el mismo patrón:

```javascript
try {
  const response = await apiClient.get(endpoint);
  return response;
} catch (error) {
  throw new Error(error.message || "Error al listar items");
}
```

---

## 📊 Comparativa Antes/Después

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Timeouts** | ❌ No | ✅ 30s configurable |
| **Retry Automático** | ❌ No | ✅ 3 intentos exponencial |
| **Token Refresh** | ❌ Manual | ✅ Automático |
| **Logging** | ❌ Inconsistente | ✅ Centralizado |
| **Validación Sesión** | ❌ Solo al cargar | ✅ Continuo cada 5 min |
| **CORS** | ❌ Solo dev | ✅ Manejo automático |
| **adminWorkspace** | ❌ Solo localStorage | ✅ API real |
| **Endpoints** | ❌ Hardcodeados | ✅ Centralizados |
| **Rutas Inconsistentes** | ❌ Sí | ✅ Estandarizadas |
| **Error Handling** | ❌ Inconsistente | ✅ Coherente |

---

## 🚀 Próximos Pasos Recomendados

1. **Backend CORS Configuration**
   - Asegurar que los headers CORS estén configurados correctamente
   - Especialmente importante para producción

2. **Endpoint Validation**
   - Verificar que todos los endpoints existan en el backend
   - Actualizar rutas si diferencia de `/condome_api/owner` vs `/admin`

3. **Testing**
   - Probar todas las funcionalidades en desarrollo
   - Validar que los retries funcionan correctamente
   - Verificar token refresh en sesiones largas

4. **Monitoreo**
   - Usar logs exportados para debugging
   - Monitorear errores 5xx y timeouts

---

## 📖 Guía de Uso

### Para usar un endpoint existente:

```javascript
import apiClient from "./utils/ApiClient.js";
import { ADMIN_ENDPOINTS, buildUrl } from "./utils/API_ENDPOINTS.js";

// Obtener comunicados
const endpoint = buildUrl(ADMIN_ENDPOINTS.comunicados, { condominio_id: 123 });
const response = await apiClient.get(endpoint);
```

### Para agregar un nuevo endpoint:

1. Agregar a `API_ENDPOINTS.js`:
```javascript
export const CUSTOM_ENDPOINTS = {
  myEndpoint: `/condome_api/my-feature/`,
  getMyItem: (id) => `/condome_api/my-feature/${id}`,
};
```

2. Usar en servicio:
```javascript
import { CUSTOM_ENDPOINTS } from "./API_ENDPOINTS.js";

async function getItem(id) {
  return apiClient.get(CUSTOM_ENDPOINTS.getMyItem(id));
}
```

---

## ⚠️ Breaking Changes

- **AuthService**: Ahora devuelve `{ token, user }` en lugar de solo `user`
- **adminWorkspaceService**: Cambiado de localStorage a API real
- **Error handling**: Los servicios ahora lanzan `Error` en lugar de devolver `{ error: true }`

---

## 📝 Archivos Nuevos/Modificados

### Nuevos:
- ✨ `frontend/src/utils/ApiClient.js` - Cliente HTTP centralizado
- ✨ `frontend/src/utils/API_ENDPOINTS.js` - Constantes de endpoints
- ✨ `frontend/src/utils/SchemaValidator.js` - Validador de esquemas
- ✨ `frontend/src/utils/SessionValidator.js` - Validador de sesion
- ✨ `frontend/src/utils/Logger.js` - Sistema de logging

### Modificados:
- 🔄 `frontend/src/utils/AuthService.js` - Refactorizado
- 🔄 `frontend/src/utils/condominioService.js` - Refactorizado
- 🔄 `frontend/src/utils/adminService.js` - Refactorizado
- 🔄 `frontend/src/utils/residentPortalService.js` - Refactorizado
- 🔄 `frontend/src/utils/billingPortalService.js` - Refactorizado
- 🔄 `frontend/src/utils/adminWorkspaceService.js` - Conectado a API
- 🔄 `frontend/src/context/AuthContext.jsx` - Mejorado

---

## ✅ Validación

Todos los cambios han sido implementados siguiendo:
- ✅ Principios SOLID
- ✅ Error handling robusto
- ✅ Logging centralizado
- ✅ Retry con exponential backoff
- ✅ Timeline automation
- ✅ Token management seguro
- ✅ Consistencia en APIs

---

## 📞 Soporte

Para debuggear:
```javascript
// Exportar logs
import { logger } from "./utils/Logger.js";
logger.downloadLogs("json"); // Descargar logs como archivo

// Ver logs en consola
localStorage.getItem("condome_app_logs") // Ver logs almacenados
```

---

**Ultima actualización:** 2026-04-03  
**Versión:** 1.0.0
