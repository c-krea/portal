export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { ArchivosClient } from "./archivos-client"
import { getArchivosList } from "./actions"

export default async function ArchivosPage() {
  const archivos = await getArchivosList()

  return (
    <div>
      <PageHeader title="Archivos" />
      <ArchivosClient archivos={archivos} />
    </div>
  )
}
