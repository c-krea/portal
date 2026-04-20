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
  lastSignIn: string | null
}

export type PortalTenantRow = {
  tenantId: string
  nombre: string
  units: string
  unitIds: string[]
  portalEmail: string | null
  businessEmail: string | null
  authUserId: string | null
  lastSignIn: string | null
  // contract (null for multi-unit tenants — edit via Clientes)
  contractId: string | null
  canonBase: number | null
  descuentoPct: number | null
  prontoPagoPct: number | null
  fechaInicio: string | null
  fechaFin: string | null
  descripcionDescuentos: string | null
}

export async function getPortalTenants(): Promise<PortalTenantRow[]> {
  const rows = await execute(`
    SELECT
      t.id,
      COALESCE(t.nombre_corto, t.razon_social) AS nombre,
      t.portal_email,
      t.email AS business_email,
      STRING_AGG(u.unit_number, ', ' ORDER BY u.unit_number) AS units,
      STRING_AGG(u.id::text, ',' ORDER BY u.unit_number) AS unit_ids,
      p.id AS auth_user_id,
      MIN(c.id::text)                    AS contract_id,
      MIN(c.canon_base::numeric)         AS canon_base,
      MIN(c.descuento_pct::numeric)      AS descuento_pct,
      MIN(c.pronto_pago_pct::numeric)    AS pronto_pago_pct,
      MIN(c.fecha_inicio::text)          AS fecha_inicio,
      MIN(c.fecha_fin::text)             AS fecha_fin,
      MIN(c.descripcion_descuentos)      AS descripcion_descuentos
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
  const authEmailMap  = new Map<string, string>()

  if (authUserIds.length > 0) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    for (const u of data?.users ?? []) {
      lastSignInMap.set(u.id, u.last_sign_in_at ?? null)
      if (u.email) authEmailMap.set(u.id, u.email)
    }
  }

  // Backfill portal_email from auth.users for any tenant whose DB value is stale/missing
  const backfills: Promise<unknown>[] = []
  for (const r of rows) {
    if (!r.auth_user_id) continue
    const authEmail = authEmailMap.get(String(r.auth_user_id))
    if (authEmail && authEmail !== r.portal_email) {
      backfills.push(
        supabaseAdmin
          .from("tenants")
          .update({ portal_email: authEmail })
          .eq("id", String(r.id))
      )
    }
  }
  if (backfills.length > 0) await Promise.all(backfills)

  return rows.map(r => {
    const authUserId  = r.auth_user_id ? String(r.auth_user_id) : null
    const authEmail   = authUserId ? (authEmailMap.get(authUserId) ?? null) : null
    return {
      tenantId:      String(r.id),
      nombre:        String(r.nombre),
      units:         String(r.units),
      unitIds:       String(r.unit_ids).split(","),
      portalEmail:   authEmail ?? (r.portal_email ? String(r.portal_email) : null),
      businessEmail: r.business_email ? String(r.business_email) : null,
      authUserId,
      lastSignIn:           authUserId ? (lastSignInMap.get(authUserId) ?? null) : null,
      contractId:           r.contract_id ? String(r.contract_id) : null,
      canonBase:            r.canon_base != null ? Number(r.canon_base) : null,
      descuentoPct:         r.descuento_pct != null ? Number(r.descuento_pct) : null,
      prontoPagoPct:        r.pronto_pago_pct != null ? Number(r.pronto_pago_pct) : null,
      fechaInicio:          r.fecha_inicio ? String(r.fecha_inicio) : null,
      fechaFin:             r.fecha_fin ? String(r.fecha_fin) : null,
      descripcionDescuentos: r.descripcion_descuentos ? String(r.descripcion_descuentos) : null,
    }
  })
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
    WHERE p.role != 'tenant'
    ORDER BY p.created_at DESC
  `)

  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const lastSignInMap = new Map<string, string | null>()
  for (const u of authData?.users ?? []) {
    lastSignInMap.set(u.id, u.last_sign_in_at ?? null)
  }

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id:         String(r.id),
    fullName:   String(r.full_name),
    email:      String(r.email),
    role:       String(r.role) as UsuarioRow["role"],
    tenantId:   r.tenant_id ? String(r.tenant_id) : null,
    tenantName: r.tenant_name ? String(r.tenant_name) : null,
    isActive:   Boolean(r.is_active),
    createdAt:  String(r.created_at),
    lastSignIn: lastSignInMap.get(String(r.id)) ?? null,
  }))
}
