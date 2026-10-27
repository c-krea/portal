import { execute } from "@/lib/db/executor"
import { getIvaRate } from "@/lib/data/configuracion"
import { moraVencEfecExpr } from "@/lib/data/mora"
import { cached } from "@/lib/cache"

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
  contratosPorVencer: number
}

async function getLocalesKPIs_uncached(entrada?: string): Promise<LocalesKPIs> {
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
    contratosPorVencer: Number(r.contratos_por_vencer ?? 0),
  }
}

async function getClienteRows_uncached(entrada?: string): Promise<ClienteRow[]> {
  const iva = await getIvaRate()
  // Regla canónica de mora (mora.ts): venc_efec = fecha_factura + 30, sin gracia.
  // ca.dias_mora es CURRENT_DATE − vencimiento ERP crudo y grace_period_days=30
  // se sumaba encima (doble gracia ≈60 días desde factura). El estado y max usan
  // la fecha corregida y solo FVS (igual que /mora); el saldo mostrado sigue
  // siendo todo vr_vencido>0 para no esconder deuda no-FVS en la tabla.
  // Solo contratos activo/critico: un local de contrato vencido/terminado ya
  // sale en getVacantUnitRows; incluirlo aquí lo duplicaba (ej. 106, 209, 505).
  const e = safeEntrada(entrada)
  const entradaExists = e
    ? `AND EXISTS (
        SELECT 1 FROM v2.contratos cx
        JOIN v2.locales lx ON lx.id = cx.local_id
        WHERE cx.inquilino_id = t.id
          AND cx.estado IN ('activo','critico')
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
          * ((1 + ${iva}) - CASE WHEN t.tipo_persona = 'PJ' THEN 0.035 ELSE 0 END)
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
        SELECT MAX(GREATEST(0, CURRENT_DATE - (${moraVencEfecExpr("ca.fecha_vencimiento", "ca.fecha_factura")}))) FROM v2.vista_cartera_actual ca
        WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0 AND ca.factura LIKE 'FVS-%'
      ), 0)                                                              AS max_dias_mora,
      CASE
        WHEN bool_or(con.estado IN ('activo', 'critico'))
          AND (SELECT COALESCE(MAX(GREATEST(0, CURRENT_DATE - (${moraVencEfecExpr("ca.fecha_vencimiento", "ca.fecha_factura")}))), 0) FROM v2.vista_cartera_actual ca
               WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0 AND ca.factura LIKE 'FVS-%') > 60
          THEN 'critico'
        WHEN bool_or(con.estado IN ('activo', 'critico'))
          AND (SELECT COALESCE(MAX(GREATEST(0, CURRENT_DATE - (${moraVencEfecExpr("ca.fecha_vencimiento", "ca.fecha_factura")}))), 0) FROM v2.vista_cartera_actual ca
               WHERE ca.inquilino_id = t.id AND ca.vr_vencido > 0 AND ca.factura LIKE 'FVS-%') > 0
          THEN 'en_mora'
        WHEN bool_or(con.estado IN ('activo', 'critico')) THEN 'al_dia'
        ELSE 'inactivo'
      END                                                                AS status
    FROM v2.inquilinos t
    LEFT JOIN v2.contratos con
      ON con.inquilino_id = t.id
      AND con.estado IN ('activo', 'critico')
    LEFT JOIN v2.locales u ON con.local_id = u.id
    WHERE t.juridica = false
      AND EXISTS (
        SELECT 1 FROM v2.contratos c4
        WHERE c4.inquilino_id = t.id
          AND c4.estado IN ('activo', 'critico')
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

async function getVacantUnitRows_uncached(entrada?: string): Promise<ClienteRow[]> {
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

export type YaSalieronRow = {
  tenantId: string
  nit: string | null
  nombre: string | null
  ultimaUnidad: string | null
  ultimaEntrada: string | null
  saldo: number
}

async function getYaSalieronRows_uncached(): Promise<YaSalieronRow[]> {
  const rows = await execute(`
    SELECT
      i.id AS tenant_id,
      i.nit,
      COALESCE(i.nombre_corto, i.razon_social) AS nombre,
      COALESCE(SUM(ca.saldo), 0)::numeric AS saldo,
      (
        SELECT l.unidad
        FROM v2.contratos c2
        JOIN v2.locales l ON l.id = c2.local_id
        WHERE c2.inquilino_id = i.id
          AND c2.estado IN ('terminado', 'vencido')
        ORDER BY c2.fecha_fin DESC NULLS LAST, c2.id DESC
        LIMIT 1
      ) AS ultima_unidad,
      (
        SELECT l.entrada
        FROM v2.contratos c2
        JOIN v2.locales l ON l.id = c2.local_id
        WHERE c2.inquilino_id = i.id
          AND c2.estado IN ('terminado', 'vencido')
        ORDER BY c2.fecha_fin DESC NULLS LAST, c2.id DESC
        LIMIT 1
      ) AS ultima_entrada
    FROM v2.inquilinos i
    JOIN v2.vista_cartera_actual ca ON ca.inquilino_id = i.id
    WHERE NOT EXISTS (
      SELECT 1 FROM v2.contratos c
      WHERE c.inquilino_id = i.id
        AND c.estado IN ('activo', 'critico')
    )
    GROUP BY i.id, i.nit, i.razon_social, i.nombre_corto
    HAVING SUM(ca.saldo) > 0
    ORDER BY SUM(ca.saldo) DESC
  `)

  return rows.map((r) => ({
    tenantId: String(r.tenant_id),
    nit: r.nit ? String(r.nit) : null,
    nombre: r.nombre ? String(r.nombre) : null,
    ultimaUnidad: r.ultima_unidad ? String(r.ultima_unidad) : null,
    ultimaEntrada: r.ultima_entrada ? String(r.ultima_entrada) : null,
    saldo: Number(r.saldo ?? 0),
  }))
}

// ── Cached exports (30-min window; read-only — locales is ERP-derived) ──
export const getLocalesKPIs     = cached(getLocalesKPIs_uncached,     ["locales:kpis"],       "locales")
export const getClienteRows     = cached(getClienteRows_uncached,     ["locales:clientes"],   "locales")
export const getVacantUnitRows  = cached(getVacantUnitRows_uncached,  ["locales:vacantes"],   "locales")
export const getYaSalieronRows  = cached(getYaSalieronRows_uncached,  ["locales:ya_salieron"], "locales")
