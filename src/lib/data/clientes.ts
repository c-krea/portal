import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export type ClienteRow = {
  unitId: string
  unitNumber: string
  entrada: string
  unitStatus: string
  tenantId: string | null
  cliente: string | null
  nit: string | null
  contractId: string | null
  contractStatus: string | null
  canonBase: number
  descuentoPct: number
  prontoPagoPct: number
  saldoVencido: number
  maxDiasMora: number
  // derived
  status: "al_dia" | "en_mora" | "critico" | "inactivo"
}

function deriveStatus(row: Omit<ClienteRow, "status">): ClienteRow["status"] {
  if (
    row.unitStatus === "disponible" ||
    !row.contractId ||
    row.contractStatus === "terminado" ||
    row.contractStatus === "vencido"
  )
    return "inactivo"
  if (row.saldoVencido > 0 && row.maxDiasMora > 90) return "critico"
  if (row.saldoVencido > 0) return "en_mora"
  return "al_dia"
}

export async function getClienteRows(): Promise<ClienteRow[]> {
  const rows = await db.execute(sql`
    SELECT
      u.id                                           AS unit_id,
      u.unit_number,
      u.entrada,
      u.status                                       AS unit_status,
      t.id                                           AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)       AS cliente,
      t.nit,
      con.id                                         AS contract_id,
      con.status                                     AS contract_status,
      COALESCE(con.canon_base, 0)::numeric           AS canon_base,
      COALESCE(con.descuento_pct, 0)::numeric        AS descuento_pct,
      COALESCE(con.pronto_pago_pct, 0)::numeric      AS pronto_pago_pct,
      COALESCE(SUM(c.valor_vencido), 0)::numeric     AS saldo_vencido,
      COALESCE(MAX(c.dias_mora), 0)                  AS max_dias_mora
    FROM units u
    LEFT JOIN contracts con
      ON con.unit_id = u.id
      AND con.status IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN tenants t ON con.tenant_id = t.id
    LEFT JOIN cartera c
      ON c.tenant_id = t.id
      AND c.valor_vencido > 0
    GROUP BY
      u.id, u.unit_number, u.entrada, u.status,
      t.id, t.razon_social, t.nombre_corto, t.nit,
      con.id, con.status, con.canon_base, con.descuento_pct, con.pronto_pago_pct
    ORDER BY u.unit_number
  `)

  return rows.map((r) => {
    const base = {
      unitId: String(r.unit_id),
      unitNumber: String(r.unit_number),
      entrada: String(r.entrada ?? "—"),
      unitStatus: String(r.unit_status),
      tenantId: r.tenant_id ? String(r.tenant_id) : null,
      cliente: r.cliente ? String(r.cliente) : null,
      nit: r.nit ? String(r.nit) : null,
      contractId: r.contract_id ? String(r.contract_id) : null,
      contractStatus: r.contract_status ? String(r.contract_status) : null,
      canonBase: Number(r.canon_base ?? 0),
      descuentoPct: Number(r.descuento_pct ?? 0),
      prontoPagoPct: Number(r.pronto_pago_pct ?? 0),
      saldoVencido: Number(r.saldo_vencido ?? 0),
      maxDiasMora: Number(r.max_dias_mora ?? 0),
    }
    return { ...base, status: deriveStatus(base) }
  })
}
