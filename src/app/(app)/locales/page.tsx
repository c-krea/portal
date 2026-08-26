import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { getClienteRows, getVacantUnitRows, getLocalesKPIs, getYaSalieronRows } from "@/lib/data/clientes"
import { formatCOP } from "@/lib/formatters"
import { Building2, DoorOpen, TrendingUp, CalendarClock, ChevronRight } from "lucide-react"

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ entrada?: string }>
}) {
  const { entrada } = await searchParams

  const [rows, vacantRows, kpis, yaSalieron] = await Promise.all([
    getClienteRows(entrada),
    getVacantUnitRows(entrada),
    getLocalesKPIs(entrada),
    getYaSalieronRows(),
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

      {yaSalieron.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Ya salieron
            </span>
            <span className="text-xs text-slate-400">
              Gente que ya se fue y aún debe · cobro por fuera de ocupación actual
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Último local</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Saldo pendiente</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {yaSalieron.map((r) => (
                  <tr key={r.tenantId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {r.tenantId ? (
                        <Link href={`/locales/${r.tenantId}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                          {r.nombre ?? "—"}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{r.nombre ?? "—"}</span>
                      )}
                      {r.nit && <p className="text-xs text-slate-400">{r.nit}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {r.ultimaUnidad ? (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                          {r.ultimaEntrada && (
                            <span className="text-slate-400">E{r.ultimaEntrada === "ZONA 8" ? "8" : r.ultimaEntrada}·</span>
                          )}
                          {r.ultimaUnidad}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-rose-600">{formatCOP(r.saldo)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.tenantId && (
                        <Link href={`/locales/${r.tenantId}`} className="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
