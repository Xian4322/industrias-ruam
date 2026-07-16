-- ============================================================
-- Industrias RUAM - MTO Platform Database Schema
-- SQLite3 with WAL mode
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL,
    role            TEXT    NOT NULL CHECK(role IN ('admin','operario')),
    display_name    TEXT,
    daily_wage      REAL    DEFAULT 60.00,
    is_active       BOOLEAN DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders table (pedidos por presentación/unidades)
CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code      TEXT    UNIQUE NOT NULL,
    client_name     TEXT    NOT NULL,
    snack_type      TEXT    NOT NULL CHECK(snack_type IN ('papa','platano','pituca')),
    presentation    TEXT    NOT NULL DEFAULT '34g' CHECK(presentation IN ('34g','150g')),
    units_requested INTEGER NOT NULL,
    unit_price      REAL    NOT NULL,
    kg_requested    REAL    NOT NULL,
    revenue_total   REAL    NOT NULL,
    kanban_stage    INTEGER DEFAULT 1 CHECK(kanban_stage BETWEEN 1 AND 5),
    status          TEXT    DEFAULT 'active' CHECK(status IN ('active','frozen','completed','cancelled')),
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at    DATETIME
);

-- 3. Order materials table
CREATE TABLE IF NOT EXISTS order_materials (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER NOT NULL REFERENCES orders(id),
    raw_material_kg     REAL    NOT NULL,
    raw_material_cost   REAL    NOT NULL,
    oil_liters          REAL    NOT NULL,
    oil_cost            REAL    NOT NULL,
    total_material_cost REAL    NOT NULL,
    prep_type           TEXT    NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Kanban history table
CREATE TABLE IF NOT EXISTS kanban_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    from_stage      INTEGER,
    to_stage        INTEGER NOT NULL,
    changed_by      INTEGER REFERENCES users(id),
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Quality checks table
CREATE TABLE IF NOT EXISTS quality_checks (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id                INTEGER NOT NULL REFERENCES orders(id),
    operator_id             INTEGER NOT NULL REFERENCES users(id),
    oil_temp_ok             BOOLEAN NOT NULL DEFAULT 0,
    blade_calibration_ok    BOOLEAN NOT NULL DEFAULT 0,
    is_approved             BOOLEAN GENERATED ALWAYS AS (oil_temp_ok AND blade_calibration_ok) STORED,
    checked_at              DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Packaging QC table
CREATE TABLE IF NOT EXISTS packaging_qc (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    operator_id     INTEGER NOT NULL REFERENCES users(id),
    kg_conforming   REAL    NOT NULL,
    kg_waste        REAL    NOT NULL,
    sealed_ok       BOOLEAN NOT NULL DEFAULT 0,
    is_conforming   BOOLEAN GENERATED ALWAYS AS (sealed_ok AND kg_waste <= kg_conforming * 0.025) STORED,
    checked_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Maintenance logs table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER REFERENCES orders(id),
    operator_id         INTEGER NOT NULL REFERENCES users(id),
    failure_type        TEXT    NOT NULL CHECK(failure_type IN ('brazo_presion','cuchillas_desafiladas','caida_temperatura','otro')),
    description         TEXT,
    started_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at            DATETIME,
    duration_minutes    REAL
);

-- 8. EVM records table
CREATE TABLE IF NOT EXISTS evm_records (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER NOT NULL UNIQUE REFERENCES orders(id),
    pv                  REAL    NOT NULL,
    ev                  REAL    NOT NULL,
    ac                  REAL    NOT NULL,
    cv                  REAL,
    sv                  REAL,
    cpi                 REAL,
    spi                 REAL,
    labor_cost          REAL,
    material_cost       REAL,
    oil_cost_actual     REAL,
    calculated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Change requests table
CREATE TABLE IF NOT EXISTS change_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    requested_by    INTEGER NOT NULL REFERENCES users(id),
    reason          TEXT    NOT NULL,
    cost_impact     REAL,
    time_impact_days REAL,
    new_units       INTEGER,
    new_presentation TEXT,
    new_snack_type  TEXT,
    status          TEXT    DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    approved_by     INTEGER REFERENCES users(id),
    approved_at     DATETIME,
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Baseline config table
CREATE TABLE IF NOT EXISTS baseline_config (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key      TEXT    UNIQUE NOT NULL,
    config_value    REAL    NOT NULL,
    description     TEXT,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
