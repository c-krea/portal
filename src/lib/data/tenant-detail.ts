import { execute } from "@/lib/db/executor"
import { getIvaRate } from "@/lib/data/configuracion"
import { assertUuid } from "@/lib/security/validators"
import { moraDiasVencidosExpr, moraInteresExpr, moraRateCteSql, moraVencEfecExpr } from "@/lib/data/mora"

export type TenantDetail = {
  id: string
  razonSocial: string
  nit: string
  email: string | null
  telefono: string | null
  contactoNombre: string | null
  condicionPago: string | null
}

export type CarteraItem = {
  id: string
  siesaFactura: string | null
  fechaFactura: string | null
  fechaVence: string | null
  unidad: string | null
  diasMora: number
  diasInterest: number
  saldo: number
  ventas: number
  valorVencido: number
  interesAcumulado: number
}

export type PagoHistorialItem = {
  id: string
  fechaRecaudo: string
  fechaFactura: string | null
  valorAplicado: number
  prontoPagoAplicado: number
  valorFinal: number
  concepto: string | null
  siesaDocto: string | null
  siesaCruce: string | null
  diasDesdeFactura: number | null
}

export async function getTenantDetail(tenantId: string): Promise<TenantDetail | null> {
  assertUuid(tenantId)
  const rows = await execute(`
    SELECT
      t.id, t.razon_social, t.nit,
      COALESCE(t.email_contacto, t.portal_email) AS email,
      t.telefono, t.contacto_nombre, t.condicion_pago
    FROM v2.inquilinos t
    WHERE t.id = '${tenantId}'
    LIMIT 1
  `)
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: String(r.id),
    razonSocial: String(r.razon_social),
    nit: String(r.nit),
    email: r.email ? String(r.email) : null,
    telefono: r.telefono ? String(r.telefono) : null,
    contactoNombre: r.contacto_nombre ? String(r.contacto_nombre) : null,
    condicionPago: r.condicion_pago ? String(r.condicion_pago) : null,
  }
}

export type TenantContract = {
  contractId: string
  contractStatus: string
  unitNumber: string | null
  entrada: string | null
  areaM2: number | null
  clasificacion: string | null
  fechaInicio: string | null
  fechaFin: string | null
  canonBase: number
  canonReal: number
  descuentoPct: number
  prontoPagoPct: number
  descripcionDescuentos: string | null
}

export async function getTenantContracts(tenantId: string): Promise<TenantContract[]> {
  assertUuid(tenantId)
  const iva = await getIvaRate()

  const rows = await execute(`
    SELECT
      c.id AS contract_id, c.estado AS contract_status,
      c.fecha_inicio, c.fecha_fin,
      COALESCE(c.canon_base, 0)::numeric        AS canon_base,
      COALESCE((
        SELECT
          o.precio * (1 - COALESCE(o.descuento, 0) / 100.0)
          * ((1 + ${iva}) - CASE WHEN t.tipo_persona = 'PJ' THEN 0.035 ELSE 0 END)
        FROM siesa_raw.ocupacion o
        WHERE o.documento = t.nit
          AND o.loc = u.unidad
          AND o.razon_social IS NOT NULL
          AND COALESCE(o.precio, 0) > 0
        ORDER BY o.precio DESC
        LIMIT 1
      ), 0)::numeric                            AS canon_real,
      COALESCE(c.descuento_pct, 0)::numeric     AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric   AS pronto_pago_pct,
      c.descripcion_descuentos,
      u.unidad AS unit_number,
      u.entrada,
      u.area_m2::numeric AS area_m2,
      u.clasificacion
    FROM v2.contratos c
    JOIN v2.inquilinos t ON t.id = c.inquilino_id
    LEFT JOIN v2.locales u ON c.local_id = u.id
    WHERE c.inquilino_id = '${tenantId}'
      AND c.estado IN ('activo', 'critico', 'vencido', 'terminado')
    ORDER BY c.estado = 'activo' DESC, c.estado = 'critico' DESC, c.fecha_inicio DESC
  `)
  return rows.map((r) => ({
    contractId: String(r.contract_id),
    contractStatus: String(r.contract_status),
    unitNumber: r.unit_number ? String(r.unit_number) : null,
    entrada: r.entrada ? String(r.entrada) : null,
    areaM2: r.area_m2 !== null ? Number(r.area_m2) : null,
    clasificacion: r.clasificacion ? String(r.clasificacion) : null,
    fechaInicio: r.fecha_inicio ? String(r.fecha_inicio) : null,
    fechaFin: r.fecha_fin ? String(r.fecha_fin) : null,
    canonBase: Number(r.canon_base ?? 0),
    canonReal: Number(r.canon_real ?? 0),
    descuentoPct: Number(r.descuento_pct ?? 0),
    prontoPagoPct: Number(r.pronto_pago_pct ?? 0),
    descripcionDescuentos: r.descripcion_descuentos ? String(r.descripcion_descuentos) : null,
  }))
}

export async function getTenantCartera(tenantId: string): Promise<CarteraItem[]> {
  assertUuid(tenantId)
  // Interés DIAN compartido con /mora (ver mora.ts): vr_vencido × (tasa ÷ 366) ×
  // GREATEST(0, CURRENT_DATE − venc_efec). Se reutiliza la FÓRMULA, no el filtro
  // de mora: esto lista TODA la cartera del inquilino y lo no vencido da interés 0.
  const vencEfec = moraVencEfecExpr("v.fecha_vencimiento", "v.fecha_factura::date")
  const rows = await execute(`
    WITH ${moraRateCteSql()}
    SELECT
      v.row_id::text                                              AS id,
      v.factura                                                   AS siesa_factura,
      v.fecha_factura,
      v.fecha_vencimiento                                         AS fecha_vence,
      REVERSE(SPLIT_PART(REVERSE(v.sucursal), ' ', 1))            AS unidad,
      COALESCE(v.dias_mora, 0)                                    AS dias_mora,
      ${moraDiasVencidosExpr(vencEfec)}                           AS dias_interest,
      COALESCE(v.saldo, 0)::numeric                              AS saldo,
      ROUND(d.ventas)::numeric                                   AS ventas,
      COALESCE(v.vr_vencido, 0)::numeric                         AS valor_vencido,
      ${moraInteresExpr("COALESCE(v.vr_vencido, 0)", vencEfec)}   AS interes
    FROM v2.vista_cartera_actual v
    LEFT JOIN siesa_raw.documentos d
      ON d.documento = '001-' || v.factura AND d.tipo = 'Facturas'
    WHERE v.inquilino_id = '${tenantId}'
    ORDER BY v.fecha_vencimiento DESC NULLS LAST
  `)
  return rows.map((r) => ({
    id: String(r.id),
    siesaFactura: r.siesa_factura ? String(r.siesa_factura) : null,
    fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
    fechaVence: r.fecha_vence ? String(r.fecha_vence) : null,
    unidad: r.unidad ? String(r.unidad) : null,
    diasMora: Number(r.dias_mora ?? 0),
    diasInterest: Number(r.dias_interest ?? 0),
    saldo: Number(r.saldo ?? 0),
    ventas: Number(r.ventas ?? 0),
    valorVencido: Number(r.valor_vencido ?? 0),
    interesAcumulado: Number(r.interes ?? 0),
  }))
}

export type PagoTotals = { valorFinal: number; prontoPago: number }

export async function getTenantPayments(
  tenantId: string,
  page = 1,
  pageSize = 10,
): Promise<{ pagos: PagoHistorialItem[]; totalCount: number; totals: PagoTotals }> {
  assertUuid(tenantId)
  const offset = (page - 1) * pageSize

  const rows = await execute(`
    WITH mine AS MATERIALIZED (
      -- Scan the vista_pagos view (full recaudo scan) ONCE for this tenant, then run all the
      -- dedup logic against this ~150-row set. Referencing v2.vista_pagos inside the correlated
      -- NOT EXISTS below re-scanned the whole recaudo table per row (~19s → statement timeout).
      SELECT * FROM v2.vista_pagos WHERE inquilino_id = '${tenantId}'
    ),
    standalones AS (
      SELECT p.docto, p.cruce, p.valor_final, p.fecha_recaudo,
             date_trunc('month', p.fecha_recaudo)::date AS m
      FROM mine p
      WHERE p.docto LIKE '001-%'
        AND NOT EXISTS (
          SELECT 1 FROM mine p2
          WHERE p2.cruce = p.cruce
            AND p2.docto = REPLACE(p.docto, '001-', '')
            AND p2.valor_final = p.valor_final
        )
    ),
    standalone_month_totals AS (
      SELECT m, SUM(valor_final) AS standalone_total
      FROM standalones GROUP BY m
    ),
    elec_per_month AS (
      SELECT (TO_DATE(mr.periodo || '-01', 'YYYY-MM-DD') + INTERVAL '1 month')::date AS m,
             SUM(mr.total_energia) AS elec_total
      FROM v2.contratos c
      JOIN v2.locales u ON u.id = c.local_id
      JOIN v2.lecturas_medidor mr ON mr.local_id = u.id
      WHERE c.inquilino_id = '${tenantId}'
        AND c.estado IN ('activo','critico','vencido','terminado')
      GROUP BY mr.periodo
    ),
    months_to_drop AS (
      SELECT smt.m FROM standalone_month_totals smt
      JOIN elec_per_month e ON e.m = smt.m
      WHERE ABS(smt.standalone_total - e.elec_total) <= 50
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY fecha_recaudo DESC, docto, cruce)::text AS id,
      fecha_recaudo,
      COALESCE(valor_aplicado, 0)::numeric        AS valor_aplicado,
      COALESCE(pronto_pago_aplicado, 0)::numeric  AS pronto_pago_aplicado,
      COALESCE(valor_final, 0)::numeric           AS valor_final,
      docto                                       AS siesa_docto,
      cruce                                       AS siesa_cruce,
      fecha_factura,
      (fecha_recaudo - fecha_factura)             AS dias_desde_factura,
      COUNT(*) OVER()                             AS total_count,
      SUM(COALESCE(valor_final, 0)) OVER()        AS grand_total_final,
      SUM(COALESCE(pronto_pago_aplicado, 0)) OVER() AS grand_total_pp
    FROM mine p
    WHERE NOT (
        p.docto LIKE '001-%'
        AND date_trunc('month', p.fecha_recaudo)::date IN (SELECT m FROM months_to_drop)
        AND NOT EXISTS (
          SELECT 1 FROM mine p2
          WHERE p2.cruce = p.cruce
            AND p2.docto = REPLACE(p.docto, '001-', '')
            AND p2.valor_final = p.valor_final
        )
      )
    ORDER BY fecha_recaudo DESC, docto, cruce
    LIMIT ${pageSize} OFFSET ${offset}
  `)

  const totalCount = rows[0] ? Number(rows[0].total_count) : 0
  const totals: PagoTotals = {
    valorFinal: rows[0] ? Number(rows[0].grand_total_final ?? 0) : 0,
    prontoPago: rows[0] ? Number(rows[0].grand_total_pp ?? 0) : 0,
  }
  return {
    pagos: rows.map((r) => ({
      id: String(r.id),
      fechaRecaudo: String(r.fecha_recaudo),
      valorAplicado: Number(r.valor_aplicado ?? 0),
      prontoPagoAplicado: Number(r.pronto_pago_aplicado ?? 0),
      valorFinal: Number(r.valor_final ?? 0),
      concepto: null,
      siesaDocto: r.siesa_docto ? String(r.siesa_docto) : null,
      siesaCruce: r.siesa_cruce ? String(r.siesa_cruce) : null,
      fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
      diasDesdeFactura: r.dias_desde_factura != null ? Number(r.dias_desde_factura) : null,
    })),
    totalCount,
    totals,
  }
}
