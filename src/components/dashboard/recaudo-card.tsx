"use client"

import { useState } from "react"
import { RendimientoChart } from "@/components/dashboard/rendimiento-chart"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { ProyectadoVsReal } from "@/lib/data/reportes"

export function RecaudoCard({ data }: { data: ProyectadoVsReal[] }) {
  const [tab, setTab] = useState<"grafica" | "tabla">("grafica")


  return (
    <div className="flex h-[480px] flex-1 flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Proyectado vs. Recaudado 2026</h2>
        <div role="tablist" aria-label="Vista de proyección" className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          {(["grafica", "tabla"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                tab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              {t === "grafica" ? "Gráfica" : "Tabla"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-2 min-h-0 flex-1">
        {tab === "grafica" ? (
          <RendimientoChart data={data} />
        ) : (
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 400 }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100">
                  <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Mes</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-600">Piso</th>
                  <th className="hidden lg:table-cell py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-600">Techo</th>
                  <th className="hidden sm:table-cell py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-600">Recaudo</th>
                  <th className="hidden md:table-cell py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-600">PP otorg.</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-600">Falta</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-600">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.filter((r) => r.piso > 0).map((r) => {
                  // Cash-only %: piso already nets PP out, don't add it back.
                  const pct      = r.piso > 0 ? Math.round((r.recaudado / r.piso) * 100) : 0
                  const isFuture = r.recaudado === 0 && r.ppOtorgado === 0
                  return (
                    <tr key={r.mes} className="hover:bg-slate-50">
                      <td className="py-1.5 font-medium text-slate-700">{r.mes}</td>
                      <td className="py-1.5 text-right font-mono text-slate-700">{formatCOP(r.piso)}</td>
                      <td className="hidden lg:table-cell py-1.5 text-right font-mono text-slate-500">{formatCOP(r.techo)}</td>
                      <td className="hidden sm:table-cell py-1.5 text-right font-mono">
                        {r.recaudado > 0
                          ? <span className="text-emerald-700">{formatCOP(r.recaudado)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="hidden md:table-cell py-1.5 text-right font-mono">
                        {r.ppOtorgado > 0
                          ? <span className="font-medium text-emerald-900">{formatCOP(r.ppOtorgado)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {r.pendiente > 0
                          ? <span className={isFuture ? "text-slate-500" : "font-medium text-rose-600"}>{formatCOP(r.pendiente)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-1.5 text-right">
                        {isFuture ? (
                          <span className="text-slate-400">—</span>
                        ) : pct >= 100 ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">✓</span>
                        ) : pct >= 80 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">{pct}%</span>
                        ) : (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">{pct}%</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
