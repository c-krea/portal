import { execute } from "@/lib/db/executor"
import { cached } from "@/lib/cache"

export type ProyeccionSummary = {
  year: number
  contractCount: number
  unitCount: number
  totalCanon: number
}

export type ProyeccionBreakdown = {
  canonBruto: number
  totalDescuentos: number
  totalPP: number
  totalIVA: number
  pisoConIVA: number        // floor: full PP applied (everyone pays on time)
  ppEsperado: number        // expected PP discount (per-tenant historical rate)
  netoEsperado: number      // expected collection = piso + (PP not used by late payers)
  techoConIVA: number       // ceiling: no PP given (everyone pays late), retefuente still applied
}

export type ProyeccionDetalle = {
  contractId: string
  unitNumber: string
  cliente: string
  tipoPersona: 'PJ' | 'PN'
  fechaInicio: string | null
  mesesTranscurridos: number
  canonMensual: number
  descuentoPct: number
  prontoPagoPct: number
  descuentoPhasePct: number | null
  descuentoHastaMes: number | null
  ppHistoricoPct: number
  ppHistoricoPagos: number
  netoAnualIVA: number
  netoEsperadoIVA: number
  status: string
}

export type ProyeccionMes = {
  mes: string
  canonBruto: number
  descuentos: number
  prontoPago: number
  baseNeta: number
  iva: number
  proyectadoPiso: number
  ppEsperado: number
  proyectadoEsperado: number
}

export type MensualSnapshot = {
  periodo: string         // 'YYYYMM'
  year: number
  month: number           // 1-12
  monthLabel: string      // 'Mayo 2026'
  totalFacturado: number  // SUM(valor_total) = ventas + impuesto - retenciones
  facturasCount: number
}

export type MensualDetalle = {
  inquilinoId: string
  cliente: string
  tipoPersona: 'PJ' | 'PN'
  unidades: string        // 'L101' or 'L101, L203' for multi-unit tenants
  facturasCount: number
  baseNeta: number
  iva: number
  retenciones: number
  valorTotal: number
}

export type ContractForProjection = {
  contractId: string
  unitId: string
  unitNumber: string
  clienteName: string
  descuentoPct: number
  prontoPagoPct: number
  descuentoPhasePct: number | null
  descuentoHastaMes: number | null
  lastCanon: number
  lastYear: number
  lastMonth: number
}

const MONTH_LABELS = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"]

export async function getProyeccionSummaries(empresaId: string): Promise<ProyeccionSummary[]> {
  const rows = await execute(`
    SELECT
      p.anio                                            AS year,
      COUNT(DISTINCT p.contrato_id)::int                AS contract_count,
      COUNT(DISTINCT p.local_id)::int                   AS unit_count,
      ROUND(SUM(p.canon_proyectado - p.descuento_proyectado)::numeric * 1.19 / 12) AS total_canon_avg
    FROM v2.proyecciones p
    WHERE p.empresa_id = '${empresaId}'::uuid
    GROUP BY p.anio
    ORDER BY p.anio DESC
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    year:          Number(r.year),
    contractCount: Number(r.contract_count),
    unitCount:     Number(r.unit_count),
    totalCanon:    Number(r.total_canon_avg),
  }))
}

async function getProyeccionBreakdown_uncached(empresaId: string, year: number): Promise<ProyeccionBreakdown> {
  // LIVE source: siesa_raw.ocupacion (ERP truth).
  // Phase-discount expiry IS modeled: if c.descuento_hasta_mes ends mid-year,
  // o.descuento applies only for months 1..mes_dcto_end of YEAR, then 0%.
  // If phase ended before YEAR, o.descuento treated as persistent loyalty (flat).
  // Mid-YEAR contract starts prorate canon. IPC bumps NOT modeled.
  // PJ: retefuente 3.5% → multiplier 1.155. PN: 1.19.
  const rows = await execute(`
    WITH base AS (
      SELECT
        COALESCE(o.precio,      0)::numeric           AS canon_mes,
        COALESCE(o.descuento,   0)::numeric / 100.0   AS dcto_pct,
        COALESCE(o.pronto_pago, 0)::numeric / 100.0   AS pp_pct,
        COALESCE(i.tipo_persona, 'PN')                AS tipo_persona,
        COALESCE(i.pp_historico_pct, 0)::numeric / 100.0 AS pp_hist_pct,
        CASE
          WHEN c.fecha_inicio IS NULL OR c.fecha_inicio < DATE '${year}-01-01' THEN 1
          WHEN c.fecha_inicio > DATE '${year}-12-31' THEN 13
          ELSE EXTRACT(MONTH FROM c.fecha_inicio)::int
        END AS mes_start,
        CASE
          WHEN c.descuento_hasta_mes IS NULL THEN 13
          WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) < DATE '${year}-01-01' THEN 0
          WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) > DATE '${year}-12-31' THEN 13
          ELSE EXTRACT(MONTH FROM (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval))::int
        END AS mes_dcto_end
      FROM siesa_raw.ocupacion o
      JOIN v2.inquilinos i ON i.nit = o.documento
        AND i.empresa_id = '${empresaId}'::uuid
      LEFT JOIN v2.locales l ON l.unidad = o.loc
        AND l.empresa_id = '${empresaId}'::uuid
      LEFT JOIN LATERAL (
        SELECT * FROM v2.contratos cc
        WHERE cc.local_id = l.id AND cc.inquilino_id = i.id
          AND cc.estado IN ('activo','critico')
        ORDER BY cc.fecha_inicio DESC NULLS LAST LIMIT 1
      ) c ON TRUE
      WHERE o.razon_social IS NOT NULL
        AND COALESCE(o.precio, 0) > 0
    ),
    expanded AS (
      SELECT
        b.canon_mes, b.dcto_pct, b.pp_pct, b.tipo_persona, b.pp_hist_pct,
        CASE WHEN m.mes >= b.mes_start THEN 1 ELSE 0 END                                  AS active,
        CASE WHEN m.mes >= b.mes_start AND m.mes <= b.mes_dcto_end THEN b.dcto_pct ELSE 0 END AS dcto_eff
      FROM base b CROSS JOIN generate_series(1,12) m(mes)
    )
    SELECT
      ROUND(COALESCE(SUM(canon_mes * active), 0))::numeric                                AS canon_bruto,
      ROUND(COALESCE(SUM(canon_mes * dcto_eff), 0))::numeric                              AS total_descuentos,
      0::numeric                                                                           AS total_pp,
      ROUND(COALESCE(SUM(canon_mes * (active - dcto_eff) * 0.19), 0))::numeric            AS total_iva,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff) * (1 - pp_pct)
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                      AS piso_con_iva,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff) * pp_pct * pp_hist_pct
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                      AS pp_esperado,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff) * (1 - pp_pct * pp_hist_pct)
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                      AS neto_esperado,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff)
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                      AS techo_con_iva
    FROM expanded
  `)
  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    canonBruto:      Number(r.canon_bruto      ?? 0),
    totalDescuentos: Number(r.total_descuentos ?? 0),
    totalPP:         Number(r.total_pp         ?? 0),
    totalIVA:        Number(r.total_iva        ?? 0),
    pisoConIVA:      Number(r.piso_con_iva     ?? 0),
    ppEsperado:      Number(r.pp_esperado      ?? 0),
    netoEsperado:    Number(r.neto_esperado    ?? 0),
    techoConIVA:     Number(r.techo_con_iva    ?? 0),
  }
}

async function getProyeccionDetalle_uncached(empresaId: string, year: number): Promise<ProyeccionDetalle[]> {
  // LIVE source: siesa_raw.ocupacion. One row per occupied unit.
  // Phase-discount expiry modeled the same way as breakdown.
  // PJ → multiplier 1.155. PN → 1.19.
  const rows = await execute(`
    WITH base AS (
      SELECT
        o.loc, o.razon_social,
        COALESCE(o.precio, 0)::numeric                  AS canon_mes,
        COALESCE(o.descuento, 0)::numeric / 100.0       AS dcto_pct,
        COALESCE(o.pronto_pago, 0)::numeric / 100.0     AS pp_pct,
        COALESCE(t.nombre_corto, t.razon_social, o.razon_social) AS cliente,
        COALESCE(t.tipo_persona, 'PN')                  AS tipo_persona,
        COALESCE(t.pp_historico_pct, 0)::numeric / 100.0 AS pp_hist_pct,
        COALESCE(t.pp_historico_pct, 0)::numeric        AS pp_hist_pct_raw,
        COALESCE(t.pp_historico_pagos, 0)::int          AS pp_hist_pagos,
        c.fecha_inicio, c.descuento_phase_pct, c.descuento_hasta_mes,
        COALESCE(c.estado, 'activo')                    AS status,
        CASE
          WHEN c.fecha_inicio IS NULL OR c.fecha_inicio < DATE '${year}-01-01' THEN 1
          WHEN c.fecha_inicio > DATE '${year}-12-31' THEN 13
          ELSE EXTRACT(MONTH FROM c.fecha_inicio)::int
        END AS mes_start,
        CASE
          WHEN c.descuento_hasta_mes IS NULL THEN 13
          WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) < DATE '${year}-01-01' THEN 0
          WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) > DATE '${year}-12-31' THEN 13
          ELSE EXTRACT(MONTH FROM (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval))::int
        END AS mes_dcto_end
      FROM siesa_raw.ocupacion o
      JOIN v2.inquilinos t ON t.nit = o.documento
        AND t.empresa_id = '${empresaId}'::uuid
      LEFT JOIN v2.locales u ON u.unidad = o.loc
        AND u.empresa_id = '${empresaId}'::uuid
      LEFT JOIN LATERAL (
        SELECT * FROM v2.contratos cc
        WHERE cc.local_id = u.id AND cc.inquilino_id = t.id
          AND cc.estado IN ('activo', 'critico')
        ORDER BY cc.fecha_inicio DESC NULLS LAST LIMIT 1
      ) c ON TRUE
      WHERE o.razon_social IS NOT NULL
        AND COALESCE(o.precio, 0) > 0
    ),
    agg AS (
      SELECT
        b.loc,
        SUM(CASE WHEN m.mes >= b.mes_start THEN 1 ELSE 0 END)::int                              AS meses_active,
        SUM(CASE WHEN m.mes >= b.mes_start AND m.mes <= b.mes_dcto_end THEN b.dcto_pct ELSE 0 END) AS dcto_eff_total
      FROM base b CROSS JOIN generate_series(1,12) m(mes)
      GROUP BY b.loc
    )
    SELECT
      b.loc                                                            AS contract_id,
      b.loc                                                            AS unit_number,
      b.cliente,
      b.tipo_persona,
      b.fecha_inicio,
      CASE
        WHEN b.fecha_inicio IS NOT NULL THEN
          GREATEST(
            EXTRACT(YEAR  FROM AGE(CURRENT_DATE, b.fecha_inicio))::int * 12 +
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, b.fecha_inicio))::int,
            0
          )
        ELSE 0
      END                                                              AS meses_transcurridos,
      b.canon_mes                                                      AS canon_mensual,
      ROUND(b.dcto_pct * 100, 2)::numeric                              AS descuento_pct,
      ROUND(b.pp_pct  * 100, 2)::numeric                               AS pronto_pago_pct,
      b.descuento_phase_pct::numeric                                   AS descuento_phase_pct,
      b.descuento_hasta_mes::int                                       AS descuento_hasta_mes,
      b.pp_hist_pct_raw                                                AS pp_historico_pct,
      b.pp_hist_pagos                                                  AS pp_historico_pagos,
      ROUND(
        (b.canon_mes * a.meses_active - b.canon_mes * a.dcto_eff_total)
        * (1.19 - CASE WHEN b.tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      )::numeric                                                       AS neto_anual_iva,
      ROUND(
        (b.canon_mes * a.meses_active - b.canon_mes * a.dcto_eff_total)
        * (1 - b.pp_pct * b.pp_hist_pct)
        * (1.19 - CASE WHEN b.tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      )::numeric                                                       AS neto_esperado_iva,
      b.status
    FROM base b
    JOIN agg  a ON a.loc = b.loc
    ORDER BY b.loc
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    contractId:         String(r.contract_id),
    unitNumber:         String(r.unit_number),
    cliente:            String(r.cliente),
    tipoPersona:        (String(r.tipo_persona) === 'PJ' ? 'PJ' : 'PN'),
    fechaInicio:        r.fecha_inicio ? String(r.fecha_inicio) : null,
    mesesTranscurridos: Number(r.meses_transcurridos ?? 0),
    canonMensual:       Number(r.canon_mensual ?? 0),
    descuentoPct:       Number(r.descuento_pct ?? 0),
    prontoPagoPct:      Number(r.pronto_pago_pct ?? 0),
    descuentoPhasePct:  r.descuento_phase_pct == null ? null : Number(r.descuento_phase_pct),
    descuentoHastaMes:  r.descuento_hasta_mes == null ? null : Number(r.descuento_hasta_mes),
    ppHistoricoPct:     Number(r.pp_historico_pct ?? 0),
    ppHistoricoPagos:   Number(r.pp_historico_pagos ?? 0),
    netoAnualIVA:       Number(r.neto_anual_iva ?? 0),
    netoEsperadoIVA:    Number(r.neto_esperado_iva ?? 0),
    status:             String(r.status),
  }))
}

async function getProyeccionMensual_uncached(empresaId: string, year: number): Promise<ProyeccionMes[]> {
  // LIVE source: siesa_raw.ocupacion. Per-month aggregation: phase-discount
  // expiry produces a step-up after the phase ends. Mid-year contract starts
  // produce zero canon for months before mes_start. IPC bumps NOT modeled.
  // PJ → multiplier 1.155. PN → 1.19.
  const rows = await execute(`
    WITH base AS (
      SELECT
        COALESCE(o.precio,      0)::numeric           AS canon_mes,
        COALESCE(o.descuento,   0)::numeric / 100.0   AS dcto_pct,
        COALESCE(o.pronto_pago, 0)::numeric / 100.0   AS pp_pct,
        COALESCE(i.tipo_persona, 'PN')                AS tipo_persona,
        COALESCE(i.pp_historico_pct, 0)::numeric / 100.0 AS pp_hist_pct,
        CASE
          WHEN c.fecha_inicio IS NULL OR c.fecha_inicio < DATE '${year}-01-01' THEN 1
          WHEN c.fecha_inicio > DATE '${year}-12-31' THEN 13
          ELSE EXTRACT(MONTH FROM c.fecha_inicio)::int
        END AS mes_start,
        CASE
          WHEN c.descuento_hasta_mes IS NULL THEN 13
          WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) < DATE '${year}-01-01' THEN 0
          WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) > DATE '${year}-12-31' THEN 13
          ELSE EXTRACT(MONTH FROM (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval))::int
        END AS mes_dcto_end
      FROM siesa_raw.ocupacion o
      JOIN v2.inquilinos i ON i.nit = o.documento
        AND i.empresa_id = '${empresaId}'::uuid
      LEFT JOIN v2.locales l ON l.unidad = o.loc
        AND l.empresa_id = '${empresaId}'::uuid
      LEFT JOIN LATERAL (
        SELECT * FROM v2.contratos cc
        WHERE cc.local_id = l.id AND cc.inquilino_id = i.id
          AND cc.estado IN ('activo','critico')
        ORDER BY cc.fecha_inicio DESC NULLS LAST LIMIT 1
      ) c ON TRUE
      WHERE o.razon_social IS NOT NULL
        AND COALESCE(o.precio, 0) > 0
    ),
    expanded AS (
      SELECT
        m.mes,
        b.canon_mes, b.pp_pct, b.tipo_persona, b.pp_hist_pct,
        CASE WHEN m.mes >= b.mes_start THEN 1 ELSE 0 END                                  AS active,
        CASE WHEN m.mes >= b.mes_start AND m.mes <= b.mes_dcto_end THEN b.dcto_pct ELSE 0 END AS dcto_eff
      FROM base b CROSS JOIN generate_series(1,12) m(mes)
    )
    SELECT
      mes,
      ROUND(COALESCE(SUM(canon_mes * active), 0))::numeric                              AS canon_bruto,
      ROUND(COALESCE(SUM(canon_mes * dcto_eff), 0))::numeric                            AS descuentos,
      0::numeric                                                                         AS pronto_pago,
      ROUND(COALESCE(SUM(canon_mes * (active - dcto_eff)), 0))::numeric                 AS base_neta,
      ROUND(COALESCE(SUM(canon_mes * (active - dcto_eff) * 0.19), 0))::numeric          AS iva,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff) * (1 - pp_pct)
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                    AS proyectado_piso,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff) * pp_pct * pp_hist_pct
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                    AS pp_esperado,
      ROUND(COALESCE(SUM(
        canon_mes * (active - dcto_eff) * (1 - pp_pct * pp_hist_pct)
        * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
      ), 0))::numeric                                                                    AS proyectado_esperado
    FROM expanded
    GROUP BY mes
    ORDER BY mes
  `)

  const byMes = new Map<number, Record<string, unknown>>()
  for (const r of rows as Array<Record<string, unknown>>) byMes.set(Number(r.mes), r)

  return MONTH_LABELS.map((mes, i) => {
    const r = byMes.get(i + 1) ?? {}
    return {
      mes,
      canonBruto:         Number(r.canon_bruto         ?? 0),
      descuentos:         Number(r.descuentos          ?? 0),
      prontoPago:         Number(r.pronto_pago         ?? 0),
      baseNeta:           Number(r.base_neta           ?? 0),
      iva:                Number(r.iva                 ?? 0),
      proyectadoPiso:     Number(r.proyectado_piso     ?? 0),
      ppEsperado:         Number(r.pp_esperado         ?? 0),
      proyectadoEsperado: Number(r.proyectado_esperado ?? 0),
    }
  })
}

export async function getMensualSnapshot(empresaId: string, date: Date = new Date()): Promise<MensualSnapshot> {
  const year  = date.getFullYear()
  const month = date.getMonth() + 1
  const periodo = year * 100 + month  // integer YYYYMM e.g. 202605
  const monthLabel = `${["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][month - 1]} ${year}`

  const rows = await execute(`
    SELECT
      ROUND(COALESCE(SUM(valor_total), 0))::numeric AS total_facturado,
      COUNT(*)::int                                  AS facturas_count
    FROM v2.vista_facturas
    WHERE empresa_id = '${empresaId}'::uuid
      AND is_factura = true
      AND periodo    = ${periodo}
  `)
  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    periodo: String(periodo),
    year,
    month,
    monthLabel,
    totalFacturado: Number(r.total_facturado ?? 0),
    facturasCount:  Number(r.facturas_count  ?? 0),
  }
}

export async function getMensualDetalle(empresaId: string, date: Date = new Date()): Promise<MensualDetalle[]> {
  const periodo = date.getFullYear() * 100 + (date.getMonth() + 1)

  const rows = await execute(`
    WITH facts AS (
      SELECT
        vf.inquilino_id,
        COUNT(*)                AS facturas_count,
        SUM(vf.base_neta)       AS base_neta,
        SUM(vf.iva)             AS iva,
        SUM(vf.retenciones)     AS retenciones,
        SUM(vf.valor_total)     AS valor_total
      FROM v2.vista_facturas vf
      WHERE vf.empresa_id = '${empresaId}'::uuid
        AND vf.is_factura = true
        AND vf.periodo    = ${periodo}
      GROUP BY vf.inquilino_id
    ),
    units AS (
      SELECT c.inquilino_id, string_agg(DISTINCT l.unidad, ', ' ORDER BY l.unidad) AS unidades
      FROM v2.contratos c
      JOIN v2.locales   l ON l.id = c.local_id
      WHERE c.estado IN ('activo','critico')
      GROUP BY c.inquilino_id
    )
    SELECT
      i.id::text                                          AS inquilino_id,
      COALESCE(i.nombre_corto, i.razon_social)            AS cliente,
      COALESCE(i.tipo_persona, 'PN')                      AS tipo_persona,
      COALESCE(u.unidades, '—')                           AS unidades,
      f.facturas_count::int                               AS facturas_count,
      ROUND(f.base_neta)::numeric                         AS base_neta,
      ROUND(f.iva)::numeric                               AS iva,
      ROUND(f.retenciones)::numeric                       AS retenciones,
      ROUND(f.valor_total)::numeric                       AS valor_total
    FROM facts f
    JOIN v2.inquilinos i ON i.id = f.inquilino_id
    LEFT JOIN units    u ON u.inquilino_id = f.inquilino_id
    ORDER BY u.unidades NULLS LAST, cliente
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    inquilinoId:    String(r.inquilino_id),
    cliente:        String(r.cliente),
    tipoPersona:    (String(r.tipo_persona) === 'PJ' ? 'PJ' : 'PN'),
    unidades:       String(r.unidades),
    facturasCount:  Number(r.facturas_count ?? 0),
    baseNeta:       Number(r.base_neta      ?? 0),
    iva:            Number(r.iva            ?? 0),
    retenciones:    Number(r.retenciones    ?? 0),
    valorTotal:     Number(r.valor_total    ?? 0),
  }))
}

export async function getContractsForProjection(
  empresaId: string,
  targetYear: number,
): Promise<ContractForProjection[]> {
  // Active contracts + their LAST available projection (prefer Dec of prev year).
  const rows = await execute(`
    WITH last_proj AS (
      SELECT DISTINCT ON (p.contrato_id)
        p.contrato_id,
        p.local_id,
        p.canon_proyectado::numeric        AS last_canon,
        p.descuento_proyectado::numeric    AS last_descuento,
        p.anio                             AS last_year,
        p.mes                              AS last_month
      FROM v2.proyecciones p
      WHERE p.empresa_id = '${empresaId}'::uuid
      ORDER BY p.contrato_id, p.anio DESC, p.mes DESC
    )
    SELECT
      c.id                                            AS contract_id,
      c.local_id                                      AS unit_id,
      u.unidad                                        AS unit_number,
      COALESCE(t.nombre_corto, t.razon_social)        AS cliente_name,
      COALESCE(o.descuento, c.descuento_pct, 0)::numeric  AS descuento_pct,
      COALESCE(o.pronto_pago, c.pronto_pago_pct, 0)::numeric AS pronto_pago_pct,
      c.descuento_phase_pct::numeric                  AS descuento_phase_pct,
      c.descuento_hasta_mes::int                      AS descuento_hasta_mes,
      COALESCE(lp.last_canon, c.canon_base)::numeric  AS last_canon,
      COALESCE(lp.last_year, ${targetYear - 1})       AS last_year,
      COALESCE(lp.last_month, 12)                     AS last_month
    FROM v2.contratos  c
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    JOIN v2.locales    u ON c.local_id     = u.id
    LEFT JOIN siesa_raw.ocupacion o ON o.loc = u.unidad
    LEFT JOIN last_proj lp ON lp.contrato_id = c.id
    WHERE c.empresa_id = '${empresaId}'::uuid
      AND c.estado IN ('activo', 'critico')
      AND NOT EXISTS (
        SELECT 1 FROM v2.proyecciones p2
        WHERE p2.contrato_id = c.id
          AND p2.anio        = ${targetYear}
        LIMIT 1
      )
    ORDER BY u.unidad
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    contractId:        String(r.contract_id),
    unitId:            String(r.unit_id),
    unitNumber:        String(r.unit_number),
    clienteName:       String(r.cliente_name),
    descuentoPct:      Number(r.descuento_pct),
    prontoPagoPct:     Number(r.pronto_pago_pct),
    descuentoPhasePct: r.descuento_phase_pct == null ? null : Number(r.descuento_phase_pct),
    descuentoHastaMes: r.descuento_hasta_mes == null ? null : Number(r.descuento_hasta_mes),
    lastCanon:         Number(r.last_canon),
    lastYear:          Number(r.last_year),
    lastMonth:         Number(r.last_month),
  }))
}

// ── Cached exports (30-min window; busts via ERP sync + projection/rule edits) ──
// getProyeccionSummaries (unused), getMensual* (new Date() default), and
// getContractsForProjection (write-path read) are intentionally left uncached.
export const getProyeccionBreakdown = cached(getProyeccionBreakdown_uncached, ["proyecciones:breakdown"], "proyecciones")
export const getProyeccionDetalle   = cached(getProyeccionDetalle_uncached,   ["proyecciones:detalle"],   "proyecciones")
export const getProyeccionMensual   = cached(getProyeccionMensual_uncached,   ["proyecciones:mensual"],   "proyecciones")
