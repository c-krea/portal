import { PageHeader } from "@/components/layout/page-header"
import { RegistrarPagoForm } from "@/components/pagos/registrar-pago-form"
import { getRecentPagos, getActiveTenantOptions } from "@/lib/data/pagos"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import Link from "next/link"

const PAYMENT_STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  recaudado: { cls: "bg-emerald-50 text-emerald-700", label: "Recaudado" },
  parcial: { cls: "bg-amber-50 text-amber-700", label: "Parcial" },
  vencido: { cls: "bg-rose-50 text-rose-700", label: "Vencido" },
  no_proyectado: { cls: "bg-slate-100 text-slate-500", label: "No Proyectado" },
  anulado: { cls: "bg-slate-100 text-slate-400", label: "Anulado" },
}

export default async function PagosPage() {
  const [pagos, tenants] = await Promise.all([
    getRecentPagos(30),
    getActiveTenantOptions(),
  ])

  const totalRecaudado = pagos.reduce((s, p) => s + p.valorFinal, 0)

  return (
    <>
      <PageHeader title="Pagos" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form panel */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Registrar Pago
            </h2>
            <RegistrarPagoForm tenants={tenants} />
          </div>

          {/* Summary card */}
          {pagos.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total Recaudado (últimos {pagos.length})</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatCOP(totalRecaudado)}
              </p>
            </div>
          )}
        </div>

        {/* Payments list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800">Historial de Pagos</h2>
              {pagos.length > 0 && (
                <p className="text-xs text-slate-400">Últimos {pagos.length} pagos</p>
              )}
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Estado
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p) => {
                      const cfg =
                        PAYMENT_STATUS_CONFIG[p.status] ?? {
                          cls: "bg-slate-100 text-slate-500",
                          label: p.status,
                        }
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-slate-50 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-slate-600">{p.fechaRecaudo}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{p.clienteName}</p>
                            {p.unitNumber && (
                              <p className="text-xs text-slate-400">Local {p.unitNumber}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {formatCOP(p.valorFinal)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {p.concepto ??
                              (p.siesaDocto ? `Doc: ${p.siesaDocto}` : "—")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                cfg.cls,
                              )}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/clientes/${p.tenantId}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Ver cliente
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
        </div>
      </div>
    </>
  )
}
