// Cuentas de cobro: entered by hand on the Resumen, per month (ejecutado + proyectado),
// with a change history (who, when, before → after). Migration 20261124130000.

import { execute, executeDml, sqlStr } from "@/lib/db/executor"
import { cached } from "@/lib/cache"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { assertPeriodo, assertUuid } from "@/lib/security/validators"

export type CuentasCobro = { ejecutado: number; proyectado: number }

export type CuentasCobroCambio = {
  id: string
  ejecutadoAnterior: number | null
  proyectadoAnterior: number | null
  ejecutado: number
  proyectado: number
  usuarioNombre: string
  createdAt: string
}

async function getCuentasCobro_uncached(month: string): Promise<CuentasCobro> {
  assertPeriodo(month)
  const empresaId = await getEmpresaCkreaId()
  assertUuid(empresaId)
  try {
    const rows = await execute(`
      SELECT ejecutado, proyectado FROM v2.cuentas_cobro_mensuales
      WHERE empresa_id = '${empresaId}'::uuid AND periodo = '${month}'
    `)
    return { ejecutado: Number(rows[0]?.ejecutado ?? 0), proyectado: Number(rows[0]?.proyectado ?? 0) }
  } catch (e) {
    // Table not created yet in this DB: no cuentas registered.
    console.error("[cuentas-cobro] read", e)
    return { ejecutado: 0, proyectado: 0 }
  }
}

async function getCuentasCobroHistorial_uncached(month: string): Promise<CuentasCobroCambio[]> {
  assertPeriodo(month)
  const empresaId = await getEmpresaCkreaId()
  assertUuid(empresaId)
  try {
    const rows = await execute(`
      SELECT id, ejecutado_anterior, proyectado_anterior, ejecutado, proyectado,
             COALESCE(NULLIF(usuario_nombre, ''), usuario_email, 'Usuario') AS usuario, created_at
      FROM v2.cuentas_cobro_historial
      WHERE empresa_id = '${empresaId}'::uuid AND periodo = '${month}'
      ORDER BY created_at DESC, id DESC
      LIMIT 50
    `)
    return rows.map((r) => ({
      id: String(r.id),
      ejecutadoAnterior: r.ejecutado_anterior == null ? null : Number(r.ejecutado_anterior),
      proyectadoAnterior: r.proyectado_anterior == null ? null : Number(r.proyectado_anterior),
      ejecutado: Number(r.ejecutado ?? 0),
      proyectado: Number(r.proyectado ?? 0),
      usuarioNombre: String(r.usuario),
      createdAt: String(r.created_at),
    }))
  } catch (e) {
    console.error("[cuentas-cobro] historial", e)
    return []
  }
}

export const getCuentasCobro = cached(getCuentasCobro_uncached, ["cuentas-cobro:mes"], "pagos")
export const getCuentasCobroHistorial = cached(getCuentasCobroHistorial_uncached, ["cuentas-cobro:historial"], "pagos")
export { getCuentasCobro_uncached as getCuentasCobroFresh }

// One statement, so the value, its history row and the month's cierre (if the
// month is already closed) change together or not at all.
export async function guardarCuentasCobroDb(
  month: string,
  valores: CuentasCobro,
  usuario: { id: string; nombre: string; email: string | null },
): Promise<void> {
  assertPeriodo(month)
  assertUuid(usuario.id)
  const empresaId = await getEmpresaCkreaId()
  assertUuid(empresaId)
  const x = String(Math.round(valores.ejecutado))
  const y = String(Math.round(valores.proyectado))
  const e = `'${empresaId}'::uuid`
  const p = `'${month}'`

  await executeDml(`
    WITH prev AS (
      SELECT ejecutado, proyectado FROM v2.cuentas_cobro_mensuales
      WHERE empresa_id = ${e} AND periodo = ${p}
      FOR UPDATE
    ),
    up AS (
      INSERT INTO v2.cuentas_cobro_mensuales (empresa_id, periodo, ejecutado, proyectado, actualizado_por)
      VALUES (${e}, ${p}, ${x}, ${y}, '${usuario.id}'::uuid)
      ON CONFLICT (empresa_id, periodo) DO UPDATE SET
        ejecutado = excluded.ejecutado,
        proyectado = excluded.proyectado,
        actualizado_por = excluded.actualizado_por,
        updated_at = now()
      RETURNING 1
    ),
    hist AS (
      INSERT INTO v2.cuentas_cobro_historial
        (empresa_id, periodo, ejecutado_anterior, proyectado_anterior, ejecutado, proyectado, usuario_id, usuario_nombre, usuario_email)
      SELECT ${e}, ${p}, (SELECT ejecutado FROM prev), (SELECT proyectado FROM prev), ${x}, ${y},
             '${usuario.id}'::uuid, ${sqlStr(usuario.nombre)}, ${sqlStr(usuario.email)}
      RETURNING 1
    ),
    cierre AS (
      UPDATE v2.resumen_cierres_mensuales SET
        total_recaudo      = total_recaudo - cuentas + ${x},
        total_proyectado   = total_proyectado - cuentas_proyectado + ${y},
        cuentas            = ${x},
        cuentas_proyectado = ${y}
      WHERE empresa_id = ${e} AND periodo = ${p}
      RETURNING 1
    )
    SELECT (SELECT count(*) FROM up), (SELECT count(*) FROM hist), (SELECT count(*) FROM cierre)
  `)
}
