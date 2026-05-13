import { execute, supabaseAdmin } from "@/lib/db/executor"
import type { User } from "@supabase/supabase-js"

async function listAllAuthUsers(): Promise<User[]> {
  const all: User[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const users = data?.users ?? []
    all.push(...users)
    if (users.length < 1000) break
  }
  return all
}

export type UsuarioRow = {
  id: string
  fullName: string
  email: string
  role: "admin" | "finanzas" | "visor" | "inquilino"
  tenantId: string | null
  tenantName: string | null
  isActive: boolean
  createdAt: string
  lastSignIn: string | null
}

export type UnitContract = {
  unitId: string
  unitNumber: string
  entrada: string | null
  contractId: string
  canonBase: number
  descuentoPct: number | null
  prontoPagoPct: number | null
  fechaInicio: string
  fechaFin: string | null
  descripcionDescuentos: string | null
}

export type PortalTenantRow = {
  tenantId: string
  nombre: string
  razonSocial: string
  nit: string | null
  telefono: string | null
  contactoNombre: string | null
  tipoCliente: string | null
  units: string
  unitIds: string[]
  entrada: string | null
  portalEmail: string | null
  businessEmail: string | null
  authUserId: string | null
  lastSignIn: string | null
  unitContracts: UnitContract[]
}

export async function getPortalTenants(): Promise<PortalTenantRow[]> {
  const rows = await execute(`
    SELECT
      t.id,
      COALESCE(t.nombre_corto, t.razon_social) AS nombre,
      t.razon_social,
      t.nit,
      t.telefono,
      t.contacto_nombre,
      t.tipo_cliente,
      t.portal_email,
      t.email_contacto AS business_email,
      STRING_AGG(u.unidad, ', ' ORDER BY u.unidad) AS units,
      STRING_AGG(u.id::text, ',' ORDER BY u.unidad) AS unit_ids,
      MIN(u.entrada)                     AS entrada,
      p.id AS auth_user_id,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'unitId',               u.id::text,
          'unitNumber',           u.unidad,
          'entrada',              u.entrada,
          'contractId',           c.id::text,
          'canonBase',            c.canon_base::numeric,
          'descuentoPct',         c.descuento_pct::numeric,
          'prontoPagoPct',        c.pronto_pago_pct::numeric,
          'fechaInicio',          c.fecha_inicio::text,
          'fechaFin',             c.fecha_fin::text,
          'descripcionDescuentos',c.descripcion_descuentos
        ) ORDER BY u.unidad
      ) AS unit_contracts
    FROM v2.inquilinos t
    JOIN v2.contratos c ON c.inquilino_id = t.id AND c.estado IN ('activo', 'critico')
    JOIN v2.locales u ON u.id = c.local_id
    LEFT JOIN v2.perfiles p ON p.inquilino_id = t.id AND p.rol = 'inquilino'
    WHERE t.activo = true
    GROUP BY t.id, t.nombre_corto, t.razon_social, t.portal_email, t.email_contacto, p.id
    ORDER BY MIN(u.unidad)
  `)

  const authUserIds = rows.map(r => r.auth_user_id).filter(Boolean) as string[]
  const lastSignInMap = new Map<string, string | null>()
  const authEmailMap  = new Map<string, string>()

  if (authUserIds.length > 0) {
    const users = await listAllAuthUsers()
    for (const u of users) {
      lastSignInMap.set(u.id, u.last_sign_in_at ?? null)
      if (u.email) authEmailMap.set(u.id, u.email)
    }
  }

  return rows.map(r => {
    const authUserId  = r.auth_user_id ? String(r.auth_user_id) : null
    const authEmail   = authUserId ? (authEmailMap.get(authUserId) ?? null) : null
    const rawContracts = (r.unit_contracts as UnitContract[]) ?? []
    const unitContracts: UnitContract[] = rawContracts.map(uc => ({
      unitId:               String(uc.unitId),
      unitNumber:           String(uc.unitNumber),
      entrada:              uc.entrada ? String(uc.entrada) : null,
      contractId:           String(uc.contractId),
      canonBase:            Number(uc.canonBase),
      descuentoPct:         uc.descuentoPct != null ? Number(uc.descuentoPct) : null,
      prontoPagoPct:        uc.prontoPagoPct != null ? Number(uc.prontoPagoPct) : null,
      fechaInicio:          String(uc.fechaInicio),
      fechaFin:             uc.fechaFin ? String(uc.fechaFin) : null,
      descripcionDescuentos: uc.descripcionDescuentos ? String(uc.descripcionDescuentos) : null,
    }))
    return {
      tenantId:             String(r.id),
      nombre:               String(r.nombre),
      razonSocial:          String(r.razon_social),
      nit:                  r.nit ? String(r.nit) : null,
      telefono:             r.telefono ? String(r.telefono) : null,
      contactoNombre:       r.contacto_nombre ? String(r.contacto_nombre) : null,
      tipoCliente:          r.tipo_cliente ? String(r.tipo_cliente) : null,
      units:                String(r.units),
      unitIds:              String(r.unit_ids).split(","),
      entrada:              r.entrada ? String(r.entrada) : null,
      portalEmail:          authEmail ?? (r.portal_email ? String(r.portal_email) : null),
      businessEmail:        r.business_email ? String(r.business_email) : null,
      authUserId,
      lastSignIn:           authUserId ? (lastSignInMap.get(authUserId) ?? null) : null,
      unitContracts,
      }
  })
}

export async function getUsuarios(): Promise<UsuarioRow[]> {
  const rows = await execute(`
    SELECT
      p.id,
      p.nombre_completo  AS full_name,
      p.email,
      p.rol              AS role,
      p.inquilino_id     AS tenant_id,
      COALESCE(t.nombre_corto, t.razon_social) AS tenant_name,
      p.activo           AS is_active,
      p.created_at
    FROM v2.perfiles p
    LEFT JOIN v2.inquilinos t ON p.inquilino_id = t.id
    WHERE p.rol != 'inquilino'
    ORDER BY p.created_at DESC
  `)

  const users = await listAllAuthUsers()
  const lastSignInMap = new Map<string, string | null>()
  for (const u of users) {
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
