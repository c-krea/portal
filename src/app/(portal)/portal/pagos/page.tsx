export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  getPortalProfile,
  getPortalPagosPage,
  getPortalPagosKpis,
} from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import { Receipt, CheckCircle2, Clock } from "lucide-react"

export default async function PagosHistorialPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getPortalProfile(user.id)
  if (!profile) redirect("/portal")

  const [{ pagos }, kpis] = await Promise.all([
    getPortalPagosPage(profile.tenantId, 1, 10),
    getPortalPagosKpis(profile.tenantId),
  ])

  const pctEnPlazo = kpis.totalCount > 0
    ? Math.round((kpis.enPlazoCount / kpis.totalCount) * 100)
    : 0

  const unitsLabel = profile.allUnits.length > 1
    ? `Locales ${profile.allUnits.join(" · ")}`
    : `Local ${profile.unitNumber}`

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Historial de Pagos</h1>
        <p className="mt-0.5 text-sm text-slate-500">{unitsLabel}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {/* Mobile: horizontal (icon+label left, value right) · Desktop: vertical */}
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:p-4 shadow-sm flex items-center justify-between sm:block">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-emerald-500" />
            <div>
              <p className="text-xs font-medium text-slate-500 sm:uppercase sm:tracking-wider">En Plazo</p>
              <p className="text-[11px] sm:hidden text-slate-400">{kpis.enPlazoCount} de {kpis.totalCount} · dentro de 30 días</p>
            </div>
          </div>
          <div className="text-right sm:text-left sm:mt-2">
            <p className="text-base sm:text-lg font-bold text-emerald-600">{pctEnPlazo}%</p>
            <p className="hidden sm:block mt-0.5 text-xs text-slate-400">{kpis.enPlazoCount} de {kpis.totalCount} · dentro de 30 días</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:p-4 shadow-sm flex items-center justify-between sm:block">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-400" />
            <div>
              <p className="text-xs font-medium text-slate-500 sm:uppercase sm:tracking-wider">Promedio días</p>
              <p className="text-[11px] sm:hidden text-slate-400">factura a pago</p>
            </div>
          </div>
          <div className="text-right sm:text-left sm:mt-2">
            <p className="text-base sm:text-lg font-bold text-slate-900">{kpis.avgDias != null ? `${kpis.avgDias}d` : "—"}</p>
            <p className="hidden sm:block mt-0.5 text-xs text-slate-400">desde factura a pago</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:p-4 shadow-sm flex items-center justify-between sm:block">
          <div className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-rose-400" />
            <div>
              <p className="text-xs font-medium text-slate-500 sm:uppercase sm:tracking-wider">Pagos en mora</p>
              <p className="text-[11px] sm:hidden text-slate-400">después de 30 días</p>
            </div>
          </div>
          <div className="text-right sm:text-left sm:mt-2">
            <p className="text-base sm:text-lg font-bold text-rose-600">{kpis.tardeCount}</p>
            <p className="hidden sm:block mt-0.5 text-xs text-slate-400">pagados después de 30 días</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Últimos 10 pagos</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Fecha de Pago</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">Valor</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-xs sm:text-sm text-slate-400">
                    Sin pagos registrados
                  </td>
                </tr>
              )}
              {pagos.map((p) => {
                const d = p.diasDesdeFactura
                const enMora = d != null && d > 30
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-700">
                      {formatDate(p.fechaRecaudo)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-slate-900">
                      {formatCOP(p.valorFinal)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      {enMora ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600">
                          {d} días mora
                        </span>
                      ) : d != null ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          En plazo · {d}d
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          Recaudado
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
