export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { GastosTable } from "@/components/gastos/gastos-table"
import { GastosChart } from "@/components/gastos/gastos-chart"
import { getGastoRows, getGastoSummary, getGastosForPeriodo } from "@/lib/data/gastos"
import { formatCOP } from "@/lib/formatters"

const PERIODOS = [
  { label: "Ene", value: "2026-01" },
  { label: "Feb", value: "2026-02" },
  { label: "Mar", value: "2026-03" },
  { label: "Abr", value: "2026-04" },
]

const MES_LABEL: Record<string, string> = {
  "2026-01": "Enero", "2026-02": "Febrero", "2026-03": "Marzo",
  "2026-04": "Abril", "2026-05": "Mayo",    "2026-06": "Junio",
  "2026-07": "Julio", "2026-08": "Agosto",  "2026-09": "Septiembre",
  "2026-10": "Octubre","2026-11": "Noviembre","2026-12": "Diciembre",
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  const periodo = periodoParam ?? "2026-04"

  const [rows, summary, chartData] = await Promise.all([
    getGastoRows(periodo),
    getGastoSummary(),
    getGastosForPeriodo(periodo),
  ])

  const mesLabel = MES_LABEL[periodo] ?? periodo

  return (
    <>
      <PageHeader title="Gastos" />

      {/* Period tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {PERIODOS.map((p) => (
          <a
            key={p.value}
            href={`/gastos?periodo=${p.value}`}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
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
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Gastos 2026</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCOP(summary.totalYtd)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{summary.totalMeses} meses registrados</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{mesLabel} 2026</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCOP(chartData.total)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{rows.length} registros · promedio {formatCOP(summary.avgMensual)}/mes</p>
        </div>
      </div>

      {/* Two separate cards */}
      <div className="flex gap-4">

        {/* Left — table */}
        <div className="w-[70%] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <GastosTable data={rows} embedded />
        </div>

        {/* Right — pie + legend */}
        <div className="flex w-[30%] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
