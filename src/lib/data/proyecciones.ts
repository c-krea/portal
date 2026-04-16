import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export type ProyeccionSummary = {
  year: number
  contractCount: number
  unitCount: number
  totalCanon: number
}

export type ContractForProjection = {
  contractId: string
  unitId: string
  unitNumber: string
  clienteName: string
  descuentoPct: number
  prontoPagoPct: number
  lastCanon: number       // last Dec projection (or latest available)
  lastDescuentoPct: number
  lastYear: number
  lastMonth: number
}

export async function getProyeccionSummaries(companyId: string): Promise<ProyeccionSummary[]> {
  const rows = await db.execute(sql`
    SELECT
      p.year,
      COUNT(DISTINCT p.contract_id)::int      AS contract_count,
      COUNT(DISTINCT p.unit_id)::int          AS unit_count,
      ROUND(SUM(p.canon_proyectado)::numeric / 12) AS total_canon_avg
    FROM projections p
    WHERE p.company_id = ${companyId}::uuid
    GROUP BY p.year
    ORDER BY p.year DESC
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    year:          Number(r.year),
    contractCount: Number(r.contract_count),
    unitCount:     Number(r.unit_count),
    totalCanon:    Number(r.total_canon_avg),
  }))
}

export async function getContractsForProjection(
  companyId: string,
  targetYear: number,
): Promise<ContractForProjection[]> {
  // Get active contracts + their LAST available projection (prefer Dec of prev year)
  const rows = await db.execute(sql`
    WITH last_proj AS (
      SELECT DISTINCT ON (p.contract_id)
        p.contract_id,
        p.unit_id,
        p.canon_proyectado::numeric        AS last_canon,
        p.descuento_proyectado::numeric    AS last_descuento,
        p.year                             AS last_year,
        p.month                            AS last_month
      FROM projections p
      WHERE p.company_id = ${companyId}::uuid
      ORDER BY p.contract_id, p.year DESC, p.month DESC
    )
    SELECT
      c.id                                            AS contract_id,
      c.unit_id,
      u.unit_number,
      COALESCE(t.nombre_corto, t.razon_social)        AS cliente_name,
      COALESCE(c.descuento_pct, 0)::numeric           AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric         AS pronto_pago_pct,
      COALESCE(lp.last_canon, c.canon_base)::numeric  AS last_canon,
      COALESCE(
        CASE WHEN lp.last_canon > 0
             THEN ROUND(lp.last_descuento / lp.last_canon * 100, 2)
             ELSE 0 END,
        c.descuento_pct
      )::numeric                                      AS last_descuento_pct,
      COALESCE(lp.last_year, ${targetYear - 1})       AS last_year,
      COALESCE(lp.last_month, 12)                     AS last_month
    FROM contracts c
    JOIN tenants t  ON c.tenant_id = t.id
    JOIN units u    ON c.unit_id   = u.id
    LEFT JOIN last_proj lp ON lp.contract_id = c.id
    WHERE c.company_id = ${companyId}::uuid
      AND c.status IN ('activo', 'critico')
      AND NOT EXISTS (
        SELECT 1 FROM projections p2
        WHERE p2.contract_id = c.id
          AND p2.year = ${targetYear}
        LIMIT 1
      )
    ORDER BY u.unit_number
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    contractId:      String(r.contract_id),
    unitId:          String(r.unit_id),
    unitNumber:      String(r.unit_number),
    clienteName:     String(r.cliente_name),
    descuentoPct:    Number(r.descuento_pct),
    prontoPagoPct:   Number(r.pronto_pago_pct),
    lastCanon:       Number(r.last_canon),
    lastDescuentoPct: Number(r.last_descuento_pct),
    lastYear:        Number(r.last_year),
    lastMonth:       Number(r.last_month),
  }))
}
