// Resumen totals: computed live for the open month, frozen in
// v2.resumen_cierres_mensuales once a month is closed. The page and the
// resumen-cierre cron both go through computeResumenTotales, so a cierre stores
// exactly what the page showed.

import { execute, executeDml } from "@/lib/db/executor"
import { bustTags, cached } from "@/lib/cache"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { assertPeriodo, assertUuid } from "@/lib/security/validators"
import { getResumenExtras, getResumenExtrasFresh, getResumenKPIs, getResumenKPIsFresh } from "@/lib/data/pagos"
import { getMoraTrendReconstruido, getMoraTrendReconstruidoFresh } from "@/lib/data/mora"
import { getPortfolioStats, getPortfolioStatsFresh } from "@/lib/data/dashboard"
import { getCuentasCobro, getCuentasCobroFresh } from "@/lib/data/cuentas-cobro"

export type ResumenTotales = {
  canon: number
  canonProyectado: number
  mora: number
  moraProyectado: number
  luz: number
  luzProyectado: number
  cuentas: number
  cuentasProyectado: number
  descuentoFinanciero: number
  descuentoComercial: number
  deposito: number
  totalRecaudo: number
  totalProyectado: number
  // Occupancy is only known live. null on a cierre made late (backfill).
  localesOcupados: number | null
  localesTotal: number | null
}

export type ResumenCierre = {
  totales: ResumenTotales
  origen: "cron" | "manual"
  generadoAt: string
}

export async function computeResumenTotales(
  month: string,
  opts: { fresh?: boolean; ocupacion?: boolean } = {},
): Promise<ResumenTotales> {
  assertPeriodo(month)
  const { fresh = false, ocupacion = true } = opts
  const empresaId = await getEmpresaCkreaId()
  const src = fresh
    ? { kpis: getResumenKPIsFresh, extras: getResumenExtrasFresh, trend: getMoraTrendReconstruidoFresh, portfolio: getPortfolioStatsFresh, cuentas: getCuentasCobroFresh }
    : { kpis: getResumenKPIs, extras: getResumenExtras, trend: getMoraTrendReconstruido, portfolio: getPortfolioStats, cuentas: getCuentasCobro }

  const [kpis, extras, moraTrend, portfolio, cuentasCobro] = await Promise.all([
    src.kpis(month),
    src.extras(month),
    // Balance at the END of the month, rebuilt like the /mora trend.
    src.trend(empresaId),
    ocupacion ? src.portfolio(empresaId) : Promise.resolve(null),
    src.cuentas(month),
  ])

  // Canon: on-time FVS cash (getResumenKPIs) + anticipos (receipts with no
  // invoice applied that are not RKD depósitos — see recibosSinFacturaRowsSql).
  const canon = kpis.recaudoFacturado + extras.anticipos
  const canonProyectado = kpis.facturacionMes
  const mora = kpis.recaudoMora
  const pendienteMora = moraTrend.find((p) => p.periodo === month)?.saldoVencido ?? 0
  const moraProyectado = mora + pendienteMora
  // Cuentas de cobro: entered by hand on the Resumen (v2.cuentas_cobro_mensuales).
  const cuentas = cuentasCobro.ejecutado
  const cuentasProyectado = cuentasCobro.proyectado

  return {
    canon,
    canonProyectado,
    mora,
    moraProyectado,
    luz: extras.luz,
    luzProyectado: extras.luzProyectado,
    cuentas,
    cuentasProyectado,
    descuentoFinanciero: extras.descuentoFinanciero,
    descuentoComercial: extras.descuentoComercial,
    deposito: extras.deposito,
    totalRecaudo: canon + mora + cuentas + extras.luz,
    totalProyectado: canonProyectado + moraProyectado + cuentasProyectado + extras.luzProyectado,
    localesOcupados: portfolio ? portfolio.activeClients : null,
    localesTotal: portfolio ? portfolio.totalUnits : null,
  }
}

const num = (v: unknown) => Number(v ?? 0)
const numOrNull = (v: unknown) => (v == null ? null : Number(v))

async function getResumenCierre_uncached(month: string): Promise<ResumenCierre | null> {
  assertPeriodo(month)
  const empresaId = await getEmpresaCkreaId()
  assertUuid(empresaId)
  let rows
  try {
    rows = await execute(`
      SELECT * FROM v2.resumen_cierres_mensuales
      WHERE empresa_id = '${empresaId}'::uuid AND periodo = '${month}'
    `)
  } catch (e) {
    // Table not created yet in this DB: behave as "no cierre" and compute live.
    console.error("[resumen] cierre read", e)
    return null
  }
  const r = rows[0]
  if (!r) return null
  return {
    origen: r.origen === "manual" ? "manual" : "cron",
    generadoAt: String(r.generado_at),
    totales: {
      canon: num(r.canon),
      canonProyectado: num(r.canon_proyectado),
      mora: num(r.mora),
      moraProyectado: num(r.mora_proyectado),
      luz: num(r.luz),
      luzProyectado: num(r.luz_proyectado),
      cuentas: num(r.cuentas),
      cuentasProyectado: num(r.cuentas_proyectado),
      descuentoFinanciero: num(r.descuento_financiero),
      descuentoComercial: num(r.descuento_comercial),
      deposito: num(r.deposito),
      totalRecaudo: num(r.total_recaudo),
      totalProyectado: num(r.total_proyectado),
      localesOcupados: numOrNull(r.locales_ocupados),
      localesTotal: numOrNull(r.locales_total),
    },
  }
}

export const getResumenCierre = cached(getResumenCierre_uncached, ["resumen:cierre"], "pagos")

// Freeze `month` with fresh (uncached) figures. Re-closing a month overwrites it.
export async function upsertResumenCierre(
  month: string,
  origen: "cron" | "manual",
  opts: { ocupacion: boolean },
): Promise<ResumenTotales> {
  assertPeriodo(month)
  const empresaId = await getEmpresaCkreaId()
  assertUuid(empresaId)
  const t = await computeResumenTotales(month, { fresh: true, ocupacion: opts.ocupacion })
  const n = (v: number) => (Number.isFinite(v) ? String(Math.round(v)) : "0")
  const nOrNull = (v: number | null) => (v == null ? "NULL" : n(v))

  await executeDml(`
    INSERT INTO v2.resumen_cierres_mensuales (
      empresa_id, periodo,
      canon, canon_proyectado, mora, mora_proyectado, luz, luz_proyectado,
      cuentas, cuentas_proyectado, descuento_financiero, descuento_comercial, deposito,
      total_recaudo, total_proyectado, locales_ocupados, locales_total, origen
    ) VALUES (
      '${empresaId}'::uuid, '${month}',
      ${n(t.canon)}, ${n(t.canonProyectado)}, ${n(t.mora)}, ${n(t.moraProyectado)}, ${n(t.luz)}, ${n(t.luzProyectado)},
      ${n(t.cuentas)}, ${n(t.cuentasProyectado)}, ${n(t.descuentoFinanciero)}, ${n(t.descuentoComercial)}, ${n(t.deposito)},
      ${n(t.totalRecaudo)}, ${n(t.totalProyectado)}, ${nOrNull(t.localesOcupados)}, ${nOrNull(t.localesTotal)}, '${origen}'
    )
    ON CONFLICT (empresa_id, periodo) DO UPDATE SET
      canon = excluded.canon, canon_proyectado = excluded.canon_proyectado,
      mora = excluded.mora, mora_proyectado = excluded.mora_proyectado,
      luz = excluded.luz, luz_proyectado = excluded.luz_proyectado,
      cuentas = excluded.cuentas, cuentas_proyectado = excluded.cuentas_proyectado,
      descuento_financiero = excluded.descuento_financiero, descuento_comercial = excluded.descuento_comercial,
      deposito = excluded.deposito, total_recaudo = excluded.total_recaudo, total_proyectado = excluded.total_proyectado,
      locales_ocupados = excluded.locales_ocupados, locales_total = excluded.locales_total,
      origen = excluded.origen, generado_at = now()
  `)
  bustTags("pagos")
  return t
}
