import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"
import { assertPeriodo } from "@/lib/security/validators"
import { cached } from "@/lib/cache"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { moraVencEfecExpr } from "@/lib/data/mora"

export type PagoRow = {
  id: string
  tenantId: string
  clienteName: string
  unitNumber: string | null
  fechaRecaudo: string
  valorFinal: number
  siesaDocto: string | null
  siesaCruce: string | null
  diasMoraAlPago: number
  invoicePeriodo: number | null
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
//
// `vp` materialises v2.vista_pagos ONCE per query and every downstream CTE reads from it.
// Without the MATERIALIZED fence Postgres inlines the view into the NOT EXISTS anti-join and
// re-scans siesa_raw.recaudo (330k+ rows, no usable index for the view's filters) once per
// candidate row — 40 seq scans, ~4.9s. That blew past the 8s statement_timeout PostgREST
// inherits from the `authenticator` role and took the whole page down with "Error al cargar".
// Materialising drops the same query to ~0.37s. Keep the fence; results are identical.
// SELECT * on purpose: the view is ~3k rows after its own filters, so the extra columns cost
// nothing, and a hand-kept column list would have to be edited every time a new field is read
// from vp. tenant-detail.ts:186 fences the same view the same way.
function electricityTenantsSubquery(monthExpr: string, prevMonth: string): string {
  return `
    vp AS MATERIALIZED (
      SELECT * FROM v2.vista_pagos
    ),
    electricity_tenants AS (
      SELECT tst.inquilino_id
      FROM (
        SELECT p.inquilino_id, SUM(p.valor_final) AS standalone_total
        FROM vp p
        WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
          AND p.docto LIKE '001-%'
          AND NOT EXISTS (
            SELECT 1 FROM vp p2
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

// Range variant of the electricity-dedup rule (used only by getPagosRange).
// Same idea as electricityTenantsSubquery, but per calendar month: a tenant's
// standalone 001- entries are excluded only in the months where that month's
// standalone total matches that month's metered electricity total (prev-month
// lecturas periodo). Matching is tenant × month, so a tenant flagged for
// September keeps their standalone entries in every other month.
//
// Still set-based over the materialised `vp` fence (one vp-vs-vp anti-join
// grouped by tenant × month, one small tenant × month join) — no correlated
// re-scan of siesa_raw.recaudo per row. See the fence comment above.
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

function assertFecha(f: string): void {
  if (!DATE_RE.test(f)) throw new Error(`Invalid fecha: ${f}. Expected YYYY-MM-DD.`)
}

// Calendar months "YYYY-MM" touched by [from, to] (inclusive), ascending.
// from/to are validated YYYY-MM-DD, so slicing + lexicographic compare is safe.
function monthsInRange(from: string, to: string): string[] {
  const out: string[] = []
  let y = Number(from.slice(0, 4))
  let m = Number(from.slice(5, 7))
  const ey = Number(to.slice(0, 4))
  const em = Number(to.slice(5, 7))
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`)
    m++
    if (m === 13) { m = 1; y++ }
  }
  return out
}

function electricityTenantsSubqueryRange(from: string, to: string): string {
  const prevs = [...new Set(monthsInRange(from, to).map((mm) => {
    const [y, m] = mm.split("-").map(Number)
    return prevMonthStr(y, m)
  }))]
  const prevList = prevs.map((p) => `'${p}'`).join(", ")
  return `
    vp AS MATERIALIZED (
      SELECT * FROM v2.vista_pagos
    ),
    electricity_tenants AS (
      SELECT tst.inquilino_id, tst.m
      FROM (
        SELECT p.inquilino_id, date_trunc('month', p.fecha_recaudo) AS m, SUM(p.valor_final) AS standalone_total
        FROM vp p
        WHERE p.fecha_recaudo BETWEEN DATE '${from}' AND DATE '${to}'
          AND p.docto LIKE '001-%'
          AND NOT EXISTS (
            SELECT 1 FROM vp p2
            WHERE p2.inquilino_id = p.inquilino_id
              AND p2.cruce        = p.cruce
              AND p2.docto        = REPLACE(p.docto, '001-', '')
              AND p2.valor_final  = p.valor_final
          )
        GROUP BY p.inquilino_id, m
      ) tst
      JOIN (
        SELECT c.inquilino_id, mr.periodo AS periodo, SUM(mr.total_energia) AS elec_total
        FROM v2.contratos c
        JOIN v2.locales u ON u.id = c.local_id
        JOIN v2.lecturas_medidor mr ON mr.local_id = u.id AND mr.periodo IN (${prevList})
        WHERE c.estado IN ('activo','critico','vencido','terminado')
        GROUP BY c.inquilino_id, mr.periodo
      ) pme ON pme.inquilino_id = tst.inquilino_id
           AND pme.periodo = to_char(tst.m - INTERVAL '1 month', 'YYYY-MM')
      WHERE ABS(tst.standalone_total - pme.elec_total) <= 50
    )`
}

const EXCLUDE_ELECTRICITY_RANGE = `
    AND NOT (
      p.docto LIKE '001-%'
      AND EXISTS (
        SELECT 1 FROM electricity_tenants et
        WHERE et.inquilino_id = p.inquilino_id
          AND et.m = date_trunc('month', p.fecha_recaudo)
      )
    )`

async function getPagosKPIs_uncached(month: string): Promise<PagosKPIs> {
  assertPeriodo(month)
  const resolvedMonth = month
  const [yearStr, monthStr] = resolvedMonth.split("-")
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)
  const monthExpr = `DATE '${resolvedMonth}-01'`
  const prev = prevMonthStr(year, monthNum)

  const rows = await execute(`
    WITH ${electricityTenantsSubquery(monthExpr, prev)},
    deduped AS (
      SELECT p.inquilino_id, p.fecha_recaudo, p.valor_final, p.docto
      FROM vp p
      JOIN siesa_raw.documentos inv
        ON inv.documento = '001-' || p.cruce
        AND inv.tipo     = 'Facturas'
        AND inv.periodo  = ${year * 100 + monthNum}
      WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        ${EXCLUDE_ELECTRICITY}
    ),
    este_mes AS (
      SELECT COALESCE(SUM(valor_final), 0) AS total, COUNT(DISTINCT docto) AS cnt
      FROM deduped
    ),
    proyectado_mes AS (
      SELECT ROUND(COALESCE(SUM(ventas + impuesto - retenciones), 0))::numeric AS total
      FROM siesa_raw.documentos
      WHERE periodo = ${year * 100 + monthNum}
        AND tipo = 'Facturas'
        AND id_canal = 'R08'
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

// ── /resumen hero + charts (WOR-322) ─────────────────────────────────────────
// One grouped aggregate row per month — never per-payment rows bucketed in JS.
// Lateness uses the single-home moraVencEfecExpr (invoice+10 vs invoice+30 rule
// lives in mora.ts; duplicating it caused the billing bug fixed in 67d0718).
// NEVER use vista_pagos.dias_mora_al_pago here: it is fecha_recaudo − RAW ERP
// fecha_vencimiento, which overstated 2026 mora collections by 153,428,496.
//
// Scope: on-time cash counts every tenant (it ratios against full R08 billing);
// late cash excludes cartera jurídica (it ratios against the mora-at-start
// denominator, which is non-jurídica by construction — see
// getMoraTrendReconstruido). totalRecaudo is derived as the sum in TS so
// cards 1+2 == card 3 holds by construction for every month.
export type ResumenKPIs = {
  facturacionMes: number
  recaudoFacturado: number
  recaudoMora: number
  totalRecaudo: number
  decena1: number
  decena2: number
  decena3: number
}

async function getResumenKPIs_uncached(month: string): Promise<ResumenKPIs> {
  assertPeriodo(month)
  const [yearStr, monthStr] = month.split("-")
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)
  const monthExpr = `DATE '${month}-01'`
  const prev = prevMonthStr(year, monthNum)
  const empresaId = await getEmpresaCkreaId()
  const vencEfec = moraVencEfecExpr("p.fecha_vencimiento", "p.fecha_factura")

  const rows = await execute(`
    WITH ${electricityTenantsSubquery(monthExpr, prev)},
    fact AS (
      SELECT ROUND(COALESCE(SUM(ventas + impuesto - retenciones), 0))::numeric AS total
      FROM siesa_raw.documentos
      WHERE periodo = ${year * 100 + monthNum}
        AND tipo = 'Facturas'
        AND id_canal = 'R08'
    ),
    cash AS (
      SELECT
        COALESCE(SUM(CASE WHEN p.fecha_recaudo <= (${vencEfec}) THEN p.valor_final ELSE 0 END), 0) AS ontime,
        COALESCE(SUM(CASE WHEN p.fecha_recaudo > (${vencEfec}) AND COALESCE(p.juridica, false) = false THEN p.valor_final ELSE 0 END), 0) AS late,
        COALESCE(SUM(CASE WHEN EXTRACT(DAY FROM p.fecha_recaudo) BETWEEN 1 AND 10 THEN p.valor_final ELSE 0 END), 0) AS d1,
        COALESCE(SUM(CASE WHEN EXTRACT(DAY FROM p.fecha_recaudo) BETWEEN 11 AND 20 THEN p.valor_final ELSE 0 END), 0) AS d2,
        COALESCE(SUM(CASE WHEN EXTRACT(DAY FROM p.fecha_recaudo) >= 21 THEN p.valor_final ELSE 0 END), 0) AS d3
      FROM vp p
      WHERE p.empresa_id = '${empresaId}'::uuid
        AND date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        ${EXCLUDE_ELECTRICITY}
    )
    SELECT
      (SELECT total FROM fact) AS facturacion,
      ROUND(ontime)::numeric   AS ontime,
      ROUND(late)::numeric     AS late,
      ROUND(d1)::numeric       AS d1,
      ROUND(d2)::numeric       AS d2,
      ROUND(d3)::numeric       AS d3
    FROM cash
  `)
  const r = rows[0] as Record<string, unknown>
  const recaudoFacturado = Number(r.ontime ?? 0)
  const recaudoMora = Number(r.late ?? 0)
  return {
    facturacionMes:   Number(r.facturacion ?? 0),
    recaudoFacturado,
    recaudoMora,
    totalRecaudo:     recaudoFacturado + recaudoMora,
    decena1:          Number(r.d1 ?? 0),
    decena2:          Number(r.d2 ?? 0),
    decena3:          Number(r.d3 ?? 0),
  }
}

async function getPagos_uncached(month: string): Promise<PagoRow[]> {
  assertPeriodo(month)
  const monthFilter = `AND date_trunc('month', p.fecha_recaudo) = DATE '${month}-01'`

  // assertPeriodo guarantees a month, so the CTE is always present — the SELECT below
  // reads from `vp`, which only exists because electricityTenantsSubquery defines it.
  const [y, m] = month.split("-").map(Number)
  const electricityCte = `WITH ${electricityTenantsSubquery(`DATE '${month}-01'`, prevMonthStr(y, m))}`

  const rows = await execute(`
    ${electricityCte}
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
      p.cruce AS siesa_cruce,
      COALESCE(p.dias_mora_al_pago, 0) AS dias_mora_al_pago,
      inv.periodo AS invoice_periodo
    FROM vp p
    LEFT JOIN v2.inquilinos t ON t.id = p.inquilino_id
    LEFT JOIN siesa_raw.documentos inv
      ON inv.documento = '001-' || p.cruce
      AND inv.tipo     = 'Facturas'
    WHERE 1=1
      ${EXCLUDE_ELECTRICITY}
    ${monthFilter}
    ORDER BY p.fecha_recaudo DESC
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
    diasMoraAlPago: Number(r.dias_mora_al_pago ?? 0),
    invoicePeriodo: r.invoice_periodo != null ? Number(r.invoice_periodo) : null,
  }))
}

// Range reader for the /pagos drill-down: same PagoRow[] shape as getPagos,
// but over an arbitrary [from, to] date window (YYYY-MM-DD, inclusive)
// instead of a single calendar month. getPagos / getPagosKPIs /
// getPagosBuckets above are untouched — Resumen depends on them as-is.
async function getPagosRange_uncached(from: string, to: string): Promise<PagoRow[]> {
  assertFecha(from)
  assertFecha(to)
  if (from > to) throw new Error(`Invalid range: desde ${from} is after hasta ${to}.`)

  const electricityCte = `WITH ${electricityTenantsSubqueryRange(from, to)}`

  const rows = await execute(`
    ${electricityCte}
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
      p.cruce AS siesa_cruce,
      COALESCE(p.dias_mora_al_pago, 0) AS dias_mora_al_pago,
      inv.periodo AS invoice_periodo
    FROM vp p
    LEFT JOIN v2.inquilinos t ON t.id = p.inquilino_id
    LEFT JOIN siesa_raw.documentos inv
      ON inv.documento = '001-' || p.cruce
      AND inv.tipo     = 'Facturas'
    WHERE 1=1
      ${EXCLUDE_ELECTRICITY_RANGE}
      AND p.fecha_recaudo BETWEEN DATE '${from}' AND DATE '${to}'
    ORDER BY p.fecha_recaudo DESC
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
    diasMoraAlPago: Number(r.dias_mora_al_pago ?? 0),
    // Rolling-window note: siesa_raw.documentos holds recent months only —
    // NULL here is expected for old rows, not a bug.
    invoicePeriodo: r.invoice_periodo != null ? Number(r.invoice_periodo) : null,
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

async function getPagosBuckets_uncached(month: string): Promise<PagosBuckets> {
  assertPeriodo(month)
  const [y, m] = month.split("-").map(Number)
  const prev = prevMonthStr(y, m)
  const monthExpr = `DATE '${month}-01'`
  const grace = await getGracePeriod()

  const rows = await execute(`
    WITH ${electricityTenantsSubquery(monthExpr, prev)},
    deduped AS (
      SELECT p.inquilino_id, p.fecha_recaudo, p.valor_final, p.dias_mora_al_pago,
             inv.periodo AS invoice_periodo
      FROM vp p
      LEFT JOIN siesa_raw.documentos inv
        ON inv.documento = '001-' || p.cruce
        AND inv.tipo     = 'Facturas'
      WHERE date_trunc('month', p.fecha_recaudo) = ${monthExpr}
        ${EXCLUDE_ELECTRICITY}
    ),
    classified AS (
      SELECT
        d.inquilino_id,
        d.fecha_recaudo,
        d.valor_final,
        CASE
          WHEN d.invoice_periodo IS NOT NULL AND d.invoice_periodo < ${y * 100 + m} THEN 'mora'
          WHEN COALESCE(d.dias_mora_al_pago, 0) > ${grace} THEN 'mora'
          WHEN EXTRACT(DAY FROM d.fecha_recaudo) BETWEEN 1 AND 10 THEN 'temprano'
          ELSE 'tardio'
        END AS bucket
      FROM deduped d
    ),
    by_tenant AS (
      SELECT
        inquilino_id,
        bucket,
        SUM(valor_final)::numeric  AS total,
        MIN(fecha_recaudo)::text   AS primera_fecha
      FROM classified
      GROUP BY inquilino_id, bucket
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

// ── Cached exports (30-min window; read-only — pagos has no admin mutation) ──
export const getResumenKPIs  = cached(getResumenKPIs_uncached,  ["pagos:resumen"],  "pagos")
export const getPagosKPIs    = cached(getPagosKPIs_uncached,    ["pagos:kpis"],    "pagos")
export const getPagos        = cached(getPagos_uncached,        ["pagos:list"],    "pagos")
export const getPagosBuckets = cached(getPagosBuckets_uncached, ["pagos:buckets"], "pagos")
export const getPagosRange   = cached(getPagosRange_uncached,   ["pagos:range"],   "pagos")
