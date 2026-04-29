import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"
import { getPagosKPIs } from "@/lib/data/pagos"

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

export type LocalesKPIs = {
  totalUnits: number
  occupiedUnits: number
  carteraTotal: number
  localesEnMora: number
  recaudadoEsteMes: number
}

export async function getLocalesKPIs(): Promise<LocalesKPIs> {
  const grace = await getGracePeriod()
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [rows, pagosKpis] = await Promise.all([
    execute(`
      SELECT
        (SELECT COUNT(*) FROM v2.locales)                                    AS total_units,
        (SELECT COUNT(DISTINCT local_id) FROM v2.contratos
          WHERE estado IN ('activo', 'critico'))                             AS occupied_units,
        (SELECT COALESCE(SUM(ca.vr_vencido), 0) FROM v2.vista_cartera_actual ca
          WHERE ca.vr_vencido > 0 AND ca.dias_mora > ${grace} AND ca.juridica = false
            AND EXISTS (SELECT 1 FROM v2.contratos c WHERE c.inquilino_id = ca.inquilino_id
                        AND c.estado IN ('activo','critico'))) AS cartera_total,
        (SELECT COUNT(DISTINCT ca.inquilino_id) FROM v2.vista_cartera_actual ca
          WHERE ca.vr_vencido > 0 AND ca.dias_mora > ${grace} AND ca.juridica = false
            AND EXISTS (SELECT 1 FROM v2.contratos c WHERE c.inquilino_id = ca.inquilino_id
                        AND c.estado IN ('activo','critico'))) AS locales_en_mora
    `),
    getPagosKPIs(month),
  ])
  const r = rows[0] as Record<string, unknown>
  return {
    totalUnits:       Number(r.total_units     ?? 0),
    occupiedUnits:    Number(r.occupied_units  ?? 0),
    carteraTotal:     Number(r.cartera_total   ?? 0),
    localesEnMora:    Number(r.locales_en_mora ?? 0),
    recaudadoEsteMes: pagosKpis.totalEsteMes,
  }
}

export async function getClienteRows(): Promise<ClienteRow[]> {
  const grace = await getGracePeriod()
  const now = new Date()
  const yr = now.getFullYear()
  const mo = now.getMonth() + 1

  const rows = await execute(`
    SELECT
      t.id                                                                AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)                           AS cliente,
      t.nit,
      ARRAY_AGG(DISTINCT u.unidad ORDER BY u.unidad)
        FILTER (WHERE u.unidad IS NOT NULL)                              AS unit_numbers,
      COALESCE((
        SELECT SUM(
          (pr.canon_proyectado - pr.descuento_proyectado)
          * (1.19 - CASE WHEN t.tipo_persona = 'PJ' THEN 0.035 ELSE 0 END)
        )
        FROM v2.proyecciones pr
        JOIN v2.contratos c3 ON pr.contrato_id = c3.id
        WHERE c3.inquilino_id = t.id AND pr.anio = ${yr} AND pr.mes = ${mo}
      ), 0)::numeric                                                     AS canon_total,
      COALESCE((
        SELECT SUM(ca.vr_vencido) FROM v2.vista_cartera_actual ca
        WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0
      ), 0)::numeric                                                     AS saldo_vencido,
      COALESCE((
        SELECT MAX(ca.dias_mora) FROM v2.vista_cartera_actual ca
        WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0
      ), 0)                                                              AS max_dias_mora,
      CASE
        WHEN bool_or(con.estado IN ('activo', 'critico'))
          AND (SELECT COALESCE(MAX(ca.dias_mora), 0) FROM v2.vista_cartera_actual ca
               WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0) > 60
          THEN 'critico'
        WHEN bool_or(con.estado IN ('activo', 'critico'))
          AND (SELECT COALESCE(MAX(ca.dias_mora), 0) FROM v2.vista_cartera_actual ca
               WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0) > ${grace}
          THEN 'en_mora'
        WHEN bool_or(con.estado IN ('activo', 'critico')) THEN 'al_dia'
        ELSE 'inactivo'
      END                                                                AS status
    FROM v2.inquilinos t
    LEFT JOIN v2.contratos con
      ON con.inquilino_id = t.id
      AND con.estado IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN v2.locales u ON con.local_id = u.id
    WHERE t.juridica = false
      AND EXISTS (
        SELECT 1 FROM v2.contratos c4
        WHERE c4.inquilino_id = t.id
          AND c4.estado IN ('activo', 'critico', 'vencido', 'terminado')
      )
    GROUP BY t.id, t.razon_social, t.nombre_corto, t.nit, t.tipo_persona
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
    SELECT u.unidad, u.entrada
    FROM v2.locales u
    WHERE NOT EXISTS (
      SELECT 1 FROM v2.contratos c
      WHERE c.local_id = u.id AND c.estado IN ('activo', 'critico')
    )
    ORDER BY u.unidad
  `)

  return rows.map((r) => ({
    tenantId: null,
    cliente: null,
    nit: null,
    unitNumbers: [String(r.unidad)],
    canonTotal: 0,
    saldoVencido: 0,
    maxDiasMora: 0,
    status: "inactivo" as const,
    isVacant: true,
  }))
}
