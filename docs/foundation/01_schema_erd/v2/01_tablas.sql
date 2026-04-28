-- =============================================================================
-- C-KREA PAYCONTROL — ESQUEMA SIMPLIFICADO v2
-- 01_tablas.sql — Tablas base (12)
-- Fecha: 2026-04-26
-- =============================================================================
-- Objetivo: una tabla por concepto, nombres en español, sin tablas vacías.
-- Reduce el esquema de 25 tablas (v1) a 12 tablas + 4 vistas + 5 RPCs.
--
-- Lecciones aplicadas (de docs/JOURNAL.md y memoria):
--   - Portal es LECTOR del ERP, no emisor (eliminamos invoices/line_items/etc)
--   - siesa_clasificacion es no-determinista, NUNCA filtrar por esa columna
--   - PP y descuento de fase APILAN (no son mutuamente excluyentes)
--   - PP solo se aplica al momento del pago, nunca en proyecciones
--   - NIT = identidad permanente del inquilino, contratos van y vienen
--   - ERP solo emite Activo/Critico, vacío = ausencia (no estado)
--   - Mora threshold = 30 días grace (configurable en reglas_financieras)
--   - Cartera siempre se ata a inquilino_id, no a contrato (debt persists)
--   - Agua incluida en canon, NO se factura aparte
--   - Gastos = electricidad medida + operacionales (no allocations table)
--
-- Convenciones:
--   - Snake_case minúsculas, español
--   - id uuid PK con uuid_generate_v4() default
--   - empresa_id en toda tabla operacional (filtro C-Krea/Reymon)
--   - last_synced_at para tablas espejadas desde ERP
--   - created_at/updated_at en todas las tablas mutables
--   - Trigger update_updated_at() (existente en DB)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SCHEMA v2 — coexiste con public.* legacy hasta Phase F
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS v2;
SET search_path TO v2, public, extensions;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE rol_usuario AS ENUM ('admin', 'finanzas', 'visor', 'inquilino');
CREATE TYPE estado_local AS ENUM ('arrendado', 'disponible', 'oficina', 'mantenimiento');
CREATE TYPE estado_contrato AS ENUM ('activo', 'critico', 'vencido', 'terminado');
CREATE TYPE categoria_gasto AS ENUM (
    'servicios_publicos', 'aseo_cafeteria', 'vigilancia', 'nomina',
    'publicidad', 'reparaciones', 'impuestos', 'otros'
);
CREATE TYPE metodo_asignacion AS ENUM ('pro_rata', 'fijo', 'medido', 'porcentaje');
CREATE TYPE estado_validacion_lectura AS ENUM ('aprobado', 'revision', 'critico', 'pendiente');

-- =============================================================================
-- 1. EMPRESAS — Filtro multi-empresa (C-Krea / Reymon)
-- =============================================================================

CREATE TABLE empresas (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          text NOT NULL,
    nit             text UNIQUE NOT NULL,
    siesa_co_id     text NOT NULL,                    -- '044' C-Krea
    siesa_canal_id  text,                              -- 'R08' C-Krea
    siesa_zona      text,                              -- 'Z40' C-Krea
    siesa_ccosto    text,                              -- '285' C-Krea
    activa          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE empresas IS 'Multi-empresa. Siesa contiene C-Krea + Reymon en mismas tablas. Empresa filtra todo.';

-- =============================================================================
-- 2. PERFILES — Usuarios autenticados (extiende auth.users)
-- =============================================================================

CREATE TABLE perfiles (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id      uuid NOT NULL REFERENCES empresas(id),
    inquilino_id    uuid,                              -- Solo para rol='inquilino' (portal)
    nombre_completo text NOT NULL,
    email           text NOT NULL,
    rol             rol_usuario NOT NULL DEFAULT 'visor',
    activo          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE perfiles IS 'Usuarios. Rol determina RLS. inquilino_id solo si rol=inquilino (portal).';

-- =============================================================================
-- 3. INQUILINOS — Arrendatarios. NIT = identidad permanente.
-- Sincroniza desde: siesa_raw.ocupacion (DOCUMENTO, RAZON_SOCIAL),
--                   siesa_raw.cartera (cliente, sucursal),
--                   siesa_raw.recaudo (cond_pago, tipo_cliente)
-- =============================================================================

CREATE TABLE inquilinos (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id          uuid NOT NULL REFERENCES empresas(id),
    -- Campos espejados desde ERP
    nit                 text NOT NULL,                  -- ocupacion.documento
    razon_social        text NOT NULL,                  -- ocupacion.razon_social
    nombre_corto        text,                            -- display
    tipo_cliente        text,                            -- recaudo.tipo_cliente ('1003')
    condicion_pago      text,                            -- 'CREDITO A 10 DIAS PP 10%'
    -- Campos solo del portal (nunca sobrescritos por sync)
    juridica            boolean NOT NULL DEFAULT false,  -- en proceso jurídico
    portal_email        text,                            -- login portal inquilino
    contacto_nombre     text,
    telefono            text,
    email_contacto      text,
    pp_historico_pct    numeric,                         -- cache, recomputado periódicamente
    pp_historico_pagos  integer NOT NULL DEFAULT 0,
    notas               text,
    -- Meta
    activo              boolean NOT NULL DEFAULT true,
    last_synced_at      timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, nit)
);

COMMENT ON TABLE inquilinos IS 'Inquilinos. NIT = identidad permanente. Sincroniza desde ERP. Cartera/pagos atan a inquilino_id, NO a contrato_id.';
COMMENT ON COLUMN inquilinos.juridica IS 'Si está en proceso jurídico. Excluye de KPIs de mora normales. Cambia retención (×1.155 vs ×1.19).';
COMMENT ON COLUMN inquilinos.pp_historico_pct IS 'Cache: % histórico de pagos con pronto pago aplicado. Recomputar tras cada sync. Tenants <10 pagos usan fallback global.';

-- =============================================================================
-- 4. LOCALES — Espacios físicos arrendables (85 unidades)
-- Sincroniza desde: siesa_raw.ocupacion (LOC, LOCAL, ENTRADA, ESTADO)
-- =============================================================================

CREATE TABLE locales (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id          uuid NOT NULL REFERENCES empresas(id),
    -- Campos espejados desde ERP
    unidad              text NOT NULL,                   -- ocupacion.loc ('101')
    codigo              text NOT NULL,                   -- ocupacion.local ('E1L101')
    entrada             text NOT NULL,                   -- ocupacion.entrada ('ENTRADA 1')
    -- Campos solo del portal
    clasificacion       text,                            -- '1A', 'C', etc
    area_m2             numeric(10,2),
    grupo_energia       text,                            -- cuál de las 6 facturas de energía
    tiene_medidor       boolean NOT NULL DEFAULT false,
    factura_consecutivo integer,
    notas               text,
    -- Estado derivado de ocupacion (vacío = disponible)
    estado              estado_local NOT NULL DEFAULT 'disponible',
    -- Meta
    last_synced_at      timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE locales IS 'Locales arrendables. ERP no emite estado=Inactivo, vacío = ausencia en ocupacion.';
COMMENT ON COLUMN locales.grupo_energia IS '1 de 6 grupos de facturación de energía (entrada-based). Drives cómo se reparten kWh.';

-- =============================================================================
-- 5. CONTRATOS — Inquilino × Local con términos financieros
-- Sincroniza desde: siesa_raw.ocupacion (INGRESO, LISTA, PRECIO, DESCUENTO,
--                   PRONTO_PAGO, ESTADO, UNO, ONCE, VEINTIUNO, CRITICO)
-- =============================================================================

CREATE TABLE contratos (
    id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id              uuid NOT NULL REFERENCES empresas(id),
    inquilino_id            uuid NOT NULL REFERENCES inquilinos(id),
    local_id                uuid NOT NULL REFERENCES locales(id),
    -- Campos espejados desde ERP
    fecha_inicio            date NOT NULL,                -- ocupacion.ingreso
    lista_precios           text,                          -- 'ACK'
    canon_base              numeric NOT NULL,              -- ocupacion.precio
    descuento_pct           numeric NOT NULL DEFAULT 0,    -- ocupacion.descuento
    pronto_pago_pct         numeric NOT NULL DEFAULT 0,    -- ocupacion.pronto_pago
    flag_uno                boolean NOT NULL DEFAULT false,
    flag_once               boolean NOT NULL DEFAULT false,
    flag_veintiuno          boolean NOT NULL DEFAULT false,
    flag_critico            boolean NOT NULL DEFAULT false,
    -- Campos solo del portal
    fecha_fin               date,
    incremento_ipc          numeric DEFAULT 0,
    fecha_incremento_ipc    date,
    descripcion_descuentos  text,
    estado                  estado_contrato NOT NULL DEFAULT 'activo',
    -- Meta
    last_synced_at          timestamptz,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE contratos IS 'Contratos. Lifecycle: activo→critico→vencido→terminado. ERP solo emite activo/critico — terminado es estado solo del portal.';
COMMENT ON COLUMN contratos.descuento_pct IS 'Descuento de fase (B). PP y este APILAN, NO son mutuamente excluyentes.';

-- =============================================================================
-- 6. PROYECCIONES — Pronóstico anual de ingresos (Excel-derived)
-- Mantenido como tabla porque se hace una vez al año.
-- =============================================================================

CREATE TABLE proyecciones (
    id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id              uuid NOT NULL REFERENCES empresas(id),
    contrato_id             uuid REFERENCES contratos(id),
    local_id                uuid NOT NULL REFERENCES locales(id),
    anio                    integer NOT NULL,
    mes                     integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
    canon_proyectado        numeric NOT NULL,
    descuento_proyectado    numeric NOT NULL DEFAULT 0,
    -- NO incluir pronto_pago_proyectado: PP solo se aplica al pago real
    notas                   text,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE(local_id, anio, mes)
);

COMMENT ON TABLE proyecciones IS 'Pronóstico anual. PP intencionalmente NO se proyecta — solo se aplica al momento del pago.';

-- =============================================================================
-- 7. LECTURAS_MEDIDOR — Lecturas de energía (input del portal del inquilino)
-- =============================================================================

CREATE TABLE lecturas_medidor (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id          uuid NOT NULL REFERENCES empresas(id),
    local_id            uuid NOT NULL REFERENCES locales(id),
    periodo             text NOT NULL,                  -- 'YYYY-MM'
    lectura_anterior    numeric NOT NULL,
    lectura_actual      numeric NOT NULL,
    kwh                 numeric NOT NULL,
    tarifa_kwh          numeric NOT NULL,
    total_energia       numeric NOT NULL,
    foto_url            text,
    foto_drive_id       text,
    notas               text,
    submitted_by        uuid REFERENCES perfiles(id),
    estado_validacion   estado_validacion_lectura NOT NULL DEFAULT 'pendiente',
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(local_id, periodo)
);

COMMENT ON TABLE lecturas_medidor IS 'Lecturas mensuales de energía. Validación: aprobado ±20%, revision ±40%, critico >40%.';

-- =============================================================================
-- 8. FACTURAS_ENERGIA — 6 facturas mensuales del proveedor (entrada-based)
-- =============================================================================

CREATE TABLE facturas_energia (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id      uuid NOT NULL REFERENCES empresas(id),
    periodo         text NOT NULL,                      -- 'YYYY-MM'
    grupo_energia   text NOT NULL,                       -- 1-6
    direccion       text NOT NULL,
    proveedor       text NOT NULL,
    fecha_factura   date,
    valor_factura   numeric NOT NULL,
    kwh_factura     numeric NOT NULL,
    tarifa_kwh      numeric NOT NULL,
    notas           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, periodo, grupo_energia)
);

COMMENT ON TABLE facturas_energia IS '6 facturas mensuales del proveedor de energía. Tarifa derivada (valor/kwh) usada para cobrar a inquilinos.';

-- =============================================================================
-- 9. TIPOS_GASTO — Catálogo de tipos de gasto
-- =============================================================================

CREATE TABLE tipos_gasto (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id          uuid NOT NULL REFERENCES empresas(id),
    categoria           categoria_gasto NOT NULL,
    nombre              text NOT NULL,
    descripcion         text,
    metodo_asignacion   metodo_asignacion NOT NULL DEFAULT 'pro_rata',
    es_facturable       boolean NOT NULL DEFAULT false,
    siesa_cuenta        text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tipos_gasto IS 'Catálogo. Solo electricidad y agua se facturan a inquilinos — el resto absorbe C-Krea.';

-- =============================================================================
-- 10. GASTOS — Gastos operacionales por período
-- =============================================================================

CREATE TABLE gastos (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id      uuid NOT NULL REFERENCES empresas(id),
    tipo_gasto_id   uuid NOT NULL REFERENCES tipos_gasto(id),
    periodo         text NOT NULL,                      -- 'YYYY-MM'
    monto_total     numeric NOT NULL,
    descripcion     text,
    observacion     text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE gastos IS 'Gastos operacionales. Sin tabla de allocations — se asignan via metodo_asignacion del tipo en query layer si aplica.';

-- =============================================================================
-- 11. REGLAS_FINANCIERAS — Configuración runtime (versionada)
-- =============================================================================

CREATE TABLE reglas_financieras (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id      uuid NOT NULL REFERENCES empresas(id),
    clave           text NOT NULL,                      -- 'iva_pct', 'mora_diaria', 'grace_dias', 'ipc_anual', 'pp_dias'
    valor           numeric NOT NULL,
    descripcion     text,
    fecha_desde     date NOT NULL DEFAULT CURRENT_DATE,
    fecha_hasta     date,                                -- NULL = vigente
    creado_por      uuid REFERENCES perfiles(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reglas_vigentes ON reglas_financieras (empresa_id, clave) WHERE fecha_hasta IS NULL;

COMMENT ON TABLE reglas_financieras IS 'Reglas: IVA 19%, mora 0.05%/día, grace 30 días, IPC anual, PP dentro de 10 días. Versionado por fecha_desde/fecha_hasta.';

-- =============================================================================
-- 12. AGENTE_CHAT — Historial del copiloto AI
-- =============================================================================

CREATE TABLE agente_chat (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     text NOT NULL,
    rol         text NOT NULL,                          -- 'user' | 'assistant'
    contenido   text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE agente_chat IS 'Transcripts del copiloto AI. Sin RLS — separado de datos financieros.';

-- =============================================================================
-- ÍNDICES OPERACIONALES
-- =============================================================================

CREATE INDEX idx_inquilinos_nit       ON inquilinos (empresa_id, nit);
CREATE INDEX idx_inquilinos_juridica  ON inquilinos (empresa_id, juridica) WHERE juridica = true;
CREATE INDEX idx_locales_codigo       ON locales (empresa_id, codigo);
CREATE INDEX idx_locales_estado       ON locales (empresa_id, estado);
CREATE INDEX idx_contratos_inquilino  ON contratos (inquilino_id, estado);
CREATE INDEX idx_contratos_local      ON contratos (local_id, estado);
CREATE INDEX idx_proy_local_periodo   ON proyecciones (local_id, anio, mes);
CREATE INDEX idx_lecturas_periodo     ON lecturas_medidor (empresa_id, periodo);
CREATE INDEX idx_gastos_periodo       ON gastos (empresa_id, periodo);

-- =============================================================================
-- TRIGGERS updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'empresas','perfiles','inquilinos','locales','contratos','proyecciones',
        'lecturas_medidor','facturas_energia','tipos_gasto','gastos','reglas_financieras'
    ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
    END LOOP;
END $$;

-- =============================================================================
-- FK CIRCULAR: perfiles.inquilino_id → inquilinos.id (después de crear ambos)
-- =============================================================================

ALTER TABLE perfiles
    ADD CONSTRAINT perfiles_inquilino_fk
    FOREIGN KEY (inquilino_id) REFERENCES inquilinos(id) ON DELETE SET NULL;
