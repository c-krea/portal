import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  integer,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  v2Schema,
  rolUsuarioEnum,
  estadoLocalEnum,
  estadoContratoEnum,
  categoriaGastoEnum,
  metodoAsignacionEnum,
  estadoValidacionLecturaEnum,
} from './enums'

export const empresas = v2Schema.table('empresas', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  nombre: text('nombre').notNull(),
  nit: text('nit').notNull().unique(),
  siesaCoId: text('siesa_co_id').notNull(),
  siesaCanalId: text('siesa_canal_id'),
  siesaZona: text('siesa_zona'),
  siesaCcosto: text('siesa_ccosto'),
  activa: boolean('activa').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const perfiles = v2Schema.table('perfiles', {
  id: uuid('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  inquilinoId: uuid('inquilino_id'),
  nombreCompleto: text('nombre_completo').notNull(),
  email: text('email').notNull(),
  rol: rolUsuarioEnum('rol').notNull().default('visor'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const inquilinos = v2Schema.table('inquilinos', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  nit: text('nit').notNull(),
  razonSocial: text('razon_social').notNull(),
  nombreCorto: text('nombre_corto'),
  tipoCliente: text('tipo_cliente'),
  condicionPago: text('condicion_pago'),
  juridica: boolean('juridica').notNull().default(false),
  portalEmail: text('portal_email'),
  contactoNombre: text('contacto_nombre'),
  telefono: text('telefono'),
  emailContacto: text('email_contacto'),
  ppHistoricoPct: numeric('pp_historico_pct'),
  ppHistoricoPagos: integer('pp_historico_pagos').notNull().default(0),
  notas: text('notas'),
  activo: boolean('activo').notNull().default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  empresaNitUnique: unique().on(t.empresaId, t.nit),
}))

export const locales = v2Schema.table('locales', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  unidad: text('unidad').notNull(),
  codigo: text('codigo').notNull(),
  entrada: text('entrada').notNull(),
  clasificacion: text('clasificacion'),
  areaM2: numeric('area_m2', { precision: 10, scale: 2 }),
  grupoEnergia: text('grupo_energia'),
  tieneMedidor: boolean('tiene_medidor').notNull().default(false),
  facturaConsecutivo: integer('factura_consecutivo'),
  notas: text('notas'),
  estado: estadoLocalEnum('estado').notNull().default('disponible'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  empresaCodigoUnique: unique().on(t.empresaId, t.codigo),
}))

export const contratos = v2Schema.table('contratos', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  inquilinoId: uuid('inquilino_id').notNull().references(() => inquilinos.id),
  localId: uuid('local_id').notNull().references(() => locales.id),
  fechaInicio: date('fecha_inicio').notNull(),
  listaPrecios: text('lista_precios'),
  canonBase: numeric('canon_base').notNull(),
  descuentoPct: numeric('descuento_pct').notNull().default('0'),
  prontoPagoPct: numeric('pronto_pago_pct').notNull().default('0'),
  flagUno: boolean('flag_uno').notNull().default(false),
  flagOnce: boolean('flag_once').notNull().default(false),
  flagVeintiuno: boolean('flag_veintiuno').notNull().default(false),
  flagCritico: boolean('flag_critico').notNull().default(false),
  fechaFin: date('fecha_fin'),
  incrementoIpc: numeric('incremento_ipc').default('0'),
  fechaIncrementoIpc: date('fecha_incremento_ipc'),
  descripcionDescuentos: text('descripcion_descuentos'),
  estado: estadoContratoEnum('estado').notNull().default('activo'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const proyecciones = v2Schema.table('proyecciones', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  contratoId: uuid('contrato_id').references(() => contratos.id),
  localId: uuid('local_id').notNull().references(() => locales.id),
  anio: integer('anio').notNull(),
  mes: integer('mes').notNull(),
  canonProyectado: numeric('canon_proyectado').notNull(),
  descuentoProyectado: numeric('descuento_proyectado').notNull().default('0'),
  notas: text('notas'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  localPeriodoUnique: unique().on(t.localId, t.anio, t.mes),
}))

export const lecturasMedidor = v2Schema.table('lecturas_medidor', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  localId: uuid('local_id').notNull().references(() => locales.id),
  periodo: text('periodo').notNull(),
  lecturaAnterior: numeric('lectura_anterior').notNull(),
  lecturaActual: numeric('lectura_actual').notNull(),
  kwh: numeric('kwh').notNull(),
  tarifaKwh: numeric('tarifa_kwh').notNull(),
  totalEnergia: numeric('total_energia').notNull(),
  fotoUrl: text('foto_url'),
  fotoDriveId: text('foto_drive_id'),
  notas: text('notas'),
  submittedBy: uuid('submitted_by').references(() => perfiles.id),
  estadoValidacion: estadoValidacionLecturaEnum('estado_validacion').notNull().default('pendiente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  localPeriodoUnique: unique().on(t.localId, t.periodo),
}))

export const facturasEnergia = v2Schema.table('facturas_energia', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  periodo: text('periodo').notNull(),
  grupoEnergia: text('grupo_energia').notNull(),
  direccion: text('direccion').notNull(),
  proveedor: text('proveedor').notNull(),
  fechaFactura: date('fecha_factura'),
  valorFactura: numeric('valor_factura').notNull(),
  kwhFactura: numeric('kwh_factura').notNull(),
  tarifaKwh: numeric('tarifa_kwh').notNull(),
  notas: text('notas'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  empresaPeriodoGrupoUnique: unique().on(t.empresaId, t.periodo, t.grupoEnergia),
}))

export const tiposGasto = v2Schema.table('tipos_gasto', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  categoria: categoriaGastoEnum('categoria').notNull(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  metodoAsignacion: metodoAsignacionEnum('metodo_asignacion').notNull().default('pro_rata'),
  esFacturable: boolean('es_facturable').notNull().default(false),
  siesaCuenta: text('siesa_cuenta'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gastos = v2Schema.table('gastos', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  tipoGastoId: uuid('tipo_gasto_id').notNull().references(() => tiposGasto.id),
  periodo: text('periodo').notNull(),
  montoTotal: numeric('monto_total').notNull(),
  descripcion: text('descripcion'),
  observacion: text('observacion'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reglasFinancieras = v2Schema.table('reglas_financieras', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  clave: text('clave').notNull(),
  valor: numeric('valor').notNull(),
  descripcion: text('descripcion'),
  fechaDesde: date('fecha_desde').notNull().defaultNow(),
  fechaHasta: date('fecha_hasta'),
  creadoPor: uuid('creado_por').references(() => perfiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const agenteChat = v2Schema.table('agente_chat', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: text('user_id').notNull(),
  rol: text('rol').notNull(),
  contenido: text('contenido').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
