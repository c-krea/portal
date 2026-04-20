import { execute, supabaseAdmin } from "@/lib/db/executor"

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

export type PortalTenantRow = {
  tenantId: string
  nombre: string
  units: string
  portalEmail: string | null
  businessEmail: string | null
  authUserId: string | null
  lastSignIn: string | null
}

export async function getPortalTenants(): Promise<PortalTenantRow[]> {
  const rows = await execute(`
    SELECT
      t.id,
      COALESCE(t.nombre_corto, t.razon_social) AS nombre,
      t.portal_email,
      t.email AS business_email,
      STRING_AGG(u.unit_number, ', ' ORDER BY u.unit_number) AS units,
      p.id AS auth_user_id
    FROM tenants t
    JOIN contracts c ON c.tenant_id = t.id AND c.status = 'activo'
    JOIN units u ON u.id = c.unit_id
    LEFT JOIN profiles p ON p.tenant_id = t.id AND p.role = 'tenant'
    WHERE t.is_active = true
    GROUP BY t.id, t.nombre_corto, t.razon_social, t.portal_email, t.email, p.id
    ORDER BY MIN(u.unit_number)
  `)

  const authUserIds = rows.map(r => r.auth_user_id).filter(Boolean) as string[]
  const lastSignInMap = new Map<string, string | null>()

  if (authUserIds.length > 0) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    for (const u of data?.users ?? []) {
      lastSignInMap.set(u.id, u.last_sign_in_at ?? null)
    }
  }

  return rows.map(r => ({
    tenantId:      String(r.id),
    nombre:        String(r.nombre),
    units:         String(r.units),
    portalEmail:   r.portal_email ? String(r.portal_email) : null,
    businessEmail: r.business_email ? String(r.business_email) : null,
    authUserId:    r.auth_user_id ? String(r.auth_user_id) : null,
    lastSignIn:    r.auth_user_id
      ? (lastSignInMap.get(String(r.auth_user_id)) ?? null)
      : null,
  }))
}

export async function getUsuarios(): Promise<UsuarioRow[]> {
  const rows = await execute(`
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
