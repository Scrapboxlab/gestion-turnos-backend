-- =============================================================
-- Gestión de Turnos — Schema inicial
-- =============================================================
-- Uso:
--   psql $DATABASE_URL -f database/init.sql
--
-- O desde psql interactivo:
--   \i database/init.sql
-- =============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- BUSINESSES
-- Negocio que usa el sistema. Soporte multi-tenant.
-- =============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  category     VARCHAR(100),
  phone        VARCHAR(50),
  email        VARCHAR(255),
  address      TEXT,
  logo_url     TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- =============================================================
-- USERS
-- Usuarios con acceso al panel (admins del negocio).
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  business_id   INTEGER      NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_role_check   CHECK (role IN ('admin', 'staff'))
);

-- =============================================================
-- CLIENTS
-- Clientes del negocio.
-- =============================================================
CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER      NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(50),
  tags        TEXT[]       NOT NULL DEFAULT '{}',  -- ['VIP', 'Regular', 'Nuevo']
  notes       TEXT,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  visits      INTEGER       NOT NULL DEFAULT 0,
  last_visit  DATE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- =============================================================
-- SERVICES
-- Servicios que ofrece el negocio.
-- =============================================================
CREATE TABLE IF NOT EXISTS services (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER      NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  duration    INTEGER      NOT NULL DEFAULT 30,   -- minutos
  price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  category    VARCHAR(100),
  color       VARCHAR(20)  NOT NULL DEFAULT '#14B8A6',
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- =============================================================
-- STAFF
-- Profesionales del negocio.
-- =============================================================
CREATE TABLE IF NOT EXISTS staff (
  id                SERIAL PRIMARY KEY,
  business_id       INTEGER      NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  role              VARCHAR(100),
  work_hours_start  TIME         NOT NULL DEFAULT '09:00',
  work_hours_end    TIME         NOT NULL DEFAULT '18:00',
  days_off          INTEGER[]    NOT NULL DEFAULT '{0}',  -- 0=Dom, 1=Lun ... 6=Sáb
  rating            DECIMAL(3,2) NOT NULL DEFAULT 0,
  appointments_count INTEGER     NOT NULL DEFAULT 0,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- =============================================================
-- STAFF_SERVICES
-- Qué servicios puede realizar cada profesional.
-- =============================================================
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id   INTEGER NOT NULL REFERENCES staff(id)    ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- =============================================================
-- APPOINTMENTS
-- Turnos reservados.
-- =============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id            SERIAL PRIMARY KEY,
  business_id   INTEGER      NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id     INTEGER      REFERENCES clients(id) ON DELETE SET NULL,
  client_name   VARCHAR(255) NOT NULL,
  client_phone  VARCHAR(50),
  client_email  VARCHAR(255),
  staff_id      INTEGER      REFERENCES staff(id)    ON DELETE SET NULL,
  staff_name    VARCHAR(255),
  service_id    INTEGER      REFERENCES services(id) ON DELETE SET NULL,
  service_name  VARCHAR(255),
  date          DATE         NOT NULL,
  time          TIME         NOT NULL,
  duration      INTEGER      NOT NULL DEFAULT 30,  -- minutos
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        VARCHAR(50)  NOT NULL DEFAULT 'pending',
  notes         TEXT,
  color         VARCHAR(20)  NOT NULL DEFAULT '#14B8A6',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  CONSTRAINT appointments_status_check CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled', 'noshow')
  )
);

-- =============================================================
-- PAYMENTS
-- Pagos asociados a turnos.
-- =============================================================
CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  business_id    INTEGER       NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  appointment_id INTEGER       REFERENCES appointments(id) ON DELETE SET NULL,
  client_name    VARCHAR(255),
  service_name   VARCHAR(255),
  amount         DECIMAL(12,2) NOT NULL,
  date           DATE          NOT NULL DEFAULT CURRENT_DATE,
  status         VARCHAR(50)   NOT NULL DEFAULT 'pending',
  method         VARCHAR(50),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_status_check CHECK (status IN ('paid', 'pending')),
  CONSTRAINT payments_method_check CHECK (method IN ('Efectivo', 'Transferencia', 'Tarjeta') OR method IS NULL)
);

-- =============================================================
-- NOTIFICATIONS
-- Notificaciones internas del sistema.
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER      NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type        VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  read        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_type_check CHECK (
    type IN ('booking', 'cancellation', 'reminder', 'payment', 'noshow')
  )
);

-- =============================================================
-- BUSINESS_SETTINGS
-- Reglas de reserva del negocio.
-- =============================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id                  SERIAL PRIMARY KEY,
  business_id         INTEGER  NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  min_notice_hours    INTEGER  NOT NULL DEFAULT 2,    -- anticipación mínima para reservar
  max_advance_days    INTEGER  NOT NULL DEFAULT 30,   -- con cuántos días de anticipación máxima
  auto_confirm        BOOLEAN  NOT NULL DEFAULT TRUE,
  allow_cancellation  BOOLEAN  NOT NULL DEFAULT TRUE,
  cancellation_hours  INTEGER  NOT NULL DEFAULT 24,   -- horas mínimas para cancelar
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_settings_business_unique UNIQUE (business_id)
);

-- =============================================================
-- BUSINESS_HOURS
-- Horarios de atención del negocio por día de semana.
-- =============================================================
CREATE TABLE IF NOT EXISTS business_hours (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER  NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER  NOT NULL,  -- 0=Domingo, 1=Lunes ... 6=Sábado
  is_open     BOOLEAN  NOT NULL DEFAULT TRUE,
  open_time   TIME     NOT NULL DEFAULT '09:00',
  close_time  TIME     NOT NULL DEFAULT '19:00',
  CONSTRAINT business_hours_day_unique   UNIQUE (business_id, day_of_week),
  CONSTRAINT business_hours_day_check    CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT business_hours_times_check  CHECK (close_time > open_time)
);

-- =============================================================
-- ÍNDICES
-- =============================================================

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_business
  ON clients(business_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_email
  ON clients(business_id, email) WHERE deleted_at IS NULL;

-- Services
CREATE INDEX IF NOT EXISTS idx_services_business
  ON services(business_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_active
  ON services(business_id, active) WHERE deleted_at IS NULL;

-- Staff
CREATE INDEX IF NOT EXISTS idx_staff_business
  ON staff(business_id) WHERE deleted_at IS NULL;

-- Appointments — los más consultados
CREATE INDEX IF NOT EXISTS idx_appointments_business
  ON appointments(business_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_date
  ON appointments(business_id, date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(business_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_staff_date
  ON appointments(staff_id, date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_client
  ON appointments(client_id) WHERE deleted_at IS NULL;

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_business
  ON payments(business_id);

CREATE INDEX IF NOT EXISTS idx_payments_date
  ON payments(business_id, date);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_business
  ON notifications(business_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(business_id, read) WHERE read = FALSE;

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_business
  ON users(business_id) WHERE deleted_at IS NULL;
