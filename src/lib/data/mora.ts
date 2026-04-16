import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export type MoraRow = {
  tenantId: string
  cliente: string
  unitNumber: string | null
  diasMora: number
  saldoVencido: number
  interesAcumulado: number
  saldoTotal: number
}

export type MoraSummary = {
  totalCarteraVencida: number
  totalInteresPortal: number
  invoicesVencidas: number
  lastAccrualDate: string | null
}

export async function getMoraSummary(): Promise<MoraSummary> {
  const [carteraRes, invoiceRes, accrualRes] = await Promise.all([
    db.execute(sql`
      SELECT COALESCE(SUM(valor_vencido), 0)::numeric AS total
      FROM cartera WHERE valor_vencido > 0
    `),
    db.execute(sql`
      SELECT
        COALESCE(SUM(subtotal_interes), 0)::numeric AS total_interes,
        COUNT(*)::int                               AS count_vencidas
      FROM invoices
      WHERE status = 'vencida' AND saldo::numeric > 0
    `),
    db.execute(sql`
      SELECT MAX(accrual_date)::text AS last_date FROM interest_accruals
    `),
  ])

  return {
    totalCarteraVencida: Number((carteraRes as Array<Record<string, unknown>>)[0]?.total ?? 0),
    totalInteresPortal:  Number((invoiceRes as Array<Record<string, unknown>>)[0]?.total_interes ?? 0),
    invoicesVencidas:    Number((invoiceRes as Array<Record<string, unknown>>)[0]?.count_vencidas ?? 0),
    lastAccrualDate:     (accrualRes as Array<Record<string, unknown>>)[0]?.last_date
      ? String((accrualRes as Array<Record<string, unknown>>)[0].last_date)
      : null,
  }
}

export async function getMoraRows(): Promise<MoraRow[]> {
  const rows = await db.execute(sql`
    SELECT
      t.id                                         AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)     AS cliente,
      u.unit_number,
      MAX(c.dias_mora)                             AS dias_mora,
      SUM(c.valor_vencido)::numeric                AS saldo_vencido,
      SUM(c.interes_acumulado)::numeric            AS interes_acumulado,
      SUM(c.saldo)::numeric                        AS saldo_total
    FROM cartera c
    JOIN tenants t ON c.tenant_id = t.id
    LEFT JOIN LATERAL (
      SELECT u2.unit_number
      FROM contracts con
      JOIN units u2 ON con.unit_id = u2.id
      WHERE con.tenant_id = t.id
        AND con.status IN ('activo', 'critico')
      ORDER BY con.fecha_inicio DESC
      LIMIT 1
    ) u ON true
    WHERE c.valor_vencido > 0
    GROUP BY t.id, t.razon_social, t.nombre_corto, u.unit_number
    ORDER BY MAX(c.dias_mora) DESC NULLS LAST
  `)

  return rows.map((r) => ({
    tenantId: String(r.tenant_id),
    cliente: String(r.cliente),
    unitNumber: r.unit_number ? String(r.unit_number) : null,
    diasMora: Number(r.dias_mora ?? 0),
    saldoVencido: Number(r.saldo_vencido ?? 0),
    interesAcumulado: Number(r.interes_acumulado ?? 0),
    saldoTotal: Number(r.saldo_total ?? 0),
  }))
}
