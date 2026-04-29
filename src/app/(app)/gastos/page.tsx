export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { GastosTable } from "@/components/gastos/gastos-table"
import { GastosChart } from "@/components/gastos/gastos-chart"
import { getGastoRows, getGastoSummary, getGastosForPeriodo, getGastoPeriodos, isValidPeriodo } from "@/lib/data/gastos"
import { formatCOP } from "@/lib/formatters"

const MES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function fullMesLabel(p: string): string {
  const [y, m] = p.split("-")
  const idx = Number(m) - 1
  if (idx < 0 || idx > 11) return p
  return `${MES_FULL[idx]} ${y}`
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  const periodos = await getGastoPeriodos()
  const fallback = periodos[0]?.value ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  const periodo = periodoParam && isValidPeriodo(periodoParam) ? periodoParam : fallback

  const [rows, summary, chartData] = await Promise.all([
    getGastoRows(periodo),
    getGastoSummary(),
    getGastosForPeriodo(periodo),
  ])

  const mesLabel = fullMesLabel(periodo)

  return (
    <>
      <PageHeader title="Gastos" />

      {/* Period tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit max-w-full">
        {periodos.length === 0 ? (
          <span className="px-5 py-1.5 text-sm text-slate-400">Sin períodos cargados</span>
        ) : periodos.map((p) => (
          <a
            key={p.value}
            href={`/gastos?periodo=${p.value}`}
            className={`shrink-0 rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
              p.value === periodo
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Histórico</p>
          <p className="mt-1 text-sm sm:text-2xl font-bold text-slate-900 tabular-nums truncate">{formatCOP(summary.totalYtd)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{summary.totalMeses} meses · {formatCOP(summary.avgMensual)}/mes</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{mesLabel}</p>
          <p className="mt-1 text-sm sm:text-2xl font-bold text-slate-900 tabular-nums truncate">{formatCOP(chartData.total)}</p>
          <p className="mt-0.5 text-xs text-slate-400 truncate">{rows.length} registros</p>
        </div>
      </div>

      {/* Two separate cards */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Left — table */}
        <div className="w-full lg:w-[70%] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <GastosTable data={rows} embedded />
        </div>

        {/* Right — pie + legend */}
        <div className="flex w-full lg:w-[30%] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 shrink-0 text-sm font-semibold text-slate-900">
            Distribución — {mesLabel} 2026
          </p>
          <div className="min-h-0 flex-1">
            <GastosChart data={chartData} />
          </div>
        </div>

      </div>
    </>
  )
}
