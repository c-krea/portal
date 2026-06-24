import { execute } from "@/lib/db/executor"
import { assertPeriodo } from "@/lib/security/validators"
import { cached } from "@/lib/cache"

const DOC_ID_RE = /^[A-Za-z0-9 _-]{1,40}$/

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

/**
 * v2: facturas read from vista_facturas (siesa_raw documentos with is_factura=true).
 * Generation lives in Siesa. Portal is read-only — no line-item breakdown, no portal-side status.
 * Saldo comes from vista_cartera_actual aggregated at tenant+periodo level (best-effort, not 1:1).
 */

const PERIODO_TO_STR = `LPAD(periodo::text, 6, '0')`
const PERIODO_FORMATTED = `SUBSTRING(${PERIODO_TO_STR}, 1, 4) || '-' || SUBSTRING(${PERIODO_TO_STR}, 5, 2)`

async function getFacturas_uncached(periodo?: string): Promise<FacturaRow[]> {
  if (periodo) assertPeriodo(periodo)
  const periodoInt = periodo ? Number(periodo.replace("-", "")) : null
  const rows = await execute(`
    SELECT
      v.doc_id                                          AS id,
      v.inquilino_id::text                              AS tenant_id,
      ${PERIODO_FORMATTED}                              AS periodo,
      v.razon_social                                    AS cliente_name,
      COALESCE((
        SELECT u.unidad
        FROM v2.contratos co
        JOIN v2.locales u ON co.local_id = u.id
        WHERE co.inquilino_id = v.inquilino_id
          AND co.estado IN ('activo', 'critico')
        ORDER BY u.unidad
        LIMIT 1
      ), '')                                            AS unit_number,
      COALESCE(v.base_neta, 0)::numeric                 AS subtotal_canon,
      COALESCE(v.iva, 0)::numeric                       AS iva,
      COALESCE(v.valor_total, 0)::numeric               AS total
    FROM v2.vista_facturas v
    WHERE v.is_factura = true
      ${periodoInt ? `AND v.periodo = ${periodoInt}` : ``}
    ORDER BY v.periodo DESC, v.razon_social
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id:                 String(r.id),
    contractId:         "",
    tenantId:           String(r.tenant_id ?? ""),
    unitNumber:         String(r.unit_number ?? ""),
    clienteName:        String(r.cliente_name ?? ""),
    periodo:            String(r.periodo),
    fechaEmision:       "",
    fechaVencimiento:   "",
    subtotalCanon:      Number(r.subtotal_canon),
    subtotalDescuentos: 0,
    subtotalProntoPago: 0,
    subtotalGastos:     0,
    iva:                Number(r.iva),
    total:              Number(r.total),
    saldo:              0,
    status:             "emitida",
  }))
}

async function getFacturaSummary_uncached(periodo?: string): Promise<FacturaSummary> {
  if (periodo) assertPeriodo(periodo)
  const periodoInt = periodo ? Number(periodo.replace("-", "")) : null
  const totals = await execute(`
    SELECT
      COUNT(*)::int                          AS total_facturas,
      COALESCE(SUM(valor_total), 0)::numeric AS total_bruto
    FROM v2.vista_facturas
    WHERE is_factura = true
      ${periodoInt ? `AND periodo = ${periodoInt}` : ``}
  `)

  const t = (totals as Array<Record<string, unknown>>)[0] ?? {}
  const totalFacturas = Number(t.total_facturas ?? 0)
  return {
    totalFacturas,
    totalBruto:    Number(t.total_bruto ?? 0),
    totalSaldo:    0,
    porEstado:     totalFacturas > 0 ? { emitida: totalFacturas } : {},
  }
}

async function getAvailablePeriodos_uncached(): Promise<string[]> {
  const rows = await execute(`
    SELECT DISTINCT ${PERIODO_FORMATTED} AS p
    FROM v2.vista_facturas
    WHERE is_factura = true
    ORDER BY p DESC
  `)
  return (rows as Array<Record<string, unknown>>).map((r) => String(r.p))
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

async function getFacturaById_uncached(id: string): Promise<FacturaDetalle | null> {
  if (!DOC_ID_RE.test(id)) return null
  const rows = await execute(`
    SELECT
      v.doc_id,
      v.inquilino_id::text                              AS tenant_id,
      ${PERIODO_FORMATTED}                              AS periodo,
      v.razon_social                                    AS cliente_name,
      v.nit_inquilino                                   AS tenant_nit,
      t.email_contacto                                  AS email_contacto,
      t.portal_email                                    AS portal_email,
      t.telefono                                        AS tenant_telefono,
      COALESCE(v.base_neta, 0)::numeric                 AS subtotal_canon,
      COALESCE(v.iva, 0)::numeric                       AS iva,
      COALESCE(v.retenciones, 0)::numeric               AS retenciones,
      COALESCE(v.valor_total, 0)::numeric               AS total,
      e.nombre                                          AS company_name,
      e.nit                                             AS company_nit,
      COALESCE((
        SELECT u.unidad
        FROM v2.contratos co
        JOIN v2.locales u ON co.local_id = u.id
        WHERE co.inquilino_id = v.inquilino_id
          AND co.estado IN ('activo', 'critico')
        ORDER BY u.unidad
        LIMIT 1
      ), '')                                            AS unit_number,
      COALESCE((
        SELECT u.codigo
        FROM v2.contratos co
        JOIN v2.locales u ON co.local_id = u.id
        WHERE co.inquilino_id = v.inquilino_id
          AND co.estado IN ('activo', 'critico')
        ORDER BY u.unidad
        LIMIT 1
      ), '')                                            AS unit_code
    FROM v2.vista_facturas v
    LEFT JOIN v2.inquilinos t ON v.inquilino_id = t.id
    LEFT JOIN v2.empresas   e ON v.empresa_id   = e.id
    WHERE v.doc_id = '${id.replace(/'/g, "''")}'
      AND v.is_factura = true
    LIMIT 1
  `)

  const list = rows as Array<Record<string, unknown>>
  if (list.length === 0) return null
  const r = list[0]
  const email = (r.email_contacto ?? r.portal_email) as string | null

  return {
    id:                 String(r.doc_id),
    contractId:         "",
    tenantId:           String(r.tenant_id ?? ""),
    unitNumber:         String(r.unit_number ?? ""),
    unitCode:           String(r.unit_code ?? ""),
    clienteName:        String(r.cliente_name ?? ""),
    tenantNit:          String(r.tenant_nit ?? ""),
    tenantEmail:        email ? String(email) : null,
    tenantTelefono:     r.tenant_telefono ? String(r.tenant_telefono) : null,
    periodo:            String(r.periodo),
    fechaEmision:       "",
    fechaVencimiento:   "",
    fechaProntoPago:    null,
    subtotalCanon:      Number(r.subtotal_canon),
    subtotalDescuentos: 0,
    subtotalProntoPago: 0,
    subtotalGastos:     0,
    iva:                Number(r.iva),
    total:              Number(r.total),
    saldo:              0,
    status:             "emitida",
    companyName:        String(r.company_name ?? "Central Creativa C-KREA"),
    companyNit:         String(r.company_nit ?? ""),
    lineItems:          [],
  }
}

// ── Cached exports (30-min window; facturas come from Siesa → busts via ERP sync) ──
export const getFacturas          = cached(getFacturas_uncached,          ["facturas:list"],     "facturas")
export const getFacturaSummary    = cached(getFacturaSummary_uncached,    ["facturas:summary"],  "facturas")
export const getAvailablePeriodos = cached(getAvailablePeriodos_uncached, ["facturas:periodos"], "facturas")
export const getFacturaById       = cached(getFacturaById_uncached,       ["facturas:byId"],     "facturas")
