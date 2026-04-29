export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { GenerateForm } from "@/components/facturas/generate-form"
import { getFacturas, getFacturaSummary, getAvailablePeriodos } from "@/lib/data/facturas"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { isValidPeriodo } from "@/lib/security/validators"

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  borrador:  { label: "Borrador",  cls: "bg-slate-100 text-slate-600" },
  emitida:   { label: "Emitida",   cls: "bg-blue-100 text-blue-700" },
  pagada:    { label: "Pagada",    cls: "bg-emerald-100 text-emerald-700" },
  parcial:   { label: "Parcial",   cls: "bg-amber-100 text-amber-700" },
  vencida:   { label: "Vencida",   cls: "bg-rose-100 text-rose-700" },
  anulada:   { label: "Anulada",   cls: "bg-slate-100 text-slate-400" },
}

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: rawPeriodo } = await searchParams
  const periodo = isValidPeriodo(rawPeriodo) ? rawPeriodo : undefined
  const [facturas, summary, periodos] = await Promise.all([
    getFacturas(periodo),
    getFacturaSummary(periodo),
    getAvailablePeriodos(),
  ])

  const exportHref = periodo
    ? `/facturas/export?periodo=${periodo}`
    : `/facturas/export`

  return (
    <>
      <PageHeader title="Facturas" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left panel: generate + KPIs */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Generate card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Generar Facturas</h2>
            <GenerateForm />
          </div>

          {/* Siesa export */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-slate-800">Exportar a Siesa</h2>
            <p className="mb-3 text-xs text-slate-400">
              Formato Documentos (FVS) — abre en Excel y carga en Siesa manualmente.
              {periodo && (
                <> Solo período <strong>{periodo}</strong>.</>
              )}
            </p>
            <a
              href={exportHref}
              download
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              ↓ Descargar CSV Siesa
            </a>
            <p className="mt-2 text-xs text-slate-400">
              Pendiente: formato XML FVS oficial (reunión con Siesa requerida)
            </p>
          </div>

          {/* Summary KPIs */}
          {summary.totalFacturas > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                {periodo ? `Período ${periodo}` : "Total General"}
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Facturas</span>
                  <span className="font-semibold text-slate-800">{summary.totalFacturas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total facturado</span>
                  <span className="font-semibold text-slate-800">{formatCOP(summary.totalBruto)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Saldo pendiente</span>
                  <span className="font-semibold text-rose-600">{formatCOP(summary.totalSaldo)}</span>
                </div>
              </div>
              {Object.entries(summary.porEstado).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(summary.porEstado).map(([status, count]) => {
                    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-slate-100 text-slate-500" }
                    return (
                      <span key={status} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cfg.cls)}>
                        {cfg.label}: {count}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel: invoice list */}
        <div className="lg:col-span-3">
          {/* Period filter */}
          {periodos.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Link
                href="/facturas"
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  !periodo
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                Todos
              </Link>
              {periodos.map((p) => (
                <Link
                  key={p}
                  href={`/facturas?periodo=${p}`}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    periodo === p
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {facturas.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm font-medium text-slate-500">No hay facturas generadas aún</p>
                <p className="mt-1 text-xs text-slate-400">
                  Use el formulario para generar facturas para un período.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Local</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cliente</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Período</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Emisión</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Canon</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Saldo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((f) => {
                      const cfg = STATUS_CONFIG[f.status] ?? { label: f.status, cls: "bg-slate-100 text-slate-500" }
                      return (
                        <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="hidden sm:table-cell px-4 py-3 font-mono text-slate-700">{f.unitNumber}</td>
                          <td className="px-4 py-3">
                            <p className="max-w-[160px] truncate font-medium text-slate-900">
                              {f.clienteName}
                            </p>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 text-slate-600">{f.periodo}</td>
                          <td className="hidden md:table-cell px-4 py-3 text-slate-500">{f.fechaEmision}</td>
                          <td className="hidden lg:table-cell px-4 py-3 text-right text-slate-700">
                            {formatCOP(f.subtotalCanon)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCOP(f.total)}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-right font-semibold text-rose-600">
                            {f.saldo > 0 ? formatCOP(f.saldo) : <span className="text-emerald-600">Pagado</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls)}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Link href={`/facturas/${f.id}`} className="text-blue-600 hover:underline">Ver</Link>
                              <Link href={`/locales/${f.tenantId}`} className="hidden sm:inline text-slate-500 hover:underline">Cliente</Link>
                            </div>
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
