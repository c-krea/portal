import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { getClienteRows, getVacantUnitRows, getLocalesKPIs } from "@/lib/data/clientes"
import { formatCOP } from "@/lib/formatters"
import { Building2, DoorOpen, TrendingUp, CalendarClock } from "lucide-react"

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ entrada?: string }>
}) {
  const { entrada } = await searchParams

  const [rows, vacantRows, kpis] = await Promise.all([
    getClienteRows(entrada),
    getVacantUnitRows(entrada),
    getLocalesKPIs(entrada),
  ])

  const occupancyPct = kpis.totalUnits > 0
    ? ((kpis.occupiedUnits / kpis.totalUnits) * 100).toFixed(1)
    : "0"

  return (
    <>
      <PageHeader title="Locales" />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Ocupación */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Ocupación</p>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {kpis.occupiedUnits} / {kpis.totalUnits}
          </p>
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">{occupancyPct}% ocupado</p>
          </div>
        </div>

        {/* Vacantes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Vacantes</p>
            <DoorOpen className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.vacantes}</p>
          <p className="mt-1 text-xs text-slate-400">
            {kpis.vacantes === 1 ? "local sin arrendar" : "locales sin arrendar"}
          </p>
        </div>

        {/* Canon mensual */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Canon mensual neto</p>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCOP(kpis.canonMensual)}</p>
          <p className="mt-1 text-xs text-slate-400">sin IVA · neto descuentos de fase</p>
        </div>

        {/* Contratos por vencer */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Por vencer</p>
            <CalendarClock className="h-4 w-4 text-amber-500" />
          </div>
          <p className={`mt-2 text-2xl font-bold ${kpis.contratosPorVencer > 0 ? "text-amber-600" : "text-slate-900"}`}>
            {kpis.contratosPorVencer}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {kpis.contratosPorVencer === 1 ? "contrato vence en 60 días" : "contratos vencen en 60 días"}
          </p>
        </div>
      </div>

      <ClientesTable data={rows} vacantUnits={vacantRows} activeEntrada={entrada} />
    </>
  )
}
