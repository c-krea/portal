import { execute } from "@/lib/db/executor"

export type ClienteRow = {
  tenantId: string | null
  cliente: string | null
  nit: string | null
  unitNumbers: string[]
  canonTotal: number
  saldoVencido: number
  maxDiasMora: number
  status: "al_dia" | "en_mora" | "critico" | "inactivo"
  isVacant?: boolean
}

export async function getClienteRows(): Promise<ClienteRow[]> {
  const rows = await execute(`
    SELECT
      t.id                                                                AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)                           AS cliente,
      t.nit,
      ARRAY_AGG(DISTINCT u.unit_number ORDER BY u.unit_number)
        FILTER (WHERE u.unit_number IS NOT NULL)                         AS unit_numbers,
      COALESCE((
        SELECT SUM(c2.canon_base) FROM contracts c2
        WHERE c2.tenant_id = t.id AND c2.status IN ('activo', 'critico')
      ), 0)::numeric                                                     AS canon_total,
      COALESCE((
        SELECT SUM(ca.valor_vencido) FROM cartera ca
        WHERE ca.tenant_id = t.id AND ca.valor_vencido > 0
      ), 0)::numeric                                                     AS saldo_vencido,
      COALESCE((
        SELECT MAX(ca.dias_mora) FROM cartera ca
        WHERE ca.tenant_id = t.id AND ca.valor_vencido > 0
      ), 0)                                                              AS max_dias_mora,
      CASE
        WHEN bool_or(con.status = 'critico') THEN 'critico'
        WHEN bool_or(con.status IN ('activo', 'critico'))
          AND (SELECT COALESCE(SUM(ca.valor_vencido), 0) FROM cartera ca WHERE ca.tenant_id = t.id) > 0
          THEN 'en_mora'
        WHEN bool_or(con.status IN ('activo', 'critico')) THEN 'al_dia'
        ELSE 'inactivo'
      END                                                                AS status
    FROM tenants t
    LEFT JOIN contracts con
      ON con.tenant_id = t.id
      AND con.status IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN units u ON con.unit_id = u.id
    WHERE t.juridica = false
    GROUP BY t.id, t.razon_social, t.nombre_corto, t.nit
    ORDER BY COALESCE(t.nombre_corto, t.razon_social)
  `)

  return rows.map((r) => ({
    tenantId: String(r.tenant_id),
    cliente: String(r.cliente),
    nit: r.nit ? String(r.nit) : null,
    unitNumbers: Array.isArray(r.unit_numbers) ? r.unit_numbers.map(String) : [],
    canonTotal: Number(r.canon_total ?? 0),
    saldoVencido: Number(r.saldo_vencido ?? 0),
    maxDiasMora: Number(r.max_dias_mora ?? 0),
    status: r.status as ClienteRow["status"],
  }))
}

export async function getVacantUnitRows(): Promise<ClienteRow[]> {
  const rows = await execute(`
    SELECT u.unit_number, u.entrada
    FROM units u
    WHERE NOT EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.unit_id = u.id AND c.status IN ('activo', 'critico')
    )
    ORDER BY u.unit_number
  `)

  return rows.map((r) => ({
    tenantId: null,
    cliente: null,
    nit: null,
    unitNumbers: [String(r.unit_number)],
    canonTotal: 0,
    saldoVencido: 0,
    maxDiasMora: 0,
    status: "inactivo" as const,
    isVacant: true,
  }))
}
