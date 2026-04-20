export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { BackButton } from "@/components/shared/back-button"
import {
  getTenantDetail,
  getTenantContracts,
  getTenantCartera,
  getTenantPayments,
} from "@/lib/data/tenant-detail"
import { PageHeader } from "@/components/layout/page-header"
import { CarteraTable } from "@/components/clientes/cartera-table"
import { formatCOP, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const CONTRACT_STATUS_CONFIG = {
  activo: { cls: "bg-emerald-50 text-emerald-700", label: "Activo" },
  critico: { cls: "bg-rose-50 text-rose-700", label: "Crítico" },
  vencido: { cls: "bg-amber-50 text-amber-700", label: "Vencido" },
  terminado: { cls: "bg-slate-100 text-slate-500", label: "Terminado" },
} as const

const PAYMENT_STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  recaudado: { cls: "bg-emerald-50 text-emerald-700", label: "Recaudado" },
  parcial: { cls: "bg-amber-50 text-amber-700", label: "Parcial" },
  vencido: { cls: "bg-rose-50 text-rose-700", label: "Vencido" },
  no_proyectado: { cls: "bg-slate-100 text-slate-500", label: "No Proyectado" },
  anulado: { cls: "bg-slate-100 text-slate-400", label: "Anulado" },
}

const CLASIFICACION_CONFIG: Record<string, { cls: string; label: string }> = {
  RECAUDADO: { cls: "bg-emerald-50 text-emerald-700", label: "Recaudado" },
  "NO PROYECTADO": { cls: "bg-slate-100 text-slate-500", label: "No proyectado" },
  VENCIDO: { cls: "bg-rose-50 text-rose-700", label: "Vencido" },
}

function KpiCard({
  label,
  value,
  warning,
}: {
  label: string
  value: string
  warning?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold",
          warning ? "text-rose-600" : "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  )
}

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ unit?: string }>
}) {
  const { id } = await params
  const { unit } = await searchParams

  const [detail, contracts, cartera, pagos] = await Promise.all([
    getTenantDetail(id, unit),
    getTenantContracts(id),
    getTenantCartera(id),
    getTenantPayments(id),
  ])

  if (!detail) notFound()

  const saldoTotal = cartera.reduce((s, c) => s + c.saldo, 0)
  const valorVencidoTotal = cartera.reduce((s, c) => s + c.valorVencido, 0)
  const interesTotal = cartera.reduce((s, c) => s + c.interesAcumulado, 0)
  const maxDias = cartera.length ? Math.max(...cartera.map((c) => c.diasMora)) : 0

  const displayName = detail.nombreCorto ?? detail.razonSocial

  return (
    <>
      <PageHeader title={displayName}>
        <BackButton label="Locales" />
      </PageHeader>

      <div className="space-y-6">
        {/* Tenant + Contract cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Tenant info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datos del Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Razón Social</p>
                <p className="font-medium text-slate-900">{detail.razonSocial}</p>
              </div>
              {detail.nombreCorto && detail.nombreCorto !== detail.razonSocial && (
                <div>
                  <p className="text-xs text-slate-400">Nombre Corto</p>
                  <p className="text-slate-700">{detail.nombreCorto}</p>
                </div>
              )}
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-slate-400">NIT</p>
                  <p className="font-mono text-sm text-slate-700">{detail.nit}</p>
                </div>
                {detail.condicionPago && (
                  <div>
                    <p className="text-xs text-slate-400">Condición de Pago</p>
                    <p className="text-slate-700">{detail.condicionPago}</p>
                  </div>
                )}
              </div>
              {detail.contactoNombre && (
                <div>
                  <p className="text-xs text-slate-400">Contacto</p>
                  <p className="text-slate-700">{detail.contactoNombre}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-6">
                {detail.email && (
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm text-slate-700">{detail.email}</p>
                  </div>
                )}
                {detail.telefono && (
                  <div>
                    <p className="text-xs text-slate-400">Teléfono</p>
                    <p className="text-slate-700">{detail.telefono}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contracts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Locales ({contracts.length})
            </h2>
            {contracts.length === 0 ? (
              <p className="text-sm text-slate-400">Sin contratos</p>
            ) : (
              <div className="space-y-3">
                {contracts.map((con) => {
                  const cfg =
                    CONTRACT_STATUS_CONFIG[con.contractStatus as keyof typeof CONTRACT_STATUS_CONFIG]
                    ?? { cls: "bg-slate-100 text-slate-500", label: con.contractStatus }
                  return (
                    <div key={con.contractId} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg font-bold text-slate-900">
                          Local {con.unitNumber ?? "—"}
                        </p>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls)}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                        {con.entrada && <span>Entrada: {con.entrada}</span>}
                        {con.areaM2 && <span>Área: {con.areaM2} m²</span>}
                        <span>Inicio: {con.fechaInicio ?? "—"}</span>
                        <span>Fin: {con.fechaFin ?? "Indefinido"}</span>
                      </div>
                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <span className="font-semibold text-slate-800">{formatCOP(con.canonBase)}</span>
                        <span className="ml-1 text-xs text-slate-400">/ mes</span>
                        {(con.descuentoPct > 0 || con.prontoPagoPct > 0) && (
                          <span className="ml-3 text-xs text-slate-400">
                            {con.descuentoPct > 0 && `Dto: ${formatPercent(con.descuentoPct)}`}
                            {con.descuentoPct > 0 && con.prontoPagoPct > 0 && " · "}
                            {con.prontoPagoPct > 0 && `PP: ${formatPercent(con.prontoPagoPct)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cartera KPIs */}
        {cartera.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Saldo Total" value={formatCOP(saldoTotal)} />
            <KpiCard
              label="Valor Vencido"
              value={formatCOP(valorVencidoTotal)}
              warning={valorVencidoTotal > 0}
            />
            <KpiCard
              label="Interés Acumulado"
              value={formatCOP(interesTotal)}
              warning={interesTotal > 0}
            />
            <KpiCard
              label="Máx. Días Mora"
              value={`${maxDias} días`}
              warning={maxDias > 30}
            />
          </div>
        )}

        {/* Cartera table */}
        {cartera.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800">Cartera de Cobro</h2>
              <p className="text-xs text-slate-400">
                {cartera.length} documento{cartera.length !== 1 ? "s" : ""} en cartera
              </p>
            </div>
            <CarteraTable data={cartera} />
          </div>
        )}


        {/* Payment history */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Historial de Pagos</h2>
              {pagos.length > 0 && (
                <p className="text-xs text-slate-400">{pagos.length} pagos registrados</p>
              )}
            </div>
            <Link
              href={`/pagos`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              + Registrar Pago
            </Link>
          </div>
          {pagos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Recibo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Factura</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Aplicado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">PP</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Neto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Clasificación</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => {
                    const clsf = p.siesaClasificacion
                      ? (CLASIFICACION_CONFIG[p.siesaClasificacion] ?? { cls: "bg-slate-100 text-slate-500", label: p.siesaClasificacion })
                      : null
                    return (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600 tabular-nums">{p.fechaRecaudo}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {p.siesaDocto ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {p.siesaCruce ?? (p.concepto ? p.concepto : "—")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {formatCOP(p.valorAplicado)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">
                          {p.prontoPagoAplicado > 0 ? formatCOP(p.prontoPagoAplicado) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                          {formatCOP(p.valorFinal)}
                        </td>
                        <td className="px-4 py-3">
                          {clsf && (
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", clsf.cls)}>
                              {clsf.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-4 py-3 text-xs font-medium text-slate-500">
                      {pagos.length} pagos mostrados
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">
                      {formatCOP(pagos.reduce((s, p) => s + p.valorAplicado, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-600 tabular-nums">
                      {formatCOP(pagos.reduce((s, p) => s + p.prontoPagoAplicado, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900 tabular-nums">
                      {formatCOP(pagos.reduce((s, p) => s + p.valorFinal, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">Sin pagos registrados</p>
              <Link
                href="/pagos"
                className="mt-3 inline-block text-sm text-blue-600 hover:underline"
              >
                Ir a registrar un pago →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
