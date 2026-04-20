export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { getClienteRows, getVacantUnitRows } from "@/lib/data/clientes"

export default async function ClientesPage() {
  const [rows, vacantRows] = await Promise.all([getClienteRows(), getVacantUnitRows()])

  return (
    <>
      <PageHeader title="Locales" />
      <ClientesTable data={rows} vacantUnits={vacantRows} />
    </>
  )
}
