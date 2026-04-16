import { execute } from "@/lib/db/executor"

export type FacturaRow = {
  id: string
  contractId: string
  tenantId: string
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
  saldo: number
  status: string
}

export type FacturaSummary = {
  totalFacturas: number
  totalBruto: number
  totalSaldo: number
  porEstado: Record<string, number>
}

export async function getFacturas(periodo?: string): Promise<FacturaRow[]> {
  const rows = await execute(`
    SELECT
      i.id,
      i.contract_id,
      i.tenant_id,
      u.unit_number,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      i.periodo,
      i.fecha_emision,
      i.fecha_vencimiento,
      COALESCE(i.subtotal_canon, 0)::numeric        AS subtotal_canon,
      COALESCE(i.subtotal_descuentos, 0)::numeric   AS subtotal_descuentos,
      COALESCE(i.subtotal_pronto_pago, 0)::numeric  AS subtotal_pronto_pago,
      COALESCE(i.subtotal_gastos, 0)::numeric       AS subtotal_gastos,
      COALESCE(i.iva, 0)::numeric                   AS iva,
      COALESCE(i.total, 0)::numeric                 AS total,
      COALESCE(i.saldo, 0)::numeric                 AS saldo,
      i.status
    FROM invoices i
    JOIN contracts c ON i.contract_id = c.id
    JOIN tenants t   ON i.tenant_id   = t.id
    JOIN units u     ON i.unit_id     = u.id
    ${periodo ? `WHERE i.periodo = '${periodo}'` : ``}
    ORDER BY i.periodo DESC, u.unit_number
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id:                 String(r.id),
    contractId:         String(r.contract_id),
    tenantId:           String(r.tenant_id),
    unitNumber:         String(r.unit_number),
    clienteName:        String(r.cliente_name),
    periodo:            String(r.periodo),
    fechaEmision:       String(r.fecha_emision),
    fechaVencimiento:   String(r.fecha_vencimiento),
    subtotalCanon:      Number(r.subtotal_canon),
    subtotalDescuentos: Number(r.subtotal_descuentos),
    subtotalProntoPago: Number(r.subtotal_pronto_pago),
    subtotalGastos:     Number(r.subtotal_gastos),
    iva:                Number(r.iva),
    total:              Number(r.total),
    saldo:              Number(r.saldo),
    status:             String(r.status),
  }))
}

export async function getFacturaSummary(periodo?: string): Promise<FacturaSummary> {
  const rows = await execute(`
    SELECT
      COUNT(*)::int                                       AS total_facturas,
      COALESCE(SUM(total), 0)::numeric                    AS total_bruto,
      COALESCE(SUM(saldo), 0)::numeric                    AS total_saldo,
      status,
      COUNT(*)::int                                       AS count_by_status
    FROM invoices
    ${periodo ? `WHERE periodo = '${periodo}'` : ``}
    GROUP BY status
  `)

  const porEstado: Record<string, number> = {}
  let totalFacturas = 0
  let totalBruto = 0
  let totalSaldo = 0

  for (const r of rows as Array<Record<string, unknown>>) {
    const s = String(r.status)
    porEstado[s] = Number(r.count_by_status)
    totalFacturas += Number(r.count_by_status)
    totalBruto += Number(r.total_bruto)
    totalSaldo += Number(r.total_saldo)
  }

  // Re-query totals without group by for accuracy
  const totals = await execute(`
    SELECT
      COUNT(*)::int                    AS total_facturas,
      COALESCE(SUM(total), 0)::numeric AS total_bruto,
      COALESCE(SUM(saldo), 0)::numeric AS total_saldo
    FROM invoices
    ${periodo ? `WHERE periodo = '${periodo}'` : ``}
  `)

  const t = (totals as Array<Record<string, unknown>>)[0] ?? {}
  return {
    totalFacturas: Number(t.total_facturas ?? 0),
    totalBruto:    Number(t.total_bruto ?? 0),
    totalSaldo:    Number(t.total_saldo ?? 0),
    porEstado,
  }
}

export async function getAvailablePeriodos(): Promise<string[]> {
  const rows = await execute(`
    SELECT DISTINCT periodo FROM invoices ORDER BY periodo DESC
  `)
  return (rows as Array<Record<string, unknown>>).map((r) => String(r.periodo))
}

export type LineItem = {
  id: string
  type: string
  description: string
  amount: number
  taxAmount: number
  sortOrder: number
}

export type FacturaDetalle = FacturaRow & {
  lineItems: LineItem[]
  fechaVencimiento: string
  fechaProntoPago: string | null
  subtotalProntoPago: number
  tenantNit: string
  tenantEmail: string | null
  tenantTelefono: string | null
  contractId: string
  unitCode: string
  companyName: string
  companyNit: string
}

export async function getFacturaById(id: string): Promise<FacturaDetalle | null> {
  const rows = await execute(`
    SELECT
      i.id,
      i.contract_id,
      i.tenant_id,
      u.unit_number,
      u.unit_code,
      COALESCE(t.nombre_corto, t.razon_social)          AS cliente_name,
      t.nit                                              AS tenant_nit,
      t.email                                            AS tenant_email,
      t.telefono                                         AS tenant_telefono,
      i.periodo,
      i.fecha_emision,
      i.fecha_vencimiento,
      i.fecha_pronto_pago,
      COALESCE(i.subtotal_canon, 0)::numeric             AS subtotal_canon,
      COALESCE(i.subtotal_descuentos, 0)::numeric        AS subtotal_descuentos,
      COALESCE(i.subtotal_pronto_pago, 0)::numeric       AS subtotal_pronto_pago,
      COALESCE(i.subtotal_gastos, 0)::numeric            AS subtotal_gastos,
      COALESCE(i.iva, 0)::numeric                        AS iva,
      COALESCE(i.total, 0)::numeric                      AS total,
      COALESCE(i.saldo, 0)::numeric                      AS saldo,
      i.status,
      co.name                                            AS company_name,
      co.nit                                             AS company_nit
    FROM invoices i
    JOIN contracts c ON i.contract_id = c.id
    JOIN tenants t   ON i.tenant_id   = t.id
    JOIN units u     ON i.unit_id     = u.id
    JOIN companies co ON i.company_id = co.id
    WHERE i.id = '${id}'::uuid
    LIMIT 1
  `)

  if ((rows as Array<Record<string, unknown>>).length === 0) return null

  const r = (rows as Array<Record<string, unknown>>)[0]

  const lineRows = await execute(`
    SELECT id, type, description,
           amount::numeric AS amount,
           COALESCE(tax_amount, 0)::numeric AS tax_amount,
           COALESCE(sort_order, 0) AS sort_order
    FROM invoice_line_items
    WHERE invoice_id = '${id}'::uuid
    ORDER BY sort_order
  `)

  const lineItems: LineItem[] = (lineRows as Array<Record<string, unknown>>).map((li) => ({
    id:          String(li.id),
    type:        String(li.type),
    description: String(li.description),
    amount:      Number(li.amount),
    taxAmount:   Number(li.tax_amount),
    sortOrder:   Number(li.sort_order),
  }))

  return {
    id:                 String(r.id),
    contractId:         String(r.contract_id),
    tenantId:           String(r.tenant_id),
    unitNumber:         String(r.unit_number),
    unitCode:           String(r.unit_code),
    clienteName:        String(r.cliente_name),
    tenantNit:          String(r.tenant_nit),
    tenantEmail:        r.tenant_email ? String(r.tenant_email) : null,
    tenantTelefono:     r.tenant_telefono ? String(r.tenant_telefono) : null,
    periodo:            String(r.periodo),
    fechaEmision:       String(r.fecha_emision),
    fechaVencimiento:   String(r.fecha_vencimiento),
    fechaProntoPago:    r.fecha_pronto_pago ? String(r.fecha_pronto_pago) : null,
    subtotalCanon:      Number(r.subtotal_canon),
    subtotalDescuentos: Number(r.subtotal_descuentos),
    subtotalProntoPago: Number(r.subtotal_pronto_pago),
    subtotalGastos:     Number(r.subtotal_gastos),
    iva:                Number(r.iva),
    total:              Number(r.total),
    saldo:              Number(r.saldo),
    status:             String(r.status),
    companyName:        String(r.company_name),
    companyNit:         String(r.company_nit),
    lineItems,
  }
}
