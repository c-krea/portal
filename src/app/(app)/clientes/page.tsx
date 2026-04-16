import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { getClienteRows } from "@/lib/data/clientes"

export default async function ClientesPage() {
  const rows = await getClienteRows()

  return (
    <>
      <PageHeader title="Clientes" />
      <ClientesTable data={rows} />
    </>
  )
}
