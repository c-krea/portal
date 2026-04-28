import { execute } from "@/lib/db/executor"

export type PagoRow = {
  id: string
  tenantId: string
  clienteName: string
  unitNumber: string | null
  fechaRecaudo: string
  valorFinal: number
  siesaDocto: string | null
  siesaCruce: string | null
  status: string
}

export type TenantOption = {
  id: string
  label: string
  nit: string
}

export type PagosKPIs = {
  totalEsteMes: number
  proyectadoMes: number
  countEsteMes: number
  ultimoPagoFecha: string | null
  ultimoPagoCliente: string | null
  ultimoPagoMonto: number | null
}

// Returns "YYYY-MM" for the month prior to the given year+month numbers.
function prevMonthStr(year: number, monthNum: number): string {
  return monthNum === 1
    ? `${year - 1}-12`
    : `${year}-${String(monthNum - 1).padStart(2, "0")}`
}

// Electricity dedup rule:
// vista_pagos already applies the 4 canonical filters (FVS cruce + dedup + <$1B + zona Z40).
// However it does NOT exclude standalone 001- entries that match prior-month electricity totals.
// We identify those inquilinos and exclude their standalone entries here.
function electricityTenantsSubquery(monthExpr: string, prevMonth: string): string {
  return `
    electricity_tenants AS (
      SELECT tst.inquilino_id
      FROM (
        SELECT p.inquilino_id, SUM(p.valor_final) AS standalone_total
        FROM v2.vista_pagos p
        WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
          AND p.docto LIKE '001-%'
          AND NOT EXISTS (
            SELECT 1 FROM v2.vista_pagos p2
            WHERE p2.inquilino_id = p.inquilino_id
              AND p2.cruce        = p.cruce
              AND p2.docto        = REPLACE(p.docto, '001-', '')
              AND p2.valor_final  = p.valor_final
          )
        GROUP BY p.inquilino_id
      ) tst
      JOIN (
        SELECT c.inquilino_id, SUM(mr.total_energia) AS elec_total
        FROM v2.contratos c
        JOIN v2.locales u ON u.id = c.local_id
        JOIN v2.lecturas_medidor mr ON mr.local_id = u.id AND mr.periodo = '${prevMonth}'
        WHERE c.estado IN ('activo','critico','vencido','terminado')
        GROUP BY c.inquilino_id
      ) pme ON pme.inquilino_id = tst.inquilino_id
      WHERE ABS(tst.standalone_total - pme.elec_total) <= 50
    )`
}

const EXCLUDE_ELECTRICITY = `
    AND NOT (
      p.docto LIKE '001-%'
      AND p.inquilino_id IN (SELECT inquilino_id FROM electricity_tenants)
    )`

export async function getPagosKPIs(month?: string): Promise<PagosKPIs> {
  const now = new Date()
  const resolvedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const [yearStr, monthStr] = resolvedMonth.split("-")
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)
  const monthExpr = `DATE '${resolvedMonth}-01'`
  const prev = prevMonthStr(year, monthNum)

  const rows = await execute(`
    WITH ${electricityTenantsSubquery(monthExpr, prev)},
    deduped AS (
      SELECT p.inquilino_id, p.fecha_recaudo, p.valor_final, p.docto
      FROM v2.vista_pagos p
      WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        ${EXCLUDE_ELECTRICITY}
    ),
    este_mes AS (
      SELECT COALESCE(SUM(valor_final), 0) AS total, COUNT(DISTINCT docto) AS cnt
      FROM deduped
    ),
    proyectado_mes AS (
      SELECT ROUND(COALESCE(SUM(
        (pr.canon_proyectado - pr.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0)) AS total
      FROM v2.proyecciones pr
      JOIN v2.contratos c ON pr.contrato_id = c.id
      JOIN v2.inquilinos t ON c.inquilino_id = t.id
      WHERE pr.anio = ${year} AND pr.mes = ${monthNum}
    ),
    ultimo AS (
      SELECT d.fecha_recaudo, COALESCE(t.nombre_corto, t.razon_social) AS cliente, d.valor_final
      FROM deduped d
      JOIN v2.inquilinos t ON t.id = d.inquilino_id
      ORDER BY d.fecha_recaudo DESC
      LIMIT 1
    )
    SELECT
      (SELECT total FROM este_mes)          AS total_este_mes,
      (SELECT cnt   FROM este_mes)          AS count_este_mes,
      (SELECT total FROM proyectado_mes)    AS proyectado_mes,
      (SELECT fecha_recaudo FROM ultimo)    AS ultimo_fecha,
      (SELECT cliente       FROM ultimo)    AS ultimo_cliente,
      (SELECT valor_final   FROM ultimo)    AS ultimo_monto
  `)
  const r = rows[0] as Record<string, unknown>
  return {
    totalEsteMes:      Number(r.total_este_mes    ?? 0),
    proyectadoMes:     Number(r.proyectado_mes    ?? 0),
    countEsteMes:      Number(r.count_este_mes    ?? 0),
    ultimoPagoFecha:   r.ultimo_fecha   ? String(r.ultimo_fecha)   : null,
    ultimoPagoCliente: r.ultimo_cliente ? String(r.ultimo_cliente) : null,
    ultimoPagoMonto:   r.ultimo_monto   ? Number(r.ultimo_monto)   : null,
  }
}

export async function getPagos(limit = 200, month?: string): Promise<PagoRow[]> {
  const monthFilter = month
    ? `AND date_trunc('month', p.fecha_recaudo) = DATE '${month}-01'`
    : ""

  let electricityCte = ""
  let electricityExclusion = ""
  if (month) {
    const [y, m] = month.split("-").map(Number)
    const prev = prevMonthStr(y, m)
    electricityCte = `WITH ${electricityTenantsSubquery(`DATE '${month}-01'`, prev)}`
    electricityExclusion = EXCLUDE_ELECTRICITY
  }

  const rows = await execute(`
    ${electricityCte || ""}
    SELECT
      ROW_NUMBER() OVER (ORDER BY p.fecha_recaudo DESC, p.docto)::text AS id,
      p.inquilino_id AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      (SELECT u.unidad
       FROM v2.contratos c2
       JOIN v2.locales u ON u.id = c2.local_id
       WHERE c2.inquilino_id = p.inquilino_id
         AND c2.estado IN ('activo','critico','vencido','terminado')
       ORDER BY c2.created_at DESC LIMIT 1) AS unit_number,
      p.fecha_recaudo,
      p.valor_final::numeric AS valor_final,
      p.docto AS siesa_docto,
      p.cruce AS siesa_cruce
    FROM v2.vista_pagos p
    LEFT JOIN v2.inquilinos t ON t.id = p.inquilino_id
    WHERE 1=1
      ${electricityExclusion}
    ${monthFilter}
    ORDER BY p.fecha_recaudo DESC
    LIMIT ${limit}
  `)
  return rows.map((r) => ({
    id:            String(r.id),
    tenantId:      r.tenant_id ? String(r.tenant_id) : "",
    clienteName:   String(r.cliente_name ?? ""),
    unitNumber:    r.unit_number ? String(r.unit_number) : null,
    fechaRecaudo:  String(r.fecha_recaudo),
    valorFinal:    Number(r.valor_final ?? 0),
    siesaDocto:    r.siesa_docto ? String(r.siesa_docto) : null,
    siesaCruce:    r.siesa_cruce ? String(r.siesa_cruce) : null,
    status:        "RECAUDADO",
  }))
}

export type BucketRow = {
  tenantId: string
  clienteName: string
  unitNumber: string | null
  total: number
  primeraFecha: string
}

export type PagosBuckets = {
  temprano: BucketRow[]
  tardio:   BucketRow[]
  mora:     BucketRow[]
}

export async function getPagosBuckets(month: string): Promise<PagosBuckets> {
  const [y, m] = month.split("-").map(Number)
  const prev = prevMonthStr(y, m)
  const monthExpr = `DATE '${month}-01'`

  const rows = await execute(`
    WITH ${electricityTenantsSubquery(monthExpr, prev)},
    deduped AS (
      SELECT p.inquilino_id, p.fecha_recaudo, p.valor_final
      FROM v2.vista_pagos p
      WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        ${EXCLUDE_ELECTRICITY}
    ),
    mora_tenants AS (
      SELECT DISTINCT inquilino_id
      FROM v2.vista_cartera_actual
      WHERE fecha_factura < ${monthExpr}
        AND saldo > 0
    ),
    by_tenant AS (
      SELECT
        d.inquilino_id,
        CASE
          WHEN mt.inquilino_id IS NOT NULL                            THEN 'mora'
          WHEN MIN(EXTRACT(DAY FROM d.fecha_recaudo)) BETWEEN 1 AND 10 THEN 'temprano'
          ELSE 'tardio'
        END                                   AS bucket,
        SUM(d.valor_final)::numeric           AS total,
        MIN(d.fecha_recaudo)::text            AS primera_fecha
      FROM deduped d
      LEFT JOIN mora_tenants mt ON mt.inquilino_id = d.inquilino_id
      GROUP BY d.inquilino_id, mt.inquilino_id
    )
    SELECT
      bt.inquilino_id AS tenant_id,
      bt.bucket,
      bt.total,
      bt.primera_fecha,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      (SELECT u.unidad
       FROM v2.contratos c2
       JOIN v2.locales u ON u.id = c2.local_id
       WHERE c2.inquilino_id = bt.inquilino_id
         AND c2.estado IN ('activo','critico','vencido','terminado')
       ORDER BY c2.created_at DESC LIMIT 1) AS unit_number
    FROM by_tenant bt
    JOIN v2.inquilinos t ON t.id = bt.inquilino_id
    ORDER BY bt.bucket, bt.total DESC
  `)

  const mapRows = (rows: Record<string, unknown>[]): BucketRow[] =>
    rows.map((r) => ({
      tenantId:     String(r.tenant_id),
      clienteName:  String(r.cliente_name),
      unitNumber:   r.unit_number ? String(r.unit_number) : null,
      total:        Number(r.total ?? 0),
      primeraFecha: String(r.primera_fecha),
    }))

  const all = rows as Record<string, unknown>[]
  return {
    temprano: mapRows(all.filter((r) => r.bucket === 'temprano')),
    tardio:   mapRows(all.filter((r) => r.bucket === 'tardio')),
    mora:     mapRows(all.filter((r) => r.bucket === 'mora')),
  }
}
