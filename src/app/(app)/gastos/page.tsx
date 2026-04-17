export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { GastosTable } from "@/components/gastos/gastos-table"
import { GastosChart } from "@/components/gastos/gastos-chart"
import { getGastoRows, getGastoSummary, getGastosChartData } from "@/lib/data/gastos"
import { formatCOP } from "@/lib/formatters"

const MES_LABEL: Record<string, string> = {
  "2026-01": "Enero", "2026-02": "Febrero", "2026-03": "Marzo",
  "2026-04": "Abril", "2026-05": "Mayo",    "2026-06": "Junio",
  "2026-07": "Julio", "2026-08": "Agosto",  "2026-09": "Septiembre",
  "2026-10": "Octubre","2026-11": "Noviembre","2026-12": "Diciembre",
}

export default async function GastosPage() {
  const [rows, summary, chartData] = await Promise.all([
    getGastoRows(),
    getGastoSummary(),
    getGastosChartData(),
  ])

  return (
    <>
      <PageHeader title="Gastos" />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Gastos YTD</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCOP(summary.totalYtd)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{summary.totalMeses} meses registrados</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Promedio Mensual</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCOP(summary.avgMensual)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Por mes 2026</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Último Mes Registrado</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCOP(summary.lastTotal)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{MES_LABEL[summary.lastPeriodo] ?? summary.lastPeriodo}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Registros</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{rows.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">Líneas de gasto</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 h-72 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-slate-900">Gastos por Mes y Categoría</p>
        <div className="h-full pb-6">
          <GastosChart data={chartData} />
        </div>
      </div>

      {/* Table */}
      <GastosTable data={rows} />
    </>
  )
}
