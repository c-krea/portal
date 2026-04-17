export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getMedidoresAdmin, getUnitsWithMeters } from "@/lib/data/medidores"
import { formatCOP } from "@/lib/formatters"
import { execute } from "@/lib/db/executor"
import { CheckCircle, Clock, AlertCircle, Zap } from "lucide-react"
import { MedidoresAdminTable } from "@/components/medidores/medidores-admin-table"

const PERIODOS = [
  { label: "Ene", value: "2026-01" },
  { label: "Feb", value: "2026-02" },
  { label: "Mar", value: "2026-03" },
  { label: "Abr", value: "2026-04" },
]

export default async function MedidoresPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  const periodo = periodoParam ?? "2026-04"

  const companies = await execute(`SELECT id FROM companies LIMIT 1`)
  const companyId = String(companies[0].id)

  const [rows, units] = await Promise.all([
    getMedidoresAdmin(companyId, periodo),
    getUnitsWithMeters(companyId),
  ])

  const registradas  = rows.filter((r) => r.status === "registrada")
  const sinLectura   = rows.filter((r) => r.status === "sin_lectura")
  const totalKwh     = registradas.reduce((s, r) => s + (r.kwh ?? 0), 0)
  const totalEnergia = registradas.reduce((s, r) => s + (r.totalEnergia ?? 0), 0)

  const periodoLabel = PERIODOS.find((p) => p.value === periodo)?.label ?? periodo

  return (
    <>
      <PageHeader title="Medidores de Energía" />

      {/* Period tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {PERIODOS.map((p) => (
          <a
            key={p.value}
            href={`/medidores?periodo=${p.value}`}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
              p.value === periodo
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Unidades</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{rows.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">Con medidor eléctrico</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Registradas</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{registradas.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">de {rows.length} unidades</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Sin Lectura</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-500">{sinLectura.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">{periodoLabel} 2026</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total kWh</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalKwh.toLocaleString("es-CO")}</p>
          <p className="mt-0.5 text-xs text-slate-400">{formatCOP(totalEnergia)}</p>
        </div>
      </div>

      {/* Notice banner — OCR feature coming */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <span>
          <strong>WOR-47 — Próximamente:</strong> Inquilinos subirán foto del contador desde el portal.
          El sistema validará automáticamente vs. promedio de 3 meses (±10%).
          Sin foto → se cobra 1.5× el promedio. Plazo: primeros 10 días del mes.
        </span>
      </div>

      {/* Admin table */}
      <MedidoresAdminTable rows={rows} units={units} periodo={periodo} />
    </>
  )
}
