export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { MoraTable } from "@/components/mora/mora-table"
import { AccrualForm } from "@/components/mora/accrual-form"
import { getMoraRows, getMoraSummary } from "@/lib/data/mora"
import { formatCOP } from "@/lib/formatters"
import { AlertTriangle, Users, Clock, TrendingUp } from "lucide-react"

export default async function MoraPage() {
  const [rows, summary] = await Promise.all([getMoraRows(), getMoraSummary()])

  const avgDias =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.diasMora, 0) / rows.length)
      : 0

  return (
    <>
      <PageHeader title="Gestión de Mora" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left: accrual trigger */}
        <div className="lg:col-span-1">
          <AccrualForm />

          {summary.lastAccrualDate && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Último cálculo: {summary.lastAccrualDate}
            </p>
          )}
        </div>

        {/* Right: KPIs + table */}
        <div className="lg:col-span-3">
          {/* KPI strip */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Cartera Vencida
                  </p>
                  <p className="text-lg font-bold text-rose-600">
                    {formatCOP(summary.totalCarteraVencida)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
                  <Users className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Clientes
                  </p>
                  <p className="text-lg font-bold text-slate-900">{rows.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Prom. Días
                  </p>
                  <p className="text-lg font-bold text-slate-900">{avgDias}d</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Interés Acum.
                  </p>
                  <p className="text-lg font-bold text-violet-700">
                    {formatCOP(summary.totalInteresPortal)}
                  </p>
                  {summary.invoicesVencidas > 0 && (
                    <p className="text-xs text-slate-400">
                      {summary.invoicesVencidas} factura{summary.invoicesVencidas !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <MoraTable data={rows} />
        </div>
      </div>
    </>
  )
}
