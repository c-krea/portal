/**
 * Vercel Cron — Cierre mensual del Resumen
 * Schedule: 0 23 * * * (18:00 Bogotá). Runs daily, but only acts on the 2nd
 * business day of the month (Mon–Fri, not a Colombian holiday): it freezes the
 * PREVIOUS month into v2.resumen_cierres_mensuales. Every other day it returns
 * { skipped: true }.
 *
 * Manual / backfill: ?periodo=YYYY-MM closes that month now, any day (it must be
 * a past month). Re-closing a month overwrites its row. Add &dry=1 to only
 * return the figures without writing.
 *
 * Protected by CRON_SECRET.
 */

import { NextResponse } from "next/server"
import { rejectUnauthorizedCron } from "@/lib/cron-auth"
import { computeResumenTotales, upsertResumenCierre } from "@/lib/data/resumen"
import { currentPeriodo, diaHabilDelMes, mesAnterior, nowBogota } from "@/lib/periodo"
import { isValidPeriodo } from "@/lib/security/validators"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const DIA_HABIL_CIERRE = 2

export async function GET(request: Request) {
  const unauthorized = rejectUnauthorizedCron(request)
  if (unauthorized) return unauthorized

  const actual = currentPeriodo()
  const anterior = mesAnterior(actual)
  const param = new URL(request.url).searchParams.get("periodo")

  let periodo: string
  let origen: "cron" | "manual"
  if (param != null) {
    if (!isValidPeriodo(param) || param >= actual) {
      return NextResponse.json({ error: `periodo inválido: ${param} (debe ser un mes ya terminado, YYYY-MM)` }, { status: 400 })
    }
    periodo = param
    origen = "manual"
  } else {
    const hoy = nowBogota()
    const diaCierre = diaHabilDelMes(DIA_HABIL_CIERRE, hoy)
    if (hoy.getDate() !== diaCierre) {
      return NextResponse.json({ skipped: true, hoy: hoy.getDate(), diaCierre })
    }
    periodo = anterior
    origen = "cron"
  }

  try {
    // Occupancy is only known live: record it only when closing last month.
    const ocupacion = periodo === anterior
    if (new URL(request.url).searchParams.get("dry") === "1") {
      const totales = await computeResumenTotales(periodo, { fresh: true, ocupacion })
      return NextResponse.json({ dry: true, periodo, origen, totales })
    }
    const totales = await upsertResumenCierre(periodo, origen, { ocupacion })
    return NextResponse.json({ success: true, periodo, origen, totales })
  } catch (e) {
    console.error("[cron/resumen-cierre]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
