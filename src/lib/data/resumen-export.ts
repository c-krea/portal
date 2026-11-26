import { execute } from "@/lib/db/executor"
import { assertPeriodo, assertUuid } from "@/lib/security/validators"
import { moraVencEfecExpr } from "@/lib/data/mora"
import {
  EXCLUDE_ELECTRICITY,
  electricityTenantsSubquery,
  prevMonthStr,
  recibosSinFacturaRowsSql,
  serviciosPublicosRowsSql,
} from "@/lib/data/pagos"

// Row-level detail behind the /resumen headline numbers, for the Excel
// downloads. Live (uncached) on purpose: a download should reflect the DB now.
//
// No new money rules here — every filter mirrors its aggregate twin:
//   • Recaudo rows  ↔ getResumenKPIs (pagos.ts): same vp fence, empresa scope,
//     electricity dedup, and on-time/late split via moraVencEfecExpr. On top of
//     that it lists servicios públicos, the same rows as getResumenExtras.luz,
//     and the receipts with no invoice applied (anticipos → Canon, RKD → Depósito).
//   • Mora rows     ↔ getResumenKPIs.late + getMoraTrendReconstruido (mora.ts):
//     late non-jurídica cash in the month + (cartera still open today OR paid
//     after the cutoff) for FVS invoices due before the month's cutoff.
// If either aggregate changes, change its twin here too.

const LOCAL_SUBQUERY = (inquilinoSql: string) => `(
  SELECT u.unidad
  FROM v2.contratos c2
  JOIN v2.locales u ON u.id = c2.local_id
  WHERE c2.inquilino_id = ${inquilinoSql}
    AND c2.estado IN ('activo','critico','vencido','terminado')
  ORDER BY c2.created_at DESC LIMIT 1
)`

function monthCte(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return electricityTenantsSubquery(`DATE '${month}-01'`, prevMonthStr(y, m))
}

// ── Recaudo del mes (Total recaudo) ─────────────────────────────────────────

// Canon = facturado + anticipo + intereses_mora paid on time; Mora = mora +
// intereses_mora paid late; Luz = servicios_publicos; + cuentas_cobro. Those
// add up to the "Total recaudo" card. mora_juridica and deposito are listed
// but sit outside that total.
export type RecaudoTipo =
  | "facturado"
  | "anticipo"
  | "deposito"
  | "cuentas_cobro" // one manual row per month, added by the recaudo route
  | "mora"
  | "intereses_mora"
  | "mora_juridica"
  | "servicios_publicos"

export type RecaudoExportRow = {
  fechaRecaudo: string
  recibo: string
  factura: string
  nit: string
  cliente: string
  local: string | null
  fechaFactura: string | null
  vencimiento: string | null
  diasAlPago: number | null
  tipo: RecaudoTipo
  valorAplicado: number
  prontoPago: number
  valorFinal: number
}

export async function getRecaudoExport(month: string, empresaId: string): Promise<RecaudoExportRow[]> {
  assertPeriodo(month)
  assertUuid(empresaId)
  const vencEfec = moraVencEfecExpr("p.fecha_vencimiento", "p.fecha_factura")

  const rows = await execute(`
    WITH ${monthCte(month)},
    -- FVS invoices: exactly the rows getResumenKPIs sums. tipo_cliente only
    -- splits mora-interest invoices out of the arriendo lines; a late payment
    -- from a jurídica tenant stays out of the total, as on the card.
    fvs AS (
      SELECT
        p.fecha_recaudo::date                           AS fecha_recaudo,
        p.docto::text                                   AS docto,
        p.cruce::text                                   AS cruce,
        p.nit_inquilino::text                           AS nit,
        p.razon_social_raw::text                        AS razon_social_raw,
        p.inquilino_id,
        p.fecha_factura::date                           AS fecha_factura,
        (${vencEfec})::date                             AS vencimiento,
        CASE
          WHEN p.fecha_recaudo > (${vencEfec}) AND COALESCE(p.juridica, false) THEN 'mora_juridica'
          WHEN p.tipo_cliente = 'INTERESES MORA' THEN 'intereses_mora'
          WHEN p.fecha_recaudo <= (${vencEfec}) THEN 'facturado'
          ELSE 'mora'
        END                                             AS tipo,
        COALESCE(p.valor_aplicado, 0)::numeric          AS valor_aplicado,
        COALESCE(p.pronto_pago_aplicado, 0)::numeric    AS pronto_pago,
        p.valor_final::numeric                          AS valor_final
      FROM vp p
      WHERE p.empresa_id = '${empresaId}'::uuid
        AND date_trunc('month', p.fecha_recaudo) = DATE '${month}-01'
        ${EXCLUDE_ELECTRICITY}
    ),
    -- Servicios públicos (energía): same rows as the /resumen Luz card.
    rge AS (
      SELECT
        r.fecha_recaudo::date                           AS fecha_recaudo,
        r.docto::text                                   AS docto,
        r.cruce::text                                   AS cruce,
        r.documento::text                               AS nit,
        r.cliente::text                                 AS razon_social_raw,
        r.inquilino_id,
        r.fecha_fact::date                              AS fecha_factura,
        NULL::date                                      AS vencimiento,
        'servicios_publicos'                            AS tipo,
        COALESCE(r.valor_aplicado, 0)::numeric          AS valor_aplicado,
        COALESCE(r.pronto_pago, 0)::numeric             AS pronto_pago,
        r.valor_final::numeric                          AS valor_final
      FROM (${serviciosPublicosRowsSql(empresaId, month)}) r
    ),
    -- Receipts with no invoice applied: anticipos (Canon) and RKD (Depósito).
    sin_factura AS (
      SELECT
        r.fecha_recaudo::date                           AS fecha_recaudo,
        r.docto::text                                   AS docto,
        r.cruce::text                                   AS cruce,
        r.documento::text                               AS nit,
        r.cliente::text                                 AS razon_social_raw,
        (SELECT i.id FROM v2.inquilinos i
          WHERE i.nit = r.documento AND i.empresa_id = '${empresaId}'::uuid LIMIT 1) AS inquilino_id,
        NULL::date                                      AS fecha_factura,
        NULL::date                                      AS vencimiento,
        r.tipo                                          AS tipo,
        COALESCE(r.valor_aplicado, 0)::numeric          AS valor_aplicado,
        COALESCE(r.pronto_pago, 0)::numeric             AS pronto_pago,
        r.valor_final::numeric                          AS valor_final
      FROM (
        SELECT a.*, 'anticipo' AS tipo FROM (${recibosSinFacturaRowsSql(month, "anticipo")}) a
        UNION ALL
        SELECT d.*, 'deposito' AS tipo FROM (${recibosSinFacturaRowsSql(month, "deposito")}) d
      ) r
    )
    SELECT
      x.fecha_recaudo::text                             AS fecha_recaudo,
      x.docto                                           AS recibo,
      x.cruce                                           AS factura,
      TRIM(x.nit)                                       AS nit,
      COALESCE(t.nombre_corto, t.razon_social, x.razon_social_raw) AS cliente,
      ${LOCAL_SUBQUERY("x.inquilino_id")}               AS local,
      x.fecha_factura::text                             AS fecha_factura,
      x.vencimiento::text                               AS vencimiento,
      (x.fecha_recaudo - x.fecha_factura)               AS dias_al_pago,
      x.tipo,
      x.valor_aplicado,
      x.pronto_pago,
      x.valor_final
    FROM (SELECT * FROM fvs UNION ALL SELECT * FROM rge UNION ALL SELECT * FROM sin_factura) x
    LEFT JOIN v2.inquilinos t ON t.id = x.inquilino_id
    ORDER BY x.fecha_recaudo, x.docto, x.cruce
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    fechaRecaudo:  String(r.fecha_recaudo),
    recibo:        String(r.recibo ?? ""),
    factura:       String(r.factura ?? ""),
    nit:           String(r.nit ?? ""),
    cliente:       String(r.cliente ?? ""),
    local:         r.local ? String(r.local) : null,
    fechaFactura:  r.fecha_factura ? String(r.fecha_factura) : null,
    vencimiento:   r.vencimiento ? String(r.vencimiento) : null,
    diasAlPago:    r.dias_al_pago != null ? Number(r.dias_al_pago) : null,
    tipo:          String(r.tipo) as RecaudoTipo,
    valorAplicado: Number(r.valor_aplicado ?? 0),
    prontoPago:    Number(r.pronto_pago ?? 0),
    valorFinal:    Number(r.valor_final ?? 0),
  }))
}

// ── Mora del mes, por documento ──────────────────────────────────────────────

export type MoraDocumentoRow = {
  factura: string
  nit: string
  cliente: string
  local: string | null
  fechaFactura: string | null
  vencimiento: string | null
  diasVencidoCorte: number | null
  recaudoMes: number
  abiertoHoy: number
  pagadoDespues: number
}

export type MoraExport = {
  corte: string
  documentos: MoraDocumentoRow[]
}

// Same LEAST(first day of next month, today) as the SQL params CTE; only used
// when the query returns no rows to carry the value.
function fallbackCorte(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
  return next < today ? next : today
}

export async function getMoraDelMesExport(month: string, empresaId: string): Promise<MoraExport> {
  assertPeriodo(month)
  assertUuid(empresaId)
  const vencPagos = moraVencEfecExpr("p.fecha_vencimiento", "p.fecha_factura")
  const vencCartera = moraVencEfecExpr("c.fecha_vencimiento", "c.fecha_factura::date")
  // docs has no fecha_vencimiento column; the helper ignores that argument anyway.
  const vencDoc = moraVencEfecExpr("NULL", "d.fecha_factura")

  const rows = await execute(`
    WITH ${monthCte(month)},
    params AS (
      SELECT LEAST((DATE '${month}-01' + INTERVAL '1 month')::date, CURRENT_DATE) AS corte
    ),
    -- Recaudo mora del mes: same predicate as getResumenKPIs "late".
    recaudo AS (
      SELECT p.cruce AS factura, p.inquilino_id, MIN(p.fecha_factura::date) AS fecha_factura,
             SUM(p.valor_final) AS recaudo_mes, 0::numeric AS abierto, 0::numeric AS despues
      FROM vp p
      WHERE p.empresa_id = '${empresaId}'::uuid
        AND date_trunc('month', p.fecha_recaudo) = DATE '${month}-01'
        AND p.fecha_recaudo > (${vencPagos})
        AND COALESCE(p.juridica, false) = false
        ${EXCLUDE_ELECTRICITY}
      GROUP BY p.cruce, p.inquilino_id
    ),
    -- Pendiente al cierre, half 1: still open in cartera today, due before corte.
    abierto AS (
      SELECT c.factura, c.inquilino_id, MIN(c.fecha_factura::date) AS fecha_factura,
             0::numeric AS recaudo_mes, SUM(c.vr_vencido) AS abierto, 0::numeric AS despues
      FROM v2.vista_cartera_actual c, params x
      WHERE c.empresa_id = '${empresaId}'::uuid
        AND COALESCE(c.juridica, false) = false
        AND c.factura LIKE 'FVS-%'
        AND c.vr_vencido > 0
        AND (${vencCartera}) < x.corte
      GROUP BY c.factura, c.inquilino_id
    ),
    -- Pendiente al cierre, half 2: was owed at corte, paid on/after corte.
    despues AS (
      SELECT p.cruce AS factura, p.inquilino_id, MIN(p.fecha_factura::date) AS fecha_factura,
             0::numeric AS recaudo_mes, 0::numeric AS abierto, SUM(p.valor_final) AS despues
      FROM vp p, params x
      WHERE p.empresa_id = '${empresaId}'::uuid
        AND COALESCE(p.juridica, false) = false
        AND p.cruce LIKE 'FVS-%'
        AND (${vencPagos}) < x.corte
        AND p.fecha_recaudo::date >= x.corte
      GROUP BY p.cruce, p.inquilino_id
    ),
    docs AS (
      SELECT factura, inquilino_id,
             MIN(fecha_factura) AS fecha_factura,
             SUM(recaudo_mes) AS recaudo_mes,
             SUM(abierto)     AS abierto,
             SUM(despues)     AS despues
      FROM (
        SELECT * FROM recaudo UNION ALL SELECT * FROM abierto UNION ALL SELECT * FROM despues
      ) u
      GROUP BY factura, inquilino_id
    )
    SELECT
      d.factura,
      TRIM(t.nit)                                         AS nit,
      COALESCE(t.nombre_corto, t.razon_social)            AS cliente,
      ${LOCAL_SUBQUERY("d.inquilino_id")}                 AS local,
      d.fecha_factura::text                               AS fecha_factura,
      (${vencDoc})::text                                  AS vencimiento,
      GREATEST(0, (SELECT corte FROM params) - (${vencDoc})) AS dias_vencido,
      d.recaudo_mes::numeric                              AS recaudo_mes,
      d.abierto::numeric                                  AS abierto,
      d.despues::numeric                                  AS despues,
      (SELECT corte FROM params)::text                    AS corte
    FROM docs d
    LEFT JOIN v2.inquilinos t ON t.id = d.inquilino_id
    ORDER BY cliente, d.fecha_factura, d.factura
  `)

  const all = rows as Array<Record<string, unknown>>
  return {
    corte: all[0]?.corte ? String(all[0].corte) : fallbackCorte(month),
    documentos: all.map((r) => ({
      factura:          String(r.factura ?? ""),
      nit:              String(r.nit ?? ""),
      cliente:          String(r.cliente ?? ""),
      local:            r.local ? String(r.local) : null,
      fechaFactura:     r.fecha_factura ? String(r.fecha_factura) : null,
      vencimiento:      r.vencimiento ? String(r.vencimiento) : null,
      diasVencidoCorte: r.dias_vencido != null ? Number(r.dias_vencido) : null,
      recaudoMes:       Number(r.recaudo_mes ?? 0),
      abiertoHoy:       Number(r.abierto ?? 0),
      pagadoDespues:    Number(r.despues ?? 0),
    })),
  }
}
