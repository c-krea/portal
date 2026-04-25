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
// Siesa records electricity payments as standalone 001-RK entries (no matching RK pair).
// Per tenant, their total standalone amount exactly equals that tenant's electricity bill
// from the PRIOR month (Siesa collects Feb electricity in March, etc.).
// We identify those tenants and exclude their standalone entries from Recaudo.
function electricityTenantsSubquery(monthExpr: string, prevMonth: string): string {
  return `
    electricity_tenants AS (
      SELECT tst.tenant_id
      FROM (
        SELECT p.tenant_id, SUM(p.valor_final) AS standalone_total
        FROM payments p
        WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
          AND p.siesa_docto LIKE '001-%'
          AND p.siesa_cruce LIKE 'FVS-%'
          AND p.valor_final < 1000000000
          AND NOT EXISTS (
            SELECT 1 FROM payments p2
            WHERE p2.tenant_id   = p.tenant_id
              AND p2.siesa_cruce = p.siesa_cruce
              AND p2.siesa_docto = REPLACE(p.siesa_docto, '001-', '')
              AND p2.valor_final = p.valor_final
          )
        GROUP BY p.tenant_id
      ) tst
      JOIN (
        SELECT c.tenant_id, SUM(mr.total_energia) AS elec_total
        FROM contracts c
        JOIN units u ON u.id = c.unit_id
        JOIN meter_readings mr ON mr.unit_id = u.id AND mr.periodo = '${prevMonth}'
        WHERE c.status IN ('activo','critico','vencido','terminado')
        GROUP BY c.tenant_id
      ) pme ON pme.tenant_id = tst.tenant_id
      WHERE ABS(tst.standalone_total - pme.elec_total) <= 50
    )`
}

// Condition added to deduped CTE to exclude standalone electricity entries.
const EXCLUDE_ELECTRICITY = `
    AND NOT (
      p.siesa_docto LIKE '001-%'
      AND p.tenant_id IN (SELECT tenant_id FROM electricity_tenants)
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
      SELECT p.tenant_id, p.fecha_recaudo, p.valor_final, p.siesa_docto, p.created_at
      FROM payments p
      WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        AND p.siesa_cruce LIKE 'FVS-%'
        AND p.valor_final < 1000000000
        AND NOT (
          p.siesa_docto LIKE '001-%'
          AND EXISTS (
            SELECT 1 FROM payments p2
            WHERE p2.tenant_id   = p.tenant_id
              AND p2.siesa_cruce = p.siesa_cruce
              AND p2.siesa_docto = REPLACE(p.siesa_docto, '001-', '')
              AND p2.valor_final = p.valor_final
          )
        )${EXCLUDE_ELECTRICITY}
    ),
    este_mes AS (
      SELECT COALESCE(SUM(valor_final), 0) AS total, COUNT(DISTINCT siesa_docto) AS cnt
      FROM deduped
    ),
    proyectado_mes AS (
      SELECT ROUND(COALESCE(SUM(
        (pr.canon_proyectado - pr.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0)) AS total
      FROM projections pr
      JOIN contracts c ON pr.contract_id = c.id
      JOIN tenants t   ON c.tenant_id    = t.id
      WHERE pr.year = ${year} AND pr.month = ${monthNum}
    ),
    ultimo AS (
      SELECT d.fecha_recaudo, COALESCE(t.nombre_corto, t.razon_social) AS cliente, d.valor_final
      FROM deduped d
      JOIN tenants t ON t.id = d.tenant_id
      ORDER BY d.fecha_recaudo DESC, d.created_at DESC
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

  // Electricity exclusion only meaningful when a specific month is scoped.
  let electricityCte = ""
  let electricityExclusion = ""
  if (month) {
    const [y, m] = month.split("-").map(Number)
    const prev = prevMonthStr(y, m)
    electricityCte = `WITH ${electricityTenantsSubquery(`DATE '${month}-01'`, prev)},`
    electricityExclusion = EXCLUDE_ELECTRICITY
  }

  const rows = await execute(`
    ${electricityCte || ""}
    SELECT
      p.id,
      p.tenant_id,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      (SELECT u.unit_number
       FROM contracts c2
       JOIN units u ON u.id = c2.unit_id
       WHERE c2.tenant_id = p.tenant_id
         AND c2.status IN ('activo','critico','vencido','terminado')
       ORDER BY c2.created_at DESC LIMIT 1) AS unit_number,
      p.fecha_recaudo,
      p.valor_final::numeric AS valor_final,
      p.siesa_docto,
      p.siesa_cruce,
      p.status
    FROM payments p
    JOIN tenants t ON t.id = p.tenant_id
    WHERE p.siesa_cruce LIKE 'FVS-%'
      AND p.valor_final < 1000000000
      AND NOT (
        p.siesa_docto LIKE '001-%'
        AND EXISTS (
          SELECT 1 FROM payments p2
          WHERE p2.tenant_id   = p.tenant_id
            AND p2.siesa_cruce = p.siesa_cruce
            AND p2.siesa_docto = REPLACE(p.siesa_docto, '001-', '')
            AND p2.valor_final = p.valor_final
        )
      )${electricityExclusion}
    ${monthFilter}
    ORDER BY p.fecha_recaudo DESC, p.created_at DESC
    LIMIT ${limit}
  `)
  return rows.map((r) => ({
    id:            String(r.id),
    tenantId:      String(r.tenant_id),
    clienteName:   String(r.cliente_name),
    unitNumber:    r.unit_number ? String(r.unit_number) : null,
    fechaRecaudo:  String(r.fecha_recaudo),
    valorFinal:    Number(r.valor_final ?? 0),
    siesaDocto:    r.siesa_docto ? String(r.siesa_docto) : null,
    siesaCruce:    r.siesa_cruce ? String(r.siesa_cruce) : null,
    status:        String(r.status),
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
  temprano: BucketRow[]   // days 1-10, not mora
  tardio:   BucketRow[]   // days 11+, not mora
  mora:     BucketRow[]   // tenant has prior-month outstanding cartera balance
}

export async function getPagosBuckets(month: string): Promise<PagosBuckets> {
  // See docs/audits/payment-classification-logic.md for full reasoning.
  //
  // Key rules:
  // 1. Deduplicate paired 001-RK: Siesa emits RK-XXXX (receipt) and 001-RK-XXXX (application)
  //    for the same cash. Exclude 001- when a matching RK exists with same tenant+cruce+amount.
  // 2. Exclude electricity standalones: standalone 001-RK entries whose per-tenant sum equals
  //    the prior month's electricity total are electricity payments, not canon receipts.
  // 3. No siesa_clasificacion filter: field is unreliable (same payment gets different values).
  // 4. Mora = tenant has a cartera invoice from before this month still outstanding.
  // 5. Unit number via correlated subquery — never JOIN contracts on tenant_id for payment
  //    sums (12 tenants have multiple active contracts → row duplication).

  const [y, m] = month.split("-").map(Number)
  const prev = prevMonthStr(y, m)
  const monthExpr = `DATE '${month}-01'`

  const rows = await execute(`
    WITH ${electricityTenantsSubquery(monthExpr, prev)},
    deduped AS (
      SELECT p.tenant_id, p.fecha_recaudo, p.valor_final
      FROM payments p
      WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        AND p.siesa_cruce LIKE 'FVS-%'
        AND p.valor_final < 1000000000
        AND NOT (
          p.siesa_docto LIKE '001-%'
          AND EXISTS (
            SELECT 1 FROM payments p2
            WHERE p2.tenant_id   = p.tenant_id
              AND p2.siesa_cruce = p.siesa_cruce
              AND p2.siesa_docto = REPLACE(p.siesa_docto, '001-', '')
              AND p2.valor_final = p.valor_final
          )
        )${EXCLUDE_ELECTRICITY}
    ),
    mora_tenants AS (
      SELECT DISTINCT tenant_id
      FROM cartera
      WHERE fecha_factura < ${monthExpr}
        AND saldo > 0
    ),
    by_tenant AS (
      SELECT
        d.tenant_id,
        CASE
          WHEN mt.tenant_id IS NOT NULL                            THEN 'mora'
          WHEN MIN(EXTRACT(DAY FROM d.fecha_recaudo)) BETWEEN 1 AND 10 THEN 'temprano'
          ELSE 'tardio'
        END                                   AS bucket,
        SUM(d.valor_final)::numeric           AS total,
        MIN(d.fecha_recaudo)::text            AS primera_fecha
      FROM deduped d
      LEFT JOIN mora_tenants mt ON mt.tenant_id = d.tenant_id
      GROUP BY d.tenant_id, mt.tenant_id
    )
    SELECT
      bt.tenant_id,
      bt.bucket,
      bt.total,
      bt.primera_fecha,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      (SELECT u.unit_number
       FROM contracts c2
       JOIN units u ON u.id = c2.unit_id
       WHERE c2.tenant_id = bt.tenant_id
         AND c2.status IN ('activo','critico','vencido','terminado')
       ORDER BY c2.created_at DESC LIMIT 1) AS unit_number
    FROM by_tenant bt
    JOIN tenants t ON t.id = bt.tenant_id
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
