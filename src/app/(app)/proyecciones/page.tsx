export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { ProyeccionesChart } from "@/components/proyecciones/proyecciones-chart"
import { GenerateButton } from "@/components/proyecciones/generate-button"
import { DetalleTable } from "@/components/proyecciones/detalle-table"
import {
  getProyeccionBreakdown,
  getProyeccionDetalle,
  getProyeccionMensual,
} from "@/lib/data/proyecciones"
import { getProyectadoVsReal } from "@/lib/data/reportes"
import { getFinancialRules } from "@/lib/data/configuracion"
import { formatCOP, formatPercent } from "@/lib/formatters"
import { execute } from "@/lib/db/executor"
import { cn } from "@/lib/utils"

export default async function ProyeccionesPage() {
  const companies = await execute(`SELECT id FROM companies LIMIT 1`)
  const companyId = String((companies as Array<Record<string, unknown>>)[0].id)

  const year = 2026
  const nextYear = year + 1

  const [breakdown, detalle, mensual, rules, vsReal] = await Promise.all([
    getProyeccionBreakdown(companyId, year),
    getProyeccionDetalle(companyId, year),
    getProyeccionMensual(companyId, year),
    getFinancialRules(companyId),
    getProyectadoVsReal(year),
  ])

  const ipcRule  = rules.find((r) => r.ruleKey === "ipc_increment_pct")
  const defaultIpc = ipcRule ? ipcRule.ruleValue : 5.1

  const descPct = breakdown.canonBruto > 0 ? (breakdown.totalDescuentos / breakdown.canonBruto) * 100 : 0

  return (
    <>
      <PageHeader title={`Proyecciones ${year}`} />

      {/* ── KPI breakdown ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Canon bruto</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCOP(breakdown.canonBruto)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Antes de descuentos</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Descuentos de fase</p>
          <p className="mt-1 text-xl font-bold text-rose-500">
            − {formatCOP(breakdown.totalDescuentos)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatPercent(descPct, 1)} del canon bruto
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">IVA (19%)</p>
          <p className="mt-1 text-xl font-bold text-amber-600">+ {formatCOP(breakdown.totalIVA)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Sobre base neta</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-blue-200 bg-blue-50">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Total neto c/IVA</p>
          <p className="mt-1 text-xl font-bold text-blue-900">{formatCOP(breakdown.netoConIVA)}</p>
          <p className="mt-0.5 text-xs text-blue-500">Recaudo proyectado {year}</p>
        </div>
      </div>

      {/* ── Formula explainer ── */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">Cómo se calcula:</span>
          {" "}Canon bruto <span className="font-mono font-medium text-slate-900">{formatCOP(breakdown.canonBruto)}</span>
          {" "}− Descuentos fase <span className="font-mono font-medium text-rose-600">{formatCOP(breakdown.totalDescuentos)}</span>
          {" "}= Base neta <span className="font-mono font-medium text-slate-900">{formatCOP(breakdown.canonBruto - breakdown.totalDescuentos)}</span>
          {" "}× 1.19 IVA = <span className="font-mono font-bold text-blue-700">{formatCOP(breakdown.netoConIVA)}</span>
          <span className="ml-3 text-slate-400">· Pronto pago se aplica solo si el cliente paga antes del día 10</span>
        </p>
      </div>

      {/* ── Monthly chart ── */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Recaudo proyectado por mes — {year} (c/IVA)</p>
          <p className="text-xs text-slate-400">
            Prom. mensual: <span className="font-medium text-slate-700">{formatCOP(Math.round(breakdown.netoConIVA / 12))}</span>
          </p>
        </div>
        <ProyeccionesChart data={mensual} />
      </div>

      {/* ── Reconciliation table ── */}
      {(() => {
        const totProy = vsReal.reduce((s, r) => s + r.proyectado, 0)
        const totRec  = vsReal.reduce((s, r) => s + r.recaudado, 0)
        const totPP   = vsReal.reduce((s, r) => s + r.ppOtorgado, 0)
        const totPend = vsReal.reduce((s, r) => s + r.pendiente, 0)
        const totPct  = totProy > 0 ? Math.round(((totRec + totPP) / totProy) * 100) : 0

        return (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">Proyectado vs. Recaudado — {year}</p>
              <p className="text-xs text-slate-400">Recaudo neto + PP otorgado = total cobrado vs proyectado</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Mes", "Proyectado", "Recaudo neto", "PP otorgado", "Pendiente", "%"].map((h, i) => (
                      <th key={h} className={cn(
                        "px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500",
                        i === 0 ? "text-left" : "text-right",
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vsReal.filter((r) => r.proyectado > 0).map((r) => {
                    const cobrado = r.recaudado + r.ppOtorgado
                    const pct     = r.proyectado > 0 ? Math.round((cobrado / r.proyectado) * 100) : 0
                    const isFuture = cobrado === 0
                    return (
                      <tr key={r.mes} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{r.mes}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">{formatCOP(r.proyectado)}</td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {r.recaudado > 0
                            ? <span className="text-emerald-700">{formatCOP(r.recaudado)}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {r.ppOtorgado > 0
                            ? <span className="font-medium text-emerald-900">{formatCOP(r.ppOtorgado)}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {r.pendiente > 0
                            ? <span className={isFuture ? "text-slate-400" : "text-rose-600 font-medium"}>{formatCOP(r.pendiente)}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isFuture ? (
                            <span className="text-slate-300">—</span>
                          ) : pct >= 100 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">✓ 100%</span>
                          ) : pct >= 80 ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{pct}%</span>
                          ) : (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">{pct}%</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Total {year}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">{formatCOP(totProy)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{formatCOP(totRec)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-900">{totPP > 0 ? formatCOP(totPP) : <span className="font-normal text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">{totPend > 0 ? formatCOP(totPend) : <span className="font-normal text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        totPct >= 100 ? "bg-emerald-50 text-emerald-700" :
                        totPct >= 80  ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      )}>{totPct}%</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      })()}

      {/* ── Detail table ── */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Detalle por local — {detalle.length} contratos
          </p>
        </div>
        <DetalleTable data={detalle} />
      </div>

      {/* ── Floating generate button ── */}
      <GenerateButton defaultYear={nextYear} defaultIpc={defaultIpc} />
    </>
  )
}
