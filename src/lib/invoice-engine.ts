/**
 * Invoice generation engine.
 * Follows the Master Invoice Calculation Chain from financial-rules-engine-spec.md §6.
 *
 * Uses projections.canon_proyectado as the effective canon (already IPC-adjusted in seed).
 * Falls back to contract.canon_base if no projection exists for the period.
 */

import { execute, supabaseAdmin } from "@/lib/db/executor"

type LineItemType =
  | "canon" | "descuento" | "pronto_pago" | "iva" | "retencion" | "interes_mora"
  | "gasto_energia" | "gasto_acueducto" | "gasto_aseo" | "gasto_vigilancia"
  | "gasto_nomina" | "gasto_publicidad" | "gasto_reparaciones" | "gasto_otros"

type LineItemInsert = {
  invoiceId: string
  type: LineItemType
  description: string
  amount: string
  taxAmount: string
  sortOrder: number
}

export type InvoicePeriod = { year: number; month: number }

export type GeneratedInvoice = {
  contractId: string
  tenantId: string
  unitId: string
  unitNumber: string
  clienteName: string
  periodo: string
  fechaEmision: string
  fechaVencimiento: string
  subtotalCanon: number
  subtotalDescuentos: number
  subtotalProntoPago: number
  subtotalGastos: number
  iva: number
  total: number
  status: "borrador"
}

/** Billing day from contract flags */
function billingDay(flags: {
  flagUno: boolean
  flagOnce: boolean
  flagVeintiuno: boolean
}): number {
  if (flags.flagOnce) return 11
  if (flags.flagVeintiuno) return 21
  return 1 // flagUno + flagCritico both default to 1st
}

/** YYYY-MM-DD string from year/month/day */
function toDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Add N calendar days to a YYYY-MM-DD string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Round to nearest whole peso (no decimals) */
function roundCOP(n: number): number {
  return Math.round(n)
}

const IVA_RATE = 0.19
// Water is included in the canon — NOT a separate line item.
// Only electricity (metered) is an extra charge billed to tenants.

type ContractRow = {
  contractId: string
  tenantId: string
  unitId: string
  unitNumber: string
  clienteName: string
  canonBase: number
  descuentoPct: number
  prontoPagoPct: number
  flagUno: boolean
  flagOnce: boolean
  flagVeintiuno: boolean
  canonProyectado: number | null
  descuentoProyectado: number | null
  energiaTotal: number | null  // from meter_readings if exists
  energiaKwh: number | null
}

export async function generateInvoicesForPeriod(
  companyId: string,
  period: InvoicePeriod,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const { year, month } = period
  const periodoStr = `${year}-${String(month).padStart(2, "0")}`

  // Fetch all active contracts for the company, joined with projections for the period
  const contracts = await execute(`
    SELECT
      c.id                                               AS contract_id,
      c.tenant_id,
      c.unit_id,
      u.unit_number,
      COALESCE(t.nombre_corto, t.razon_social)           AS cliente_name,
      COALESCE(c.canon_base, 0)::numeric                 AS canon_base,
      COALESCE(c.descuento_pct, 0)::numeric              AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric            AS pronto_pago_pct,
      COALESCE(c.flag_uno, true)                         AS flag_uno,
      COALESCE(c.flag_once, false)                       AS flag_once,
      COALESCE(c.flag_veintiuno, false)                  AS flag_veintiuno,
      p.canon_proyectado::numeric                        AS canon_proyectado,
      p.descuento_proyectado::numeric                    AS descuento_proyectado,
      mr.total_energia::numeric                          AS energia_total,
      mr.kwh::numeric                                    AS energia_kwh
    FROM contracts c
    JOIN tenants t  ON c.tenant_id = t.id
    JOIN units u    ON c.unit_id   = u.id
    LEFT JOIN projections p
           ON p.contract_id = c.id
          AND p.year         = ${year}
          AND p.month        = ${month}
    LEFT JOIN meter_readings mr
           ON mr.unit_id = u.id
          AND mr.periodo  = '${periodoStr}'
    WHERE c.company_id = '${companyId}'::uuid
      AND c.status IN ('activo', 'critico')
  `)

  // Check which contracts already have an invoice for this period
  const existing = await execute(`
    SELECT contract_id FROM invoices
    WHERE company_id = '${companyId}'::uuid
      AND periodo     = '${periodoStr}'
  `)
  const existingIds = new Set((existing as Array<Record<string, unknown>>).map((r) => String(r.contract_id)))

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of contracts as Array<Record<string, unknown>>) {
    const r: ContractRow = {
      contractId:         String(row.contract_id),
      tenantId:           String(row.tenant_id),
      unitId:             String(row.unit_id),
      unitNumber:         String(row.unit_number),
      clienteName:        String(row.cliente_name),
      canonBase:          Number(row.canon_base),
      descuentoPct:       Number(row.descuento_pct),
      prontoPagoPct:      Number(row.pronto_pago_pct),
      flagUno:            Boolean(row.flag_uno),
      flagOnce:           Boolean(row.flag_once),
      flagVeintiuno:      Boolean(row.flag_veintiuno),
      canonProyectado:    row.canon_proyectado != null ? Number(row.canon_proyectado) : null,
      descuentoProyectado: row.descuento_proyectado != null ? Number(row.descuento_proyectado) : null,
      energiaTotal:       row.energia_total != null ? Number(row.energia_total) : null,
      energiaKwh:         row.energia_kwh != null ? Number(row.energia_kwh) : null,
    }

    if (existingIds.has(r.contractId)) {
      skipped++
      continue
    }

    try {
      await computeAndInsertInvoice(companyId, r, period, periodoStr)
      created++
    } catch (e) {
      errors.push(`${r.unitNumber} (${r.clienteName}): ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { created, skipped, errors }
}

async function computeAndInsertInvoice(
  companyId: string,
  r: ContractRow,
  period: InvoicePeriod,
  periodoStr: string,
): Promise<void> {
  const { year, month } = period

  // Step 1: Effective canon — use projection if available, else canonBase
  const canonEffective = r.canonProyectado ?? r.canonBase

  // Step 2: Phase discount — use projection.descuentoProyectado if available,
  //         else compute from contract.descuentoPct (simplified: contract-level rate applies all year)
  const descuentoFase =
    r.descuentoProyectado != null
      ? r.descuentoProyectado
      : roundCOP(canonEffective * (r.descuentoPct / 100))

  // Step 3: Net canon after phase discount
  const netCanon = canonEffective - descuentoFase

  // Step 4: IVA on net canon (not on PP — per spec §6.2)
  const iva = roundCOP(netCanon * IVA_RATE)

  // Step 5: Pronto pago (reference — applied at payment time, not baked into invoice total)
  // PP and phase discount STACK: PP applies on the post-phase-discount net canon.
  // Confirmed in real Siesa data (e.g. MEDIOS IMPRESOS Jan invoice: 20% phase + 10% PP).
  const prontoPagoRef = roundCOP(netCanon * (r.prontoPagoPct / 100))

  // Step 6: Gastos — electricity only (water is included in canon, not a separate charge)
  const electricidad = r.energiaTotal != null ? roundCOP(r.energiaTotal) : 0
  const subtotalGastos = electricidad

  // Step 7: Invoice total = netCanon + IVA + gastos (PP NOT deducted — tenant earns it by paying on time)
  const total = roundCOP(netCanon + iva + subtotalGastos)

  // Billing date from contract flags
  const day = billingDay({ flagUno: r.flagUno, flagOnce: r.flagOnce, flagVeintiuno: r.flagVeintiuno })
  const fechaEmision = toDate(year, month, day)
  const fechaVencimiento = addDays(fechaEmision, 10) // due 10 days after invoice
  const fechaProntoPago = fechaVencimiento          // same window

  // Insert invoice
  const { data: insertedData, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .insert({
      company_id:           companyId,
      contract_id:          r.contractId,
      tenant_id:            r.tenantId,
      unit_id:              r.unitId,
      periodo:              periodoStr,
      fecha_emision:        fechaEmision,
      fecha_vencimiento:    fechaVencimiento,
      fecha_pronto_pago:    fechaProntoPago,
      subtotal_canon:       String(roundCOP(canonEffective)),
      subtotal_descuentos:  String(roundCOP(descuentoFase)),
      subtotal_pronto_pago: String(prontoPagoRef),
      subtotal_gastos:      String(subtotalGastos),
      subtotal_interes:     "0",
      iva:                  String(iva),
      retenciones:          "0",
      total:                String(total),
      saldo:                String(total),
      status:               "borrador",
    })
    .select("id")
  if (invoiceError) throw new Error(invoiceError.message)

  const invoiceId = (insertedData as Array<Record<string, unknown>>)[0].id as string

  // Insert line items
  const lineItems: Array<{
    invoice_id: string
    type: LineItemType
    description: string
    amount: string
    tax_amount: string
    sort_order: number
  }> = [
    {
      invoice_id:  invoiceId,
      type:        "canon",
      description: `Arrendamiento ${periodoStr}`,
      amount:      String(roundCOP(canonEffective)),
      tax_amount:  "0",
      sort_order:  1,
    },
  ]

  if (descuentoFase > 0) {
    lineItems.push({
      invoice_id:  invoiceId,
      type:        "descuento",
      description: `Descuento fase contrato`,
      amount:      String(-roundCOP(descuentoFase)),
      tax_amount:  "0",
      sort_order:  2,
    })
  }

  lineItems.push({
    invoice_id:  invoiceId,
    type:        "iva",
    description: `IVA 19%`,
    amount:      String(iva),
    tax_amount:  String(iva),
    sort_order:  3,
  })

  if (prontoPagoRef > 0) {
    lineItems.push({
      invoice_id:  invoiceId,
      type:        "pronto_pago",
      description: `Descuento pronto pago ${r.prontoPagoPct}% (si paga antes de ${fechaProntoPago})`,
      amount:      String(-prontoPagoRef),
      tax_amount:  "0",
      sort_order:  4,
    })
  }

  if (electricidad > 0 && r.energiaKwh != null) {
    lineItems.push({
      invoice_id:  invoiceId,
      type:        "gasto_energia",
      description: `Energía eléctrica ${r.energiaKwh.toLocaleString("es-CO")} kWh`,
      amount:      String(electricidad),
      tax_amount:  "0",
      sort_order:  5,
    })
  }

  const { error: lineError } = await supabaseAdmin
    .from("invoice_line_items")
    .insert(lineItems)
  if (lineError) throw new Error(lineError.message)
}
