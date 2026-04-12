# ✅ Checklist de Validación de Integraciones

Usa este checklist para validar que todas las integraciones del frontend funcionan correctamente.

---

## 🔐 Autenticación

### Login
- [ ] Intentar login con credenciales válidas
- [ ] Verificar que el token se almacena en localStorage
- [ ] Verificar que el user se muestra en el contexto
- [ ] Verificar que se redirige a dashboard después del login

### Token Management
- [ ] Intentar acceder con un token expirado
- [ ] Verificar que se detiene el 401 y se intenta refrescar automáticamente
- [ ] Verificar que se redirige a login si el refresh falla

### Session Validation
- [ ] Verificar que el SessionValidator inicia automáticamente
- [ ] Esperar 5+ minutos y verificar que valida la sesión
- [ ] Verificar que detiene la validación después del logout

### Logout
- [ ] Verificar que se limpia el token de localStorage
- [ ] Verificar que se redirige a login
- [ ] Verificar que el SessionValidator se detiene

---

## 📦 Servicios

### AuthService
- [ ] Login devuelve `{ token, user }`
- [ ] Logout devuelve `{ success: true }`
- [ ] getSessionInfo() devuelve datos del usuario
- [ ] getProfile() devuelve perfil actualizado
- [ ] updateProfile() actualiza el contexto
- [ ] changePassword() cambia la contraseña sin desloguearse
- [ ] register() crea cuenta y hace login automático
- [ ] validateToken() devuelve true/false

### condominioService
- [ ] listar(db) retorna lista de condominios
- [ ] obtener(id, db) retorna un condominio
- [ ] crear(formData, db) crea condominio
- [ ] actualizar(id, formData, db) actualiza
- [ ] eliminar(id, db) elimina condominio
- [ ] listarEdificios() retorna edificios
- [ ] crearEdificio() crea edificio
- [ ] listarApartamentos() retorna apartamentos
- [ ] crearApartamento() crea apartamento
- [ ] listarResidentes() retorna residentes
- [ ] crearResidente() crea residente

### adminService
- [ ] getDashboardSummary() retorna datos
- [ ] listRoles() retorna roles
- [ ] listOwners(condominioId) retorna propietarios
- [ ] createOwner(payload) crea propietario
- [ ] listDocuments() retorna documentos
- [ ] createDocument() crea documento
- [ ] getSettings() retorna configuración
- [ ] listCommunications() retorna comunicados
- [ ] createCommunication() crea comunicado
- [ ] listReservations() retorna reservas
- [ ] createReservation() crea reserva
- [ ] listAuditEntries() retorna auditoría

### residentPortalService
- [ ] getResidentContext() retorna contexto
- [ ] listResidentVisits() retorna visitas
- [ ] createResidentVisit() crea visita
- [ ] listOwnerVisits() retorna visitas del propietario
- [ ] decideVisit(id, payload) aprueba/rechaza visita
- [ ] listResidentIncidents() retorna incidencias
- [ ] createResidentIncident() crea incidencia
- [ ] updateIncident() actualiza incidencia
- [ ] listOwnerNotifications() retorna notificaciones
- [ ] markNotificationRead() marca como leída

### billingPortalService
- [ ] listPropertyOwnerPayments() retorna pagos
- [ ] registerPropertyOwnerPayment() registra pago
- [ ] listPropertyOwnerPaymentHistory() retorna historial
- [ ] listResidentPayments() retorna pagos
- [ ] registerResidentPayment() registra pago

### adminWorkspaceService (NUEVO - Conectado a API)
- [ ] listCommunications() retorna comunicados **desde API**
- [ ] createCommunication() crea **en API real**
- [ ] listCommonAreas() retorna áreas **desde API**
- [ ] createCommonArea() crea **en API real**
- [ ] listReservations() retorna **desde API**
- [ ] createReservation() crea **en API real**
- [ ] listAccessPolicies() retorna **desde API**
- [ ] saveAccessPolicy() crea/actualiza **en API real**
- [ ] listDocuments() retorna **desde API**
- [ ] saveDocument() crea/actualiza **en API real**

---

## 🔄 Retry y Timeouts

### Retry Logic
- [ ] Apagar backend temporalmente
- [ ] Hacer una solicitud
- [ ] Verificar en console que intenta 3 veces
- [ ] Verificar que espera entre intentos (exponential backoff)

### Timeouts
- [ ] Usar Network tab en DevTools para throttle artificial
- [ ] Simular latencia de 40+ segundos
- [ ] Verificar que falla con timeout error (408)

---

## 📊 Logging

### API Logging
- [ ] Abrir console
- [ ] Hacer solicitud a API
- [ ] Verificar que se loguea: `[API] GET /endpoint`
- [ ] Verificar que se loguea respuesta: `[API] ✓ GET /endpoint [200]`

### Storage Logs
```javascript
// En console
localStorage.getItem('condome_app_logs')
```
- [ ] Verificar que se almacenan logs
- [ ] Verificar que hay al menos 10+ logs

### Export Logs
- [ ] Ejecutar en console: `logger.downloadLogs('json')`
- [ ] Verificar que descarga archivo JSON
- [ ] Ejecutar en console: `logger.downloadLogs('csv')`
- [ ] Verificar que descarga archivo CSV

---

## 🌐 Endpoints

### Verificar Rutas Consistentes
```javascript
// En console - verificar que todas las rutas usan /condome_api
import { AUTH_ENDPOINTS, ADMIN_ENDPOINTS, RESIDENT_ENDPOINTS } from './utils/API_ENDPOINTS.js';

console.log('AUTH:', AUTH_ENDPOINTS);
console.log('ADMIN:', ADMIN_ENDPOINTS);
console.log('RESIDENT:', RESIDENT_ENDPOINTS);
```
- [ ] Todas las rutas de AUTH usan `/condome_auth`
- [ ] Todas las rutas de API usan `/condome_api`
- [ ] No hay inconsistencias como `/condome_api/owner`

---

## ⚠️ Manejo de Errores

### Error Handling
- [ ] Intentar crear item con datos inválidos
- [ ] Verificar que se muestra mensaje de error claro
- [ ] Verificar que NO crashes la app

### Network Errors
- [ ] Desconectar internet
- [ ] Hacer solicitud
- [ ] Verificar error: "network error" o similar
- [ ] Reconectar internet y reintentar

### 500 Errors
- [ ] Hacer solicitud a endpoint que devuelve 500
- [ ] Verificar que intenta reintentar automáticamente
- [ ] Verificar que eventualmente falla con error descriptivo

---

## 📱 Funcionalidades del Usuario

### Dashboard
- [ ] Página carga datos correctamente
- [ ] No hay console errors
- [ ] PropietariosMultiples roles se muestran correctamente
- [ ] Filtros funcionan

### Formularios
- [ ] Llenar formario y guardar
- [ ] Verificar que se persiste en API
- [ ] Refrescar página
- [ ] Verificar que datos persisten

### Listas
- [ ] Cargar lista de items
- [ ] Crear item nuevo
- [ ] Verificar que aparece en lista
- [ ] Actualizar item
- [ ] Verificar cambios en lista
- [ ] Eliminar item
- [ ] Verificar que desaparece de lista

---

## 🔐 Tokens & Sessions

### Multiple Tabs
- [ ] Abrir app en 2 pestañas
- [ ] Login en pestaña 1
- [ ] Verificar que pestaña 2 se mantiene autenticada
- [ ] Logout en pestaña 1
- [ ] Verificar que pestaña 2 se desautentica (en próxima acción)

### Token Expiration
- [ ] Esperar a que token caduque
- [ ] Hacer solicitud
- [ ] Verificar que se intenta refrescar automáticamente
- [ ] Verificar que solicitud se reintentan

---

## 🎯 Validación General

### Performance
- [ ] Primera carga < 2 segundos
- [ ] Navegación fluida sin lag
- [ ] Listas grandes (100+ items) cargan sin problemas

### Errors
- [ ] No hay console errors rojo
- [ ] Los warnings son mínimos
- [ ] Todos los 404 son intencionales

### Cross-browser
- [ ] Chrome - ✅
- [ ] Firefox - ✅
- [ ] Safari - ✅
- [ ] Edge - ✅

---

## 📋 Resumen

| Categoría | Estado | Notas |
|-----------|--------|-------|
| Autenticación | ☐ ✅ | |
| AuthService | ☐ ✅ | |
| condominioService | ☐ ✅ | |
| adminService | ☐ ✅ | |
| residentPortalService | ☐ ✅ | |
| billingPortalService | ☐ ✅ | |
| adminWorkspaceService | ☐ ✅ | |
| Retry/Timeouts | ☐ ✅ | |
| Logging | ☐ ✅ | |
| Endpoints | ☐ ✅ | |
| Error Handling | ☐ ✅ | |
| Sessions | ☐ ✅ | |
| Performance | ☐ ✅ | |
| Cross-browser | ☐ ✅ | |

---

## 🐛 Debugging

Si algo no funciona:

1. **Verificar console**
   ```
   F12 → Console
   ```

2. **Ver logs almacenados**
   ```javascript
   JSON.parse(localStorage.getItem('condome_app_logs'))
   ```

3. **Exportar logs**
   ```javascript
   logger.downloadLogs('json')
   ```

4. **Ver solicitudes de red**
   ```
   F12 → Network → buscar endpoint
   ```

5. **Validar estructura de respuesta**
   ```javascript
   // En Network tab, ver Response
   // Verificar que estructura es correcta
   ```

---

**Estado:** Revision Inicial  
**Fecha:** 2026-04-03
