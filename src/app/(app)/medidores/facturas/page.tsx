export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { execute } from "@/lib/db/executor"
import { getElectricityInvoices } from "@/lib/data/electricity"
import { InvoiceForm } from "./invoice-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
  const selectedYear = yearParam ? Number(yearParam) : now.getFullYear()
  const defaultPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const periodo = periodoParam ?? defaultPeriodo
  const PERIODOS = buildPeriodos(selectedYear)

  const companies = await execute(`SELECT id FROM companies LIMIT 1`)
  const companyId = String(companies[0].id)

  const invoices = await getElectricityInvoices(companyId, periodo)

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
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[2025, 2026].map((y) => (
            <a
              key={y}
              href={`/medidores/facturas?year=${y}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                y === selectedYear
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {y}
            </a>
          ))}
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
