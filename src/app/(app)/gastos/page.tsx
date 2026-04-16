import { PageHeader } from "@/components/layout/page-header"
import { GastosTable } from "@/components/gastos/gastos-table"
import { getGastoRows, getGastoSummary } from "@/lib/data/gastos"
import { formatCOP } from "@/lib/formatters"

export default async function GastosPage() {
  const [rows, summary] = await Promise.all([getGastoRows(), getGastoSummary()])

  return (
    <>
      <PageHeader title="Gastos" />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Gastos</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatCOP(summary.totalGastos)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Asignados</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">
            {formatCOP(summary.totalAllocated)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{summary.countAllocated} gastos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pendientes</p>
          <p className="mt-1 text-lg font-semibold text-amber-600">
            {formatCOP(summary.totalPending)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{summary.countPending} gastos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Registros</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{rows.length}</p>
        </div>
      </div>

      <GastosTable data={rows} />
    </>
  )
}
