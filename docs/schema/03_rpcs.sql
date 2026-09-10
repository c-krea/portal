-- =============================================================================
-- C-KREA PAYCONTROL — ESQUEMA SIMPLIFICADO v2
-- 03_rpcs.sql — RPCs (5)
-- Fecha: 2026-04-26
-- =============================================================================
-- Copiloto tool surface. The portal does not call these from src/ — it queries vistas and siesa_raw.
-- Naming: obtener_* (todos retornan SETOF / TABLE).
--
-- Reglas:
--   - GRANT a authenticated + service_role; REVOKE de public/anon
--   - SECURITY INVOKER (RLS aplica) excepto donde se justifique DEFINER
--   - Nunca aceptar siesa_clasificacion como filtro (no se expone)
--   - Argumentos en español, snake_case
-- =============================================================================

-- =============================================================================
-- SCHEMA v2 — RPCs viven aquí, coexisten con public.* legacy hasta Phase F
-- =============================================================================

SET search_path TO v2, public;

-- =============================================================================
-- RPC 1 — obtener_recaudo
-- Total recaudado en rango de fechas. Reemplaza get_collections_dedup.
-- =============================================================================

CREATE OR REPLACE FUNCTION obtener_recaudo(
    p_empresa_id    uuid,
    p_fecha_desde   date,
    p_fecha_hasta   date
)
RETURNS TABLE (
    recaudado           numeric,
    pp_otorgado         numeric,
    num_pagos           integer,
    num_inquilinos      integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        COALESCE(SUM(valor_final), 0)               AS recaudado,
        COALESCE(SUM(pronto_pago_aplicado), 0)      AS pp_otorgado,
        COUNT(*)::int                                AS num_pagos,
        COUNT(DISTINCT inquilino_id)::int            AS num_inquilinos
    FROM vista_pagos
    WHERE empresa_id    = p_empresa_id
      AND fecha_recaudo >= p_fecha_desde
      AND fecha_recaudo <  p_fecha_hasta;
$$;

COMMENT ON FUNCTION obtener_recaudo IS 'Recaudo total + PP otorgado en rango. Filtros canónicos via vista_pagos.';

-- =============================================================================
-- RPC 2 — obtener_cartera_actual
-- Snapshot de cartera viva (saldo > 0) por empresa.
-- =============================================================================

CREATE OR REPLACE FUNCTION obtener_cartera_actual(
    p_empresa_id    uuid,
    p_incluir_juridica boolean DEFAULT false
)
RETURNS TABLE (
    saldo_total         numeric,
    vencido_total       numeric,
    corriente_total     numeric,
    num_facturas        integer,
    num_inquilinos      integer,
    en_mora_real_count  integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        COALESCE(SUM(saldo), 0)                              AS saldo_total,
        COALESCE(SUM(vr_vencido), 0)                         AS vencido_total,
        COALESCE(SUM(vr_corriente), 0)                       AS corriente_total,
        COUNT(*)::int                                         AS num_facturas,
        COUNT(DISTINCT inquilino_id)::int                     AS num_inquilinos,
        COUNT(*) FILTER (WHERE en_mora_real)::int             AS en_mora_real_count
    FROM vista_cartera_actual
    WHERE empresa_id = p_empresa_id
      AND (p_incluir_juridica OR juridica IS NOT TRUE);
$$;

COMMENT ON FUNCTION obtener_cartera_actual IS 'Cartera viva. Por defecto excluye procesos jurídicos.';

-- =============================================================================
-- RPC 3 — obtener_buckets_mora
-- Distribución de cartera por bucket de mora.
-- =============================================================================

CREATE OR REPLACE FUNCTION obtener_buckets_mora(
    p_empresa_id    uuid
)
RETURNS TABLE (
    bucket_mora     text,
    num_facturas    integer,
    saldo_total     numeric,
    vencido_total   numeric,
    corriente_total numeric,
    num_inquilinos  integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        bucket_mora,
        num_facturas::int,
        saldo_total,
        vencido_total,
        corriente_total,
        num_inquilinos::int
    FROM vista_mora_buckets
    WHERE empresa_id = p_empresa_id
    ORDER BY
        CASE bucket_mora
            WHEN 'corriente' THEN 0
            WHEN '1-30'      THEN 1
            WHEN '31-60'     THEN 2
            WHEN '61-90'     THEN 3
            WHEN '91-180'    THEN 4
            WHEN '180+'      THEN 5
        END;
$$;

COMMENT ON FUNCTION obtener_buckets_mora IS 'Cartera por bucket. Excluye juridica via la vista subyacente.';

-- =============================================================================
-- RPC 4 — obtener_recaudo_vs_proyectado
-- Comparativa mes a mes: lo proyectado vs lo recaudado.
-- =============================================================================

CREATE OR REPLACE FUNCTION obtener_recaudo_vs_proyectado(
    p_empresa_id    uuid,
    p_anio          integer
)
RETURNS TABLE (
    mes                 integer,
    proyectado          numeric,
    recaudado           numeric,
    diferencia          numeric,
    pct_cumplimiento    numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    WITH proy AS (
        SELECT
            mes,
            SUM(canon_proyectado - descuento_proyectado) AS proyectado
        FROM proyecciones
        WHERE empresa_id = p_empresa_id
          AND anio       = p_anio
        GROUP BY mes
    ),
    rec AS (
        SELECT
            EXTRACT(MONTH FROM fecha_recaudo)::int AS mes,
            SUM(valor_final)                       AS recaudado
        FROM vista_pagos
        WHERE empresa_id = p_empresa_id
          AND EXTRACT(YEAR FROM fecha_recaudo)::int = p_anio
        GROUP BY EXTRACT(MONTH FROM fecha_recaudo)
    )
    SELECT
        m.mes,
        COALESCE(p.proyectado, 0)                                  AS proyectado,
        COALESCE(r.recaudado, 0)                                   AS recaudado,
        COALESCE(r.recaudado, 0) - COALESCE(p.proyectado, 0)       AS diferencia,
        CASE
            WHEN COALESCE(p.proyectado, 0) = 0 THEN NULL
            ELSE ROUND(100.0 * COALESCE(r.recaudado, 0) / p.proyectado, 2)
        END                                                         AS pct_cumplimiento
    FROM generate_series(1, 12) m(mes)
    LEFT JOIN proy p ON p.mes = m.mes
    LEFT JOIN rec  r ON r.mes = m.mes
    ORDER BY m.mes;
$$;

COMMENT ON FUNCTION obtener_recaudo_vs_proyectado IS 'Mes a mes: proyectado vs recaudado. PP NO se descuenta del proyectado (regla canónica).';

-- =============================================================================
-- RPC 5 — obtener_resumen_inquilino
-- Vista 360° de un inquilino: saldo, último pago, contratos activos.
-- =============================================================================

CREATE OR REPLACE FUNCTION obtener_resumen_inquilino(
    p_inquilino_id  uuid
)
RETURNS TABLE (
    inquilino_id        uuid,
    nit                 text,
    razon_social        text,
    juridica            boolean,
    saldo_total         numeric,
    vencido_total       numeric,
    num_facturas_open   integer,
    bucket_max          text,
    ultimo_pago_fecha   date,
    ultimo_pago_valor   numeric,
    pp_historico_pct    numeric,
    contratos_activos   integer,
    locales             text[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    WITH cart AS (
        SELECT
            inquilino_id,
            COALESCE(SUM(saldo), 0)         AS saldo_total,
            COALESCE(SUM(vr_vencido), 0)    AS vencido_total,
            COUNT(*)::int                    AS num_facturas_open,
            -- Bucket más viejo (peor)
            MAX(CASE bucket_mora
                WHEN '180+'    THEN 5
                WHEN '91-180'  THEN 4
                WHEN '61-90'   THEN 3
                WHEN '31-60'   THEN 2
                WHEN '1-30'    THEN 1
                ELSE 0
            END)                            AS bucket_max_idx
        FROM vista_cartera_actual
        WHERE inquilino_id = p_inquilino_id
        GROUP BY inquilino_id
    ),
    last_pay AS (
        SELECT
            inquilino_id,
            fecha_recaudo,
            valor_final
        FROM vista_pagos
        WHERE inquilino_id = p_inquilino_id
        ORDER BY fecha_recaudo DESC
        LIMIT 1
    ),
    contr AS (
        SELECT
            c.inquilino_id,
            COUNT(*) FILTER (WHERE c.estado IN ('activo','critico'))::int AS contratos_activos,
            ARRAY_AGG(DISTINCT l.codigo) FILTER (WHERE c.estado IN ('activo','critico')) AS locales
        FROM contratos c
        JOIN locales l ON l.id = c.local_id
        WHERE c.inquilino_id = p_inquilino_id
        GROUP BY c.inquilino_id
    )
    SELECT
        i.id,
        i.nit,
        i.razon_social,
        i.juridica,
        COALESCE(cart.saldo_total, 0),
        COALESCE(cart.vencido_total, 0),
        COALESCE(cart.num_facturas_open, 0),
        CASE COALESCE(cart.bucket_max_idx, 0)
            WHEN 5 THEN '180+'
            WHEN 4 THEN '91-180'
            WHEN 3 THEN '61-90'
            WHEN 2 THEN '31-60'
            WHEN 1 THEN '1-30'
            ELSE 'corriente'
        END,
        last_pay.fecha_recaudo,
        last_pay.valor_final,
        i.pp_historico_pct,
        COALESCE(contr.contratos_activos, 0),
        COALESCE(contr.locales, ARRAY[]::text[])
    FROM inquilinos i
    LEFT JOIN cart     ON cart.inquilino_id     = i.id
    LEFT JOIN last_pay ON last_pay.inquilino_id = i.id
    LEFT JOIN contr    ON contr.inquilino_id    = i.id
    WHERE i.id = p_inquilino_id;
$$;

COMMENT ON FUNCTION obtener_resumen_inquilino IS '360° de un inquilino: cartera, último pago, contratos, locales.';

-- =============================================================================
-- GRANTS
-- =============================================================================

REVOKE ALL ON FUNCTION obtener_recaudo(uuid, date, date)              FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION obtener_cartera_actual(uuid, boolean)          FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION obtener_buckets_mora(uuid)                     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION obtener_recaudo_vs_proyectado(uuid, integer)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION obtener_resumen_inquilino(uuid)                FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION obtener_recaudo(uuid, date, date)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION obtener_cartera_actual(uuid, boolean)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION obtener_buckets_mora(uuid)                   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION obtener_recaudo_vs_proyectado(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION obtener_resumen_inquilino(uuid)              TO authenticated, service_role;
