export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { getClienteRows } from "@/lib/data/clientes"

export default async function ClientesPage() {
  const rows = await getClienteRows()

  return (
    <>
      <PageHeader title="Locales" />
      <ClientesTable data={rows} />
    </>
  )
}
