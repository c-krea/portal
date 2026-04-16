import { execute } from "@/lib/db/executor"

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

export async function getTenantDetail(tenantId: string): Promise<TenantDetail | null> {
  const rows = await execute(`
    SELECT
      t.id, t.razon_social, t.nombre_corto, t.nit,
      t.email, t.telefono, t.contacto_nombre, t.condicion_pago,
      c.id                                           AS contract_id,
      c.status                                       AS contract_status,
      c.fecha_inicio, c.fecha_fin,
      COALESCE(c.canon_base, 0)::numeric             AS canon_base,
      COALESCE(c.descuento_pct, 0)::numeric          AS descuento_pct,
      COALESCE(c.pronto_pago_pct, 0)::numeric        AS pronto_pago_pct,
      c.descripcion_descuentos,
      u.unit_number, u.entrada,
      u.area_m2::numeric                             AS area_m2,
      u.clasificacion
    FROM tenants t
    LEFT JOIN contracts c
      ON c.tenant_id = t.id
      AND c.status IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN units u ON c.unit_id = u.id
    WHERE t.id = '${tenantId}'
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

export async function getTenantCartera(tenantId: string): Promise<CarteraItem[]> {
  const rows = await execute(`
    SELECT
      id, siesa_factura, fecha_factura, fecha_vence,
      COALESCE(dias_mora, 0)                      AS dias_mora,
      COALESCE(saldo, 0)::numeric                 AS saldo,
      COALESCE(valor_vencido, 0)::numeric         AS valor_vencido,
      COALESCE(interes_acumulado, 0)::numeric     AS interes_acumulado,
      observacion
    FROM cartera
    WHERE tenant_id = '${tenantId}'
    ORDER BY fecha_vence DESC NULLS LAST
  `)
  return rows.map((r) => ({
    id: String(r.id),
    siesaFactura: r.siesa_factura ? String(r.siesa_factura) : null,
    fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
    fechaVence: r.fecha_vence ? String(r.fecha_vence) : null,
    diasMora: Number(r.dias_mora ?? 0),
    saldo: Number(r.saldo ?? 0),
    valorVencido: Number(r.valor_vencido ?? 0),
    interesAcumulado: Number(r.interes_acumulado ?? 0),
    observacion: r.observacion ? String(r.observacion) : null,
  }))
}

export async function getTenantPayments(tenantId: string): Promise<PagoHistorialItem[]> {
  const rows = await execute(`
    SELECT
      id, fecha_recaudo,
      COALESCE(valor_aplicado, 0)::numeric        AS valor_aplicado,
      COALESCE(pronto_pago_aplicado, 0)::numeric  AS pronto_pago_aplicado,
      COALESCE(valor_final, 0)::numeric           AS valor_final,
      concepto, siesa_docto, siesa_cruce, siesa_clasificacion, status
    FROM payments
    WHERE tenant_id = '${tenantId}'
    ORDER BY fecha_recaudo DESC
    LIMIT 50
  `)
  return rows.map((r) => ({
    id: String(r.id),
    fechaRecaudo: String(r.fecha_recaudo),
    valorAplicado: Number(r.valor_aplicado ?? 0),
    prontoPagoAplicado: Number(r.pronto_pago_aplicado ?? 0),
    valorFinal: Number(r.valor_final ?? 0),
    concepto: r.concepto ? String(r.concepto) : null,
    siesaDocto: r.siesa_docto ? String(r.siesa_docto) : null,
    siesaCruce: r.siesa_cruce ? String(r.siesa_cruce) : null,
    siesaClasificacion: r.siesa_clasificacion ? String(r.siesa_clasificacion) : null,
    status: String(r.status),
  }))
}

export async function getContractPhases(contractId: string): Promise<ContractPhaseItem[]> {
  const rows = await execute(`
    SELECT
      id, phase_number, name, start_date, end_date,
      COALESCE(descuento_pct, 0)::numeric    AS descuento_pct,
      COALESCE(pronto_pago_pct, 0)::numeric  AS pronto_pago_pct,
      is_active
    FROM contract_phases
    WHERE contract_id = '${contractId}'
    ORDER BY phase_number
  `)
  return rows.map((r) => ({
    id: String(r.id),
    phaseNumber: Number(r.phase_number),
    name: String(r.name),
    startDate: String(r.start_date),
    endDate: r.end_date ? String(r.end_date) : null,
    descuentoPct: Number(r.descuento_pct ?? 0),
    prontoPagoPct: Number(r.pronto_pago_pct ?? 0),
    isActive: Boolean(r.is_active),
  }))
}
