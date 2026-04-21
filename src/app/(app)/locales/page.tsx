export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { getClienteRows, getVacantUnitRows, getLocalesKPIs } from "@/lib/data/clientes"
import { formatCOP } from "@/lib/formatters"
import { Building2, AlertTriangle, CreditCard, TrendingUp } from "lucide-react"

export default async function ClientesPage() {
  const [rows, vacantRows, kpis] = await Promise.all([
    getClienteRows(),
    getVacantUnitRows(),
    getLocalesKPIs(),
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

        {/* Cartera total */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cartera total</p>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCOP(kpis.carteraTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">saldo pendiente total</p>
        </div>

        {/* Recaudado este mes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Recaudado este mes</p>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCOP(kpis.recaudadoEsteMes)}
          </p>
          <p className="mt-1 text-xs text-slate-400">desde el ERP</p>
        </div>

        {/* Locales en mora */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">En mora</p>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {kpis.localesEnMora}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {kpis.localesEnMora === 1 ? "local con saldo vencido" : "locales con saldo vencido"}
          </p>
        </div>
      </div>

      <ClientesTable data={rows} vacantUnits={vacantRows} />
    </>
  )
}
