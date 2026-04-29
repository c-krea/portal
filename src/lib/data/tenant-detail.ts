import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"
import { assertUuid, assertUnit } from "@/lib/security/validators"

export type TenantDetail = {
  id: string
  razonSocial: string
  nombreCorto: string | null
  nit: string
  email: string | null
  telefono: string | null
  contactoNombre: string | null
  condicionPago: string | null
  contractId: string | null
  contractStatus: string | null
  fechaInicio: string | null
  fechaFin: string | null
  canonBase: number
  descuentoPct: number
  prontoPagoPct: number
  descripcionDescuentos: string | null
  unitNumber: string | null
  entrada: string | null
  areaM2: number | null
  clasificacion: string | null
}

export type CarteraItem = {
  id: string
  siesaFactura: string | null
  fechaFactura: string | null
  fechaVence: string | null
  diasMora: number
  saldo: number
  valorVencido: number
  interesAcumulado: number
  observacion: string | null
}

export type PagoHistorialItem = {
  id: string
  fechaRecaudo: string
  valorAplicado: number
  prontoPagoAplicado: number
  valorFinal: number
  concepto: string | null
  siesaDocto: string | null
  siesaCruce: string | null
  siesaClasificacion: string | null
  status: string
}

export type ContractPhaseItem = {
  id: string
  phaseNumber: number
  name: string
  startDate: string
  endDate: string | null
  descuentoPct: number
  prontoPagoPct: number
  isActive: boolean
}

export async function getTenantDetail(tenantId: string, unitNumber?: string): Promise<TenantDetail | null> {
  assertUuid(tenantId)
  if (unitNumber) assertUnit(unitNumber)
  const unitFilter = unitNumber ? `AND u.unidad = '${unitNumber}'` : ""
  const rows = await execute(`
    SELECT
      t.id, t.razon_social, t.nombre_corto, t.nit,
      COALESCE(t.email_contacto, t.portal_email) AS email,
      t.telefono, t.contacto_nombre, t.condicion_pago,
      c.id                                           AS contract_id,
      c.estado                                       AS contract_status,
      c.fecha_inicio, c.fecha_fin,
      COALESCE(c.canon_base, 0)::numeric             AS canon_base,
      COALESCE(c.descuento_pct, 0)::numeric          AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric        AS pronto_pago_pct,
      c.descripcion_descuentos,
      u.unidad                                       AS unit_number,
      u.entrada,
      u.area_m2::numeric                             AS area_m2,
      u.clasificacion
    FROM v2.inquilinos t
    LEFT JOIN v2.contratos c
      ON c.inquilino_id = t.id
      AND c.estado IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN v2.locales u ON c.local_id = u.id
    WHERE t.id = '${tenantId}' ${unitFilter}
    ORDER BY c.created_at DESC NULLS LAST
    LIMIT 1
  `)
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: String(r.id),
    razonSocial: String(r.razon_social),
    nombreCorto: r.nombre_corto ? String(r.nombre_corto) : null,
    nit: String(r.nit),
    email: r.email ? String(r.email) : null,
    telefono: r.telefono ? String(r.telefono) : null,
    contactoNombre: r.contacto_nombre ? String(r.contacto_nombre) : null,
    condicionPago: r.condicion_pago ? String(r.condicion_pago) : null,
    contractId: r.contract_id ? String(r.contract_id) : null,
    contractStatus: r.contract_status ? String(r.contract_status) : null,
    fechaInicio: r.fecha_inicio ? String(r.fecha_inicio) : null,
    fechaFin: r.fecha_fin ? String(r.fecha_fin) : null,
    canonBase: Number(r.canon_base ?? 0),
    descuentoPct: Number(r.descuento_pct ?? 0),
    prontoPagoPct: Number(r.pronto_pago_pct ?? 0),
    descripcionDescuentos: r.descripcion_descuentos ? String(r.descripcion_descuentos) : null,
    unitNumber: r.unit_number ? String(r.unit_number) : null,
    entrada: r.entrada ? String(r.entrada) : null,
    areaM2: r.area_m2 !== null && r.area_m2 !== undefined ? Number(r.area_m2) : null,
    clasificacion: r.clasificacion ? String(r.clasificacion) : null,
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
  const now = new Date()
  const yr = now.getFullYear()
  const mo = now.getMonth() + 1

  const rows = await execute(`
    SELECT
      c.id AS contract_id, c.estado AS contract_status,
      c.fecha_inicio, c.fecha_fin,
      COALESCE(c.canon_base, 0)::numeric        AS canon_base,
      COALESCE((
        SELECT (pr.canon_proyectado - pr.descuento_proyectado)
             * (1.19 - CASE WHEN t.tipo_persona = 'PJ' THEN 0.035 ELSE 0 END)
        FROM v2.proyecciones pr
        WHERE pr.contrato_id = c.id AND pr.anio = ${yr} AND pr.mes = ${mo}
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
  const grace = await getGracePeriod()
  const rows = await execute(`
    WITH r AS (
      SELECT valor::numeric AS rate FROM v2.reglas_financieras WHERE clave = 'interes_mora_diario' LIMIT 1
    )
    SELECT
      row_id::text                                AS id,
      factura                                     AS siesa_factura,
      fecha_factura,
      fecha_vencimiento                           AS fecha_vence,
      COALESCE(dias_mora, 0)                      AS dias_mora,
      COALESCE(saldo, 0)::numeric                 AS saldo,
      COALESCE(vr_vencido, 0)::numeric            AS valor_vencido,
      (COALESCE(saldo, 0) * GREATEST(0, COALESCE(dias_mora, 0) - ${grace}) * (SELECT rate FROM r))::numeric AS interes
    FROM v2.vista_cartera_actual
    WHERE inquilino_id = '${tenantId}'
    ORDER BY fecha_vencimiento DESC NULLS LAST
  `)
  return rows.map((r) => ({
    id: String(r.id),
    siesaFactura: r.siesa_factura ? String(r.siesa_factura) : null,
    fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
    fechaVence: r.fecha_vence ? String(r.fecha_vence) : null,
    diasMora: Number(r.dias_mora ?? 0),
    saldo: Number(r.saldo ?? 0),
    valorVencido: Number(r.valor_vencido ?? 0),
    interesAcumulado: Number(r.interes ?? 0),
    observacion: null,
  }))
}

export async function getTenantPayments(tenantId: string): Promise<PagoHistorialItem[]> {
  assertUuid(tenantId)
  const rows = await execute(`
    WITH standalones AS (
      SELECT p.docto, p.cruce, p.valor_final, p.fecha_recaudo,
             date_trunc('month', p.fecha_recaudo)::date AS m
      FROM v2.vista_pagos p
      WHERE p.inquilino_id = '${tenantId}'
        AND p.docto LIKE '001-%'
        AND NOT EXISTS (
          SELECT 1 FROM v2.vista_pagos p2
          WHERE p2.inquilino_id = p.inquilino_id
            AND p2.cruce = p.cruce
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
      cruce                                       AS siesa_cruce
    FROM v2.vista_pagos p
    WHERE p.inquilino_id = '${tenantId}'
      AND NOT (
        p.docto LIKE '001-%'
        AND date_trunc('month', p.fecha_recaudo)::date IN (SELECT m FROM months_to_drop)
        AND NOT EXISTS (
          SELECT 1 FROM v2.vista_pagos p2
          WHERE p2.inquilino_id = p.inquilino_id
            AND p2.cruce = p.cruce
            AND p2.docto = REPLACE(p.docto, '001-', '')
            AND p2.valor_final = p.valor_final
        )
      )
    ORDER BY fecha_recaudo DESC
  `)
  return rows.map((r) => ({
    id: String(r.id),
    fechaRecaudo: String(r.fecha_recaudo),
    valorAplicado: Number(r.valor_aplicado ?? 0),
    prontoPagoAplicado: Number(r.pronto_pago_aplicado ?? 0),
    valorFinal: Number(r.valor_final ?? 0),
    concepto: null,
    siesaDocto: r.siesa_docto ? String(r.siesa_docto) : null,
    siesaCruce: r.siesa_cruce ? String(r.siesa_cruce) : null,
    siesaClasificacion: null,
    status: "RECAUDADO",
  }))
}
