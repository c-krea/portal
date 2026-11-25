import { execute, executeDml } from "@/lib/db/executor"
import { bustTags, cached } from "@/lib/cache"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { assertUuid } from "@/lib/security/validators"

// ── Late-interest (interés de mora) — DIAN / art. 635 E.T. method ──────────────
// interés = vr_vencido × (tasa_ea_mes ÷ 366) × dias_vencidos
//   dias_vencidos = today − fecha de vencimiento efectiva
//   vencimiento efectivo = fecha_factura + 30, siempre (regla única del owner).
// Rate = tasa DIAN del mes vigente (v2.tasa_interes_mora), aplicada a todo el tramo.

export type MoraInvoice = {
  factura: string
  fechaFactura: string        // 'YYYY-MM-DD'
  vencimiento: string         // effective due date used for the interest count
  diasVencidos: number
  saldoVencido: number
  interes: number
  unidad: string | null
}

export type MoraRow = {
  tenantId: string
  cliente: string
  unitNumber: string | null   // unit of the most-overdue invoice (for the row link)
  diasMora: number            // max diasVencidos across the tenant's invoices
  facturas: number            // invoice count
  saldoVencido: number        // sum of overdue balances
  interes: number             // sum of interest
  carteraCorriente: number    // open balance not yet due (vr_corriente, Z40 FVS); 0 for jurídica
  invoices: MoraInvoice[]     // per-invoice detail (expandable in the UI)
  // Not-yet-due Z40 FVS invoices (vr_corriente) behind carteraCorriente. Shown in
  // /resumen's dropdown next to the overdue ones; diasVencidos ≤ 0 = días para vencer.
  corrientes: MoraInvoice[]
}

export type MoraSummary = {
  totalCarteraVencida: number
  totalInteres: number
  invoicesVencidas: number
  clientes: number
  promedioDias: number
  juridicaCarteraVencida: number
  juridicaInteres: number
  juridicaClientes: number
  tasaEa: number | null       // DIAN rate in effect (fallback to latest <= current month)
  periodo: string             // current 'YYYY-MM'
  tasaPeriodo: string | null  // periodo of the rate actually in use (null if none)
}

export type MoraData = {
  activos: MoraRow[]
  juridica: MoraRow[]
  summary: MoraSummary
}

// Cached under "mora" — busts on ERP sync, financial-rule edits, and rate edits.
export const getMoraData = cached(getMoraData_uncached, ["mora:data"], "mora")

export type MoraSnapshotRow = {
  periodo: string
  clientes: number
  saldoVencido: number
}

// ── DIAN late-interest — single home ──────────────────────────────────────────
// interés = vr_vencido × (tasa_ea_mes ÷ 366) × dias_vencidos,
// dias_vencidos = GREATEST(0, CURRENT_DATE − venc_efec),
// venc_efec = fecha_factura + 30, siempre (regla única aprobada por el owner).
//   El ERP no es confiable: cond_pago dice "CREDITO A 10 DIAS" para todos pero la
//   regla de negocio es día-31, y la misma condición emite términos de 0 a 30 días.
//   La heurística vieja (ERP salvo bug factura+10 → factura+30) se retiró por inerte.
// mora, tenant-detail, portal, clientes y reportes construyen sus queries sobre
// estos fragmentos — no duplicarlos. Los sitios difieren en tabla/filtros/columnas,
// nunca en fórmula.
export function moraRateCteSql(): string {
  return `rate AS (
      SELECT tasa_ea FROM v2.tasa_interes_mora
       WHERE periodo <= to_char(CURRENT_DATE,'YYYY-MM') ORDER BY periodo DESC LIMIT 1
    )`
}

// Vencimiento efectivo: flat (fechaFactura + 30). Se mantiene el primer parámetro
// (_fechaVenceSql) solo por compatibilidad para no tocar /proyecciones ni /resumen
// (pagos.ts) ni los call sites de portal/tenant-detail: todos siguen pasando
// (vence, factura) y la función ignora el vencimiento ERP. El código nuevo pasa la
// columna de vencimiento real por consistencia aunque se ignore.

export function moraVencEfecExpr(_fechaVenceSql: string, fechaFacturaSql: string): string {
  return `(${fechaFacturaSql} + 30)`
}

export function moraEsJuridicaExpr(tenantAlias = "t"): string {
  return `(COALESCE(${tenantAlias}.juridica, false) = true)`
}

export function moraPastDueExpr(vencEfecSql: string): string {
  return `(${vencEfecSql} < CURRENT_DATE)`
}

export function moraDiasVencidosExpr(vencEfecSql: string): string {
  return `GREATEST(0, CURRENT_DATE - ${vencEfecSql})`
}

export function moraInteresExpr(vrVencidoSql: string, vencEfecSql: string): string {
  return `ROUND(${vrVencidoSql} * COALESCE((SELECT tasa_ea FROM rate), 0) / 366 * ${moraDiasVencidosExpr(vencEfecSql)})`
}

// ── Tasa DIAN vigente — lectura única para la UI ───────────────────────────────
// Misma fuente que moraRateCteSql (tasa del mes vigente, fallback al último
// periodo <= mes actual). La UI tenant-facing y staff muestra la diaria real
// (tasa_ea / 366 × 100) en vez de hardcodear la 0.05% pre-DIAN ya superada.
// Nunca hardcodear 0.0756 ni ninguna diaria: leer de v2.tasa_interes_mora.
async function getTasaMoraVigente_uncached(): Promise<number | null> {
  const rows = await execute(`
    SELECT tasa_ea FROM v2.tasa_interes_mora
     WHERE periodo <= to_char(CURRENT_DATE,'YYYY-MM') ORDER BY periodo DESC LIMIT 1
  `)
  const v = (rows as Array<Record<string, unknown>>)[0]?.tasa_ea
  return v == null ? null : Number(v)
}

export const getTasaMoraVigente = cached(getTasaMoraVigente_uncached, ["mora:tasa"], "mora")

// ── "Who counts as en mora" — single source of truth ───────────────────────────
// Overdue FVS invoices (vr_vencido > 0 AND factura LIKE 'FVS-%') joined to
// inquilinos, with es_juridica = flag-only (COALESCE(t.juridica,false)=true).
// No contract-existence clause: a missing contract row never marks anyone as
// jurídica (owner decision WOR-323 amendment — PUNTO ACRILICO shows in main
// numbers because it was never marked jurídica). Both getMoraData_uncached and
// upsertMoraSnapshot build on this fragment — do not duplicate it. Exported para que /locales, reportes y
// notificaciones reutilicen la regla en vez de copiarla.
export function moraEnMoraBaseSql(empresaId: string): string {
  return `
      SELECT
        t.id                                     AS tenant_id,
        COALESCE(t.nombre_corto, t.razon_social) AS cliente,
        ${moraEsJuridicaExpr("t")}               AS es_juridica,
        NULLIF(REGEXP_REPLACE(c.sucursal, '^.*[[:space:]]', ''), '') AS unidad,
        c.factura,
        c.fecha_factura::date                    AS fecha_factura,
        ${moraVencEfecExpr("c.fecha_vencimiento", "c.fecha_factura::date")} AS venc_efec,
        c.vr_vencido
      FROM v2.vista_cartera_actual c
      JOIN v2.inquilinos t ON c.inquilino_id = t.id
      WHERE c.vr_vencido > 0 AND c.factura LIKE 'FVS-%'
        AND t.empresa_id = '${empresaId}'::uuid
  `
}

// ── Cartera jurídica — fuente propia ─────────────────────────────────────────
// SIESA mueve la cartera en cobro jurídico a la zona Z99, que vista_cartera_actual
// (solo Z40) no ve. Se toma de siesa_raw.cartera Z99 y se limita a C-Krea con el
// punto de envío del cliente (row_id_tercero + id_sucursal) en lista de precios
// 'ACK'. EXISTS y no JOIN: un cliente puede tener varios puntos por sucursal
// (p. ej. 4 en ARIAS GARCIA) y un JOIN multiplicaría las facturas. La cartera trae
// una fila por factura (row_id NO es único: lo comparten varias facturas).
export function moraJuridicaBaseSql(empresaId: string): string {
  assertUuid(empresaId)
  return `
      SELECT
        COALESCE(t.id::text, trim(c.documento))  AS tenant_id,
        COALESCE(t.nombre_corto, t.razon_social, c.cliente) AS cliente,
        true                                     AS es_juridica,
        NULLIF(REGEXP_REPLACE(c.sucursal, '^.*[[:space:]]', ''), '') AS unidad,
        c.factura,
        c.fecha_factura::date                    AS fecha_factura,
        ${moraVencEfecExpr("c.fecha_vence::date", "c.fecha_factura::date")} AS venc_efec,
        c.vr_vencido
      FROM siesa_raw.cartera c
      LEFT JOIN v2.inquilinos t ON t.nit = trim(c.documento) AND t.empresa_id = '${empresaId}'::uuid
      WHERE c.id_zona = 'Z99'
        AND NOT COALESCE(c."Eliminado", false)
        AND c.vr_vencido > 0
        AND EXISTS (
          SELECT 1 FROM siesa_raw.puntos_de_envio p
          WHERE p.rowid_cliente = c.row_id_tercero
            AND trim(p.id_sucursal) = trim(c.id_sucursal)
            AND trim(p.id_lista_precio) = 'ACK'
            AND NOT COALESCE(p."Eliminado", false)
        )
  `
}

async function getMoraTrend_uncached(): Promise<MoraSnapshotRow[]> {
  const empresaId = await getEmpresaCkreaId()
  const rows = await execute(`
    SELECT periodo, clientes, saldo_vencido
    FROM v2.mora_snapshots_mensuales
    WHERE empresa_id = '${empresaId}'::uuid
      AND periodo < to_char(CURRENT_DATE, 'YYYY-MM')
    ORDER BY periodo DESC
    LIMIT 2
  `)
  return rows
    .map((r) => ({
      periodo: String(r.periodo),
      clientes: Number(r.clientes ?? 0),
      saldoVencido: Number(r.saldo_vencido ?? 0),
    }))
    .reverse()
}

export const getMoraTrend = cached(getMoraTrend_uncached, ["mora:trend"], "mora")

export type MoraTrendPoint = {
  periodo: string
  saldoVencido: number
}

// ── Reconstructed month-start mora trend (WOR-321) ─────────────────────────────
// Month-start mora is rebuildable from data we already hold: every peso owed at
// date D is EITHER still open in vista_cartera_actual today, OR was paid after D
// and sits in vista_pagos. Sum of both halves = mora balance at D. Stable over
// time: when a tenant pays down old mora, that peso moves from the "still open"
// half to the "paid after D" half and the total for month D does not change.
//
// ONE pass, set-based: each view is scanned exactly once into small grouped
// aggregates (cartera by due-month, pagos by due-month × pago-month), then joined
// against the month series. No per-month correlated scan of the base tables and
// no JS-side bucketing (~100ms on the local twin vs the 8s statement timeout).
// Each point is the balance at the END of its month: the cutoff for month M is
// the first instant of M+1, so the bar labelled 2026-08 is what was still owed
// once August closed. The CURRENT month is the exception — its cutoff is
// CURRENT_DATE, so the last point is live and equals the /mora KPI exactly, and
// it only freezes when the month turns over. That live cutoff is mid-month, so
// the comparisons are day-grain, not the month-grain shortcut used before.
//
// Amount is valor_final (cash received), rounded per month. Matches the page KPI
// definition: effective due date via moraVencEfecExpr (flat factura+30) on both
// sides, FVS only, non-jurídica, vr_vencido > 0, scoped by empresa_id.
//
// Does NOT replace upsertMoraSnapshot/getMoraTrend: the snapshot is the audit
// record of what was true that day (it captures invoices later cancelled, which
// this reconstruction silently forgets).
async function getMoraTrendReconstruido_uncached(empresaId: string): Promise<MoraTrendPoint[]> {
  assertUuid(empresaId)
  const vencCartera = moraVencEfecExpr("c.fecha_vencimiento", "c.fecha_factura::date")
  const vencPagos = moraVencEfecExpr("p.fecha_vencimiento", "p.fecha_factura")
  const rows = await execute(`
    WITH months AS (
      SELECT generate_series(DATE '2025-01-01', date_trunc('month', CURRENT_DATE)::date, INTERVAL '1 month')::date AS m
    ),
    cortes AS (
      SELECT m, LEAST((m + INTERVAL '1 month')::date, CURRENT_DATE) AS corte FROM months
    ),
    cartera_m AS (
      SELECT (${vencCartera}) AS vm, SUM(c.vr_vencido) AS s
      FROM v2.vista_cartera_actual c
      WHERE c.empresa_id = '${empresaId}'::uuid
        AND COALESCE(c.juridica, false) = false
        AND c.factura LIKE 'FVS-%'
        AND c.vr_vencido > 0
      GROUP BY 1
    ),
    pagos_m AS (
      SELECT (${vencPagos}) AS vm,
             p.fecha_recaudo::date AS pm,
             SUM(p.valor_final) AS s
      FROM v2.vista_pagos p
      WHERE p.empresa_id = '${empresaId}'::uuid
        AND COALESCE(p.juridica, false) = false
        AND p.cruce LIKE 'FVS-%'
      GROUP BY 1, 2
    ),
    cartera_cum AS (
      SELECT x.m AS m, SUM(cm.s) AS s FROM cortes x JOIN cartera_m cm ON cm.vm < x.corte GROUP BY x.m
    ),
    pagos_cum AS (
      SELECT x.m AS m, SUM(pm.s) AS s FROM cortes x JOIN pagos_m pm ON pm.vm < x.corte AND pm.pm >= x.corte GROUP BY x.m
    )
    SELECT to_char(m.m, 'YYYY-MM') AS periodo,
           ROUND(COALESCE(c.s, 0) + COALESCE(p.s, 0)) AS saldo_vencido
    FROM months m
    LEFT JOIN cartera_cum c ON c.m = m.m
    LEFT JOIN pagos_cum   p ON p.m = m.m
    ORDER BY m.m
  `)
  return rows.map((r) => ({
    periodo: String(r.periodo),
    saldoVencido: Number(r.saldo_vencido ?? 0),
  }))
}

export const getMoraTrendReconstruido = cached(getMoraTrendReconstruido_uncached, ["mora:trend-reconstruido"], "mora")

export async function upsertMoraSnapshot(empresaId: string): Promise<void> {
  const baseSql = moraEnMoraBaseSql(empresaId)
  await executeDml(`
    INSERT INTO v2.mora_snapshots_mensuales (empresa_id, periodo, clientes, saldo_vencido)
    SELECT
      '${empresaId}'::uuid,
      to_char(CURRENT_DATE, 'YYYY-MM'),
      COUNT(DISTINCT CASE WHEN NOT es_juridica THEN tenant_id END),
      COALESCE(SUM(CASE WHEN NOT es_juridica THEN vr_vencido ELSE 0 END), 0)
    FROM (
      ${baseSql}
    ) s
    ON CONFLICT (empresa_id, periodo) DO UPDATE SET
      clientes = excluded.clientes,
      saldo_vencido = excluded.saldo_vencido,
      updated_at = now()
  `)
  bustTags("mora")
}

type RawInvoice = {
  tenant_id: string
  cliente: string
  es_juridica: boolean
  unidad: string | null
  factura: string
  fecha_factura: string
  venc_efec: string
  dias_vencidos: number
  vr_vencido: number
  interes: number
}

async function getMoraData_uncached(): Promise<MoraData> {
  const empresaId = await getEmpresaCkreaId()
  const baseSql = moraEnMoraBaseSql(empresaId)
  const rateRows = await execute(`
    SELECT
      to_char(CURRENT_DATE,'YYYY-MM') AS periodo,
      (SELECT tasa_ea FROM v2.tasa_interes_mora
        WHERE periodo <= to_char(CURRENT_DATE,'YYYY-MM') ORDER BY periodo DESC LIMIT 1) AS tasa_ea,
      (SELECT periodo FROM v2.tasa_interes_mora
        WHERE periodo <= to_char(CURRENT_DATE,'YYYY-MM') ORDER BY periodo DESC LIMIT 1) AS tasa_periodo
  `)
  const periodo = String(rateRows[0]?.periodo ?? "")
  const tasaEa = rateRows[0]?.tasa_ea == null ? null : Number(rateRows[0].tasa_ea)
  const tasaPeriodo = rateRows[0]?.tasa_periodo == null ? null : String(rateRows[0].tasa_periodo)

  const rows = (await execute(`
    WITH ${moraRateCteSql()},
    base AS (
      -- Z40 (activos + inquilinos marcados jurídica) + cartera jurídica Z99/ACK.
      -- Zonas distintas: ninguna factura cae en ambas (verificado 2026-11-20).
      SELECT tenant_id::text, cliente, es_juridica, unidad, factura, fecha_factura, venc_efec, vr_vencido
      FROM (${baseSql}) z40
      UNION ALL
      ${moraJuridicaBaseSql(empresaId)}
    )
    SELECT
      tenant_id, cliente, es_juridica, unidad, factura, fecha_factura, venc_efec,
      ${moraDiasVencidosExpr("venc_efec")} AS dias_vencidos,
      vr_vencido,
      ${moraInteresExpr("vr_vencido", "venc_efec")} AS interes
    FROM base
    ORDER BY cliente, fecha_factura
  `)) as unknown as RawInvoice[]

  // Keyed by tenant + jurídica: a tenant can have Z40 (activo) and Z99 (jurídica)
  // invoices at once, and each set belongs to its own section.
  const byTenant = new Map<string, MoraRow>()
  const juridicaFlag = new Map<MoraRow, boolean>()

  for (const r of rows) {
    const key = `${r.tenant_id}|${r.es_juridica === true}`
    const inv: MoraInvoice = {
      factura: String(r.factura),
      fechaFactura: String(r.fecha_factura),
      vencimiento: String(r.venc_efec),
      diasVencidos: Number(r.dias_vencidos ?? 0),
      saldoVencido: Number(r.vr_vencido ?? 0),
      interes: Number(r.interes ?? 0),
      unidad: r.unidad ? String(r.unidad) : null,
    }
    let row = byTenant.get(key)
    if (!row) {
      row = {
        tenantId: String(r.tenant_id),
        cliente: String(r.cliente),
        unitNumber: null,
        diasMora: 0,
        facturas: 0,
        saldoVencido: 0,
        interes: 0,
        carteraCorriente: 0,
        invoices: [],
        corrientes: [],
      }
      byTenant.set(key, row)
      juridicaFlag.set(row, r.es_juridica === true)
    }
    row.invoices.push(inv)
    row.facturas += 1
    row.saldoVencido += inv.saldoVencido
    row.interes += inv.interes
    if (inv.diasVencidos > row.diasMora) {
      row.diasMora = inv.diasVencidos
      row.unitNumber = inv.unidad
    }
  }

  // Cartera corriente (not yet due) per invoice, attached to the activo row (or
  // the jurídica row of a Z40 tenant marked jurídica, if that is its only row):
  // what a tenant in mora must also pay this month on top of the overdue balance.
  const corrienteRows = await execute(`
    SELECT
      c.inquilino_id::text AS tenant_id,
      NULLIF(REGEXP_REPLACE(c.sucursal, '^.*[[:space:]]', ''), '') AS unidad,
      c.factura,
      c.fecha_factura::date AS fecha_factura,
      ${moraVencEfecExpr("c.fecha_vencimiento", "c.fecha_factura::date")} AS venc_efec,
      CURRENT_DATE - ${moraVencEfecExpr("c.fecha_vencimiento", "c.fecha_factura::date")} AS dias,
      c.vr_corriente
    FROM v2.vista_cartera_actual c
    WHERE c.empresa_id = '${empresaId}'::uuid
      AND c.factura LIKE 'FVS-%'
      AND c.vr_corriente > 0
    ORDER BY c.fecha_factura
  `)
  for (const c of corrienteRows) {
    const row = byTenant.get(`${c.tenant_id}|false`) ?? byTenant.get(`${c.tenant_id}|true`)
    if (!row) continue
    const saldo = Number(c.vr_corriente ?? 0)
    row.carteraCorriente += saldo
    row.corrientes.push({
      factura: String(c.factura),
      fechaFactura: String(c.fecha_factura),
      vencimiento: String(c.venc_efec),
      diasVencidos: Number(c.dias ?? 0),
      saldoVencido: saldo,
      interes: 0,
      unidad: c.unidad ? String(c.unidad) : null,
    })
  }

  const all = [...byTenant.values()]
  for (const row of all) row.invoices.sort((a, b) => b.diasVencidos - a.diasVencidos)

  const activos  = all.filter((r) => !juridicaFlag.get(r)).sort((a, b) => b.diasMora - a.diasMora)
  const juridica = all.filter((r) =>  juridicaFlag.get(r)).sort((a, b) => b.diasMora - a.diasMora)

  const sum = (arr: MoraRow[], f: (r: MoraRow) => number) => arr.reduce((s, r) => s + f(r), 0)
  const summary: MoraSummary = {
    totalCarteraVencida:    sum(activos, (r) => r.saldoVencido),
    totalInteres:           sum(activos, (r) => r.interes),
    invoicesVencidas:       sum(activos, (r) => r.facturas),
    clientes:               activos.length,
    promedioDias:           activos.length ? Math.round(sum(activos, (r) => r.diasMora) / activos.length) : 0,
    juridicaCarteraVencida: sum(juridica, (r) => r.saldoVencido),
    juridicaInteres:        sum(juridica, (r) => r.interes),
    juridicaClientes:       juridica.length,
    tasaEa,
    periodo,
    tasaPeriodo,
  }

  return { activos, juridica, summary }
}

// Uncached read for the monthly close (resumen-cierre cron).
export { getMoraTrendReconstruido_uncached as getMoraTrendReconstruidoFresh }
