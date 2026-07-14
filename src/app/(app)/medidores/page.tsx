export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getMedidoresAdmin, getUnitsWithMeters, getMeterYears } from "@/lib/data/medidores"
import { formatCOP } from "@/lib/formatters"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { CheckCircle, Clock, AlertCircle, Zap, FileText } from "lucide-react"
import { MedidoresAdminTable } from "@/components/medidores/medidores-admin-table"
import Link from "next/link"
import { isValidPeriodo, isValidYear } from "@/lib/security/validators"
import { MedidoresFilter } from "@/components/medidores/medidores-filter"
import { lecturaPeriodo } from "@/lib/periodo"

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function buildPeriodos(year: number) {
  // A reading always belongs to the PREVIOUS month, so the current month is never
  // a valid period — offering it lets an admin file a reading under a month that
  // has no invoice (tarifa 0, total 0).
  const [maxYear, maxMonth] = lecturaPeriodo().split("-").map(Number)
  const lastMonth = year < maxYear ? 12 : year === maxYear ? maxMonth : 0
  const periodos = []
  for (let m = 1; m <= lastMonth; m++) {
    periodos.push({
      label: MONTH_LABELS[m - 1],
      value: `${year}-${String(m).padStart(2, "0")}`,
    })
  }
  return periodos
}

export default async function MedidoresPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; year?: string }>
}) {
  const { periodo: periodoParam, year: yearParam } = await searchParams
  const now = new Date()
  const selectedYear = isValidYear(yearParam) ? Number(yearParam) : now.getFullYear()
  // Default to the measurement month: day-9 readings are stored under the PREVIOUS month
  const defaultPeriodo = lecturaPeriodo()
  const periodo = isValidPeriodo(periodoParam) ? periodoParam : defaultPeriodo
  const PERIODOS = buildPeriodos(selectedYear)

  const empresaId = await getEmpresaCkreaId()

  const [rows, units, years] = await Promise.all([
    getMedidoresAdmin(empresaId, periodo),
    getUnitsWithMeters(empresaId),
    getMeterYears(),
  ])

  const registradas  = rows.filter((r) => r.status === "registrada")
  const sinLectura   = rows.filter((r) => r.status === "sin_lectura")
  const totalKwh     = registradas.reduce((s, r) => s + (r.kwh ?? 0), 0)
  const totalEnergia = registradas.reduce((s, r) => s + (r.totalEnergia ?? 0), 0)

  const periodoLabel = MONTH_LABELS[Number(periodo.split("-")[1]) - 1] ?? periodo

  return (
    <>
      <PageHeader title="Medidores de Energía">
        <Link
          href={`/medidores/facturas?periodo=${periodo}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <FileText className="h-4 w-4 text-slate-500" />
          Facturas de Energía
        </Link>
      </PageHeader>

      <MedidoresFilter
        years={years}
        periodos={PERIODOS}
        selectedYear={selectedYear}
        selectedPeriodo={periodo}
      />

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Unidades</p>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{rows.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">Con medidor eléctrico</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Registradas</p>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600">{registradas.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">de {rows.length} unidades</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Sin Lectura</p>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-500">{sinLectura.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">{periodoLabel} {periodo.split("-")[0]}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total kWh</p>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{totalKwh.toLocaleString("es-CO")}</p>
          <p className="mt-0.5 text-xs text-slate-400 truncate">{formatCOP(totalEnergia)}</p>
        </div>
      </div>

      {/* Admin table */}
      <MedidoresAdminTable rows={rows} units={units} periodo={periodo} />
    </>
  )
}
