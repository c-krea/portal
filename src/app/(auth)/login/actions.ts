"use server"

import { ROLE_COOKIE, roleCookieOptions } from "@/lib/auth/session-cookie"
import { bustProfileCache } from "@/lib/auth/session"
import { supabaseAdmin, sqlStr } from "@/lib/db/executor"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export type LoginState = {
  error?: string
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Ingrese email y contraseña" }
  }

  const rememberMe = formData.get("remember_me") === "1"
  const supabase = await createClient(rememberMe)
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Credenciales incorrectas. Verifique e intente de nuevo." }
  }

  // One role lookup at login only — gatekeeper reuses this cookie (no DB every page)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let rol: string | null = null
  let home = "/"
  if (user) {
    const { data: roleRows } = await supabaseAdmin.rpc("exec_sql", {
      q: `SELECT rol FROM v2.perfiles WHERE id = ${sqlStr(user.id)}::uuid LIMIT 1`,
    })
    if (Array.isArray(roleRows) && roleRows[0]?.rol) {
      rol = String(roleRows[0].rol)
    }
    // Evict this user's cached profile so the first page after login refetches.
    bustProfileCache(user.id)
    if (!rol) {
      await supabase.auth.signOut()
      const cookieStore = await cookies()
      cookieStore.set(ROLE_COOKIE, "", roleCookieOptions(0))
      return { error: "Tu usuario no tiene acceso a C-Krea. Contacta al administrador." }
    }
    home = rol === "inquilino" ? "/portal" : "/"

    const cookieStore = await cookies()
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    cookieStore.set(ROLE_COOKIE, rol, roleCookieOptions(maxAge))
  }

  redirect(home)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.set(ROLE_COOKIE, "", roleCookieOptions(0))
  redirect("/login")
}
