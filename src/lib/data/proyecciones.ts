import { execute } from "@/lib/db/executor"

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
  proyectado: number
  ppEsperado: number
  proyectadoEsperado: number
}

export type ContractForProjection = {
  contractId: string
  unitId: string
  unitNumber: string
  clienteName: string
  descuentoPct: number
  prontoPagoPct: number
  lastCanon: number
  lastDescuentoPct: number
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

export async function getProyeccionBreakdown(empresaId: string, year: number): Promise<ProyeccionBreakdown> {
  const rows = await execute(`
    SELECT
      ROUND(COALESCE(SUM(p.canon_proyectado), 0))::numeric                                     AS canon_bruto,
      ROUND(COALESCE(SUM(p.descuento_proyectado), 0))::numeric                                 AS total_descuentos,
      0::numeric                                                                                AS total_pp,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 0.19)::numeric     AS total_iva,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 1.19)::numeric     AS neto_con_iva,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0)
        * 1.19
      ), 0))::numeric                                                                           AS pp_esperado,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0))::numeric                                                                           AS neto_esperado
    FROM v2.proyecciones p
    JOIN v2.contratos  c ON p.contrato_id  = c.id
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    WHERE p.anio = ${year}
      AND p.empresa_id = '${empresaId}'::uuid
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

export async function getProyeccionDetalle(empresaId: string, year: number): Promise<ProyeccionDetalle[]> {
  const rows = await execute(`
    SELECT
      c.id                                              AS contract_id,
      u.unidad                                          AS unit_number,
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
      c.estado                                          AS status
    FROM v2.proyecciones p
    JOIN v2.contratos  c ON p.contrato_id  = c.id
    JOIN v2.locales    u ON c.local_id     = u.id
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    WHERE p.anio = ${year}
      AND p.empresa_id = '${empresaId}'::uuid
    GROUP BY c.id, u.unidad, t.nombre_corto, t.razon_social, c.fecha_inicio, c.descuento_pct, c.pronto_pago_pct, c.estado, t.pp_historico_pct, t.pp_historico_pagos
    ORDER BY u.unidad
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

export async function getProyeccionMensual(empresaId: string, year: number): Promise<ProyeccionMes[]> {
  const rows = await execute(`
    SELECT
      p.mes                                                                                     AS month,
      ROUND(COALESCE(SUM(p.canon_proyectado), 0))::numeric                                     AS canon_bruto,
      ROUND(COALESCE(SUM(p.descuento_proyectado), 0))::numeric                                 AS descuentos,
      0::numeric                                                                                AS pronto_pago,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0))::numeric            AS base_neta,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 0.19)::numeric     AS iva,
      ROUND(COALESCE(SUM(p.canon_proyectado - p.descuento_proyectado), 0) * 1.19)::numeric     AS proyectado,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0)
        * 1.19
      ), 0))::numeric                                                                           AS pp_esperado,
      ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0))::numeric                                                                           AS proyectado_esperado
    FROM v2.proyecciones p
    JOIN v2.contratos  c ON p.contrato_id  = c.id
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    WHERE p.anio = ${year}
      AND p.empresa_id = '${empresaId}'::uuid
    GROUP BY p.mes
    ORDER BY p.mes
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
    FROM v2.contratos  c
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    JOIN v2.locales    u ON c.local_id     = u.id
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
    contractId:       String(r.contract_id),
    unitId:           String(r.unit_id),
    unitNumber:       String(r.unit_number),
    clienteName:      String(r.cliente_name),
    descuentoPct:     Number(r.descuento_pct),
    prontoPagoPct:    Number(r.pronto_pago_pct),
    lastCanon:        Number(r.last_canon),
    lastDescuentoPct: Number(r.last_descuento_pct),
    lastYear:         Number(r.last_year),
    lastMonth:        Number(r.last_month),
  }))
}
