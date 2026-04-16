import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export type UsuarioRow = {
  id: string
  fullName: string
  email: string
  role: "admin" | "finance" | "viewer" | "tenant"
  tenantId: string | null
  tenantName: string | null
  isActive: boolean
  createdAt: string
}

export async function getUsuarios(): Promise<UsuarioRow[]> {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.role,
      p.tenant_id,
      COALESCE(t.nombre_corto, t.razon_social) AS tenant_name,
      p.is_active,
      p.created_at
    FROM profiles p
    LEFT JOIN tenants t ON p.tenant_id = t.id
    ORDER BY p.created_at DESC
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id:         String(r.id),
    fullName:   String(r.full_name),
    email:      String(r.email),
    role:       String(r.role) as UsuarioRow["role"],
    tenantId:   r.tenant_id ? String(r.tenant_id) : null,
    tenantName: r.tenant_name ? String(r.tenant_name) : null,
    isActive:   Boolean(r.is_active),
    createdAt:  String(r.created_at),
  }))
}
