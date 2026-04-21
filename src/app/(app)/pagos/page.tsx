export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getPagos, getPagosKPIs } from "@/lib/data/pagos"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { TrendingUp, TrendingDown, CreditCard, Clock } from "lucide-react"

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  recaudado:     { cls: "bg-emerald-50 text-emerald-700", label: "Recaudado" },
  parcial:       { cls: "bg-amber-50 text-amber-700",     label: "Parcial" },
  vencido:       { cls: "bg-rose-50 text-rose-700",       label: "Vencido" },
  no_proyectado: { cls: "bg-slate-100 text-slate-500",    label: "No Proyectado" },
  anulado:       { cls: "bg-slate-100 text-slate-400",    label: "Anulado" },
}

export default async function PagosPage() {
  const [kpis, pagos] = await Promise.all([
    getPagosKPIs(),
    getPagos(200),
  ])

  const mesAnteriorDiff = kpis.totalEsteMes - kpis.totalMesAnterior
  const mesAnteriorPct = kpis.totalMesAnterior > 0
    ? ((mesAnteriorDiff / kpis.totalMesAnterior) * 100).toFixed(1)
    : null

  return (
    <>
      <PageHeader title="Pagos" />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Recaudado este mes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Recaudado este mes
            </p>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCOP(kpis.totalEsteMes)}
          </p>
          {mesAnteriorPct && (
            <div className={cn("mt-1 flex items-center gap-1 text-xs", mesAnteriorDiff >= 0 ? "text-emerald-600" : "text-rose-500")}>
              {mesAnteriorDiff >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              <span>{mesAnteriorDiff >= 0 ? "+" : ""}{mesAnteriorPct}% vs mes anterior</span>
            </div>
          )}
        </div>

        {/* Recaudado mes anterior */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Mes anterior
            </p>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCOP(kpis.totalMesAnterior)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Referencia comparativa</p>
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

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">Historial de Pagos</h2>
            <p className="text-xs text-slate-400">Últimos {pagos.length} movimientos · Fuente: CSF ERP</p>
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
