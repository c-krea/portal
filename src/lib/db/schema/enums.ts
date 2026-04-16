import { pgEnum } from 'drizzle-orm/pg-core'

export const unitStatusEnum = pgEnum('unit_status', ['arrendado', 'disponible', 'oficina', 'mantenimiento'])
export const contractStatusEnum = pgEnum('contract_status', ['activo', 'critico', 'vencido', 'terminado'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['borrador', 'emitida', 'pagada', 'parcial', 'vencida', 'anulada'])
export const paymentStatusEnum = pgEnum('payment_status', ['recaudado', 'no_proyectado', 'vencido', 'parcial', 'anulado'])
export const lineItemTypeEnum = pgEnum('line_item_type', [
  'canon', 'descuento', 'pronto_pago', 'iva', 'retencion', 'interes_mora',
  'gasto_energia', 'gasto_acueducto', 'gasto_aseo', 'gasto_vigilancia',
  'gasto_nomina', 'gasto_publicidad', 'gasto_reparaciones', 'gasto_otros'
])
export const gastoCategoryEnum = pgEnum('gasto_category', [
  'servicios_publicos', 'aseo_cafeteria', 'vigilancia', 'nomina', 'publicidad', 'reparaciones', 'impuestos', 'otros'
])
export const gastoAllocationMethodEnum = pgEnum('gasto_allocation_method', ['pro_rata', 'fixed', 'metered', 'percentage'])
export const syncDirectionEnum = pgEnum('sync_direction', ['pull', 'push'])
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'in_progress', 'success', 'error'])
export const auditActionEnum = pgEnum('audit_action', ['INSERT', 'UPDATE', 'DELETE', 'OVERRIDE', 'WAIVE', 'SYNC'])
export const userRoleEnum = pgEnum('user_role', ['admin', 'finance', 'viewer', 'tenant'])
