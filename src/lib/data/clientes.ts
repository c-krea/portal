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

export type LocalesKPIs = {
  totalUnits: number
  occupiedUnits: number
  carteraTotal: number
  localesEnMora: number
  recaudadoEsteMes: number
}

export async function getLocalesKPIs(): Promise<LocalesKPIs> {
  const rows = await execute(`
    SELECT
      (SELECT COUNT(*) FROM v2.locales)                                    AS total_units,
      (SELECT COUNT(DISTINCT local_id) FROM v2.contratos
        WHERE estado IN ('activo', 'critico'))                             AS occupied_units,
      (SELECT COALESCE(SUM(saldo), 0) FROM v2.vista_cartera_actual
        WHERE saldo > 0)                                                   AS cartera_total,
      (SELECT COUNT(DISTINCT inquilino_id) FROM v2.vista_cartera_actual
        WHERE dias_mora > 0 AND vr_vencido > 0)                            AS locales_en_mora,
      (SELECT COALESCE(SUM(valor_final), 0) FROM v2.vista_pagos
        WHERE date_trunc('month', fecha_recaudo) = date_trunc('month', CURRENT_DATE)) AS recaudado_este_mes
  `)
  const r = rows[0] as Record<string, unknown>
  return {
    totalUnits:       Number(r.total_units       ?? 0),
    occupiedUnits:    Number(r.occupied_units    ?? 0),
    carteraTotal:     Number(r.cartera_total     ?? 0),
    localesEnMora:    Number(r.locales_en_mora   ?? 0),
    recaudadoEsteMes: Number(r.recaudado_este_mes ?? 0),
  }
}

export async function getClienteRows(): Promise<ClienteRow[]> {
  const rows = await execute(`
    SELECT
      t.id                                                                AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)                           AS cliente,
      t.nit,
      ARRAY_AGG(DISTINCT u.unidad ORDER BY u.unidad)
        FILTER (WHERE u.unidad IS NOT NULL)                              AS unit_numbers,
      COALESCE((
        SELECT SUM(c2.canon_base) FROM v2.contratos c2
        WHERE c2.inquilino_id = t.id AND c2.estado IN ('activo', 'critico')
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
        WHEN bool_or(con.estado = 'critico') THEN 'critico'
        WHEN bool_or(con.estado IN ('activo', 'critico'))
          AND (SELECT COALESCE(SUM(ca.vr_vencido), 0) FROM v2.vista_cartera_actual ca WHERE ca.inquilino_id = t.id) > 0
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
