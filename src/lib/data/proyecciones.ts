import { execute, supabaseAdmin } from "@/lib/db/executor"

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
  netoConIVA: number        // conservative: no PP assumed
  ppEsperado: number        // expected PP discount (per-tenant historical rate)
  netoEsperado: number      // expected collection = netoConIVA - ppEsperado
}

export type ProyeccionDetalle = {
  contractId: string
  unitNumber: string
  cliente: string
  fechaInicio: string | null
  mesesTranscurridos: number
  canonMensual: number
  descuentoPct: number
  prontoPagoPct: number
  ppHistoricoPct: number    // historical PP usage rate for this tenant
  ppHistoricoPagos: number  // number of payments used to compute the rate
  netoAnualIVA: number      // conservative
  netoEsperadoIVA: number   // expected (with per-tenant PP applied)
  status: string
}

export type ProyeccionMes = {
  mes: string
  canonBruto: number
  descuentos: number
  prontoPago: number
  baseNeta: number
  iva: number
  proyectado: number     // conservative: baseNeta × 1.19
  ppEsperado: number     // expected PP discount this month
  proyectadoEsperado: number  // expected collection this month
}

export type ContractForProjection = {
  contractId: string
  unitId: string
  unitNumber: string
  clienteName: string
  descuentoPct: number
  prontoPagoPct: number
  lastCanon: number       // last Dec projection (or latest available)
  lastDescuentoPct: number
  lastYear: number
  lastMonth: number
}

export async function getProyeccionSummaries(companyId: string): Promise<ProyeccionSummary[]> {
  const rows = await execute(`
    SELECT
      p.year,
      COUNT(DISTINCT p.contract_id)::int      AS contract_count,
      COUNT(DISTINCT p.unit_id)::int          AS unit_count,
      ROUND(SUM(p.canon_proyectado - p.descuento_proyectado)::numeric * 1.19 / 12) AS total_canon_avg
    FROM projections p
    WHERE p.company_id = '${companyId}'::uuid
    GROUP BY p.year
    ORDER BY p.year DESC
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    year:          Number(r.year),
    contractCount: Number(r.contract_count),
    unitCount:     Number(r.unit_count),
    totalCanon:    Number(r.total_canon_avg),
  }))
}

const MONTH_LABELS = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"]

export async function getProyeccionBreakdown(companyId: string, year: number): Promise<ProyeccionBreakdown> {
  const rows = await execute(`
    SELECT
      ROUND(COALESCE(SUM(p.canon_proyectado), 0))::numeric                                     AS canon_bruto,
      ROUND(COALESCE(SUM(p.descuento_proyectado), 0))::numeric                                 AS total_descuentos,
      ROUND(COALESCE(SUM(p.pronto_pago_proyectado), 0))::numeric                               AS total_pp,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 0.19)::numeric     AS total_iva,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 1.19)::numeric     AS neto_con_iva,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0)
        * 1.19
      ), 0))::numeric                                                                            AS pp_esperado,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0))::numeric                                                                            AS neto_esperado
    FROM projections p
    JOIN contracts c ON p.contract_id = c.id
    JOIN tenants t   ON c.tenant_id   = t.id
    WHERE p.year = ${year}
      AND p.company_id = '${companyId}'::uuid
  `)
  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    canonBruto:      Number(r.canon_bruto      ?? 0),
    totalDescuentos: Number(r.total_descuentos ?? 0),
    totalPP:         Number(r.total_pp         ?? 0),
    totalIVA:        Number(r.total_iva        ?? 0),
    netoConIVA:      Number(r.neto_con_iva     ?? 0),
    ppEsperado:      Number(r.pp_esperado      ?? 0),
    netoEsperado:    Number(r.neto_esperado    ?? 0),
  }
}

export async function getProyeccionDetalle(companyId: string, year: number): Promise<ProyeccionDetalle[]> {
  const rows = await execute(`
    SELECT
      c.id                                              AS contract_id,
      u.unit_number,
      COALESCE(t.nombre_corto, t.razon_social)          AS cliente,
      c.fecha_inicio,
      CASE
        WHEN c.fecha_inicio IS NOT NULL THEN
          GREATEST(
            EXTRACT(YEAR  FROM AGE(CURRENT_DATE, c.fecha_inicio))::int * 12 +
            EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.fecha_inicio))::int,
            0
          )
        ELSE 0
      END                                               AS meses_transcurridos,
      ROUND(SUM(p.canon_proyectado) / 12)::numeric      AS canon_mensual,
      COALESCE(c.descuento_pct, 0)::numeric             AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric           AS pronto_pago_pct,
      COALESCE(t.pp_historico_pct,  0)::numeric         AS pp_historico_pct,
      COALESCE(t.pp_historico_pagos, 0)::int            AS pp_historico_pagos,
      ROUND(SUM(p.canon_proyectado - p.descuento_proyectado) * 1.19)::numeric AS neto_anual_iva,
      ROUND(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ))::numeric                                       AS neto_esperado_iva,
      c.status
    FROM projections p
    JOIN contracts c ON p.contract_id = c.id
    JOIN units u     ON c.unit_id     = u.id
    JOIN tenants t   ON c.tenant_id   = t.id
    WHERE p.year = ${year}
      AND p.company_id = '${companyId}'::uuid
    GROUP BY c.id, u.unit_number, t.nombre_corto, t.razon_social, c.fecha_inicio, c.descuento_pct, c.pronto_pago_pct, c.status, t.pp_historico_pct, t.pp_historico_pagos
    ORDER BY u.unit_number
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    contractId:         String(r.contract_id),
    unitNumber:         String(r.unit_number),
    cliente:            String(r.cliente),
    fechaInicio:        r.fecha_inicio ? String(r.fecha_inicio) : null,
    mesesTranscurridos: Number(r.meses_transcurridos ?? 0),
    canonMensual:       Number(r.canon_mensual ?? 0),
    descuentoPct:       Number(r.descuento_pct ?? 0),
    prontoPagoPct:      Number(r.pronto_pago_pct ?? 0),
    ppHistoricoPct:     Number(r.pp_historico_pct ?? 0),
    ppHistoricoPagos:   Number(r.pp_historico_pagos ?? 0),
    netoAnualIVA:       Number(r.neto_anual_iva ?? 0),
    netoEsperadoIVA:    Number(r.neto_esperado_iva ?? 0),
    status:             String(r.status),
  }))
}

export async function getProyeccionMensual(companyId: string, year: number): Promise<ProyeccionMes[]> {
  const rows = await execute(`
    SELECT
      p.month,
      ROUND(COALESCE(SUM(p.canon_proyectado), 0))::numeric                                          AS canon_bruto,
      ROUND(COALESCE(SUM(p.descuento_proyectado), 0))::numeric                                      AS descuentos,
      ROUND(COALESCE(SUM(p.pronto_pago_proyectado), 0))::numeric                                    AS pronto_pago,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0))::numeric                 AS base_neta,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 0.19)::numeric          AS iva,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 1.19)::numeric          AS proyectado,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0)
        * 1.19
      ), 0))::numeric                                                                                AS pp_esperado,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0))::numeric                                                                                AS proyectado_esperado
    FROM projections p
    JOIN contracts c ON p.contract_id = c.id
    JOIN tenants t   ON c.tenant_id   = t.id
    WHERE p.year = ${year}
      AND p.company_id = '${companyId}'::uuid
    GROUP BY p.month
    ORDER BY p.month
  `)

  return MONTH_LABELS.map((mes, i) => {
    const row = (rows as Array<Record<string, unknown>>).find((r) => Number(r.month) === i + 1)
    return {
      mes,
      canonBruto:          Number(row?.canon_bruto          ?? 0),
      descuentos:          Number(row?.descuentos           ?? 0),
      prontoPago:          Number(row?.pronto_pago          ?? 0),
      baseNeta:            Number(row?.base_neta            ?? 0),
      iva:                 Number(row?.iva                  ?? 0),
      proyectado:          Number(row?.proyectado           ?? 0),
      ppEsperado:          Number(row?.pp_esperado          ?? 0),
      proyectadoEsperado:  Number(row?.proyectado_esperado  ?? 0),
    }
  })
}

export async function getContractsForProjection(
  companyId: string,
  targetYear: number,
): Promise<ContractForProjection[]> {
  // Get active contracts + their LAST available projection (prefer Dec of prev year)
  const rows = await execute(`
    WITH last_proj AS (
      SELECT DISTINCT ON (p.contract_id)
        p.contract_id,
        p.unit_id,
        p.canon_proyectado::numeric        AS last_canon,
        p.descuento_proyectado::numeric    AS last_descuento,
        p.year                             AS last_year,
        p.month                            AS last_month
      FROM projections p
      WHERE p.company_id = '${companyId}'::uuid
      ORDER BY p.contract_id, p.year DESC, p.month DESC
    )
    SELECT
      c.id                                            AS contract_id,
      c.unit_id,
      u.unit_number,
      COALESCE(t.nombre_corto, t.razon_social)        AS cliente_name,
      COALESCE(c.descuento_pct, 0)::numeric           AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric         AS pronto_pago_pct,
      COALESCE(lp.last_canon, c.canon_base)::numeric  AS last_canon,
      COALESCE(
        CASE WHEN lp.last_canon > 0
             THEN ROUND(lp.last_descuento / lp.last_canon * 100, 2)
             ELSE 0 END,
        c.descuento_pct
      )::numeric                                      AS last_descuento_pct,
      COALESCE(lp.last_year, ${targetYear - 1})       AS last_year,
      COALESCE(lp.last_month, 12)                     AS last_month
    FROM contracts c
    JOIN tenants t  ON c.tenant_id = t.id
    JOIN units u    ON c.unit_id   = u.id
    LEFT JOIN last_proj lp ON lp.contract_id = c.id
    WHERE c.company_id = '${companyId}'::uuid
      AND c.status IN ('activo', 'critico')
      AND NOT EXISTS (
        SELECT 1 FROM projections p2
        WHERE p2.contract_id = c.id
          AND p2.year = ${targetYear}
        LIMIT 1
      )
    ORDER BY u.unit_number
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    contractId:      String(r.contract_id),
    unitId:          String(r.unit_id),
    unitNumber:      String(r.unit_number),
    clienteName:     String(r.cliente_name),
    descuentoPct:    Number(r.descuento_pct),
    prontoPagoPct:   Number(r.pronto_pago_pct),
    lastCanon:       Number(r.last_canon),
    lastDescuentoPct: Number(r.last_descuento_pct),
    lastYear:        Number(r.last_year),
    lastMonth:       Number(r.last_month),
  }))
}
