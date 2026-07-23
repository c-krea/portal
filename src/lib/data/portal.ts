import { execute } from "@/lib/db/executor"
import { cached } from "@/lib/cache"
import { assertUuid, assertPeriodo } from "@/lib/security/validators"
import { ELECTRICITY_GROUPS } from "@/lib/data/electricity"

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

async function getPortalProfile_uncached(userId: string): Promise<PortalProfile | null> {
  assertUuid(userId)
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
    WHERE p.id = '${userId}'::uuid
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

async function getPortalPagos_uncached(tenantId: string, limit = 5): Promise<PortalPago[]> {
  assertUuid(tenantId)
  const rawLimit = Number(limit)
  const safeLimit = Math.max(1, Math.min(50, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 5))
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
    LIMIT ${safeLimit}
  `)
  return rows.map(mapPago)
}

export type PortalPagosPage = {
  pagos: PortalPago[]
  totalCount: number
}

async function getPortalPagosPage_uncached(
  tenantId: string,
  page: number,
  pageSize = 10,
): Promise<PortalPagosPage> {
  assertUuid(tenantId)
  const rawPage     = Number(page)
  const rawPageSize = Number(pageSize)
  const safePage     = Math.max(1, Math.min(10_000, Number.isFinite(rawPage)     ? Math.floor(rawPage)     : 1))
  const safePageSize = Math.max(1, Math.min(100,    Number.isFinite(rawPageSize) ? Math.floor(rawPageSize) : 10))
  const offset       = (safePage - 1) * safePageSize
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
    LIMIT ${safePageSize} OFFSET ${offset}
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

async function getPortalPagosKpis_uncached(tenantId: string): Promise<PortalPagosKpis> {
  assertUuid(tenantId)
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

async function getPortalMedidorHistory_uncached(
  unitId: string,
  limit = 6,
): Promise<PortalMedidorHistoryRow[]> {
  assertUuid(unitId)
  const rawLimit = Number(limit)
  const safeLimit = Math.max(1, Math.min(24, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 6))
  const rows = await execute(`
    SELECT
      periodo,
      kwh::numeric            AS kwh,
      lectura_actual::numeric AS lectura_actual,
      estado_validacion       AS validation_status
    FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid
    ORDER BY periodo DESC
    LIMIT ${safeLimit}
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

async function getPortalContratos_uncached(tenantId: string): Promise<PortalContrato[]> {
  assertUuid(tenantId)
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
      ORDER BY o.ingreso DESC NULLS LAST
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
  fechaFactura: string | null
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

async function getPortalCartera_uncached(nit: string): Promise<PortalCartera> {
  if (!NIT_RE.test(nit)) return { saldoTotal: 0, facturaCount: 0, vencido: 0, maxDiasMora: 0, maxDiasInterest: 0, interesEstimado: 0, rows: [] }
  // Interest uses the SAME DIAN method as the admin Mora page (see mora.ts):
  // vr_vencido × (tasa DIAN del mes ÷ 366) × días vencidos, counted from the
  // effective due date (fecha_vence, or factura+30 for the old ERP fecha_vence bug).
  const rows = await execute(`
    WITH rate AS (
      SELECT COALESCE(
        (SELECT tasa_ea FROM v2.tasa_interes_mora WHERE periodo = to_char(CURRENT_DATE,'YYYY-MM') LIMIT 1),
        0
      ) / 366 AS r
    ),
    base AS (
      SELECT
        (EXTRACT(YEAR FROM c.fecha_factura) * 100 + EXTRACT(MONTH FROM c.fecha_factura))::int AS periodo,
        REVERSE(SPLIT_PART(REVERSE(c.sucursal), ' ', 1))                                      AS unidad,
        ROUND(c.saldo)::numeric                                     AS saldo,
        ROUND(c.vr_vencido)::numeric                                AS vencido,
        c.vr_vencido                                                AS vr_vencido_raw,
        CASE WHEN c.fecha_vence::date >= c.fecha_factura::date + 25
             THEN c.fecha_vence::date
             ELSE c.fecha_factura::date + 30 END                    AS venc_efec,
        c.fecha_vence::date                                         AS fecha_vence,
        c.fecha_factura::date                                       AS fecha_factura,
        ROUND(d.ventas)::numeric      AS ventas,
        ROUND(d.impuesto)::numeric    AS impuesto,
        ROUND(d.retenciones)::numeric AS retenciones
      FROM siesa_raw.cartera c
      LEFT JOIN siesa_raw.documentos d
        ON d.documento = '001-' || c.factura
        AND d.tipo = 'Facturas'
      WHERE c.documento = '${nit}'
        AND c.factura LIKE 'FVS-%'
        AND c.id_zona = 'Z40'
        AND c.saldo > 0
    )
    SELECT
      periodo, unidad, saldo, vencido,
      GREATEST(0, CURRENT_DATE - venc_efec)::int  AS dias_mora,
      GREATEST(0, CURRENT_DATE - venc_efec)::int  AS dias_interest,
      ROUND(vr_vencido_raw * (SELECT r FROM rate) * GREATEST(0, CURRENT_DATE - venc_efec))::numeric AS interes_est,
      fecha_factura, fecha_vence, ventas, impuesto, retenciones
    FROM base
    ORDER BY fecha_factura DESC, unidad
  `)
  const mapped: PortalCarteraRow[] = rows.map((r) => ({
    periodo:     Number(r.periodo),
    unidad:      r.unidad ? String(r.unidad) : null,
    saldo:       Number(r.saldo ?? 0),
    vencido:     Number(r.vencido ?? 0),
    diasMora:    Number(r.dias_mora ?? 0),
    diasInterest: Number(r.dias_interest ?? 0),
    fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
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

export type SyncFreshness = {
  lastPush: string | null
  hoursStale: number
  isStale: boolean
}

// Siesa pushes into siesa_raw every ~3h. When the newest push is over a day old
// the ERP feed is stuck: cartera/recaudo are frozen while interest above is still
// counted against CURRENT_DATE, so a tenant who paid after the freeze is shown as
// overdue with a charge that grows daily. The portal hides mora/interés while true.
const SYNC_STALE_HOURS = 24

async function getSyncFreshness_uncached(): Promise<SyncFreshness> {
  const rows = await execute(`
    SELECT
      (MAX(siesa_synced_at) AT TIME ZONE 'America/Bogota')::date::text AS last_push,
      EXTRACT(EPOCH FROM (now() - MAX(siesa_synced_at))) / 3600        AS hours
    FROM siesa_raw.cartera
    WHERE id_zona = 'Z40'
  `)
  const r = rows[0] as Record<string, unknown> | undefined
  const lastPush = r?.last_push ? String(r.last_push) : null
  const hoursStale = r?.hours != null ? Number(r.hours) : 0
  return {
    lastPush,
    hoursStale,
    // No rows → no claim. Only flag stale on a real timestamp we can point at.
    isStale: lastPush !== null && hoursStale > SYNC_STALE_HOURS,
  }
}

export type PortalMedidorRef = {
  lecturaAnteriorRef: number
  tarifaKwh: number
  alreadySubmitted: boolean
}

async function getPortalMedidorRef_uncached(
  unitId: string,
  periodo: string,
): Promise<PortalMedidorRef> {
  assertUuid(unitId)
  assertPeriodo(periodo)
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

async function getPortalMedidorStatus_uncached(
  unitId: string,
  periodo: string,
): Promise<PortalMedidorStatus> {
  assertUuid(unitId)
  assertPeriodo(periodo)
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

// ── Electricity invoice data ─────────────────────────────────────────────────

export type PortalElectricityInvoiceData = {
  unidad: string
  proveedor: string
  proveedorNit: string
  contrato: string
  periodoLabel: string  // "1 al 31 de mayo de 2026"
  periodoKey: string    // "2026-05"
  consumoKwh: number
  tarifaKwh: number
  direccion: string
  total: number
  invoiceNumber: string // "001", "002" — sequential per unit from 2026-03
}

function periodoToSpanish(periodo: string): string {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const monthName = date.toLocaleDateString("es-CO", { month: "long" })
  return `1 al ${lastDay} de ${monthName} de ${year}`
}

async function getPortalElectricityInvoiceData_uncached(
  unitId: string,
  periodo: string,
): Promise<PortalElectricityInvoiceData | null> {
  assertUuid(unitId)
  assertPeriodo(periodo)

  const rows = await execute(`
    SELECT
      lm.kwh::numeric            AS kwh,
      lm.total_energia::numeric  AS total_energia,
      u.grupo_energia,
      u.unidad,
      COALESCE(fe.tarifa_kwh, lm.tarifa_kwh)::numeric AS tarifa_kwh,
      (
        SELECT COUNT(*)::int
        FROM v2.lecturas_medidor seq
        WHERE seq.local_id = lm.local_id
          AND seq.kwh IS NOT NULL AND seq.kwh > 0
          AND seq.periodo >= '2026-03'
          AND seq.periodo <= lm.periodo
      ) AS invoice_seq
    FROM v2.lecturas_medidor lm
    JOIN v2.locales u ON u.id = lm.local_id
    LEFT JOIN v2.facturas_energia fe
      ON fe.grupo_energia = u.grupo_energia AND fe.periodo = lm.periodo
    WHERE lm.local_id = '${unitId}'::uuid AND lm.periodo = '${periodo}'
    LIMIT 1
  `)

  const r = rows[0]
  if (!r) return null

  const grupo = String(r.grupo_energia ?? "")
  const meta  = ELECTRICITY_GROUPS.find(g => g.group === grupo)
  if (!meta) return null

  const kwh    = Number(r.kwh)
  const tarifa = Number(r.tarifa_kwh)
  const total  = r.total_energia != null
    ? Number(r.total_energia)
    : Math.round(kwh * tarifa)

  const seq = Number(r.invoice_seq ?? 1)

  return {
    unidad:        String(r.unidad),
    proveedor:     meta.proveedorFullName,
    proveedorNit:  meta.proveedorNit,
    contrato:      meta.contratoDisplay,
    periodoLabel:  periodoToSpanish(periodo),
    periodoKey:    periodo,
    consumoKwh:    kwh,
    tarifaKwh:     tarifa,
    invoiceNumber: String(seq).padStart(3, '0'),
    direccion:    meta.direccion,
    total,
  }
}

async function getPortalElectricityPeriodos_uncached(
  unitId: string,
): Promise<string[]> {
  assertUuid(unitId)

  const rows = await execute(`
    SELECT periodo
    FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid
      AND kwh IS NOT NULL
      AND kwh > 0
      AND periodo >= '2026-03'
    ORDER BY periodo DESC
  `)

  return (rows as Record<string, unknown>[]).map(r => String(r.periodo))
}

// ── cached exports (auto)
export const getPortalProfile = cached(getPortalProfile_uncached, ["portal:profile"], "portal")
export const getPortalPagos = cached(getPortalPagos_uncached, ["portal:pagos"], "portal")
export const getPortalPagosPage = cached(getPortalPagosPage_uncached, ["portal:pagosPage"], "portal")
export const getPortalPagosKpis = cached(getPortalPagosKpis_uncached, ["portal:pagosKpis"], "portal")
export const getPortalMedidorHistory = cached(getPortalMedidorHistory_uncached, ["portal:medidorHistory"], "portal")
export const getPortalContratos = cached(getPortalContratos_uncached, ["portal:contratos"], "portal")
export const getPortalCartera = cached(getPortalCartera_uncached, ["portal:cartera"], "portal")
export const getSyncFreshness = cached(getSyncFreshness_uncached, ["portal:syncFreshness"], "portal")
export const getPortalMedidorRef = cached(getPortalMedidorRef_uncached, ["portal:medidorRef"], "portal")
export const getPortalMedidorStatus = cached(getPortalMedidorStatus_uncached, ["portal:medidorStatus"], "portal")
export const getPortalElectricityInvoiceData = cached(getPortalElectricityInvoiceData_uncached, ["portal:elecInvoice"], "portal")
export const getPortalElectricityPeriodos = cached(getPortalElectricityPeriodos_uncached, ["portal:elecPeriodos"], "portal")
