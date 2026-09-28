import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { execute } from "@/lib/db/executor"
import { assertUuid } from "@/lib/security/validators"
import { unstable_cache, updateTag } from "next/cache"
import { CACHE_TTL_SECONDS } from "@/lib/cache"
import type { User } from "@supabase/supabase-js"

export type StaffProfile = {
  userId: string
  email: string | null
  rol: string
  nombreCompleto: string
}

/**
 * Prefer identity stamped by proxy (already verified via getUser there).
 * Falls back to getUser() for server actions / API routes (no proxy headers).
 * React cache → at most one Auth call per request tree when fallback runs.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const h = await headers()
  const headerId = h.get("x-user-id")
  if (headerId && /^[0-9a-f-]{36}$/i.test(headerId)) {
    const email = h.get("x-user-email")
    // Minimal User-shaped object for id/email consumers (full User not needed)
    return {
      id: headerId,
      email: email || undefined,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "",
    } as User
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export async function requireUser(): Promise<User> {
  const user = await getAuthUser()
  if (!user) redirect("/login")
  return user
}

type ProfileRow = { rol: string; nombreCompleto: string }

async function loadProfileRow(userId: string): Promise<ProfileRow | null> {
  assertUuid(userId)
  const rows = await execute(`
    SELECT rol, nombre_completo
    FROM v2.perfiles
    WHERE id = '${userId}'::uuid
    LIMIT 1
  `)
  const r = rows[0]
  if (!r) return null
  return {
    rol: String(r.rol),
    nombreCompleto: String(r.nombre_completo ?? ""),
  }
}

/** Thrown inside the cross-request cache so a missing profile is never stored.
 *  Only this sentinel maps to null — real DB errors still propagate. */
class ProfileMissingError extends Error {}

/** Cross-request cache: role/name almost never change mid-day.
 *  A miss throws so null is never stored — the next request refetches. */
function getCachedProfileRow(userId: string): Promise<ProfileRow | null> {
  return unstable_cache(
    async () => {
      const row = await loadProfileRow(userId)
      if (!row) throw new ProfileMissingError()
      return row
    },
    ["session-profile", userId],
    { revalidate: CACHE_TTL_SECONDS, tags: ["profiles", `profile:${userId}`] },
  )().catch((e) => {
    if (e instanceof ProfileMissingError) return null
    throw e
  })
}

/** Layout + pages share this within one request; profile row cached 60 min across requests. */
export const getSessionProfile = cache(async (): Promise<StaffProfile | null> => {
  const user = await getAuthUser()
  if (!user) return null
  const row = await getCachedProfileRow(user.id)
  if (!row) return null
  return {
    userId: user.id,
    email: user.email ?? null,
    rol: row.rol,
    nombreCompleto: row.nombreCompleto || user.email || "Usuario",
  }
})

/** Admin app shell — tenants bounced to /portal. */
export async function requireStaff(): Promise<StaffProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect("/login")
  if (profile.rol === "inquilino") redirect("/portal")
  return profile
}

/** Tenant portal shell — staff bounced to /. */
export async function requireInquilino(): Promise<StaffProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect("/login")
  if (profile.rol !== "inquilino") redirect("/")
  return profile
}

/** Server actions: no redirect, return error object. */
export async function requireStaffAction(
  allowedRoles: string[] = ["admin", "finanzas", "visor"],
): Promise<{ profile: StaffProfile } | { error: string }> {
  const profile = await getSessionProfile()
  if (!profile) return { error: "No autorizado" }
  if (profile.rol === "inquilino" || !allowedRoles.includes(profile.rol)) {
    return { error: "Permiso denegado" }
  }
  return { profile }
}

export async function requireAdminAction(): Promise<
  { profile: StaffProfile } | { error: string }
> {
  return requireStaffAction(["admin"])
}

export async function requireAdminOrFinanzasAction(): Promise<
  { profile: StaffProfile } | { error: string }
> {
  return requireStaffAction(["admin", "finanzas"])
}

/** Call after role/name changes so the next page load refetches perfil.
 *  updateTag expires immediately (next request blocks for fresh data).
 *  revalidateTag(tag, "max") would serve the stale row once — wrong here.
 *  Server Actions only (login, admin writes); never call during page render. */
export function bustProfileCache(userId?: string): void {
  updateTag("profiles")
  if (userId) updateTag(`profile:${userId}`)
}
