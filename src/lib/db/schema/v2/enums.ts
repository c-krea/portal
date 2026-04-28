import { pgSchema } from 'drizzle-orm/pg-core'

export const v2Schema = pgSchema('v2')

export const rolUsuarioEnum = v2Schema.enum('rol_usuario', [
  'admin',
  'finanzas',
  'visor',
  'inquilino',
])

export const estadoLocalEnum = v2Schema.enum('estado_local', [
  'arrendado',
  'disponible',
  'oficina',
  'mantenimiento',
])

export const estadoContratoEnum = v2Schema.enum('estado_contrato', [
  'activo',
  'critico',
  'vencido',
  'terminado',
])

export const categoriaGastoEnum = v2Schema.enum('categoria_gasto', [
  'servicios_publicos',
  'aseo_cafeteria',
  'vigilancia',
  'nomina',
  'publicidad',
  'reparaciones',
  'impuestos',
  'otros',
])

export const metodoAsignacionEnum = v2Schema.enum('metodo_asignacion', [
  'pro_rata',
  'fijo',
  'medido',
  'porcentaje',
])

export const estadoValidacionLecturaEnum = v2Schema.enum('estado_validacion_lectura', [
  'aprobado',
  'revision',
  'critico',
  'pendiente',
])
