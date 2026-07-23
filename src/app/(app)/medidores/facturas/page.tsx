import { PageHeader } from "@/components/layout/page-header"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityInvoices } from "@/lib/data/electricity"
import { getMeterYears } from "@/lib/data/medidores"
import { InvoiceForm } from "./invoice-form"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { isValidPeriodo, isValidYear } from "@/lib/security/validators"
import { lecturaPeriodo } from "@/lib/periodo"

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function buildPeriodos(year: number) {
  // Invoices arrive ~day 10 for the month that just closed, so the current month
  // is never a valid period.
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


export default async function FacturasEnergiaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; year?: string }>
}) {
  const { periodo: periodoParam, year: yearParam } = await searchParams
  const now = new Date()
  const selectedYear = isValidYear(yearParam) ? Number(yearParam) : now.getFullYear()
  // Default to the measurement month: invoices entered ~day 10 belong to the PREVIOUS month
  const defaultPeriodo = lecturaPeriodo()
  const periodo = isValidPeriodo(periodoParam) ? periodoParam : defaultPeriodo
  const PERIODOS = buildPeriodos(selectedYear)

  const empresaId = await getEmpresaCkreaId()

  const [invoices, years] = await Promise.all([
    getElectricityInvoices(empresaId, periodo),
    getMeterYears(),
  ])

  return (
    <>
      <PageHeader title="Facturas de Energía" />

      <Link
        href="/medidores"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Medidores
      </Link>

      {/* Year + period tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {years.map((y) => {
            const lastMonth = y === now.getFullYear() ? now.getMonth() + 1 : 12
            const yearPeriodo = `${y}-${String(lastMonth).padStart(2, "0")}`
            return (
              <a
                key={y}
                href={`/medidores/facturas?year=${y}&periodo=${yearPeriodo}`}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  y === selectedYear
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {y}
              </a>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {PERIODOS.map((p) => (
            <a
              key={p.value}
              href={`/medidores/facturas?year=${selectedYear}&periodo=${p.value}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                p.value === periodo
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>

        <a
          href={`/api/medidores/export-energia?periodo=${periodo}`}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </a>
      </div>

      <InvoiceForm periodo={periodo} invoices={invoices} />
    </>
  )
}
