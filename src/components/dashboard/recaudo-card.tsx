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
        <p className="text-sm font-semibold text-slate-900">Proyectado vs. Recaudado 2026</p>
        <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          {(["grafica", "tabla"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                tab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
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
                  <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Mes</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Proyectado</th>
                  <th className="hidden sm:table-cell py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Recaudo neto</th>
                  <th className="hidden md:table-cell py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-400">PP otorgado</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Pendiente</th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-400">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.filter((r) => r.proyectado > 0).map((r) => {
                  const cobrado  = r.recaudado + r.ppOtorgado
                  const pct      = r.proyectado > 0 ? Math.round((cobrado / r.proyectado) * 100) : 0
                  const isFuture = cobrado === 0
                  return (
                    <tr key={r.mes} className="hover:bg-slate-50">
                      <td className="py-1.5 font-medium text-slate-700">{r.mes}</td>
                      <td className="py-1.5 text-right font-mono text-slate-600">{formatCOP(r.proyectado)}</td>
                      <td className="hidden sm:table-cell py-1.5 text-right font-mono">
                        {r.recaudado > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-emerald-700">{formatCOP(r.recaudado)}</span>
                            {r.recaudadoVencido > 0 && (
                              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                +tardío
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-1.5 text-right font-mono">
                        {r.ppOtorgado > 0
                          ? <span className="font-medium text-emerald-900">{formatCOP(r.ppOtorgado)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {r.pendiente > 0
                          ? <span className={isFuture ? "text-slate-400" : "font-medium text-rose-600"}>{formatCOP(r.pendiente)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-1.5 text-right">
                        {isFuture ? (
                          <span className="text-slate-300">—</span>
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
