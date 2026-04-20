-- =============================================================================
-- C-KREA PAYCONTROL — INITIAL DATABASE SCHEMA
-- Migration: 001_initial_schema
-- Date: 2026-04-15
-- Description: Complete Supabase-ready schema for C-Krea PayControl portal
--              covering tenants, contracts, units, invoices, payments, cartera,
--              gastos allocation, financial rules engine, and audit/ledger tables.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE unit_status AS ENUM ('arrendado', 'disponible', 'oficina', 'mantenimiento');
CREATE TYPE contract_status AS ENUM ('activo', 'critico', 'vencido', 'terminado');
CREATE TYPE invoice_status AS ENUM ('borrador', 'emitida', 'pagada', 'parcial', 'vencida', 'anulada');
CREATE TYPE payment_status AS ENUM ('recaudado', 'no_proyectado', 'vencido', 'parcial', 'anulado');
CREATE TYPE line_item_type AS ENUM ('canon', 'descuento', 'pronto_pago', 'iva', 'retencion', 'interes_mora', 'gasto_energia', 'gasto_acueducto', 'gasto_aseo', 'gasto_vigilancia', 'gasto_nomina', 'gasto_publicidad', 'gasto_reparaciones', 'gasto_otros');
CREATE TYPE gasto_category AS ENUM ('servicios_publicos', 'aseo_cafeteria', 'vigilancia', 'nomina', 'publicidad', 'reparaciones', 'impuestos', 'otros');
CREATE TYPE gasto_allocation_method AS ENUM ('pro_rata', 'fixed', 'metered', 'percentage');
CREATE TYPE sync_direction AS ENUM ('pull', 'push');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'success', 'error');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'OVERRIDE', 'WAIVE', 'SYNC');
CREATE TYPE user_role AS ENUM ('admin', 'finance', 'viewer', 'tenant');

-- =============================================================================
-- 1. COMPANIES — Multi-company filter (C-Krea vs Raymond)
-- =============================================================================

CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    nit             TEXT UNIQUE NOT NULL,              -- Colombian tax ID
    siesa_co_id     TEXT NOT NULL,                     -- Siesa CO identifier (e.g., '044')
    siesa_ccosto    TEXT,                              -- Siesa centro de costo (e.g., '285')
    siesa_canal_id  TEXT,                              -- Siesa canal (e.g., 'R08')
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE companies IS 'Multi-company filter. Siesa DB contains both C-Krea and Raymond — must filter from day one.';

-- =============================================================================
-- 2. USERS / PROFILES — Extends Supabase auth.users
-- =============================================================================

CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id),
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'viewer',
    tenant_id       UUID,                              -- Set for Phase 2 tenant self-service
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth. role determines RLS access level.';

-- =============================================================================
-- 3. TENANTS — Rental clients (arrendatarios)
-- Siesa mapping: Ocupacion.DOCUMENTO/RAZON_SOCIAL, Cartera.Documento/Cliente
-- =============================================================================

CREATE TABLE tenants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    nit                 TEXT NOT NULL,                  -- Siesa: Ocupacion.DOCUMENTO, Cartera.Documento
    razon_social        TEXT NOT NULL,                  -- Siesa: Ocupacion.RAZON_SOCIAL, Cartera.Cliente
    nombre_corto        TEXT,                           -- Display name
    tipo_cliente        TEXT,                           -- Siesa: Documentos.tipo_cliente (e.g., '1003')
    condicion_pago      TEXT,                           -- Siesa: Recaudo.CondPago (e.g., 'CREDITO A 10 DIAS PP 10%')
    email               TEXT,
    telefono            TEXT,
    contacto_nombre     TEXT,
    siesa_row_id        TEXT,                           -- Siesa: Cartera.RowIdTercero
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, nit)
);

COMMENT ON TABLE tenants IS 'Rental tenants. NIT is the Colombian tax ID used as primary Siesa identifier.';

-- =============================================================================
-- 4. UNITS — Physical rental spaces (locales)
-- Siesa mapping: Ocupacion.ENTRADA/LOC/LOCAL/ESTADO
-- =============================================================================

CREATE TABLE units (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    unit_number         TEXT NOT NULL,                  -- Siesa: Ocupacion.LOC (e.g., '101')
    unit_code           TEXT NOT NULL,                  -- Siesa: Ocupacion.LOCAL (e.g., 'E1L101')
    entrada             TEXT NOT NULL,                  -- Siesa: Ocupacion.ENTRADA (e.g., 'ENTRADA 1')
    clasificacion       TEXT,                           -- From projection: '1A', 'C', etc.
    factura_consecutivo INTEGER,                        -- From projection: FACTURA #
    status              unit_status NOT NULL DEFAULT 'disponible',
    area_m2             NUMERIC(10,2),
    has_electricity_meter BOOLEAN NOT NULL DEFAULT false,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, unit_number)
);

COMMENT ON TABLE units IS 'Physical rental units (locales). 85 total across 6 entradas + Zona 8.';

-- =============================================================================
-- 5. CONTRACTS — Links tenant to unit with financial terms
-- Siesa mapping: Ocupacion.INGRESO/LISTA/PRECIO/DESCUENTO/PRONTO_PAGO
-- =============================================================================

CREATE TABLE contracts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    unit_id                 UUID NOT NULL REFERENCES units(id),
    -- Core terms
    fecha_inicio            DATE NOT NULL,              -- Siesa: Ocupacion.INGRESO
    fecha_fin               DATE,
    lista_precios           TEXT,                       -- Siesa: Ocupacion.LISTA (e.g., 'ACK')
    canon_base              NUMERIC(15,2) NOT NULL,     -- Siesa: Ocupacion.PRECIO
    -- IPC (annual CPI adjustment)
    incremento_ipc          NUMERIC(15,2) DEFAULT 0,    -- From projection: INCREMENTO IPC
    fecha_incremento_ipc    DATE,                       -- From projection: FECHA INCREMENTO IPC
    -- Default discount/pronto pago from Siesa
    descuento_pct           NUMERIC(5,2) DEFAULT 0,     -- Siesa: Ocupacion.DESCUENTO (e.g., 20%)
    pronto_pago_pct         NUMERIC(5,2) DEFAULT 0,     -- Siesa: Ocupacion.PRONTO_PAGO (e.g., 10%)
    -- Late interest
    interes_mora_rate       NUMERIC(8,6),               -- Daily rate, overrides global if set
    grace_period_days       INTEGER DEFAULT 0,           -- Days after due before interest starts
    -- Status
    status                  contract_status NOT NULL DEFAULT 'activo',
    descripcion_descuentos  TEXT,                        -- From projection: free-text description of discount phases
    -- Siesa flags for criticality
    flag_uno                BOOLEAN DEFAULT false,       -- Siesa: Ocupacion.UNO
    flag_once               BOOLEAN DEFAULT false,       -- Siesa: Ocupacion.ONCE
    flag_veintiuno          BOOLEAN DEFAULT false,       -- Siesa: Ocupacion.VEINTIUNO
    flag_critico            BOOLEAN DEFAULT false,       -- Siesa: Ocupacion.CRITICO
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE contracts IS 'Rental agreements linking tenant→unit with financial terms. One active contract per unit.';

-- =============================================================================
-- 6. CONTRACT PHASES — Time-based discount phases
-- PRD Rule B: configurable phases (Phase 1, 2, 3+)
-- Derived from: projection "Descripción" column
-- e.g., "Enero 20% +10 pp hasta mayo y luego 10 pp"
-- =============================================================================

CREATE TABLE contract_phases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    phase_number        INTEGER NOT NULL,               -- 1, 2, 3...
    name                TEXT NOT NULL,                   -- e.g., 'Fase 1 - Descuento 20%'
    start_date          DATE NOT NULL,
    end_date            DATE,                            -- NULL = ongoing
    descuento_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,-- Discount % for this phase
    pronto_pago_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,-- PP % for this phase
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(contract_id, phase_number)
);

COMMENT ON TABLE contract_phases IS 'Contract-phase discounts (PRD Rule B). Phases define time windows with different discount/PP percentages.';

-- =============================================================================
-- 7. FINANCIAL RULES — Global configurable rules
-- PRD: Financial Rules Engine parameters
-- =============================================================================

CREATE TABLE financial_rules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id),
    rule_key                TEXT NOT NULL,               -- e.g., 'interes_mora_diario', 'pp_window_days'
    rule_value              NUMERIC(15,6) NOT NULL,
    description             TEXT,
    effective_from          DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until          DATE,                        -- NULL = currently active
    created_by              UUID REFERENCES profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, rule_key, effective_from)
);

COMMENT ON TABLE financial_rules IS 'Global financial rules: daily interest rate, pronto-pago window (10 days), grace period, etc.';

-- Seed default rules
-- INSERT INTO financial_rules (company_id, rule_key, rule_value, description) VALUES
-- (<ckrea_id>, 'pp_window_days', 10, 'Early payment discount window in days from due date'),
-- (<ckrea_id>, 'interes_mora_diario', 0.000667, 'Daily late-interest rate (approx 2% monthly / 24% annual)'),
-- (<ckrea_id>, 'grace_period_days', 0, 'Default grace period before interest starts');

-- =============================================================================
-- 8. INVOICES — Monthly billing documents (facturas)
-- Siesa mapping: Documentos.documento/periodo/ventas/impuesto/retenciones
-- =============================================================================

CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id),
    contract_id             UUID NOT NULL REFERENCES contracts(id),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    unit_id                 UUID NOT NULL REFERENCES units(id),
    -- Siesa document reference
    siesa_documento         TEXT,                        -- Siesa: Documentos.documento (e.g., '001-FVS-69736')
    siesa_periodo           TEXT,                        -- Siesa: Documentos.periodo (e.g., '202601')
    siesa_auxiliar          TEXT,                        -- Siesa: Documentos.auxiliar
    siesa_tipo              TEXT,                        -- Siesa: Documentos.tipo (Facturas/Descuentos)
    -- Dates
    fecha_emision           DATE NOT NULL,
    fecha_vencimiento       DATE NOT NULL,
    fecha_pronto_pago       DATE,                       -- fecha_emision + pp_window_days
    periodo                 TEXT NOT NULL,               -- YYYYMM format
    -- Amounts (ledger: immutable once emitted)
    subtotal_canon          NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal_descuentos     NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal_pronto_pago    NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal_gastos         NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal_interes        NUMERIC(15,2) NOT NULL DEFAULT 0,
    iva                     NUMERIC(15,2) NOT NULL DEFAULT 0,    -- Siesa: Documentos.impuesto
    retenciones             NUMERIC(15,2) NOT NULL DEFAULT 0,    -- Siesa: Documentos.retenciones
    total                   NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo                   NUMERIC(15,2) NOT NULL DEFAULT 0,    -- Remaining balance
    -- Status
    status                  invoice_status NOT NULL DEFAULT 'borrador',
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_periodo ON invoices(periodo);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_siesa_doc ON invoices(siesa_documento);

COMMENT ON TABLE invoices IS 'Monthly invoice headers. Line items stored separately for Siesa reconciliation.';

-- =============================================================================
-- 9. INVOICE LINE ITEMS — Detailed breakdown per invoice
-- Each discount, interest charge, and gasto = separate line for Siesa XML push
-- =============================================================================

CREATE TABLE invoice_line_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    type                line_item_type NOT NULL,
    description         TEXT NOT NULL,
    amount              NUMERIC(15,2) NOT NULL,         -- Positive for charges, negative for discounts
    tax_amount          NUMERIC(15,2) DEFAULT 0,
    siesa_cuenta        TEXT,                           -- Siesa account code (e.g., '42201006')
    reference_id        UUID,                           -- FK to gasto_allocation, interest_accrual, etc.
    sort_order          INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_type ON invoice_line_items(type);

COMMENT ON TABLE invoice_line_items IS 'Invoice line items. Discounts, interest, and gastos are separate lines for Siesa XML compatibility.';

-- =============================================================================
-- 10. PAYMENTS — Payment receipts (recaudos)
-- Siesa mapping: Recaudo columns
-- =============================================================================

CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    -- Siesa references
    siesa_docto             TEXT,                        -- Siesa: Recaudo.Docto (e.g., '001-RK-543')
    siesa_cruce             TEXT,                        -- Siesa: Recaudo.Cruce (matched invoice)
    siesa_clasificacion     TEXT,                        -- Siesa: Recaudo.Clasificacion
    -- Dates
    fecha_recaudo           DATE NOT NULL,               -- Siesa: Recaudo.FechaRecaudo
    fecha_pronto_pago       DATE,                        -- Siesa: Recaudo.FechaPp
    fecha_vencimiento       DATE,                        -- Siesa: Recaudo.FechaVcto
    fecha_factura           DATE,                        -- Siesa: Recaudo.FechaFact
    -- Amounts
    valor_aplicado          NUMERIC(15,2) NOT NULL,      -- Siesa: Recaudo.ValorAplicado
    pronto_pago_aplicado    NUMERIC(15,2) DEFAULT 0,     -- Siesa: Recaudo.ProntoPago
    valor_final             NUMERIC(15,2) NOT NULL,      -- Siesa: Recaudo.ValorFinal
    -- Status
    status                  payment_status NOT NULL DEFAULT 'recaudado',
    concepto                TEXT,                         -- e.g., 'CANON', 'LUZ', 'DEPOSITO'
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_fecha ON payments(fecha_recaudo);
CREATE INDEX idx_payments_siesa_docto ON payments(siesa_docto);

COMMENT ON TABLE payments IS 'Payment records from Siesa Recaudo. Includes canon payments and gastos (electricity, etc.).';

-- =============================================================================
-- 11. PAYMENT APPLICATIONS — How payments apply to invoices (ledger pattern)
-- =============================================================================

CREATE TABLE payment_applications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id          UUID NOT NULL REFERENCES payments(id),
    invoice_id          UUID NOT NULL REFERENCES invoices(id),
    amount_applied      NUMERIC(15,2) NOT NULL,
    applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pay_app_payment ON payment_applications(payment_id);
CREATE INDEX idx_pay_app_invoice ON payment_applications(invoice_id);

COMMENT ON TABLE payment_applications IS 'Ledger: maps each payment to one or more invoices with exact amounts.';

-- =============================================================================
-- 12. INTEREST ACCRUALS — Daily late-payment interest (PRD Rule C)
-- =============================================================================

CREATE TABLE interest_accruals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id),
    contract_id         UUID NOT NULL REFERENCES contracts(id),
    accrual_date        DATE NOT NULL,
    days_overdue        INTEGER NOT NULL,
    overdue_balance     NUMERIC(15,2) NOT NULL,          -- Balance on which interest is calculated
    daily_rate          NUMERIC(10,8) NOT NULL,
    interest_amount     NUMERIC(15,2) NOT NULL,
    cumulative_interest NUMERIC(15,2) NOT NULL,          -- Running total for this invoice
    is_waived           BOOLEAN NOT NULL DEFAULT false,
    waived_by           UUID REFERENCES profiles(id),
    waived_reason       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interest_invoice ON interest_accruals(invoice_id);
CREATE INDEX idx_interest_date ON interest_accruals(accrual_date);

COMMENT ON TABLE interest_accruals IS 'Daily late-interest accrual records (PRD Rule C). Accumulated per overdue invoice.';

-- =============================================================================
-- 13. CARTERA — Receivables snapshot (synced from Siesa)
-- Siesa mapping: Cartera sheet columns
-- =============================================================================

CREATE TABLE cartera (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    invoice_id              UUID REFERENCES invoices(id),
    -- Siesa fields
    siesa_row_id            TEXT,                        -- Siesa: Cartera.RowId
    siesa_factura           TEXT,                        -- Siesa: Cartera.Factura
    siesa_sucursal          TEXT,                        -- Siesa: Cartera.Sucursal
    observacion             TEXT,                        -- Siesa: Cartera.Obs
    fecha_factura           DATE,                        -- Siesa: Cartera.FechaFactura
    fecha_pronto_pago       DATE,                        -- Siesa: Cartera.FechaProntoPago
    fecha_vence             DATE,                        -- Siesa: Cartera.FechaVence
    dias_mora               INTEGER,                     -- Siesa: Cartera.Dias
    dias_financia           INTEGER,                     -- Siesa: Cartera.Financia
    saldo                   NUMERIC(15,2) NOT NULL,      -- Siesa: Cartera.Saldo
    valor_vencido           NUMERIC(15,2),               -- Siesa: Cartera.VrVencido
    -- Enriched by portal
    interes_acumulado       NUMERIC(15,2) DEFAULT 0,
    gastos_pendientes       NUMERIC(15,2) DEFAULT 0,
    total_deuda             NUMERIC(15,2) GENERATED ALWAYS AS (saldo + COALESCE(interes_acumulado, 0) + COALESCE(gastos_pendientes, 0)) STORED,
    last_synced_at          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cartera_tenant ON cartera(tenant_id);
CREATE INDEX idx_cartera_dias ON cartera(dias_mora);

COMMENT ON TABLE cartera IS 'Receivables from Siesa Cartera, enriched with portal-calculated interest and gastos.';

-- =============================================================================
-- 14. GASTO TYPES — Categories of shared expenses
-- =============================================================================

CREATE TABLE gasto_types (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    category            gasto_category NOT NULL,
    name                TEXT NOT NULL,                   -- e.g., 'Energía', 'Acueducto', 'T-protec'
    description         TEXT,
    allocation_method   gasto_allocation_method NOT NULL DEFAULT 'pro_rata',
    is_billable         BOOLEAN NOT NULL DEFAULT true,   -- Whether allocated to tenants
    siesa_cuenta        TEXT,                            -- Siesa account code for reconciliation
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

COMMENT ON TABLE gasto_types IS 'Shared expense categories (PRD Rule D). Defines how each type is allocated.';

-- =============================================================================
-- 15. GASTOS — Monthly shared expense records
-- Source: C-KREA GB 4. GASTOS sheet
-- =============================================================================

CREATE TABLE gastos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    gasto_type_id       UUID NOT NULL REFERENCES gasto_types(id),
    periodo             TEXT NOT NULL,                   -- YYYYMM
    total_amount        NUMERIC(15,2) NOT NULL,
    description         TEXT,
    observacion         TEXT,
    is_allocated        BOOLEAN NOT NULL DEFAULT false,  -- Has been distributed to tenants
    allocated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gastos_periodo ON gastos(periodo);

COMMENT ON TABLE gastos IS 'Monthly shared expense totals. Distributed to tenants via gasto_allocations.';

-- =============================================================================
-- 16. GASTO ALLOCATIONS — Per-unit distribution of shared expenses
-- Source: Electricity detail from GASTOS sheet (LUZ records)
-- =============================================================================

CREATE TABLE gasto_allocations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gasto_id            UUID NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    unit_id             UUID NOT NULL REFERENCES units(id),
    contract_id         UUID REFERENCES contracts(id),
    invoice_id          UUID REFERENCES invoices(id),    -- Linked once billed
    -- Allocation details
    amount              NUMERIC(15,2) NOT NULL,
    allocation_method   gasto_allocation_method NOT NULL,
    allocation_basis    TEXT,                            -- e.g., 'meter reading', 'equal split', 'area m2'
    -- For metered (electricity)
    meter_reading       NUMERIC(15,2),
    siesa_cruce         TEXT,                           -- Siesa invoice ref for reconciliation
    siesa_rk            TEXT,                           -- Siesa RK document number
    -- Status
    is_billed           BOOLEAN NOT NULL DEFAULT false,
    is_paid             BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gasto_alloc_tenant ON gasto_allocations(tenant_id);
CREATE INDEX idx_gasto_alloc_gasto ON gasto_allocations(gasto_id);

COMMENT ON TABLE gasto_allocations IS 'Per-tenant allocation of shared expenses (PRD Rule D). Electricity is metered; others pro-rata.';

-- =============================================================================
-- 17. PROJECTIONS — Monthly canon/discount/PP projections per unit
-- Source: C-KREA GB PROYECCION RECAUDO 2026 / PROYECCION MENSUAL
-- =============================================================================

CREATE TABLE projections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    contract_id         UUID REFERENCES contracts(id),
    unit_id             UUID NOT NULL REFERENCES units(id),
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,               -- 1-12
    canon_proyectado    NUMERIC(15,2) NOT NULL DEFAULT 0,
    descuento_proyectado NUMERIC(15,2) NOT NULL DEFAULT 0,
    pronto_pago_proyectado NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(unit_id, year, month)
);

COMMENT ON TABLE projections IS 'Monthly revenue projections per unit from the C-KREA GB workbook. Used for variance analysis.';

-- =============================================================================
-- 18. ACCOUNTING ENTRIES — Estado de resultados (P&L)
-- Siesa mapping: Estado de resultados sheet
-- =============================================================================

CREATE TABLE accounting_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    siesa_documento     TEXT NOT NULL,                   -- Siesa: DOCUMENTO
    notas               TEXT,                            -- Siesa: NOTAS
    cuenta              TEXT NOT NULL,                   -- Siesa: CUENTA (e.g., '52050601')
    desc_cuenta         TEXT,                            -- Siesa: DESC_CUENTA
    co                  TEXT,                            -- Siesa: CO
    ccosto              TEXT,                            -- Siesa: CCOSTO
    desc_ccosto         TEXT,                            -- Siesa: DESC_CCOSTO
    periodo             TEXT NOT NULL,                   -- Siesa: PERIODO (e.g., '202604')
    valor               NUMERIC(15,2) NOT NULL,          -- Siesa: VALOR
    last_synced_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_acct_entries_periodo ON accounting_entries(periodo);
CREATE INDEX idx_acct_entries_cuenta ON accounting_entries(cuenta);

COMMENT ON TABLE accounting_entries IS 'P&L accounting entries from Siesa Estado de resultados. Read-only sync for reporting.';

-- =============================================================================
-- 19. SIESA SYNC LOG — Bidirectional sync tracking
-- =============================================================================

CREATE TABLE siesa_sync_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    direction           sync_direction NOT NULL,
    entity_type         TEXT NOT NULL,                   -- e.g., 'invoices', 'payments', 'cartera'
    entity_id           UUID,
    siesa_document_ref  TEXT,
    status              sync_status NOT NULL DEFAULT 'pending',
    request_payload     JSONB,                          -- XML or query sent
    response_payload    JSONB,                          -- Response from Siesa
    error_message       TEXT,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_status ON siesa_sync_log(status);
CREATE INDEX idx_sync_entity ON siesa_sync_log(entity_type, entity_id);

COMMENT ON TABLE siesa_sync_log IS 'Tracks every pull/push to Siesa for 100% reconciliation. Stores XML payloads for audit.';

-- =============================================================================
-- 20. AUDIT LOG — Full change history (immutable ledger)
-- =============================================================================

CREATE TABLE audit_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    user_id             UUID REFERENCES profiles(id),
    action              audit_action NOT NULL,
    entity_type         TEXT NOT NULL,                   -- Table name
    entity_id           UUID NOT NULL,
    old_values          JSONB,
    new_values          JSONB,
    reason              TEXT,                            -- Mandatory for overrides/waivers
    ip_address          INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

COMMENT ON TABLE audit_log IS 'Immutable audit trail. Every change, override, waiver, and sync is recorded with mandatory reason.';

-- =============================================================================
-- 21. NOTIFICATIONS — Alerts for late payments, interest, gastos
-- =============================================================================

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id),
    tenant_id           UUID REFERENCES tenants(id),
    user_id             UUID REFERENCES profiles(id),    -- Target user (admin or tenant)
    type                TEXT NOT NULL,                    -- e.g., 'payment_reminder', 'interest_alert', 'gasto_allocation'
    title               TEXT NOT NULL,
    body                TEXT,
    reference_type      TEXT,                            -- e.g., 'invoice', 'cartera'
    reference_id        UUID,
    is_read             BOOLEAN NOT NULL DEFAULT false,
    sent_at             TIMESTAMPTZ,
    channel             TEXT,                            -- 'email', 'sms', 'in_app'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

COMMENT ON TABLE notifications IS 'Email/SMS/in-app alerts for payment reminders, interest accrual, gastos.';

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            t
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_accruals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartera ENABLE ROW LEVEL SECURITY;
ALTER TABLE gasto_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gasto_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE siesa_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's company_id
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's tenant_id (Phase 2)
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── COMPANY-SCOPED READ for all internal tables ───
-- Admin/Finance: full read within their company
-- Viewer: read-only within company
-- Tenant: reads only their own records (Phase 2)

-- Macro: apply standard company-scoped policies
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN VALUES
        ('tenants'), ('units'), ('contracts'), ('contract_phases'),
        ('invoices'), ('invoice_line_items'), ('payments'),
        ('payment_applications'), ('interest_accruals'), ('cartera'),
        ('gasto_types'), ('gastos'), ('gasto_allocations'),
        ('projections'), ('accounting_entries'), ('financial_rules')
    LOOP
        -- SELECT: company-scoped for admin/finance/viewer
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT USING (
                company_id = auth.user_company_id()
                OR (auth.user_role() = ''tenant'' AND tenant_id = auth.user_tenant_id())
            )',
            'policy_select_' || tbl, tbl
        );
        -- INSERT/UPDATE/DELETE: admin and finance only
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (
                company_id = auth.user_company_id()
                AND auth.user_role() IN (''admin'', ''finance'')
            )',
            'policy_insert_' || tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR UPDATE USING (
                company_id = auth.user_company_id()
                AND auth.user_role() IN (''admin'', ''finance'')
            )',
            'policy_update_' || tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR DELETE USING (
                company_id = auth.user_company_id()
                AND auth.user_role() = ''admin''
            )',
            'policy_delete_' || tbl, tbl
        );
    END LOOP;
END;
$$;

-- Special policies for tables without company_id directly
-- invoice_line_items: access through invoice
CREATE POLICY policy_select_line_items ON invoice_line_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.id = invoice_line_items.invoice_id
        AND i.company_id = auth.user_company_id()
    ));

-- payment_applications: access through payment
CREATE POLICY policy_select_pay_apps ON payment_applications FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM payments p
        WHERE p.id = payment_applications.payment_id
        AND p.company_id = auth.user_company_id()
    ));

-- Profiles: users see their own profile
CREATE POLICY policy_select_profiles ON profiles FOR SELECT
    USING (id = auth.uid() OR company_id = auth.user_company_id());

CREATE POLICY policy_update_profiles ON profiles FOR UPDATE
    USING (id = auth.uid() OR auth.user_role() = 'admin');

-- Companies: users see their own company
CREATE POLICY policy_select_companies ON companies FOR SELECT
    USING (id = auth.user_company_id());

-- Audit log: read-only, admin/finance within company
CREATE POLICY policy_select_audit ON audit_log FOR SELECT
    USING (company_id = auth.user_company_id() AND auth.user_role() IN ('admin', 'finance'));

CREATE POLICY policy_insert_audit ON audit_log FOR INSERT
    WITH CHECK (company_id = auth.user_company_id());

-- Siesa sync log: admin only
CREATE POLICY policy_select_sync ON siesa_sync_log FOR SELECT
    USING (company_id = auth.user_company_id() AND auth.user_role() = 'admin');

CREATE POLICY policy_insert_sync ON siesa_sync_log FOR INSERT
    WITH CHECK (company_id = auth.user_company_id());

-- Notifications: user sees their own
CREATE POLICY policy_select_notif ON notifications FOR SELECT
    USING (user_id = auth.uid() OR (company_id = auth.user_company_id() AND auth.user_role() = 'admin'));

