import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"

const ENTRADA_RE = /^[A-Za-z0-9 ]{1,8}$/

function safeEntrada(e: string | undefined): string | undefined {
  return e && ENTRADA_RE.test(e) ? e : undefined
}

export type ClienteRow = {
  tenantId: string | null
  cliente: string | null
  nit: string | null
  unitNumbers: string[]
  entradas: string[]
  canonTotal: number
  saldoVencido: number
  maxDiasMora: number
  status: "al_dia" | "en_mora" | "critico" | "inactivo"
  isVacant?: boolean
}

export type LocalesKPIs = {
  totalUnits: number
  occupiedUnits: number
  vacantes: number
  canonMensual: number
  contratosPorVencer: number
}

export async function getLocalesKPIs(entrada?: string): Promise<LocalesKPIs> {
  const e = safeEntrada(entrada)
  const ef = e ? `AND l.entrada = '${e}'` : ""
  const ef2 = e ? `AND c.local_id IN (SELECT id FROM v2.locales WHERE entrada = '${e}')` : ""

  const rows = await execute(`
    SELECT
      (SELECT COUNT(*) FROM v2.locales l WHERE TRUE ${ef})                  AS total_units,
      (SELECT COUNT(DISTINCT c.local_id) FROM v2.contratos c
        JOIN v2.locales l ON l.id = c.local_id
        WHERE c.estado IN ('activo','critico') ${ef})                       AS occupied_units,
      (SELECT COUNT(*) FROM v2.locales l
        WHERE NOT EXISTS (
          SELECT 1 FROM v2.contratos c WHERE c.local_id = l.id
            AND c.estado IN ('activo','critico')
        ) ${ef})                                                            AS vacantes,
      (SELECT COALESCE(SUM(o.precio * (1 - COALESCE(o.descuento,0)/100.0)),0)
        FROM siesa_raw.ocupacion o
        JOIN v2.locales l ON l.unidad = o.loc
        WHERE o.razon_social IS NOT NULL
          AND COALESCE(o.precio,0) > 0 ${ef})                              AS canon_mensual,
      (SELECT COUNT(*) FROM v2.contratos c
        JOIN v2.locales l ON l.id = c.local_id
        WHERE c.estado IN ('activo','critico')
          AND c.fecha_fin IS NOT NULL
          AND c.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
          ${ef})                                                            AS contratos_por_vencer
  `)
  const r = rows[0] as Record<string, unknown>
  return {
    totalUnits:         Number(r.total_units          ?? 0),
    occupiedUnits:      Number(r.occupied_units       ?? 0),
    vacantes:           Number(r.vacantes             ?? 0),
    canonMensual:       Number(r.canon_mensual        ?? 0),
    contratosPorVencer: Number(r.contratos_por_vencer ?? 0),
  }
}

export async function getClienteRows(entrada?: string): Promise<ClienteRow[]> {
  const grace = await getGracePeriod()
  const e = safeEntrada(entrada)
  const entradaExists = e
    ? `AND EXISTS (
        SELECT 1 FROM v2.contratos cx
        JOIN v2.locales lx ON lx.id = cx.local_id
        WHERE cx.inquilino_id = t.id
          AND cx.estado IN ('activo','critico','vencido','terminado')
          AND lx.entrada = '${e}'
      )`
    : ""

  const rows = await execute(`
    SELECT
      t.id                                                                AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social)                           AS cliente,
      t.nit,
      ARRAY_AGG(DISTINCT u.unidad ORDER BY u.unidad)
        FILTER (WHERE u.unidad IS NOT NULL)                              AS unit_numbers,
      ARRAY_AGG(DISTINCT u.entrada ORDER BY u.entrada)
        FILTER (WHERE u.entrada IS NOT NULL)                             AS entradas,
      COALESCE((
        SELECT SUM(
          o.precio * (1 - COALESCE(o.descuento, 0) / 100.0)
          * (1.19 - CASE WHEN t.tipo_persona = 'PJ' THEN 0.035 ELSE 0 END)
        )
        FROM siesa_raw.ocupacion o
        WHERE o.documento = t.nit
          AND o.razon_social IS NOT NULL
          AND COALESCE(o.precio, 0) > 0
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
      ${entradaExists}
    GROUP BY t.id, t.razon_social, t.nombre_corto, t.nit, t.tipo_persona
    ORDER BY COALESCE(t.nombre_corto, t.razon_social)
  `)

  return rows.map((r) => ({
    tenantId:    String(r.tenant_id),
    cliente:     String(r.cliente),
    nit:         r.nit ? String(r.nit) : null,
    unitNumbers: Array.isArray(r.unit_numbers) ? r.unit_numbers.map(String) : [],
    entradas:    Array.isArray(r.entradas)    ? r.entradas.map(String)    : [],
    canonTotal:  Number(r.canon_total  ?? 0),
    saldoVencido: Number(r.saldo_vencido ?? 0),
    maxDiasMora:  Number(r.max_dias_mora ?? 0),
    status:      r.status as ClienteRow["status"],
  }))
}

export async function getVacantUnitRows(entrada?: string): Promise<ClienteRow[]> {
  const e = safeEntrada(entrada)
  const ef = e ? `AND u.entrada = '${e}'` : ""

  const rows = await execute(`
    SELECT u.unidad, u.entrada
    FROM v2.locales u
    WHERE NOT EXISTS (
      SELECT 1 FROM v2.contratos c
      WHERE c.local_id = u.id AND c.estado IN ('activo', 'critico')
    )
    ${ef}
    ORDER BY u.unidad
  `)

  return rows.map((r) => ({
    tenantId:    null,
    cliente:     null,
    nit:         null,
    unitNumbers: [String(r.unidad)],
    entradas:    r.entrada ? [String(r.entrada)] : [],
    canonTotal:  0,
    saldoVencido: 0,
    maxDiasMora:  0,
    status:      "inactivo" as const,
    isVacant:    true,
  }))
}
