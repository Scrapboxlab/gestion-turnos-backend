# Gestión de Turnos — Backend

API REST para el sistema de gestión de turnos. Node.js + Express + PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con las credenciales de la base de datos
```

## Base de datos

```bash
# Crear la base de datos en PostgreSQL
createdb gestion_turnos

# Ejecutar migraciones
npm run migrate

# Cargar datos de ejemplo (opcional)
npm run seed
```

Credenciales del seed: `admin@beautystudio.com` / `admin123`

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor corre en `http://localhost:3001` por defecto.

## Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login con email/password |
| POST | `/api/auth/register` | Registro de nuevo negocio |
| GET | `/api/auth/me` | Datos del usuario autenticado |

### Turnos (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/appointments` | Listar turnos (filtros: date, status, staffId, from, to) |
| GET | `/api/appointments/:id` | Obtener turno |
| POST | `/api/appointments` | Crear turno |
| PUT | `/api/appointments/:id` | Actualizar turno |
| DELETE | `/api/appointments/:id` | Eliminar turno |

### Clientes (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clients` | Listar clientes (filtros: search, tag) |
| GET | `/api/clients/:id` | Obtener cliente |
| POST | `/api/clients` | Crear cliente |
| PUT | `/api/clients/:id` | Actualizar cliente |
| DELETE | `/api/clients/:id` | Eliminar cliente |

### Servicios (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/services` | Listar servicios (filtro: active=true) |
| POST | `/api/services` | Crear servicio |
| PUT | `/api/services/:id` | Actualizar servicio |
| DELETE | `/api/services/:id` | Eliminar servicio |

### Staff (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/staff` | Listar profesionales |
| POST | `/api/staff` | Crear profesional |
| PUT | `/api/staff/:id` | Actualizar profesional |
| DELETE | `/api/staff/:id` | Eliminar profesional |

### Pagos (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/payments` | Listar pagos |
| GET | `/api/payments/summary` | Resumen financiero |
| POST | `/api/payments` | Registrar pago |
| PUT | `/api/payments/:id` | Actualizar estado de pago |

### Notificaciones (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Listar notificaciones |
| PUT | `/api/notifications/read-all` | Marcar todas como leídas |
| PUT | `/api/notifications/:id/read` | Marcar una como leída |
| DELETE | `/api/notifications` | Eliminar todas |

### Dashboard (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | Stats del día, semana, ingresos |

### Analytics (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/analytics` | Datos de análisis completos |

### Configuración (autenticado)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/settings` | Obtener toda la configuración |
| PUT | `/api/settings/business` | Actualizar datos del negocio |
| PUT | `/api/settings/hours` | Actualizar horarios de atención |
| PUT | `/api/settings/booking` | Actualizar reglas de reserva |

### Booking público (sin autenticación)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/booking/:businessId/services` | Servicios activos para reserva |
| GET | `/api/booking/:businessId/staff` | Staff disponible |
| GET | `/api/booking/:businessId/availability` | Horarios disponibles |
| POST | `/api/booking/:businessId` | Crear reserva pública |

## Autenticación

Incluir el token en el header de todas las rutas protegidas:

```
Authorization: Bearer <token>
```

## Estructura

```
src/
  controllers/    Manejo de requests/responses
  services/       Lógica de negocio
  repositories/   Acceso a base de datos
  routes/         Definición de rutas
  middlewares/    Auth, errores, validación
  validations/    Schemas Zod
  utils/          Logger, AppError, asyncHandler
  config/         Conexión a base de datos
migrations/       SQL migrations
seeds/            Datos de ejemplo
```
