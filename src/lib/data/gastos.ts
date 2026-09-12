import { execute } from "@/lib/db/executor"
import { assertPeriodo, assertYear, isValidPeriodo } from "@/lib/security/validators"
import { cached } from "@/lib/cache"

export { isValidPeriodo }

export type GastoDetail = { name: string; amount: number }

export type GastoRow = {
  id: string
  periodo: string
  gastoTypeName: string
  category: string
  allocationMethod: string
  totalAmount: number
  prevAmount: number
  description: string | null
  details: GastoDetail[]
  isAllocated: boolean
  isMissing: boolean
}

export type GastoSummary = {
  totalYtd: number
  avgMensual: number
  totalMeses: number
  lastPeriodo: string
  lastTotal: number
}

export type GastoChartRow = {
  periodo: string
  vigilancia: number
  reparaciones: number
  nomina: number
  servicios_publicos: number
  aseo_cafeteria: number
  publicidad: number
  impuestos: number
  otros: number
  total: number
}

export type GastoPeriodo = { value: string; label: string }

const MES_3 = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function periodoLabel(p: string): string {
  const [y, m] = p.split("-")
  const mIdx = Number(m) - 1
  if (mIdx < 0 || mIdx > 11) return p
  return `${MES_3[mIdx]} ${y}`
}

// Converts 'YYYY-MM' → integer YYYYMM for siesa_raw.estado_resultados.periodo
function periodoToSiesa(p: string): string {
  return p.replace("-", "")
}

// Returns the previous month as 'YYYY-MM' (handles Jan → Dec of prior year)
function prevPeriodo(p: string): string {
  const [y, m] = p.split("-").map(Number)
  const d = new Date(y, m - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const CAT_LABEL: Record<string, string> = {
  vigilancia:          "Vigilancia",
  nomina:              "Nómina",
  servicios_publicos:  "Servicios Públicos",
  aseo_cafeteria:      "Aseo y Cafetería",
  publicidad:          "Publicidad",
  reparaciones:        "Reparaciones",
  impuestos:           "Impuestos",
  otros:               "Otros",
}

// Account → category mapping applied in every SQL query
const CATEGORY_CASE = `
  CASE
    WHEN cuenta = '52350506'                                         THEN 'vigilancia'
    WHEN LEFT(cuenta, 4) = '5205'                                    THEN 'nomina'
    WHEN cuenta IN ('52352501','52353001','52353502','52353505')      THEN 'servicios_publicos'
    WHEN cuenta IN ('52350505','52952501','52952502')                 THEN 'aseo_cafeteria'
    WHEN cuenta = '52356001'                                         THEN 'publicidad'
    WHEN cuenta = '52501501'                                         THEN 'reparaciones'
    WHEN LEFT(cuenta, 4) = '5215'                                    THEN 'impuestos'
    ELSE                                                             'otros'
  END
`

async function getGastoPeriodos_uncached(): Promise<GastoPeriodo[]> {
  const rows = await execute(`
    SELECT DISTINCT
      LEFT(periodo::text, 4) || '-' || RIGHT(periodo::text, 2) AS periodo
    FROM siesa_raw.estado_resultados
    WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5'
    ORDER BY periodo DESC
  `)
  return rows.map((r) => {
    const v = String(r.periodo)
    return { value: v, label: periodoLabel(v) }
  })
}

function parseDetails(raw: unknown): GastoDetail[] {
  if (!Array.isArray(raw)) return []
  return raw.map((d: Record<string, unknown>) => ({
    name:   String(d.name ?? ""),
    amount: Number(d.amount ?? 0),
  }))
}

async function getGastoRows_uncached(periodo?: string): Promise<GastoRow[]> {
  if (periodo) {
    assertPeriodo(periodo)
    const prev = prevPeriodo(periodo)
    const rows = await execute(`
      WITH raw AS (
        SELECT valor, desc_cuenta, ${CATEGORY_CASE} AS cat
        FROM siesa_raw.estado_resultados
        WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5' AND periodo = ${periodoToSiesa(periodo)}
      ),
      prev_raw AS (
        SELECT valor, ${CATEGORY_CASE} AS cat
        FROM siesa_raw.estado_resultados
        WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5' AND periodo = ${periodoToSiesa(prev)}
      ),
      by_cuenta AS (
        SELECT cat, desc_cuenta, SUM(valor)::numeric AS sub_total
        FROM raw GROUP BY cat, desc_cuenta
      ),
      prev_by_cat AS (
        SELECT cat, SUM(valor)::numeric AS prev_total
        FROM prev_raw GROUP BY cat
      )
      SELECT
        cur.cat                                                                     AS category,
        SUM(cur.sub_total)::numeric                                                 AS total_amount,
        COALESCE(p.prev_total, 0)::numeric                                          AS prev_amount,
        JSON_AGG(JSON_BUILD_OBJECT('name', cur.desc_cuenta, 'amount', cur.sub_total)
                 ORDER BY cur.sub_total DESC)                                       AS details
      FROM by_cuenta cur
      LEFT JOIN prev_by_cat p ON p.cat = cur.cat
      GROUP BY cur.cat, p.prev_total
      ORDER BY total_amount DESC
    `)
    return rows.map((r) => {
      const cat     = String(r.category)
      const details = parseDetails(r.details)
      return {
        id:               `siesa-${cat}-${periodo}`,
        periodo,
        gastoTypeName:    CAT_LABEL[cat] ?? cat,
        category:         cat,
        allocationMethod: "pro_rata",
        totalAmount:      Number(r.total_amount ?? 0),
        prevAmount:       Number(r.prev_amount  ?? 0),
        description:      details.map((d) => d.name).join(" · ") || null,
        details,
        isAllocated:      false,
        isMissing:        false,
      }
    })
  }

  // All periods — grouped by period + category
  const rows = await execute(`
    WITH raw AS (
      SELECT
        LEFT(periodo::text, 4) || '-' || RIGHT(periodo::text, 2) AS periodo_str,
        valor,
        desc_cuenta,
        ${CATEGORY_CASE} AS cat
      FROM siesa_raw.estado_resultados
      WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5'
    ),
    by_cuenta AS (
      SELECT periodo_str, cat, desc_cuenta, SUM(valor)::numeric AS sub_total
      FROM raw
      GROUP BY periodo_str, cat, desc_cuenta
    )
    SELECT
      periodo_str                                                                   AS periodo,
      cat                                                                           AS category,
      SUM(sub_total)::numeric                                                       AS total_amount,
      JSON_AGG(JSON_BUILD_OBJECT('name', desc_cuenta, 'amount', sub_total)
               ORDER BY sub_total DESC)                                             AS details
    FROM by_cuenta
    GROUP BY periodo_str, cat
    ORDER BY periodo_str DESC, total_amount DESC
  `)
  return rows.map((r) => {
    const cat     = String(r.category)
    const per     = String(r.periodo)
    const details = parseDetails(r.details)
    return {
      id:               `siesa-${cat}-${per}`,
      periodo:          per,
      gastoTypeName:    CAT_LABEL[cat] ?? cat,
      category:         cat,
      allocationMethod: "pro_rata",
      totalAmount:      Number(r.total_amount ?? 0),
      prevAmount:       0,
      description:      details.map((d) => d.name).join(" · ") || null,
      details,
      isAllocated:      false,
      isMissing:        false,
    }
  })
}

async function getGastoSummary_uncached(year: string): Promise<GastoSummary> {
  assertYear(year)
  const rows = await execute(`
    WITH monthly AS (
      SELECT
        LEFT(periodo::text, 4) || '-' || RIGHT(periodo::text, 2) AS periodo_str,
        SUM(valor)::numeric AS total
      FROM siesa_raw.estado_resultados
      WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5'
        AND LEFT(periodo::text, 4) = '${year}'
      GROUP BY periodo
    )
    SELECT
      SUM(total)::numeric                                                       AS total_ytd,
      ROUND(AVG(total), 0)::numeric                                             AS avg_mensual,
      COUNT(*)::int                                                             AS total_meses,
      (SELECT periodo_str FROM monthly ORDER BY periodo_str DESC LIMIT 1)      AS last_periodo,
      (SELECT total       FROM monthly ORDER BY periodo_str DESC LIMIT 1)      AS last_total
    FROM monthly
  `)
  const r = rows[0] as Record<string, unknown>
  return {
    totalYtd:    Number(r?.total_ytd   ?? 0),
    avgMensual:  Number(r?.avg_mensual ?? 0),
    totalMeses:  Number(r?.total_meses ?? 0),
    lastPeriodo: String(r?.last_periodo ?? ""),
    lastTotal:   Number(r?.last_total  ?? 0),
  }
}

async function getGastosForPeriodo_uncached(periodo: string): Promise<GastoChartRow> {
  assertPeriodo(periodo)
  const rows = await execute(`
    WITH raw AS (
      SELECT valor, ${CATEGORY_CASE} AS cat
      FROM siesa_raw.estado_resultados
      WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5'
        AND periodo = ${periodoToSiesa(periodo)}
    )
    SELECT
      COALESCE(SUM(valor) FILTER (WHERE cat = 'vigilancia'),        0)::numeric AS vigilancia,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'reparaciones'),      0)::numeric AS reparaciones,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'nomina'),            0)::numeric AS nomina,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'servicios_publicos'),0)::numeric AS servicios_publicos,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'aseo_cafeteria'),    0)::numeric AS aseo_cafeteria,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'publicidad'),        0)::numeric AS publicidad,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'impuestos'),         0)::numeric AS impuestos,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'otros'),             0)::numeric AS otros,
      COALESCE(SUM(valor),                                          0)::numeric AS total
    FROM raw
  `)
  if (!rows.length || Number((rows[0] as Record<string, unknown>).total) === 0) {
    return { periodo: periodoLabel(periodo), vigilancia: 0, reparaciones: 0, nomina: 0, servicios_publicos: 0, aseo_cafeteria: 0, publicidad: 0, impuestos: 0, otros: 0, total: 0 }
  }
  const r = rows[0] as Record<string, unknown>
  return {
    periodo:            periodoLabel(periodo),
    vigilancia:         Number(r.vigilancia         ?? 0),
    reparaciones:       Number(r.reparaciones       ?? 0),
    nomina:             Number(r.nomina             ?? 0),
    servicios_publicos: Number(r.servicios_publicos ?? 0),
    aseo_cafeteria:     Number(r.aseo_cafeteria     ?? 0),
    publicidad:         Number(r.publicidad         ?? 0),
    impuestos:          Number(r.impuestos          ?? 0),
    otros:              Number(r.otros              ?? 0),
    total:              Number(r.total              ?? 0),
  }
}

async function getGastosHistorico_uncached(periodo: string, nMeses = 6): Promise<GastoChartRow[]> {
  assertPeriodo(periodo)
  const rows = await execute(`
    WITH months AS (
      SELECT DISTINCT periodo
      FROM siesa_raw.estado_resultados
      WHERE ccosto = '285' AND LEFT(cuenta, 1) = '5'
        AND LEFT(periodo::text, 4) || '-' || RIGHT(periodo::text, 2) <= '${periodo}'
      ORDER BY periodo DESC
      LIMIT ${nMeses}
    ),
    raw AS (
      SELECT
        LEFT(e.periodo::text, 4) || '-' || RIGHT(e.periodo::text, 2) AS periodo_str,
        e.valor,
        ${CATEGORY_CASE} AS cat
      FROM siesa_raw.estado_resultados e
      WHERE e.ccosto = '285' AND LEFT(e.cuenta, 1) = '5' AND e.periodo IN (SELECT periodo FROM months)
    )
    SELECT
      periodo_str                                                              AS periodo,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'vigilancia'),        0)::numeric AS vigilancia,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'reparaciones'),      0)::numeric AS reparaciones,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'nomina'),            0)::numeric AS nomina,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'servicios_publicos'),0)::numeric AS servicios_publicos,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'aseo_cafeteria'),    0)::numeric AS aseo_cafeteria,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'publicidad'),        0)::numeric AS publicidad,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'impuestos'),         0)::numeric AS impuestos,
      COALESCE(SUM(valor) FILTER (WHERE cat = 'otros'),             0)::numeric AS otros,
      COALESCE(SUM(valor),                                          0)::numeric AS total
    FROM raw
    GROUP BY periodo_str
    ORDER BY periodo_str ASC
  `)
  return rows.map((r) => ({
    periodo:            periodoLabel(String(r.periodo)),
    vigilancia:         Number(r.vigilancia         ?? 0),
    reparaciones:       Number(r.reparaciones       ?? 0),
    nomina:             Number(r.nomina             ?? 0),
    servicios_publicos: Number(r.servicios_publicos ?? 0),
    aseo_cafeteria:     Number(r.aseo_cafeteria     ?? 0),
    publicidad:         Number(r.publicidad         ?? 0),
    impuestos:          Number(r.impuestos          ?? 0),
    otros:              Number(r.otros              ?? 0),
    total:              Number(r.total              ?? 0),
  }))
}

// ── Cached exports (30-min window; read-only — gastos is ERP-derived) ──
export const getGastoPeriodos    = cached(getGastoPeriodos_uncached,    ["gastos:periodos"],   "gastos")
export const getGastoRows        = cached(getGastoRows_uncached,        ["gastos:rows"],       "gastos")
export const getGastoSummary     = cached(getGastoSummary_uncached,     ["gastos:summary"],    "gastos")
export const getGastosForPeriodo = cached(getGastosForPeriodo_uncached, ["gastos:forPeriodo"], "gastos")
export const getGastosHistorico  = cached(getGastosHistorico_uncached,  ["gastos:historico"],  "gastos")
