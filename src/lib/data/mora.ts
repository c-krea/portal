import { execute } from "@/lib/db/executor"
import { cached } from "@/lib/cache"

// ── Late-interest (interés de mora) — DIAN / art. 635 E.T. method ──────────────
// interés = vr_vencido × (tasa_ea_mes ÷ 366) × dias_vencidos
//   dias_vencidos = today − fecha de vencimiento efectiva
//   vencimiento efectivo = ERP fecha_vencimiento, salvo invoices con el bug viejo
//     (fecha_vence = factura+10) → se usa factura+30.
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
  invoices: MoraInvoice[]     // per-invoice detail (expandable in the UI)
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
  tasaEa: number | null       // current-month DIAN rate (null = not entered yet)
  periodo: string             // current 'YYYY-MM'
}

export type MoraData = {
  activos: MoraRow[]
  juridica: MoraRow[]
  summary: MoraSummary
}

// Cached under "mora" — busts on ERP sync, financial-rule edits, and rate edits.
export const getMoraData = cached(getMoraData_uncached, ["mora:data"], "mora")

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
  const rateRows = await execute(`
    SELECT
      to_char(CURRENT_DATE,'YYYY-MM') AS periodo,
      (SELECT tasa_ea FROM v2.tasa_interes_mora
        WHERE periodo = to_char(CURRENT_DATE,'YYYY-MM') LIMIT 1) AS tasa_ea
  `)
  const periodo = String(rateRows[0]?.periodo ?? "")
  const tasaEa = rateRows[0]?.tasa_ea == null ? null : Number(rateRows[0].tasa_ea)

  const rows = (await execute(`
    WITH rate AS (
      SELECT tasa_ea FROM v2.tasa_interes_mora
       WHERE periodo = to_char(CURRENT_DATE,'YYYY-MM') LIMIT 1
    ),
    base AS (
      SELECT
        t.id                                     AS tenant_id,
        COALESCE(t.nombre_corto, t.razon_social) AS cliente,
        (t.juridica = true OR NOT EXISTS (
           SELECT 1 FROM v2.contratos con
           WHERE con.inquilino_id = t.id AND con.estado IN ('activo','critico')
        ))                                       AS es_juridica,
        NULLIF(REGEXP_REPLACE(c.sucursal, '^.*[[:space:]]', ''), '') AS unidad,
        c.factura,
        c.fecha_factura::date                    AS fecha_factura,
        CASE WHEN c.fecha_vencimiento >= c.fecha_factura::date + 25
             THEN c.fecha_vencimiento
             ELSE c.fecha_factura::date + 30 END AS venc_efec,
        c.vr_vencido
      FROM v2.vista_cartera_actual c
      JOIN v2.inquilinos t ON c.inquilino_id = t.id
      WHERE c.vr_vencido > 0 AND c.factura LIKE 'FVS-%'
    )
    SELECT
      tenant_id, cliente, es_juridica, unidad, factura, fecha_factura, venc_efec,
      GREATEST(0, CURRENT_DATE - venc_efec) AS dias_vencidos,
      vr_vencido,
      ROUND(vr_vencido * COALESCE((SELECT tasa_ea FROM rate), 0) / 366
            * GREATEST(0, CURRENT_DATE - venc_efec)) AS interes
    FROM base
    ORDER BY cliente, fecha_factura
  `)) as unknown as RawInvoice[]

  const byTenant = new Map<string, MoraRow>()
  const juridicaFlag = new Map<string, boolean>()

  for (const r of rows) {
    const key = String(r.tenant_id)
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
        tenantId: key,
        cliente: String(r.cliente),
        unitNumber: null,
        diasMora: 0,
        facturas: 0,
        saldoVencido: 0,
        interes: 0,
        invoices: [],
      }
      byTenant.set(key, row)
      juridicaFlag.set(key, r.es_juridica === true)
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

  const all = [...byTenant.values()]
  for (const row of all) row.invoices.sort((a, b) => b.diasVencidos - a.diasVencidos)

  const activos  = all.filter((r) => !juridicaFlag.get(r.tenantId)).sort((a, b) => b.diasMora - a.diasMora)
  const juridica = all.filter((r) =>  juridicaFlag.get(r.tenantId)).sort((a, b) => b.diasMora - a.diasMora)

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
  }

  return { activos, juridica, summary }
}
