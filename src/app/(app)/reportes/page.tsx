export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { RecaudoChart, ProyectadoVsRealChart } from "@/components/reportes/recaudo-chart"
import {
  getAgingBuckets,
  getMonthlyCollections,
  getProyectadoVsReal,
  getReporteSummary,
} from "@/lib/data/reportes"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const AGING_COLORS: Record<string, string> = {
  "0":     "bg-emerald-100 text-emerald-800",
  "1_30":  "bg-amber-100 text-amber-800",
  "31_60": "bg-orange-100 text-orange-800",
  "61_90": "bg-red-100 text-red-800",
  "90+":   "bg-rose-100 text-rose-800",
}

const AGING_BAR: Record<string, string> = {
  "0":     "bg-emerald-400",
  "1_30":  "bg-amber-400",
  "31_60": "bg-orange-400",
  "61_90": "bg-red-500",
  "90+":   "bg-rose-600",
}

function KpiCard({
  label,
  value,
  sub,
  color = "text-slate-900",
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", color)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export default async function ReportesPage() {
  const [summary, aging, collections, proyVsReal] = await Promise.all([
    getReporteSummary(),
    getAgingBuckets(),
    getMonthlyCollections(),
    getProyectadoVsReal(),
  ])

  const totalCarteraForPct = summary.totalCartera || 1

  return (
    <>
      <PageHeader title="Reportes" />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Cartera Total"
          value={formatCOP(summary.totalCartera)}
          sub="Saldo pendiente"
        />
        <KpiCard
          label="Saldo Vencido"
          value={formatCOP(summary.totalVencido)}
          sub="Con mora"
          color="text-rose-600"
        />
        <KpiCard
          label="Interés Acumulado"
          value={formatCOP(summary.totalInteres)}
          sub="Mora calculada"
          color="text-orange-600"
        />
        <KpiCard
          label="Recaudado 2026"
          value={formatCOP(summary.totalRecaudado2026)}
          sub="Pagos registrados"
          color="text-emerald-700"
        />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Collections by month */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Recaudo Mensual 2026</h2>
          <RecaudoChart data={collections} />
        </div>

        {/* Proyectado vs real */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Proyectado vs. Recaudado 2026</h2>
          <ProyectadoVsRealChart data={proyVsReal} />
        </div>
      </div>

      {/* Cartera aging */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Antigüedad de Cartera</h2>
          <p className="text-xs text-slate-400">Distribución de saldo por días de mora</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Rango
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Facturas
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Saldo
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Vencido
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Interés
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  % Cartera
                </th>
              </tr>
            </thead>
            <tbody>
              {aging.map((row) => {
                const pct = (row.saldo / totalCarteraForPct) * 100
                return (
                  <tr key={row.bucket} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          AGING_COLORS[row.bucket],
                        )}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-600">{row.count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                      {formatCOP(row.saldo)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {row.valorVencido > 0 ? formatCOP(row.valorVencido) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {row.interesAcumulado > 0 ? formatCOP(row.interesAcumulado) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn("h-full rounded-full", AGING_BAR[row.bucket])}
                            style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td className="px-5 py-3 text-xs font-semibold uppercase text-slate-600">Total</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-slate-700">
                  {aging.reduce((s, r) => s + r.count, 0)}
                </td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">
                  {formatCOP(summary.totalCartera)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-slate-700">
                  {formatCOP(summary.totalVencido)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-slate-700">
                  {formatCOP(summary.totalInteres)}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}
