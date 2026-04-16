import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export type PagoRow = {
  id: string
  tenantId: string
  clienteName: string
  unitNumber: string | null
  fechaRecaudo: string
  valorAplicado: number
  prontoPagoAplicado: number
  valorFinal: number
  concepto: string | null
  siesaDocto: string | null
  status: string
}

export type TenantOption = {
  id: string
  label: string
  nit: string
}

export async function getRecentPagos(limit = 30): Promise<PagoRow[]> {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)     AS cliente_name,
      u.unit_number,
      p.fecha_recaudo,
      COALESCE(p.valor_aplicado, 0)::numeric        AS valor_aplicado,
      COALESCE(p.pronto_pago_aplicado, 0)::numeric  AS pronto_pago_aplicado,
      COALESCE(p.valor_final, 0)::numeric           AS valor_final,
      p.concepto, p.siesa_docto, p.status
    FROM payments p
    JOIN tenants t ON t.id = p.tenant_id
    LEFT JOIN contracts c
      ON c.tenant_id = p.tenant_id
      AND c.status IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN units u ON c.unit_id = u.id
    ORDER BY p.fecha_recaudo DESC, p.created_at DESC
    LIMIT ${limit}
  `)
  return rows.map((r) => ({
    id: String(r.id),
    tenantId: String(r.tenant_id),
    clienteName: String(r.cliente_name),
    unitNumber: r.unit_number ? String(r.unit_number) : null,
    fechaRecaudo: String(r.fecha_recaudo),
    valorAplicado: Number(r.valor_aplicado ?? 0),
    prontoPagoAplicado: Number(r.pronto_pago_aplicado ?? 0),
    valorFinal: Number(r.valor_final ?? 0),
    concepto: r.concepto ? String(r.concepto) : null,
    siesaDocto: r.siesa_docto ? String(r.siesa_docto) : null,
    status: String(r.status),
  }))
}

export async function getActiveTenantOptions(): Promise<TenantOption[]> {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (t.id)
      t.id,
      COALESCE(t.nombre_corto, t.razon_social)  AS label,
      t.nit,
      u.unit_number
    FROM tenants t
    JOIN contracts c ON c.tenant_id = t.id AND c.status IN ('activo', 'critico')
    JOIN units u ON c.unit_id = u.id
    ORDER BY t.id, u.unit_number
  `)
  return (rows as Array<Record<string, unknown>>)
    .sort((a, b) => String(a.unit_number).localeCompare(String(b.unit_number), "es", { numeric: true }))
    .map((r) => ({
      id: String(r.id),
      label: `${String(r.label)} — Local ${String(r.unit_number)}`,
      nit: String(r.nit),
    }))
}
