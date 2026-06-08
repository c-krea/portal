-- =============================================================================
-- C-KREA PAYCONTROL — ESQUEMA SIMPLIFICADO v2
-- 02_vistas.sql — Vistas (4)
-- Fecha: 2026-04-26
-- =============================================================================
-- Vistas que derivan de siesa_raw.* + join a public.inquilinos/locales.
-- Aquí viven los 4 filtros canónicos de recaudo (FVS + dedup + <1B + zona).
-- Toda lectura del portal y del copiloto AI pasa por estas vistas o sus RPCs.
-- =============================================================================
-- Lecciones aplicadas:
--   - siesa_clasificacion (recaudo.clasificacion) NUNCA se filtra ni se expone
--   - Dedup obligatorio: 001-RK + RK pareados son una sola transacción
--   - valor_final < 1_000_000_000 excluye error de FUSION GRAFIK 2024-04-09
--   - cruce LIKE 'FVS-%' excluye NVS/RK/RKM/CN/NUL (plumbing ERP)
--   - Match inquilinos por NIT: recaudo.documento / cartera.documento / documentos.doc
--     (NUNCA cartera.cliente ni documentos.cliente — esos son razón social, no NIT)
--   - vista expone histórico completo; cortes temporales viven en RPCs (decisión 2026-04-26 opción B)
--   - vendedor/cobrador omitidos en vista_cartera_actual (valor único, deadweight)
-- =============================================================================

-- =============================================================================
-- SCHEMA v2 — vistas viven aquí, coexisten con public.* legacy hasta Phase F
-- =============================================================================

SET search_path TO v2, public;

-- =============================================================================
-- VISTA 1 — vista_pagos
-- Recaudo limpio: 4 filtros canónicos + dedup + join a inquilinos/locales
-- Reemplaza public.payments. Si query toca pagos, usar esta vista.
-- =============================================================================

CREATE OR REPLACE VIEW vista_pagos AS
WITH recaudo_dedup AS (
    -- Dedup por ID único de movimiento ERP (row_id_mov es 100% único en recaudo).
    -- NO usar DISTINCT ON (documento, cruce, fecha_recaudo): colapsaba pagos
    -- parciales/abonos legítimos hechos a la MISMA factura el MISMO día, descartando
    -- el segundo en silencio (bug 2026-06-08: 54 pagos reales / $66.137.912 perdidos,
    -- 0 duplicados verdaderos). Un inquilino paga una factura en varios recibos (RK-),
    -- cada recibo es un pago real y debe contarse. Ver JOURNAL Session 60.
    SELECT DISTINCT ON (r.row_id_mov)
        r.docto,
        r.cruce,
        r.fecha_recaudo::date            AS fecha_recaudo,
        r.fecha_fact::date               AS fecha_factura,
        r.fecha_vcto::date               AS fecha_vencimiento,
        r.fecha_pp::date                 AS fecha_pronto_pago,
        r.documento                      AS nit_inquilino,
        r.cliente                        AS razon_social_raw,
        r.cond_pago,
        r.tipo_cliente,
        r.valor_final,
        r.pronto_pago                    AS pronto_pago_aplicado,
        r.valor_aplicado
    FROM siesa_raw.recaudo r
    WHERE r.cruce LIKE 'FVS-%'                      -- Filtro 2: solo facturas reales
      AND r.valor_final < 1000000000                 -- Filtro 4: excluye outlier FUSION GRAFIK
      AND r.id_zona = 'Z40'                          -- Filtro 1 equivalente (C-Krea zone)
    -- NOTA: NO se aplica corte de fecha aquí. Vista expone histórico completo.
    -- Cada RPC/consumidor decide su ventana temporal vía parámetros.
    -- Default sugerido para queries operativas: fecha_recaudo >= '2025-01-01' (2024 es ruidoso).
    -- Backfills (e.g. pp_historico_pct) leen TODO para máxima señal histórica.
    -- NOTA Eliminado: la vista NO filtra "Eliminado". Eliminado=true = histórico que
    -- salió de la ventana rodante del ERP (~2 meses), NO anulaciones. Corte limpio por
    -- fecha (verificado 2026-06-08): pagos antes de ~abr-2026 = Eliminado=true pero válidos.
    ORDER BY r.row_id_mov
)
SELECT
    rd.docto,
    rd.cruce,
    rd.fecha_recaudo,
    rd.fecha_factura,
    rd.fecha_vencimiento,
    rd.fecha_pronto_pago,
    rd.valor_final,
    rd.pronto_pago_aplicado,
    rd.valor_aplicado,
    rd.cond_pago,
    rd.tipo_cliente,
    rd.nit_inquilino,
    rd.razon_social_raw,
    -- Join a inquilinos (puede ser NULL si NIT aún no espejado)
    i.id            AS inquilino_id,
    i.empresa_id,
    i.razon_social,
    i.juridica,
    -- PP fue otorgado si el pago llegó dentro del plazo
    (rd.pronto_pago_aplicado > 0)                                    AS pp_otorgado,
    -- Días de mora al momento del pago (negativo = pagó temprano)
    (rd.fecha_recaudo - rd.fecha_vencimiento)                        AS dias_mora_al_pago
FROM recaudo_dedup rd
LEFT JOIN inquilinos i
       ON i.nit = rd.nit_inquilino;

COMMENT ON VIEW vista_pagos IS 'Recaudo limpio. Aplica 4 filtros canónicos (FVS + dedup + <1B + Z40). Reemplaza public.payments.';

-- =============================================================================
-- VISTA 2 — vista_cartera_actual
-- Cartera viva con buckets de mora + join a inquilinos
-- =============================================================================

CREATE OR REPLACE VIEW vista_cartera_actual AS
SELECT
    c.row_id,
    c.documento,
    c.factura,
    c.fecha_factura::date           AS fecha_factura,
    c.fecha_pronto_pago::date       AS fecha_pronto_pago,
    c.fecha_vence::date             AS fecha_vencimiento,
    c.dias                          AS dias_mora,
    c.financia                      AS dias_financia,
    c.vr_corriente,
    c.vr_vencido,
    c.saldo,
    c.documento                     AS nit_inquilino,
    c.cliente                       AS razon_social_raw,
    c.sucursal,
    -- vendedor/cobrador omitidos: siempre valor único (deadweight)
    c.zona,
    -- Join a inquilinos
    i.id                            AS inquilino_id,
    i.empresa_id,
    i.razon_social,
    i.juridica,
    -- Bucket de mora (dias)
    CASE
        WHEN c.dias <= 0       THEN 'corriente'
        WHEN c.dias <= 30      THEN '1-30'
        WHEN c.dias <= 60      THEN '31-60'
        WHEN c.dias <= 90      THEN '61-90'
        WHEN c.dias <= 180     THEN '91-180'
        ELSE '180+'
    END                             AS bucket_mora,
    -- Flag de mora "real" considerando grace 30d
    (c.dias > 30)                   AS en_mora_real
FROM siesa_raw.cartera c
LEFT JOIN inquilinos i
       ON i.nit = c.documento
WHERE c.id_zona = 'Z40'                              -- C-Krea
  AND c.saldo > 0;                                   -- Cartera viva (no canceladas)

COMMENT ON VIEW vista_cartera_actual IS 'Cartera abierta con buckets de mora. Grace 30 días — en_mora_real solo si dias>30.';

-- =============================================================================
-- VISTA 3 — vista_facturas
-- Documentos (facturación tributaria) + join a inquilinos
-- =============================================================================

CREATE OR REPLACE VIEW vista_facturas AS
SELECT
    d.documento                     AS doc_id,         -- '001-FVS-69736' (factura ID, no NIT)
    d.doc                           AS nit_inquilino,   -- NIT real
    d.periodo,
    d.tipo,
    d.cliente                       AS razon_social_raw,
    d.tipo_cliente,
    d.auxiliar,
    d.ventas                        AS base_neta,
    d.impuesto                      AS iva,
    d.retenciones,
    -- Subtotal contable: ventas + iva - retenciones
    (d.ventas + d.impuesto - d.retenciones) AS valor_total,
    d.id_canal,
    d.canal,
    d.id_co,
    d.co,
    -- Join a inquilinos
    i.id                            AS inquilino_id,
    i.empresa_id,
    i.razon_social,
    i.juridica,
    -- Prefijo del documento (FVS/NVS/RK/etc) — útil para filtrar
    SPLIT_PART(d.documento, '-', 2) AS prefijo_doc,     -- '001-FVS-69736' → 'FVS'
    -- Flags de tipo: consumidor decide si filtra o agrega
    -- Descuentos = PP del 10% como docto contable separado (RK-/CN- prefix), ventas negativa
    (d.tipo = 'Facturas')           AS is_factura,
    (d.tipo = 'Descuentos')         AS is_descuento
FROM siesa_raw.documentos d
LEFT JOIN inquilinos i
       ON i.nit = d.doc
WHERE LPAD(d.id_co, 3, '0') = '044'                  -- pandas strips leading zero ('044'→'44')
  AND d.id_canal = 'R08';                            -- C-Krea carve-out

COMMENT ON VIEW vista_facturas IS 'Documentos contables (FVS/NVS/RK...). Filtra C-Krea via id_co=044 + id_canal=R08. NOTA: documentos es snapshot rolling de 4 meses, no histórico. Expone is_factura/is_descuento — consumidor filtra según contexto (totales facturados=is_factura; PP otorgado=is_descuento). Decisión task #11 (Session 35).';

-- =============================================================================
-- VISTA 4 — vista_mora_buckets
-- Resumen agregado: total cartera por bucket × empresa
-- =============================================================================

CREATE OR REPLACE VIEW vista_mora_buckets AS
SELECT
    empresa_id,
    bucket_mora,
    COUNT(*)                AS num_facturas,
    SUM(saldo)              AS saldo_total,
    SUM(vr_vencido)         AS vencido_total,
    SUM(vr_corriente)       AS corriente_total,
    COUNT(DISTINCT inquilino_id) AS num_inquilinos
FROM vista_cartera_actual
WHERE juridica IS NOT TRUE                           -- Excluye procesos jurídicos
GROUP BY empresa_id, bucket_mora;

COMMENT ON VIEW vista_mora_buckets IS 'Cartera agregada por bucket. Excluye juridica=true (cohorte separado).';
