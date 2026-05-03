export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { GastosTable } from "@/components/gastos/gastos-table"
import { GastosChart } from "@/components/gastos/gastos-chart"
import { PeriodoFilter } from "@/components/gastos/periodo-filter"
import { getGastoRows, getGastoSummary, getGastosForPeriodo, getGastoPeriodos, isValidPeriodo } from "@/lib/data/gastos"
import { isValidYear } from "@/lib/security/validators"
import { formatCOP } from "@/lib/formatters"

const MONTH_RE = /^(0[1-9]|1[0-2])$/

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
  searchParams: Promise<{ year?: string; month?: string; periodo?: string }>
}) {
  const { year: yearParam, month: monthParam, periodo: periodoParam } = await searchParams
  const periodos = await getGastoPeriodos()
  const fallback = periodos[0]?.value ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  let periodo: string
  if (yearParam && isValidYear(yearParam) && monthParam && MONTH_RE.test(monthParam)) {
    const candidate = `${yearParam}-${monthParam}`
    periodo = periodos.some((p) => p.value === candidate) ? candidate : fallback
  } else if (periodoParam && isValidPeriodo(periodoParam)) {
    periodo = periodoParam
  } else {
    periodo = fallback
  }

  const [selectedYear, selectedMonth] = periodo.split("-")

  const [rows, summary, monthData] = await Promise.all([
    getGastoRows(periodo),
    getGastoSummary(selectedYear),
    getGastosForPeriodo(periodo),
  ])

  const mesLabel = fullMesLabel(periodo)
  const currentYear = String(new Date().getFullYear())
  const yearLabel = selectedYear === currentYear ? `Acumulado ${selectedYear}` : `Total ${selectedYear}`

  return (
    <>
      <PageHeader title="Gastos" />

      <PeriodoFilter
        periodos={periodos}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{yearLabel}</p>
          <p className="mt-1 text-sm sm:text-2xl font-bold text-slate-900 tabular-nums truncate">{formatCOP(summary.totalYtd)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{summary.totalMeses} meses · {formatCOP(summary.avgMensual)}/mes</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{mesLabel}</p>
          <p className="mt-1 text-sm sm:text-2xl font-bold text-slate-900 tabular-nums truncate">{formatCOP(monthData.total)}</p>
          <p className="mt-0.5 text-xs text-slate-400 truncate">{rows.length} categorías</p>
        </div>
      </div>

      {/* Table + chart */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[70%] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <GastosTable data={rows} embedded />
        </div>
        <div className="flex w-full lg:w-[30%] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 shrink-0 text-sm font-semibold text-slate-900">
            Distribución — {mesLabel}
          </p>
          <div className="min-h-0 flex-1 h-full">
            <GastosChart data={monthData} />
          </div>
        </div>
      </div>
    </>
  )
}
