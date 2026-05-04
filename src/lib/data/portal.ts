import { execute } from "@/lib/db/executor"

export type PortalProfile = {
  fullName: string
  tenantId: string
  companyId: string
  razonSocial: string
  nombreCorto: string | null
  unitNumber: string
  unitCode: string
  unitId: string
  allUnits: string[]
  allUnitIds: string[]
  entrada: string | null
  fechaInicio: string
  fechaFin: string | null
  canonBase: number
  contractStatus: string
  nit: string | null
  email: string | null
  telefono: string | null
  contactoNombre: string | null
  tipoCliente: string | null
  tipoPersona: string | null
  descuentoPct: number | null
  prontoPagoPct: number | null
  incrementoIpc: number | null
  descripcionDescuentos: string | null
}

export type PortalPago = {
  id: string
  fechaRecaudo: string
  fechaFactura: string | null
  valorFinal: number
  valorAplicado: number
  concepto: string | null
  diasDesdeFactura: number | null
}

export type PortalMedidorStatus = {
  lecturaActual: number | null
  periodo: string | null
  fotoUrl: string | null
  fotoDriveId: string | null
  exists: boolean
  totalEnergia: number | null
}

export async function getPortalProfile(userId: string): Promise<PortalProfile | null> {
  const rows = await execute(`
    SELECT
      p.nombre_completo                                  AS full_name,
      p.inquilino_id                                     AS tenant_id,
      p.empresa_id                                       AS company_id,
      t.razon_social,
      t.nombre_corto,
      t.nit,
      COALESCE(t.email_contacto, t.portal_email)         AS email,
      t.telefono,
      t.contacto_nombre,
      t.tipo_cliente,
      t.tipo_persona,
      u.unidad                                           AS unit_number,
      u.codigo                                           AS unit_code,
      u.entrada,
      u.id                                               AS unit_id,
      (
        SELECT ARRAY_AGG(lu.unidad ORDER BY lu.unidad)
        FROM v2.contratos cc
        JOIN v2.locales lu ON lu.id = cc.local_id
        WHERE cc.inquilino_id = t.id AND cc.estado IN ('activo','critico')
      )                                                  AS all_units,
      (
        SELECT ARRAY_AGG(lu.id::text ORDER BY lu.unidad)
        FROM v2.contratos cc
        JOIN v2.locales lu ON lu.id = cc.local_id
        WHERE cc.inquilino_id = t.id AND cc.estado IN ('activo','critico')
      )                                                  AS all_unit_ids,
      c.fecha_inicio,
      c.fecha_fin,
      c.canon_base::numeric                              AS canon_base,
      c.estado                                           AS contract_status,
      c.descuento_pct::numeric                           AS descuento_pct,
      c.pronto_pago_pct::numeric                         AS pronto_pago_pct,
      c.incremento_ipc::numeric                          AS incremento_ipc,
      c.descripcion_descuentos
    FROM v2.perfiles p
    JOIN v2.inquilinos t ON t.id = p.inquilino_id
    JOIN v2.contratos  c ON c.inquilino_id = t.id AND c.estado IN ('activo','critico')
    JOIN v2.locales    u ON u.id = c.local_id
    WHERE p.id = '${userId}'
    ORDER BY u.unidad
    LIMIT 1
  `)
  const r = rows[0]
  if (!r) return null
  return {
    fullName: String(r.full_name),
    tenantId: String(r.tenant_id),
    companyId: String(r.company_id),
    razonSocial: String(r.razon_social),
    nombreCorto: r.nombre_corto ? String(r.nombre_corto) : null,
    unitNumber: String(r.unit_number),
    unitCode: String(r.unit_code),
    unitId: String(r.unit_id),
    allUnits:    Array.isArray(r.all_units)    ? (r.all_units as string[])    : [String(r.unit_number)],
    allUnitIds:  Array.isArray(r.all_unit_ids) ? (r.all_unit_ids as string[]) : [String(r.unit_id)],
    entrada: r.entrada ? String(r.entrada) : null,
    fechaInicio: String(r.fecha_inicio),
    fechaFin: r.fecha_fin ? String(r.fecha_fin) : null,
    canonBase: Number(r.canon_base),
    contractStatus: String(r.contract_status),
    nit: r.nit ? String(r.nit) : null,
    email: r.email ? String(r.email) : null,
    telefono: r.telefono ? String(r.telefono) : null,
    contactoNombre: r.contacto_nombre ? String(r.contacto_nombre) : null,
    tipoCliente: r.tipo_cliente ? String(r.tipo_cliente) : null,
    tipoPersona: r.tipo_persona ? String(r.tipo_persona) : null,
    descuentoPct: r.descuento_pct != null ? Number(r.descuento_pct) : null,
    prontoPagoPct: r.pronto_pago_pct != null ? Number(r.pronto_pago_pct) : null,
    incrementoIpc: r.incremento_ipc != null ? Number(r.incremento_ipc) : null,
    descripcionDescuentos: r.descripcion_descuentos ? String(r.descripcion_descuentos) : null,
  }
}

function mapPago(r: Record<string, unknown>): PortalPago {
  return {
    id: String(r.id),
    fechaRecaudo: String(r.fecha_recaudo),
    fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
    valorFinal: Number(r.valor_final),
    valorAplicado: Number(r.valor_aplicado),
    concepto: r.cruce ? String(r.cruce) : null,
    diasDesdeFactura: r.dias_desde_factura != null ? Number(r.dias_desde_factura) : null,
  }
}

export async function getPortalPagos(tenantId: string, limit = 5): Promise<PortalPago[]> {
  const rows = await execute(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY fecha_recaudo DESC, docto, cruce)::text AS id,
      fecha_recaudo,
      fecha_factura,
      cruce,
      valor_final::numeric                        AS valor_final,
      valor_aplicado::numeric                     AS valor_aplicado,
      (fecha_recaudo - fecha_factura)             AS dias_desde_factura
    FROM v2.vista_pagos
    WHERE inquilino_id = '${tenantId}'::uuid
    ORDER BY fecha_recaudo DESC
    LIMIT ${limit}
  `)
  return rows.map(mapPago)
}

export type PortalPagosPage = {
  pagos: PortalPago[]
  totalCount: number
}

export async function getPortalPagosPage(
  tenantId: string,
  page: number,
  pageSize = 10,
): Promise<PortalPagosPage> {
  const offset = (page - 1) * pageSize
  const rows = await execute(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY fecha_recaudo DESC, docto, cruce)::text AS id,
      fecha_recaudo,
      fecha_factura,
      cruce,
      valor_final::numeric                        AS valor_final,
      valor_aplicado::numeric                     AS valor_aplicado,
      (fecha_recaudo - fecha_factura)             AS dias_desde_factura,
      COUNT(*) OVER()                             AS total_count
    FROM v2.vista_pagos
    WHERE inquilino_id = '${tenantId}'::uuid
    ORDER BY fecha_recaudo DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `)
  const totalCount = rows[0] ? Number(rows[0].total_count) : 0
  return { pagos: rows.map(mapPago), totalCount }
}

export type PortalPagosKpis = {
  totalPagado: number
  totalCount: number
  enPlazoCount: number
  tardeCount: number
  avgDias: number | null
}

export async function getPortalPagosKpis(tenantId: string): Promise<PortalPagosKpis> {
  const rows = await execute(`
    SELECT
      COUNT(*)                                                                    AS total_count,
      SUM(valor_final)::numeric                                                   AS total_pagado,
      COUNT(*) FILTER (WHERE fecha_recaudo - fecha_factura <= 30)                 AS en_plazo,
      COUNT(*) FILTER (WHERE fecha_recaudo - fecha_factura > 30)                 AS tarde,
      ROUND(AVG(fecha_recaudo - fecha_factura), 1)                                AS avg_dias
    FROM v2.vista_pagos
    WHERE inquilino_id = '${tenantId}'::uuid
  `)
  const r = rows[0] ?? {}
  return {
    totalPagado:  Number(r.total_pagado ?? 0),
    totalCount:   Number(r.total_count ?? 0),
    enPlazoCount: Number(r.en_plazo ?? 0),
    tardeCount:   Number(r.tarde ?? 0),
    avgDias:      r.avg_dias != null ? Number(r.avg_dias) : null,
  }
}

export type PortalMedidorHistoryRow = {
  periodo: string
  kwh: number | null
  lecturaActual: number
  validationStatus: string | null
}

export async function getPortalMedidorHistory(
  unitId: string,
  limit = 6,
): Promise<PortalMedidorHistoryRow[]> {
  const rows = await execute(`
    SELECT
      periodo,
      kwh::numeric            AS kwh,
      lectura_actual::numeric AS lectura_actual,
      estado_validacion       AS validation_status
    FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid
    ORDER BY periodo DESC
    LIMIT ${limit}
  `)
  return rows.map((r) => ({
    periodo: String(r.periodo),
    kwh: r.kwh != null ? Number(r.kwh) : null,
    lecturaActual: Number(r.lectura_actual),
    validationStatus: r.validation_status ? String(r.validation_status) : null,
  }))
}

export type PortalContrato = {
  unidad: string
  entrada: string | null
  canonBase: number
  fechaInicio: string
  fechaFin: string | null
  descuentoPct: number | null
  prontoPagoPct: number | null
  estado: string
}

export async function getPortalContratos(tenantId: string): Promise<PortalContrato[]> {
  const rows = await execute(`
    SELECT
      l.unidad,
      l.entrada,
      COALESCE(ocu.precio, c.canon_base)::numeric      AS canon_base,
      c.fecha_inicio,
      c.fecha_fin,
      COALESCE(ocu.descuento, c.descuento_pct)::numeric   AS descuento_pct,
      COALESCE(ocu.pronto_pago, c.pronto_pago_pct)::numeric AS pronto_pago_pct,
      c.estado
    FROM v2.contratos c
    JOIN v2.locales l ON l.id = c.local_id
    JOIN v2.inquilinos ti ON ti.id = c.inquilino_id
    LEFT JOIN LATERAL (
      SELECT o.precio, o.descuento, o.pronto_pago
      FROM siesa_raw.ocupacion o
      WHERE o.documento = ti.nit
        AND o.loc = l.unidad
        AND o.razon_social IS NOT NULL
        AND COALESCE(o.precio, 0) > 0
      ORDER BY o.precio DESC
      LIMIT 1
    ) ocu ON TRUE
    WHERE c.inquilino_id = '${tenantId}'::uuid
      AND c.estado IN ('activo','critico')
    ORDER BY l.unidad
  `)
  return rows.map((r) => ({
    unidad:        String(r.unidad),
    entrada:       r.entrada ? String(r.entrada) : null,
    canonBase:     Number(r.canon_base),
    fechaInicio:   String(r.fecha_inicio),
    fechaFin:      r.fecha_fin ? String(r.fecha_fin) : null,
    descuentoPct:  r.descuento_pct != null ? Number(r.descuento_pct) : null,
    prontoPagoPct: r.pronto_pago_pct != null ? Number(r.pronto_pago_pct) : null,
    estado:        String(r.estado),
  }))
}

export type PortalCarteraRow = {
  periodo: number
  unidad: string | null
  saldo: number
  vencido: number
  diasMora: number
  diasInterest: number
  fechaVence: string | null
  ventas: number | null
  impuesto: number | null
  retenciones: number | null
}

export type PortalCartera = {
  saldoTotal: number
  facturaCount: number
  vencido: number
  maxDiasMora: number
  maxDiasInterest: number
  interesEstimado: number
  rows: PortalCarteraRow[]
}

const NIT_RE = /^\d{5,12}(-\d)?$/

export async function getPortalCartera(nit: string): Promise<PortalCartera> {
  if (!NIT_RE.test(nit)) return { saldoTotal: 0, facturaCount: 0, vencido: 0, maxDiasMora: 0, maxDiasInterest: 0, interesEstimado: 0, rows: [] }
  const rows = await execute(`
    WITH rate AS (
      SELECT valor::numeric AS r FROM v2.reglas_financieras WHERE clave = 'interes_mora_diario' LIMIT 1
    )
    SELECT
      (EXTRACT(YEAR FROM c.fecha_factura) * 100 + EXTRACT(MONTH FROM c.fecha_factura))::int AS periodo,
      REVERSE(SPLIT_PART(REVERSE(c.sucursal), ' ', 1))                                      AS unidad,
      ROUND(c.saldo)::numeric                                     AS saldo,
      ROUND(c.vr_vencido)::numeric                                AS vencido,
      GREATEST(0, CURRENT_DATE - c.fecha_vence::date)::int        AS dias_mora,
      GREATEST(0, COALESCE(c.financia, 0) - 30)::int              AS dias_interest,
      ROUND(c.vr_vencido * GREATEST(0, COALESCE(c.financia, 0) - 30) * (SELECT r FROM rate))::numeric AS interes_est,
      c.fecha_vence::date                                         AS fecha_vence,
      ROUND(d.ventas)::numeric      AS ventas,
      ROUND(d.impuesto)::numeric    AS impuesto,
      ROUND(d.retenciones)::numeric AS retenciones
    FROM siesa_raw.cartera c
    LEFT JOIN siesa_raw.documentos d
      ON d.documento = '001-' || c.factura
      AND d.tipo = 'Facturas'
    WHERE c.documento = '${nit}'
      AND c.factura LIKE 'FVS-%'
      AND c.saldo > 0
    ORDER BY c.fecha_factura DESC, c.sucursal
  `)
  const mapped: PortalCarteraRow[] = rows.map((r) => ({
    periodo:     Number(r.periodo),
    unidad:      r.unidad ? String(r.unidad) : null,
    saldo:       Number(r.saldo ?? 0),
    vencido:     Number(r.vencido ?? 0),
    diasMora:    Number(r.dias_mora ?? 0),
    diasInterest: Number(r.dias_interest ?? 0),
    fechaVence:  r.fecha_vence ? String(r.fecha_vence) : null,
    ventas:      r.ventas != null ? Number(r.ventas) : null,
    impuesto:    r.impuesto != null ? Number(r.impuesto) : null,
    retenciones: r.retenciones != null ? Number(r.retenciones) : null,
  }))
  return {
    saldoTotal:      mapped.reduce((s, r) => s + r.saldo, 0),
    facturaCount:    mapped.length,
    vencido:         mapped.reduce((s, r) => s + r.vencido, 0),
    maxDiasMora:     mapped.reduce((m, r) => Math.max(m, r.diasMora), 0),
    maxDiasInterest: mapped.reduce((m, r) => Math.max(m, r.diasInterest), 0),
    interesEstimado: rows.reduce((s, r) => s + Number(r.interes_est ?? 0), 0),
    rows:            mapped,
  }
}

export type PortalMedidorRef = {
  lecturaAnteriorRef: number
  tarifaKwh: number
  alreadySubmitted: boolean
}

export async function getPortalMedidorRef(
  unitId: string,
  periodo: string,
): Promise<PortalMedidorRef> {
  const [prevRows, currentRows] = await Promise.all([
    execute(`
      SELECT lectura_actual::numeric AS la, tarifa_kwh::numeric AS tk
      FROM v2.lecturas_medidor
      WHERE local_id = '${unitId}'::uuid AND periodo < '${periodo}'
      ORDER BY periodo DESC LIMIT 1
    `),
    execute(`
      SELECT id FROM v2.lecturas_medidor
      WHERE local_id = '${unitId}'::uuid AND periodo = '${periodo}'
      LIMIT 1
    `),
  ])
  return {
    lecturaAnteriorRef: prevRows[0] ? Number(prevRows[0].la) : 0,
    tarifaKwh:          prevRows[0] ? Number(prevRows[0].tk) : 0,
    alreadySubmitted:   currentRows.length > 0,
  }
}

export async function getPortalMedidorStatus(
  unitId: string,
  periodo: string,
): Promise<PortalMedidorStatus> {
  const rows = await execute(`
    SELECT lectura_actual::numeric AS lectura_actual, periodo, foto_url, foto_drive_id, total_energia::numeric AS total_energia
    FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid AND periodo = '${periodo}'
    LIMIT 1
  `)
  const r = rows[0]
  if (!r) return { lecturaActual: null, periodo: null, fotoUrl: null, fotoDriveId: null, exists: false, totalEnergia: null }
  return {
    lecturaActual: Number(r.lectura_actual),
    periodo: String(r.periodo),
    fotoUrl: r.foto_url ? String(r.foto_url) : null,
    fotoDriveId: r.foto_drive_id ? String(r.foto_drive_id) : null,
    exists: true,
    totalEnergia: r.total_energia != null ? Number(r.total_energia) : null,
  }
}
