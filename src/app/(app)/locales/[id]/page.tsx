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
import { formatCOP, formatDate, formatDateShort } from "@/lib/formatters"
import { isPpDateEligible } from "@/lib/pronto-pago"
import { cn } from "@/lib/utils"
import { isValidUuid } from "@/lib/security/validators"
import { BadgePercent } from "lucide-react"

const CONTRACT_STATUS_CONFIG = {
  activo: { cls: "bg-emerald-50 text-emerald-700", label: "Activo" },
  critico: { cls: "bg-rose-50 text-rose-700", label: "Crítico" },
  vencido: { cls: "bg-amber-50 text-amber-700", label: "Vencido" },
  terminado: { cls: "bg-slate-100 text-slate-500", label: "Terminado" },
} as const

function KpiCard({
  label,
  value,
  subtitle,
  warning,
}: {
  label: string
  value: string
  subtitle?: string
  warning?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("mt-1 text-sm sm:text-lg font-semibold truncate", warning ? "text-rose-600" : "text-slate-900")}>
        {value}
      </p>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}

const PAGE_SIZE = 10

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ppage?: string }>
}) {
  const { id } = await params
  const { ppage } = await searchParams

  if (!isValidUuid(id)) notFound()

  const rawPage = Math.max(1, parseInt(ppage ?? "1", 10) || 1)

  const [detail, contracts, cartera, { pagos, totalCount, totals }] = await Promise.all([
    getTenantDetail(id),
    getTenantContracts(id),
    getTenantCartera(id),
    getTenantPayments(id, rawPage, PAGE_SIZE),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1
  const page = Math.min(rawPage, totalPages)

  if (!detail) notFound()

  const saldoTotal = cartera.reduce((s, c) => s + c.saldo, 0)
  const valorVencidoTotal = cartera.reduce((s, c) => s + c.valorVencido, 0)
  const interesTotal = cartera.reduce((s, c) => s + c.interesAcumulado, 0)
  const maxDias = cartera.length ? Math.max(...cartera.map((c) => c.diasInterest)) : 0

  // Pronto pago: per-unit rate, valid within 10 calendar days of each invoice's OWN
  // date (invoice on the 1st → last valid day is the 11th). Shared date rule in
  // src/lib/pronto-pago.ts; Bogotá time so this matches the tenant portal exactly.
  const nowCO = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
  const todayDay = nowCO.getDate()
  const todayMidnight = new Date(nowCO.getFullYear(), nowCO.getMonth(), nowCO.getDate())
  const ppByUnit: Record<string, number> = {}
  for (const c of contracts) {
    if (c.unitNumber && c.prontoPagoPct > 0) ppByUnit[c.unitNumber] = c.prontoPagoPct
  }
  const ppDiscountTotal = cartera
    .filter(item => isPpDateEligible(item.fechaFactura, todayMidnight))
    .reduce((sum, item) => {
      const ppPct = item.unidad ? (ppByUnit[item.unidad] ?? 0) : 0
      // PP applies to the net canon (ventas, pre-IVA), never the full balance
      return sum + (ppPct > 0 ? Math.round(item.ventas * ppPct / 100) : 0)
    }, 0)
  const isPpWindow = ppDiscountTotal > 0
  const saldoConPP = saldoTotal - ppDiscountTotal

  return (
    <>
      <PageHeader title={detail.razonSocial}>
        <BackButton label="Locales" />
      </PageHeader>

      <div className="space-y-6">
        {/* Tenant + Contract cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Tenant info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datos del Inquilino
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Razón Social</p>
                <p className="font-medium text-slate-900">{detail.razonSocial}</p>
              </div>
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
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm text-slate-700">{detail.email ?? <span className="text-slate-300">—</span>}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Teléfono</p>
                <p className="text-slate-700">{detail.telefono ?? <span className="text-slate-300">—</span>}</p>
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
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">
                          Local {con.unitNumber ?? "—"}
                          {con.entrada && (
                            <span className="ml-1.5 font-bold text-slate-900">
                              · E{con.entrada === "ZONA 8" ? "8" : con.entrada}
                            </span>
                          )}
                        </p>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls)}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Desde {con.fechaInicio ? formatDate(con.fechaInicio) : "—"}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {formatCOP(con.canonReal > 0 ? con.canonReal : con.canonBase)}
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            {con.canonReal > 0 ? "c/IVA" : "s/IVA"}
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cartera KPIs */}
        {cartera.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isPpWindow ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-emerald-700">Saldo Total</p>
                  <BadgePercent className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="mt-1 text-sm sm:text-lg font-semibold text-emerald-800 truncate">{formatCOP(saldoConPP)}</p>
                <p className="mt-0.5 text-xs text-emerald-600 line-through">{formatCOP(saldoTotal)}</p>
                <p className="mt-0.5 text-[10px] text-emerald-500">c/pronto pago · día {todayDay}</p>
              </div>
            ) : (
              <KpiCard label="Saldo Total" value={formatCOP(saldoTotal)} subtitle="incl. facturas vigentes" />
            )}
            <KpiCard
              label="Valor Vencido"
              value={formatCOP(valorVencidoTotal)}
              warning={valorVencidoTotal > 1000}
            />
            <KpiCard
              label="Interés Est."
              value={formatCOP(interesTotal)}
              warning={interesTotal > 1000}
            />
            <KpiCard
              label="Días en Mora"
              value={maxDias > 0 ? `${maxDias} días` : "—"}
              subtitle={maxDias > 0 ? "desde factura" : undefined}
              warning={maxDias > 30}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Al día</p>
              <p className="text-xs text-emerald-600">Sin saldos pendientes en Siesa</p>
            </div>
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
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Historial de Pagos</h2>
            {totalCount > 0 && (
              <p className="text-xs text-slate-400">{totalCount} pagos registrados</p>
            )}
          </div>
          {pagos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fecha</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Recibo</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Factura</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Aplicado</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">PP</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Días</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => {
                    const isAnticipo = p.valorFinal < 0
                    return (
                      <tr key={p.id} className={cn("border-b border-slate-50 hover:bg-slate-50", isAnticipo && "bg-rose-50/40")}>
                        <td className="px-4 py-3 text-slate-600 tabular-nums">
                          {formatDateShort(p.fechaRecaudo)}
                          {isAnticipo && (
                            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">Anticipo</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 font-mono text-slate-500">
                          {p.siesaDocto ?? "—"}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <span className="font-mono text-slate-500">{p.siesaCruce ?? "—"}</span>
                          {p.fechaFactura && (
                            <span className="ml-1.5 text-xs text-slate-400">
                              {new Date(p.fechaFactura + "T00:00:00").toLocaleDateString("es-CO", { month: "short", year: "numeric" })}
                            </span>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {formatCOP(p.valorAplicado)}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right text-emerald-600 tabular-nums">
                          {p.prontoPagoAplicado > 0 ? formatCOP(p.prontoPagoAplicado) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums">
                          {p.diasDesdeFactura != null ? (
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              p.diasDesdeFactura > 30
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            )}>
                              {p.diasDesdeFactura}d
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", isAnticipo ? "text-rose-600" : "text-slate-900")}>
                          {formatCOP(p.valorFinal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={1} className="px-4 py-3 text-xs font-medium text-slate-500">
                      {pagos.length} pagos
                    </td>
                    <td className="hidden md:table-cell" colSpan={2} />
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">
                      {formatCOP(pagos.reduce((s, p) => s + p.valorAplicado, 0))}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold text-emerald-600 tabular-nums">
                      {formatCOP(pagos.reduce((s, p) => s + p.prontoPagoAplicado, 0))}
                    </td>
                    <td className="hidden sm:table-cell" />
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900 tabular-nums">
                      {formatCOP(pagos.reduce((s, p) => s + p.valorFinal, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">Sin pagos registrados</p>
            </div>
          )}

          {/* Total histórico */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-400">{totalCount} pagos · total histórico</span>
              <div className="flex items-center gap-4 text-xs">
                {totals.prontoPago > 0 && (
                  <span className="text-emerald-600">PP {formatCOP(totals.prontoPago)}</span>
                )}
                <span className="font-semibold text-slate-700">{formatCOP(totals.valorFinal)}</span>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (() => {
            const pages: (number | "…")[] = []
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else {
              pages.push(1)
              if (page > 3) pages.push("…")
              for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
              if (page < totalPages - 2) pages.push("…")
              pages.push(totalPages)
            }
            return (
              <div className="flex items-center gap-1 border-t border-slate-100 px-5 py-3">
                {page > 1 && (
                  <Link href={`?ppage=${page - 1}`} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    ← Anterior
                  </Link>
                )}
                {pages.map((p, i) =>
                  p === "…" ? (
                    <span key={`e-${i}`} className="px-1.5 text-xs text-slate-400">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={`?ppage=${p}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        p === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
                {page < totalPages && (
                  <Link href={`?ppage=${page + 1}`} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    Siguiente →
                  </Link>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}
