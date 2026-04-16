export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  getTenantDetail,
  getTenantCartera,
  getTenantPayments,
  getContractPhases,
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
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [detail, cartera, pagos] = await Promise.all([
    getTenantDetail(id),
    getTenantCartera(id),
    getTenantPayments(id),
  ])

  if (!detail) notFound()

  const phases = detail.contractId ? await getContractPhases(detail.contractId) : []

  const saldoTotal = cartera.reduce((s, c) => s + c.saldo, 0)
  const valorVencidoTotal = cartera.reduce((s, c) => s + c.valorVencido, 0)
  const interesTotal = cartera.reduce((s, c) => s + c.interesAcumulado, 0)
  const maxDias = cartera.length ? Math.max(...cartera.map((c) => c.diasMora)) : 0

  const displayName = detail.nombreCorto ?? detail.razonSocial

  return (
    <>
      <PageHeader title={displayName}>
        <Link
          href="/clientes"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </Link>
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

          {/* Contract + unit */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contrato Vigente
            </h2>
            {detail.contractId ? (
              <div className="space-y-3">
                <div>
                  {(() => {
                    const cfg =
                      CONTRACT_STATUS_CONFIG[
                        detail.contractStatus as keyof typeof CONTRACT_STATUS_CONFIG
                      ] ?? { cls: "bg-slate-100 text-slate-500", label: detail.contractStatus }
                    return (
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          cfg.cls,
                        )}
                      >
                        {cfg.label}
                      </span>
                    )
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Local</p>
                    <p className="text-lg font-bold text-slate-900">
                      {detail.unitNumber ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Entrada</p>
                    <p className="text-slate-700">{detail.entrada ?? "—"}</p>
                  </div>
                  {detail.clasificacion && (
                    <div>
                      <p className="text-xs text-slate-400">Clasificación</p>
                      <p className="text-slate-700">{detail.clasificacion}</p>
                    </div>
                  )}
                  {detail.areaM2 && (
                    <div>
                      <p className="text-xs text-slate-400">Área</p>
                      <p className="text-slate-700">{detail.areaM2} m²</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400">Inicio</p>
                    <p className="text-slate-700">{detail.fechaInicio ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Fin</p>
                    <p className="text-slate-700">{detail.fechaFin ?? "Indefinido"}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400">Canon Base</p>
                  <p className="mt-0.5 text-xl font-bold text-slate-900">
                    {formatCOP(detail.canonBase)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                    {detail.descuentoPct > 0 && (
                      <span>Descuento fase: {formatPercent(detail.descuentoPct)}</span>
                    )}
                    {detail.prontoPagoPct > 0 && (
                      <span>Pronto pago: {formatPercent(detail.prontoPagoPct)}</span>
                    )}
                  </div>
                  {detail.descripcionDescuentos && (
                    <p className="mt-2 text-xs text-slate-400">
                      {detail.descripcionDescuentos}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin contrato activo</p>
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

        {/* Contract phases */}
        {phases.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800">Fases del Contrato</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {phases.map((phase) => (
                <div key={phase.id} className="flex items-center gap-4 px-5 py-3">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      phase.isActive ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{phase.name}</p>
                    <p className="text-xs text-slate-400">
                      {phase.startDate} — {phase.endDate ?? "vigente"}
                      {phase.descuentoPct > 0 &&
                        ` · Dto: ${formatPercent(phase.descuentoPct)}`}
                      {phase.prontoPagoPct > 0 &&
                        ` · PP: ${formatPercent(phase.prontoPagoPct)}`}
                    </p>
                  </div>
                  {phase.isActive && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Activa
                    </span>
                  )}
                </div>
              ))}
            </div>
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
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Monto Aplicado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Pronto Pago
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
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
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCOP(p.valorAplicado)}
                        </td>
                        <td className="px-4 py-3 text-emerald-600">
                          {p.prontoPagoAplicado > 0 ? formatCOP(p.prontoPagoAplicado) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCOP(p.valorFinal)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {p.concepto ?? (p.siesaDocto ? `Doc: ${p.siesaDocto}` : "—")}
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
                      </tr>
                    )
                  })}
                </tbody>
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
