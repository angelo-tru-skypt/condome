# Condome

Condome es una plataforma de gestion de condominios construida con un backend en Odoo 17, una base de datos PostgreSQL y un frontend en React con Vite. El sistema centraliza administracion de condominios, edificios, apartamentos, residentes, propietarios, roles, cuotas, pagos, morosidad, reportes, visitas, incidencias, reservas, avisos, documentos, notificaciones, vehiculos y planes.

## Tabla de contenido

- [Arquitectura](#arquitectura)
- [Herramientas y tecnologias](#herramientas-y-tecnologias)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Variables de entorno](#variables-de-entorno)
- [Instalacion con Docker](#instalacion-con-docker)
- [Ejecucion en modo desarrollo](#ejecucion-en-modo-desarrollo)
- [Uso de la aplicacion](#uso-de-la-aplicacion)
- [Modulos del backend](#modulos-del-backend)
- [Rutas principales del frontend](#rutas-principales-del-frontend)
- [API y servicios](#api-y-servicios)
- [Comandos utiles](#comandos-utiles)
- [Datos persistentes](#datos-persistentes)
- [Pruebas y calidad](#pruebas-y-calidad)
- [Notas de desarrollo](#notas-de-desarrollo)

## Arquitectura

El proyecto esta dividido en tres capas principales:

1. Backend Odoo: expone endpoints HTTP para autenticacion, administracion, portal de residentes, facturacion, reportes, correo y operaciones del condominio.
2. Base de datos PostgreSQL: almacena la informacion persistente usada por Odoo.
3. Frontend React: consume la API de Odoo mediante rutas proxy configuradas en Vite.

Servicios definidos en `docker-compose.yml`:

| Servicio | Tecnologia | Puerto | Descripcion |
| --- | --- | --- | --- |
| `web` | Odoo 17 | `8069` | Backend principal y API HTTP |
| `mydb` | PostgreSQL 15 | interno | Base de datos para Odoo |
| `mailhog` | MailHog | `1025`, `8025` | SMTP local e interfaz web para correos de prueba |

URLs locales principales:

- Frontend Vite: `http://localhost:3000`
- Odoo/API: `http://localhost:8069`
- MailHog: `http://localhost:8025`

## Herramientas y tecnologias

Backend:

- Odoo `17.0`
- Python dentro de la imagen oficial de Odoo
- PostgreSQL `15`
- PyJWT `2.8.0`
- Stripe SDK para Python
- python-dotenv
- MailHog para pruebas de correo

Frontend:

- React `19.2.0`
- React DOM `19.2.0`
- React Router DOM `7.13.1`
- Vite `7.3.1`
- Tailwind CSS `3.4.19`
- PostCSS y Autoprefixer
- ESLint `9.39.1`
- Stripe React SDK y Stripe JS

Infraestructura:

- Docker
- Docker Compose
- Node.js recomendado: `20.x`
- npm

## Estructura del proyecto

```text
.
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── data/
│   │   ├── odoo/
│   │   └── postgres/
│   └── odoo/
│       ├── odoo.conf
│       └── addons/
│           ├── condome_api/
│           ├── condome_auth/
│           ├── condome_core/
│           ├── condome_structure/
│           ├── condome_billing/
│           └── ...
├── frontend/
│   ├── package.json
│   ├── vite.config.cjs
│   ├── tailwind.config.cjs
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── public/
│       └── utils/
├── docker-compose.yml
├── CHECKLIST_INTEGRACIONES.md
├── GUIA_PAGOS_INTERNOS.md
└── INTEGRACIONES_FRONTEND.md
```

## Requisitos previos

Antes de ejecutar el proyecto instala:

- Docker Desktop o Docker Engine con Docker Compose.
- Node.js `20.x` y npm si vas a ejecutar el frontend fuera de Docker.
- Git para clonar y versionar el proyecto.

## Variables de entorno

El backend usa `backend/.env`, cargado por `docker-compose.yml` en el servicio `web`.

Variables esperadas:

```env
PUBLISHED_KEY=...
SECRET_KEY=...
APP_PASSWORD_SMTP=...
SMTP_EMAIL=...
SMTP_HOST=...
SMTP_PORT=...
PLAN_PAYMENT_MODE=...
```

Uso esperado:

- `PUBLISHED_KEY`: clave publica de Stripe.
- `SECRET_KEY`: clave secreta de Stripe.
- `APP_PASSWORD_SMTP`: password o app password del proveedor SMTP.
- `SMTP_EMAIL`: cuenta remitente.
- `SMTP_HOST`: servidor SMTP. En desarrollo puede apuntar a MailHog.
- `SMTP_PORT`: puerto SMTP. MailHog usa `1025`.
- `PLAN_PAYMENT_MODE`: modo de pago de planes.

No publiques claves reales en commits, issues ni capturas. Para desarrollo local se puede usar MailHog sin autenticacion SMTP real.

## Instalacion con Docker

Desde la raiz del proyecto:

```powershell
docker compose build
docker compose up -d
```

Verifica que los servicios esten corriendo:

```powershell
docker compose ps
```

Logs del backend:

```powershell
docker compose logs -f web
```

Logs de PostgreSQL:

```powershell
docker compose logs -f mydb
```

Para detener los servicios:

```powershell
docker compose down
```

Para detener y eliminar volumenes/datos persistentes locales:

```powershell
docker compose down -v
```

Usa este ultimo comando con cuidado porque elimina datos de desarrollo.

## Ejecucion en modo desarrollo

### Backend

El backend se ejecuta normalmente con Docker:

```powershell
docker compose up -d mydb mailhog web
```

Odoo queda disponible en:

```text
http://localhost:8069
```

El archivo `backend/odoo/odoo.conf` define:

- `addons_path`: addons oficiales de Odoo y addons locales en `/mnt/extra-addons`.
- `db_host`: `mydb`.
- `db_port`: `5432`.
- `db_user`: `odoo`.
- `data_dir`: `/var/lib/odoo`.
- `cors`: `http://localhost:3000`.

### Frontend

Instala dependencias:

```powershell
cd frontend
npm install
```

Levanta Vite:

```powershell
npm run dev
```

El frontend queda disponible en:

```text
http://localhost:3000
```

Vite proxy envia estas rutas al backend Odoo:

- `/condome_auth` -> `http://localhost:8069`
- `/condome_api` -> `http://localhost:8069`

Tambien existe un proxy `/api` hacia `http://localhost:8000`, reservado para compatibilidad o servicios auxiliares.

## Uso de la aplicacion

Flujo general:

1. Abre `http://localhost:3000`.
2. Entra por `/login` o registra una cuenta en `/register`.
3. Verifica correo si el flujo lo requiere mediante `/verify-email`.
4. Accede al dashboard protegido en `/dashboard`.
5. Usa los modulos disponibles segun el rol del usuario.

Roles funcionales usados por el frontend:

- Propietario del sistema.
- Administrador o propietario del condominio.
- Propietario de inmueble.
- Residente.

La navegacion protegida se gestiona desde `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/context/AuthContext.jsx` y las paginas de rol en `frontend/src/components/RoleDashboardPage.jsx`.

## Modulos del backend

Los addons personalizados viven en `backend/odoo/addons`.

| Modulo | Proposito |
| --- | --- |
| `condome_api` | Gateway compatible bajo el namespace `/condome_api` |
| `condome_auth` | Autenticacion JWT, registro, login, refresh, logout y perfil |
| `condome_core` | Servicios compartidos, respuestas HTTP, serializacion, acceso y eventos |
| `condome_structure` | Estructura base del condominio: condominios, edificios, apartamentos |
| `condome_directory` | Clientes, residentes y roles funcionales |
| `condome_people` | Compatibilidad para capa de personas |
| `condome_property` | Compatibilidad para capa de estructura |
| `condome_access` | Compatibilidad para capa antigua de acceso |
| `condome_access_control` | Visitas, vehiculos y control de acceso |
| `condome_billing` | Cuotas, pagos, historial e indicadores de morosidad |
| `condome_community` | Compatibilidad para capa comunitaria |
| `condome_dashboard` | Resumen administrativo |
| `condome_governance` | Gobierno, comunicacion y trazabilidad |
| `condome_incident` | Incidencias y estados de reclamos |
| `condome_mail` | Envio de correos y notificaciones |
| `condome_reporting` | Reportes y exportaciones administrativas |
| `condome_reservation` | Reservas de areas comunes |
| `condome_roles` | Catalogo de roles y permisos |

`condome_api` depende de los modulos funcionales principales para mantener un namespace estable mientras la logica vive en addons mas pequenos.

## Rutas principales del frontend

Rutas publicas:

- `/`
- `/landing`
- `/login`
- `/register`
- `/verify-email`

Rutas protegidas bajo `/dashboard`:

- `/dashboard`
- `/dashboard/mi-residencia`
- `/dashboard/condominio`
- `/dashboard/condominio/nuevo`
- `/dashboard/edificios`
- `/dashboard/apartamentos`
- `/dashboard/residentes`
- `/dashboard/propietarios`
- `/dashboard/roles`
- `/dashboard/cuotas`
- `/dashboard/morosidad`
- `/dashboard/reportes`
- `/dashboard/visitas`
- `/dashboard/incidencias`
- `/dashboard/avisos`
- `/dashboard/reservas`
- `/dashboard/acceso`
- `/dashboard/auditoria`
- `/dashboard/configuracion`
- `/dashboard/documentos`
- `/dashboard/notificaciones`
- `/dashboard/vehiculos`
- `/dashboard/planes`
- `/dashboard/pagos`
- `/dashboard/historial`

Las rutas legacy sin `/dashboard` redireccionan automaticamente a su equivalente actual.

## API y servicios

El frontend centraliza endpoints en `frontend/src/utils/API_ENDPOINTS.js`.

Namespaces principales:

- `/condome_auth`: autenticacion y sesion.
- `/condome_api`: operaciones funcionales del sistema.

Grupos de endpoints:

- `AUTH_ENDPOINTS`: login, logout, registro, perfil, cambio de password, refresh, validacion de token y verificacion de correo.
- `CONDOMINIO_ENDPOINTS`: condominios, edificios, apartamentos y residentes.
- `ADMIN_ENDPOINTS`: dashboard, roles, propietarios, documentos, configuracion, notificaciones, acceso, comunicados, areas comunes, reservas, cuotas, pagos, morosidad, auditoria, reportes, vehiculos, visitas e incidencias.
- `RESIDENT_ENDPOINTS`: contexto del residente, visitas, incidencias y notificaciones.
- `BILLING_ENDPOINTS`: pagos, historial y cuotas para propietarios y residentes.
- `MAIL_ENDPOINTS`: avisos del sistema, broadcast, recordatorios de pago, notificacion a residentes y pruebas SMTP.

Servicios frontend relevantes:

- `ApiClient.js`: cliente base para peticiones.
- `AuthService.js`: autenticacion.
- `SessionValidator.js`: validacion de sesion.
- `condominioService.js`: operaciones de condominio.
- `adminService.js`: operaciones administrativas.
- `ownerAdminService.js`: operaciones del propietario/administrador.
- `residentPortalService.js`: portal de residentes.
- `billingPortalService.js`: pagos y facturacion.
- `mailService.js`: correo.

## Comandos utiles

Raiz del proyecto:

```powershell
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f web
docker compose logs -f mydb
docker compose logs -f mailhog
docker compose down
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

Backend/Odoo dentro del contenedor:

```powershell
docker compose exec web odoo -c /etc/odoo/odoo.conf --help
```

Actualizar modulos Odoo desde linea de comandos:

```powershell
docker compose exec web odoo -c /etc/odoo/odoo.conf -d NOMBRE_DB -u condome_api --stop-after-init
```

Cambia `NOMBRE_DB` por la base de datos que estes usando en Odoo.

## Datos persistentes

El proyecto monta datos locales en:

- `backend/data/odoo`: datos persistentes de Odoo.
- `backend/data/postgres`: datos persistentes de PostgreSQL.

Estos directorios permiten conservar informacion entre reinicios de contenedores. Si necesitas reiniciar el entorno desde cero, detente primero y elimina volumenes/datos sabiendo que perderas la informacion local.

## Pruebas y calidad

El frontend incluye ESLint:

```powershell
cd frontend
npm run lint
```

Build de produccion del frontend:

```powershell
cd frontend
npm run build
```

El backend no define una suite de pruebas automatizada en `requirements.txt`. Para validar cambios backend se recomienda:

- Revisar logs con `docker compose logs -f web`.
- Probar endpoints desde el frontend.
- Actualizar el modulo afectado en Odoo.
- Validar permisos y roles desde usuarios de prueba.
- Revisar MailHog cuando el flujo incluya correos.

## Notas de desarrollo

- El frontend corre por defecto en el puerto `3000`.
- El backend Odoo corre por defecto en el puerto `8069`.
- La configuracion CORS de Odoo permite `http://localhost:3000`.
- MailHog permite ver correos enviados en desarrollo desde `http://localhost:8025`.
- Los secretos viven en `backend/.env`; evita subir valores reales.
- Si agregas endpoints nuevos, actualiza `frontend/src/utils/API_ENDPOINTS.js`.
- Si agregas rutas nuevas, actualiza `frontend/src/App.jsx` y la navegacion correspondiente.
- Si agregas modelos Odoo nuevos, revisa `security/ir.model.access.csv` del modulo correspondiente.
- Si agregas addons nuevos, verifica dependencias en `__manifest__.py` y el `addons_path` de `backend/odoo/odoo.conf`.

## Documentacion adicional del repo

Tambien existen documentos de apoyo:

- `CHECKLIST_INTEGRACIONES.md`
- `INTEGRACIONES_FRONTEND.md`
- `GUIA_PAGOS_INTERNOS.md`

Estos archivos complementan el README con detalles de integraciones y pagos internos.
