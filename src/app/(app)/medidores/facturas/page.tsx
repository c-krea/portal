import { PageHeader } from "@/components/layout/page-header"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityInvoices } from "@/lib/data/electricity"
import { InvoiceForm } from "./invoice-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { isValidPeriodo } from "@/lib/security/validators"
import { lecturaPeriodo } from "@/lib/periodo"

const MES_NOMBRE = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

// The period is no longer pickable here (it's chosen on /medidores), so it has
// to stay visible: these inputs are real money and typing them into the wrong
// month is silent and expensive.
function periodoLabel(p: string): string {
  const [y, m] = p.split("-")
  return MES_NOMBRE[Number(m) - 1] ? `${MES_NOMBRE[Number(m) - 1]} ${y}` : p
}

export default async function FacturasEnergiaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: periodoParam } = await searchParams
  // Default to the measurement month: invoices entered ~day 10 belong to the PREVIOUS month
  const defaultPeriodo = lecturaPeriodo()
  const periodo = isValidPeriodo(periodoParam) ? periodoParam : defaultPeriodo

  const empresaId = await getEmpresaCkreaId()

  const invoices = await getElectricityInvoices(empresaId, periodo)

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-baseline gap-2">
            Ingreso Facturas
            <span className="text-base font-medium text-slate-500">{periodoLabel(periodo)}</span>
          </span>
        }
      />

      <Link
        href="/medidores"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Medidores
      </Link>

      <InvoiceForm periodo={periodo} invoices={invoices} />
    </>
  )
}
