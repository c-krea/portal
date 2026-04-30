import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"

export type MoraRow = {
  tenantId: string
  cliente: string
  unitNumber: string | null
  diasMora: number
  mesesPendientes: number
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
  const grace = await getGracePeriod()

  const res = await execute(`
    WITH r AS (
      SELECT valor::numeric AS rate FROM v2.reglas_financieras WHERE clave = 'interes_mora_diario' LIMIT 1
    )
    SELECT
      COALESCE(SUM(c.vr_vencido), 0)::numeric AS total_vencido,
      COALESCE(SUM(c.saldo * GREATEST(0, c.dias_mora - ${grace}) * (SELECT rate FROM r)), 0)::numeric AS total_interes,
      COUNT(*)::int AS facturas
    FROM v2.vista_cartera_actual c
    WHERE c.vr_vencido > 0 AND c.dias_mora > ${grace} AND c.juridica = false
  `)
  const row = (res as Array<Record<string, unknown>>)[0]

  return {
    totalCarteraVencida: Number(row?.total_vencido ?? 0),
    totalInteresPortal:  Number(row?.total_interes ?? 0),
    invoicesVencidas:    Number(row?.facturas ?? 0),
    lastAccrualDate:     null,
  }
}

export async function getMoraRows(): Promise<MoraRow[]> {
  const grace = await getGracePeriod()

  const rows = await execute(`
    SELECT
      t.id                                         AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)     AS cliente,
      u.unidad                                     AS unit_number,
      MAX(c.dias_mora)                             AS dias_mora,
      COUNT(c.row_id)::int                         AS meses_pendientes,
      SUM(c.vr_vencido)::numeric                   AS saldo_vencido,
      SUM(c.saldo)::numeric                        AS saldo_total
    FROM v2.vista_cartera_actual c
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    LEFT JOIN LATERAL (
      SELECT u2.unidad
      FROM v2.contratos con
      JOIN v2.locales u2 ON con.local_id = u2.id
      WHERE con.inquilino_id = t.id
        AND con.estado IN ('activo', 'critico')
      ORDER BY con.fecha_inicio DESC
      LIMIT 1
    ) u ON true
    WHERE c.vr_vencido > 0 AND c.dias_mora > ${grace} AND t.juridica = false
    GROUP BY t.id, t.razon_social, t.nombre_corto, u.unidad
    ORDER BY MAX(c.dias_mora) DESC NULLS LAST
  `)

  return rows.map((r) => ({
    tenantId: String(r.tenant_id),
    cliente: String(r.cliente),
    unitNumber: r.unit_number ? String(r.unit_number) : null,
    diasMora: Number(r.dias_mora ?? 0),
    mesesPendientes: Number(r.meses_pendientes ?? 0),
    saldoVencido: Number(r.saldo_vencido ?? 0),
    interesAcumulado: 0,
    saldoTotal: Number(r.saldo_total ?? 0),
  }))
}

export async function getJuridicaRows(): Promise<MoraRow[]> {
  const rows = await execute(`
    SELECT
      t.id                                         AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)     AS cliente,
      u.unidad                                     AS unit_number,
      MAX(c.dias_mora)                             AS dias_mora,
      COUNT(c.row_id)::int                         AS meses_pendientes,
      SUM(c.vr_vencido)::numeric                   AS saldo_vencido,
      SUM(c.saldo)::numeric                        AS saldo_total
    FROM v2.vista_cartera_actual c
    JOIN v2.inquilinos t ON c.inquilino_id = t.id
    LEFT JOIN LATERAL (
      SELECT u2.unidad
      FROM v2.contratos con
      JOIN v2.locales u2 ON con.local_id = u2.id
      WHERE con.inquilino_id = t.id
      ORDER BY
        CASE WHEN con.estado IN ('activo','critico') THEN 0 ELSE 1 END,
        con.fecha_fin DESC NULLS LAST,
        con.fecha_inicio DESC
      LIMIT 1
    ) u ON true
    WHERE c.vr_vencido > 0
      AND (
        t.juridica = true
        OR NOT EXISTS (
          SELECT 1 FROM v2.contratos con2
          WHERE con2.inquilino_id = t.id
            AND con2.estado IN ('activo', 'critico')
        )
      )
    GROUP BY t.id, t.razon_social, t.nombre_corto, u.unidad
    ORDER BY MAX(c.dias_mora) DESC NULLS LAST
  `)

  return rows.map((r) => ({
    tenantId: String(r.tenant_id),
    cliente: String(r.cliente),
    unitNumber: r.unit_number ? String(r.unit_number) : null,
    diasMora: Number(r.dias_mora ?? 0),
    mesesPendientes: Number(r.meses_pendientes ?? 0),
    saldoVencido: Number(r.saldo_vencido ?? 0),
    interesAcumulado: 0,
    saldoTotal: Number(r.saldo_total ?? 0),
  }))
}
