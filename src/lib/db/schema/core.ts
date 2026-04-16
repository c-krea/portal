import {
  pgTable, uuid, text, boolean, timestamp, date, numeric, integer, inet, jsonb, index, uniqueIndex
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import {
  unitStatusEnum, contractStatusEnum, invoiceStatusEnum, paymentStatusEnum,
  lineItemTypeEnum, gastoCategoryEnum, gastoAllocationMethodEnum,
  syncDirectionEnum, syncStatusEnum, auditActionEnum, userRoleEnum
} from './enums'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

// 1. COMPANIES
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: text('name').notNull(),
  nit: text('nit').unique().notNull(),
  siesaCoId: text('siesa_co_id').notNull(),
  siesaCcosto: text('siesa_ccosto'),
  siesaCanalId: text('siesa_canal_id'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

// 2. PROFILES (extends Supabase auth.users)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  tenantId: uuid('tenant_id'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

// 3. TENANTS
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  nit: text('nit').notNull(),
  razonSocial: text('razon_social').notNull(),
  nombreCorto: text('nombre_corto'),
  tipoCliente: text('tipo_cliente'),
  condicionPago: text('condicion_pago'),
  email: text('email'),
  telefono: text('telefono'),
  contactoNombre: text('contacto_nombre'),
  siesaRowId: text('siesa_row_id'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex('tenants_company_nit_idx').on(t.companyId, t.nit)])

// 4. UNITS
export const units = pgTable('units', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  unitNumber: text('unit_number').notNull(),
  unitCode: text('unit_code').notNull(),
  entrada: text('entrada').notNull(),
  clasificacion: text('clasificacion'),
  facturaConsecutivo: integer('factura_consecutivo'),
  status: unitStatusEnum('status').notNull().default('disponible'),
  areaM2: numeric('area_m2', { precision: 10, scale: 2 }),
  hasElectricityMeter: boolean('has_electricity_meter').notNull().default(false),
  notes: text('notes'),
  ...timestamps,
}, (t) => [uniqueIndex('units_company_number_idx').on(t.companyId, t.unitNumber)])

// 5. CONTRACTS
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  fechaInicio: date('fecha_inicio').notNull(),
  fechaFin: date('fecha_fin'),
  listaPrecios: text('lista_precios'),
  canonBase: numeric('canon_base', { precision: 15, scale: 2 }).notNull(),
  incrementoIpc: numeric('incremento_ipc', { precision: 15, scale: 2 }).default('0'),
  fechaIncrementoIpc: date('fecha_incremento_ipc'),
  descuentoPct: numeric('descuento_pct', { precision: 5, scale: 2 }).default('0'),
  prontoPagoPct: numeric('pronto_pago_pct', { precision: 5, scale: 2 }).default('0'),
  interesesMoraRate: numeric('interes_mora_rate', { precision: 8, scale: 6 }),
  gracePeriodDays: integer('grace_period_days').default(0),
  status: contractStatusEnum('status').notNull().default('activo'),
  descripcionDescuentos: text('descripcion_descuentos'),
  flagUno: boolean('flag_uno').default(false),
  flagOnce: boolean('flag_once').default(false),
  flagVeintiuno: boolean('flag_veintiuno').default(false),
  flagCritico: boolean('flag_critico').default(false),
  ...timestamps,
})

// 6. CONTRACT PHASES
export const contractPhases = pgTable('contract_phases', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  phaseNumber: integer('phase_number').notNull(),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  descuentoPct: numeric('descuento_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  prontoPagoPct: numeric('pronto_pago_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex('contract_phases_contract_phase_idx').on(t.contractId, t.phaseNumber)])

// 7. FINANCIAL RULES
export const financialRules = pgTable('financial_rules', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  ruleKey: text('rule_key').notNull(),
  ruleValue: numeric('rule_value', { precision: 15, scale: 6 }).notNull(),
  description: text('description'),
  effectiveFrom: date('effective_from').notNull().default(sql`CURRENT_DATE`),
  effectiveUntil: date('effective_until'),
  createdBy: uuid('created_by').references(() => profiles.id),
  ...timestamps,
})

// 8. INVOICES
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  contractId: uuid('contract_id').notNull().references(() => contracts.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  siesaDocumento: text('siesa_documento'),
  siesaPeriodo: text('siesa_periodo'),
  siesaAuxiliar: text('siesa_auxiliar'),
  siesaTipo: text('siesa_tipo'),
  fechaEmision: date('fecha_emision').notNull(),
  fechaVencimiento: date('fecha_vencimiento').notNull(),
  fechaProntoPago: date('fecha_pronto_pago'),
  periodo: text('periodo').notNull(),
  subtotalCanon: numeric('subtotal_canon', { precision: 15, scale: 2 }).notNull().default('0'),
  subtotalDescuentos: numeric('subtotal_descuentos', { precision: 15, scale: 2 }).notNull().default('0'),
  subtotalProntoPago: numeric('subtotal_pronto_pago', { precision: 15, scale: 2 }).notNull().default('0'),
  subtotalGastos: numeric('subtotal_gastos', { precision: 15, scale: 2 }).notNull().default('0'),
  subtotalInteres: numeric('subtotal_interes', { precision: 15, scale: 2 }).notNull().default('0'),
  iva: numeric('iva', { precision: 15, scale: 2 }).notNull().default('0'),
  retenciones: numeric('retenciones', { precision: 15, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 15, scale: 2 }).notNull().default('0'),
  saldo: numeric('saldo', { precision: 15, scale: 2 }).notNull().default('0'),
  status: invoiceStatusEnum('status').notNull().default('borrador'),
  notes: text('notes'),
  ...timestamps,
}, (t) => [
  index('invoices_periodo_idx').on(t.periodo),
  index('invoices_tenant_idx').on(t.tenantId),
  index('invoices_status_idx').on(t.status),
  index('invoices_siesa_doc_idx').on(t.siesaDocumento),
])

// 9. INVOICE LINE ITEMS
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  type: lineItemTypeEnum('type').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).default('0'),
  siesaCuenta: text('siesa_cuenta'),
  referenceId: uuid('reference_id'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('line_items_invoice_idx').on(t.invoiceId),
  index('line_items_type_idx').on(t.type),
])

// 10. PAYMENTS
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  siesaDocto: text('siesa_docto'),
  siesaCruce: text('siesa_cruce'),
  siesaClasificacion: text('siesa_clasificacion'),
  fechaRecaudo: date('fecha_recaudo').notNull(),
  fechaProntoPago: date('fecha_pronto_pago'),
  fechaVencimiento: date('fecha_vencimiento'),
  fechaFactura: date('fecha_factura'),
  valorAplicado: numeric('valor_aplicado', { precision: 15, scale: 2 }).notNull(),
  prontoPagoAplicado: numeric('pronto_pago_aplicado', { precision: 15, scale: 2 }).default('0'),
  valorFinal: numeric('valor_final', { precision: 15, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('recaudado'),
  concepto: text('concepto'),
  notes: text('notes'),
  ...timestamps,
}, (t) => [
  index('payments_tenant_idx').on(t.tenantId),
  index('payments_fecha_idx').on(t.fechaRecaudo),
  index('payments_siesa_docto_idx').on(t.siesaDocto),
])

// 11. PAYMENT APPLICATIONS
export const paymentApplications = pgTable('payment_applications', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  amountApplied: numeric('amount_applied', { precision: 15, scale: 2 }).notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('pay_app_payment_idx').on(t.paymentId),
  index('pay_app_invoice_idx').on(t.invoiceId),
])

// 12. INTEREST ACCRUALS
export const interestAccruals = pgTable('interest_accruals', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  contractId: uuid('contract_id').notNull().references(() => contracts.id),
  accrualDate: date('accrual_date').notNull(),
  daysOverdue: integer('days_overdue').notNull(),
  overdueBalance: numeric('overdue_balance', { precision: 15, scale: 2 }).notNull(),
  dailyRate: numeric('daily_rate', { precision: 10, scale: 8 }).notNull(),
  interestAmount: numeric('interest_amount', { precision: 15, scale: 2 }).notNull(),
  cumulativeInterest: numeric('cumulative_interest', { precision: 15, scale: 2 }).notNull(),
  isWaived: boolean('is_waived').notNull().default(false),
  waivedBy: uuid('waived_by').references(() => profiles.id),
  waivedReason: text('waived_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('interest_invoice_idx').on(t.invoiceId),
  index('interest_date_idx').on(t.accrualDate),
])

// 13. CARTERA
export const cartera = pgTable('cartera', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  siesaRowId: text('siesa_row_id'),
  siesaFactura: text('siesa_factura'),
  siesaSucursal: text('siesa_sucursal'),
  observacion: text('observacion'),
  fechaFactura: date('fecha_factura'),
  fechaProntoPago: date('fecha_pronto_pago'),
  fechaVence: date('fecha_vence'),
  diasMora: integer('dias_mora'),
  diasFinancia: integer('dias_financia'),
  saldo: numeric('saldo', { precision: 15, scale: 2 }).notNull(),
  valorVencido: numeric('valor_vencido', { precision: 15, scale: 2 }),
  interesAcumulado: numeric('interes_acumulado', { precision: 15, scale: 2 }).default('0'),
  gastosPendientes: numeric('gastos_pendientes', { precision: 15, scale: 2 }).default('0'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [
  index('cartera_tenant_idx').on(t.tenantId),
  index('cartera_dias_idx').on(t.diasMora),
])

// 14. GASTO TYPES
export const gastoTypes = pgTable('gasto_types', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  category: gastoCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  allocationMethod: gastoAllocationMethodEnum('allocation_method').notNull().default('pro_rata'),
  isBillable: boolean('is_billable').notNull().default(true),
  siesaCuenta: text('siesa_cuenta'),
  ...timestamps,
}, (t) => [uniqueIndex('gasto_types_company_name_idx').on(t.companyId, t.name)])

// 15. GASTOS
export const gastos = pgTable('gastos', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  gastoTypeId: uuid('gasto_type_id').notNull().references(() => gastoTypes.id),
  periodo: text('periodo').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  observacion: text('observacion'),
  isAllocated: boolean('is_allocated').notNull().default(false),
  allocatedAt: timestamp('allocated_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [index('gastos_periodo_idx').on(t.periodo)])

// 16. GASTO ALLOCATIONS
export const gastoAllocations = pgTable('gasto_allocations', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  gastoId: uuid('gasto_id').notNull().references(() => gastos.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  allocationMethod: gastoAllocationMethodEnum('allocation_method').notNull(),
  allocationBasis: text('allocation_basis'),
  meterReading: numeric('meter_reading', { precision: 15, scale: 2 }),
  siesaCruce: text('siesa_cruce'),
  siesaRk: text('siesa_rk'),
  isBilled: boolean('is_billed').notNull().default(false),
  isPaid: boolean('is_paid').notNull().default(false),
  ...timestamps,
}, (t) => [
  index('gasto_alloc_tenant_idx').on(t.tenantId),
  index('gasto_alloc_gasto_idx').on(t.gastoId),
])

// 17. PROJECTIONS
export const projections = pgTable('projections', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  canonProyectado: numeric('canon_proyectado', { precision: 15, scale: 2 }).notNull().default('0'),
  descuentoProyectado: numeric('descuento_proyectado', { precision: 15, scale: 2 }).notNull().default('0'),
  prontoPagoProyectado: numeric('pronto_pago_proyectado', { precision: 15, scale: 2 }).notNull().default('0'),
  ...timestamps,
}, (t) => [uniqueIndex('projections_unit_year_month_idx').on(t.unitId, t.year, t.month)])

// 18. ACCOUNTING ENTRIES
export const accountingEntries = pgTable('accounting_entries', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  siesaDocumento: text('siesa_documento').notNull(),
  notas: text('notas'),
  cuenta: text('cuenta').notNull(),
  descCuenta: text('desc_cuenta'),
  co: text('co'),
  ccosto: text('ccosto'),
  descCcosto: text('desc_ccosto'),
  periodo: text('periodo').notNull(),
  valor: numeric('valor', { precision: 15, scale: 2 }).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('acct_entries_periodo_idx').on(t.periodo),
  index('acct_entries_cuenta_idx').on(t.cuenta),
])

// 19. SIESA SYNC LOG
export const siesaSyncLog = pgTable('siesa_sync_log', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  direction: syncDirectionEnum('direction').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  siesaDocumentRef: text('siesa_document_ref'),
  status: syncStatusEnum('status').notNull().default('pending'),
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('sync_status_idx').on(t.status),
  index('sync_entity_idx').on(t.entityType, t.entityId),
])

// 20. AUDIT LOG
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').references(() => profiles.id),
  action: auditActionEnum('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  reason: text('reason'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('audit_entity_idx').on(t.entityType, t.entityId),
  index('audit_user_idx').on(t.userId),
  index('audit_created_idx').on(t.createdAt),
])

// 22. METER READINGS
export const meterReadings = pgTable('meter_readings', {
  id:              uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId:       uuid('company_id').notNull().references(() => companies.id),
  unitId:          uuid('unit_id').notNull().references(() => units.id),
  periodo:         text('periodo').notNull(),
  lecturaAnterior: numeric('lectura_anterior', { precision: 15, scale: 2 }).notNull().default('0'),
  lecturaActual:   numeric('lectura_actual',   { precision: 15, scale: 2 }).notNull(),
  kwh:             numeric('kwh',              { precision: 15, scale: 2 }).notNull(),
  tarifaKwh:       numeric('tarifa_kwh',       { precision: 15, scale: 2 }).notNull(),
  totalEnergia:    numeric('total_energia',    { precision: 15, scale: 2 }).notNull(),
  notas:           text('notas'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('meter_readings_unit_period_idx').on(t.unitId, t.periodo)])

// 21. NOTIFICATIONS
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  userId: uuid('user_id').references(() => profiles.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  referenceType: text('reference_type'),
  referenceId: uuid('reference_id'),
  isRead: boolean('is_read').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  channel: text('channel'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('notifications_user_idx').on(t.userId, t.isRead)])
