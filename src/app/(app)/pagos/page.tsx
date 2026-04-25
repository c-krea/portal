export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getPagos, getPagosKPIs, getPagosBuckets } from "@/lib/data/pagos"
import { MonthFilter } from "@/components/pagos/month-filter"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { TrendingUp, CreditCard, Clock, AlertCircle } from "lucide-react"

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  recaudado:     { cls: "bg-emerald-50 text-emerald-700", label: "Recaudado" },
  parcial:       { cls: "bg-amber-50 text-amber-700",     label: "Parcial" },
  vencido:       { cls: "bg-rose-50 text-rose-700",       label: "Vencido" },
  no_proyectado: { cls: "bg-slate-100 text-slate-500",    label: "No Proyectado" },
  anulado:       { cls: "bg-slate-100 text-slate-400",    label: "Anulado" },
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: rawMonth } = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "") ? rawMonth! : defaultMonth

  const [kpis, pagos, buckets] = await Promise.all([
    getPagosKPIs(month),
    getPagos(200, month),
    getPagosBuckets(month),
  ])

  const pendiente = Math.max(0, kpis.proyectadoMes - kpis.totalEsteMes)
  const colectadoPct = kpis.proyectadoMes > 0
    ? Math.min(100, (kpis.totalEsteMes / kpis.proyectadoMes) * 100)
    : 0

  return (
    <>
      <PageHeader title="Pagos" />

      {/* Month filter */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm text-slate-500">Mes:</span>
        <MonthFilter selected={month} />
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Recaudado este mes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Recaudado
            </p>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCOP(kpis.totalEsteMes)}
          </p>
          {kpis.proyectadoMes > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <TrendingUp className="h-3 w-3" />
              <span>{colectadoPct.toFixed(0)}% del proyectado</span>
            </div>
          )}
        </div>

        {/* Pendiente recaudo */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pendiente Recaudo
            </p>
            <AlertCircle className={cn("h-4 w-4", pendiente > 0 ? "text-amber-400" : "text-emerald-400")} />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCOP(pendiente)}
          </p>
          {kpis.proyectadoMes > 0 && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{colectadoPct.toFixed(0)}% recaudado</span>
                <span>{formatCOP(kpis.proyectadoMes)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-all", colectadoPct >= 100 ? "bg-emerald-500" : colectadoPct >= 60 ? "bg-amber-400" : "bg-rose-400")}
                  style={{ width: `${colectadoPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pagos este mes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pagos este mes
            </p>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {kpis.countEsteMes}
          </p>
          <p className="mt-1 text-xs text-slate-400">documentos recibidos</p>
        </div>

        {/* Último pago */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Último pago
            </p>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          {kpis.ultimoPagoFecha ? (
            <>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {kpis.ultimoPagoFecha}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">{kpis.ultimoPagoCliente}</p>
              <p className="text-xs font-medium text-emerald-600">{formatCOP(kpis.ultimoPagoMonto ?? 0)}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Sin pagos</p>
          )}
        </div>
      </div>

      {/* Bucket Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Primeros 10 días */}
        <div className="rounded-xl border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Primeros 10 días</p>
                <p className="text-xs text-slate-400">Elegibles para pronto pago</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">
                {buckets.temprano.length}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-emerald-700">
              {formatCOP(buckets.temprano.reduce((s, r) => s + r.total, 0))}
            </p>
          </div>
          <ul className="max-h-64 divide-y divide-slate-50 overflow-y-auto">
            {buckets.temprano.length === 0 ? (
              <li className="px-5 py-4 text-sm text-slate-400">Sin pagos</li>
            ) : buckets.temprano.map((r) => (
              <li key={r.tenantId} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/locales/${r.tenantId}`} className="truncate text-sm font-medium text-slate-800 hover:text-blue-600">
                    {r.clienteName}
                  </Link>
                  {r.unitNumber && (
                    <p className="text-xs text-slate-400">Local {r.unitNumber} · {r.primeraFecha}</p>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-sm font-semibold text-emerald-700">
                  {formatCOP(r.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Del 11 al 30 */}
        <div className="rounded-xl border border-amber-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Del 11 al 30</p>
                <p className="text-xs text-slate-400">Dentro del mes, sin descuento</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-semibold text-amber-700">
                {buckets.tardio.length}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-amber-700">
              {formatCOP(buckets.tardio.reduce((s, r) => s + r.total, 0))}
            </p>
          </div>
          <ul className="max-h-64 divide-y divide-slate-50 overflow-y-auto">
            {buckets.tardio.length === 0 ? (
              <li className="px-5 py-4 text-sm text-slate-400">Sin pagos</li>
            ) : buckets.tardio.map((r) => (
              <li key={r.tenantId} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/locales/${r.tenantId}`} className="truncate text-sm font-medium text-slate-800 hover:text-blue-600">
                    {r.clienteName}
                  </Link>
                  {r.unitNumber && (
                    <p className="text-xs text-slate-400">Local {r.unitNumber} · {r.primeraFecha}</p>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-sm font-semibold text-amber-700">
                  {formatCOP(r.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Desde mora */}
        <div className="rounded-xl border border-rose-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Desde mora</p>
                <p className="text-xs text-slate-400">Pagos aplicados a cartera vencida</p>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-sm font-semibold text-rose-700">
                {buckets.mora.length}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-rose-700">
              {formatCOP(buckets.mora.reduce((s, r) => s + r.total, 0))}
            </p>
          </div>
          <ul className="max-h-64 divide-y divide-slate-50 overflow-y-auto">
            {buckets.mora.length === 0 ? (
              <li className="px-5 py-4 text-sm text-slate-400">Sin pagos</li>
            ) : buckets.mora.map((r) => (
              <li key={r.tenantId} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/locales/${r.tenantId}`} className="truncate text-sm font-medium text-slate-800 hover:text-blue-600">
                    {r.clienteName}
                  </Link>
                  {r.unitNumber && (
                    <p className="text-xs text-slate-400">Local {r.unitNumber} · {r.primeraFecha}</p>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-sm font-semibold text-rose-700">
                  {formatCOP(r.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">Historial de Pagos</h2>
            <p className="text-xs text-slate-400">{pagos.length} movimientos · {month} · Fuente: CSF ERP</p>
          </div>
        </div>

        {pagos.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No hay pagos registrados aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Cliente
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Documento
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Cruce
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Monto
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => {
                  const cfg = STATUS_CFG[p.status] ?? { cls: "bg-slate-100 text-slate-500", label: p.status }
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{p.fechaRecaudo}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{p.clienteName}</p>
                        {p.unitNumber && (
                          <p className="text-xs text-slate-400">Local {p.unitNumber}</p>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs font-mono text-slate-500">
                        {p.siesaDocto ?? "—"}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-xs font-mono text-slate-400">
                        {p.siesaCruce ?? "—"}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-semibold", p.valorFinal < 0 ? "text-rose-600" : "text-slate-900")}>
                        {formatCOP(p.valorFinal)}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/locales/${p.tenantId}`} className="text-xs text-blue-600 hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
