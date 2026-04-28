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
  descuentoPct: number | null
  prontoPagoPct: number | null
  gracePeriodDays: number | null
  incrementoIpc: number | null
  descripcionDescuentos: string | null
}

export type PortalPago = {
  id: string
  fechaRecaudo: string
  fechaVencimiento: string | null
  valorFinal: number
  valorAplicado: number
  concepto: string | null
  status: string
  diasDiff: number | null
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
      u.unidad                                           AS unit_number,
      u.codigo                                           AS unit_code,
      u.entrada,
      u.id                                               AS unit_id,
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
    JOIN v2.contratos  c ON c.inquilino_id = t.id AND c.estado = 'activo'
    JOIN v2.locales    u ON u.id = c.local_id
    WHERE p.id = '${userId}'
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
    descuentoPct: r.descuento_pct != null ? Number(r.descuento_pct) : null,
    prontoPagoPct: r.pronto_pago_pct != null ? Number(r.pronto_pago_pct) : null,
    gracePeriodDays: null,
    incrementoIpc: r.incremento_ipc != null ? Number(r.incremento_ipc) : null,
    descripcionDescuentos: r.descripcion_descuentos ? String(r.descripcion_descuentos) : null,
  }
}

function mapPago(r: Record<string, unknown>): PortalPago {
  return {
    id: String(r.id),
    fechaRecaudo: String(r.fecha_recaudo),
    fechaVencimiento: r.fecha_vencimiento ? String(r.fecha_vencimiento) : null,
    valorFinal: Number(r.valor_final),
    valorAplicado: Number(r.valor_aplicado),
    concepto: null,
    status: "RECAUDADO",
    diasDiff: r.dias_diff != null ? Number(r.dias_diff) : null,
  }
}

export async function getPortalPagos(tenantId: string, limit = 5): Promise<PortalPago[]> {
  const rows = await execute(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY fecha_recaudo DESC, docto, cruce)::text AS id,
      fecha_recaudo,
      fecha_vencimiento,
      valor_final::numeric    AS valor_final,
      valor_aplicado::numeric AS valor_aplicado,
      (fecha_recaudo - fecha_vencimiento) AS dias_diff
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
      fecha_vencimiento,
      valor_final::numeric    AS valor_final,
      valor_aplicado::numeric AS valor_aplicado,
      (fecha_recaudo - fecha_vencimiento) AS dias_diff,
      COUNT(*) OVER()         AS total_count
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
  aTiempoCount: number
  tardeCount: number
  avgDiasTarde: number | null
  avgDiasAnticipacion: number | null
}

export async function getPortalPagosKpis(tenantId: string): Promise<PortalPagosKpis> {
  const rows = await execute(`
    SELECT
      COUNT(*)                                                              AS total_count,
      SUM(valor_final)::numeric                                            AS total_pagado,
      COUNT(*) FILTER (WHERE fecha_recaudo <= fecha_vencimiento)           AS a_tiempo,
      COUNT(*) FILTER (WHERE fecha_recaudo > fecha_vencimiento)            AS tarde,
      ROUND(AVG(fecha_recaudo - fecha_vencimiento)
        FILTER (WHERE fecha_recaudo > fecha_vencimiento), 1)               AS avg_dias_tarde,
      ROUND(AVG(fecha_vencimiento - fecha_recaudo)
        FILTER (WHERE fecha_recaudo < fecha_vencimiento), 1)               AS avg_dias_anticipacion
    FROM v2.vista_pagos
    WHERE inquilino_id = '${tenantId}'::uuid
  `)
  const r = rows[0] ?? {}
  return {
    totalPagado:         Number(r.total_pagado ?? 0),
    totalCount:          Number(r.total_count ?? 0),
    aTiempoCount:        Number(r.a_tiempo ?? 0),
    tardeCount:          Number(r.tarde ?? 0),
    avgDiasTarde:        r.avg_dias_tarde != null ? Number(r.avg_dias_tarde) : null,
    avgDiasAnticipacion: r.avg_dias_anticipacion != null ? Number(r.avg_dias_anticipacion) : null,
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
