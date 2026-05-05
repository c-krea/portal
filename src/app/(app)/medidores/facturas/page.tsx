export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityInvoices } from "@/lib/data/electricity"
import { getMeterYears } from "@/lib/data/medidores"
import { InvoiceForm } from "./invoice-form"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { isValidPeriodo, isValidYear } from "@/lib/security/validators"

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function buildPeriodos(year: number) {
  const now = new Date()
  const maxMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const periodos = []
  for (let m = 1; m <= maxMonth; m++) {
    periodos.push({
      label: MONTH_LABELS[m - 1],
      value: `${year}-${String(m).padStart(2, "0")}`,
    })
  }
  return periodos
}

function periodoLabel(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" })
}

export default async function FacturasEnergiaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; year?: string }>
}) {
  const { periodo: periodoParam, year: yearParam } = await searchParams
  const now = new Date()
  const selectedYear = isValidYear(yearParam) ? Number(yearParam) : now.getFullYear()
  const defaultPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
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

      {/* Info banner */}
      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <strong>¿Cómo funciona?</strong> Ingresa los valores de cada factura del mes de{" "}
        <strong>{periodoLabel(periodo)}</strong>. La tarifa se calcula automáticamente
        (Valor ÷ kWh) y se aplica al consumo de cada unidad en ese grupo de dirección.
      </div>

      <InvoiceForm periodo={periodo} invoices={invoices} />
    </>
  )
}
