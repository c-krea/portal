import { ROLE_COOKIE, roleCookieOptions } from "@/lib/auth/session-cookie"
import { supabaseAdmin, sqlStr } from "@/lib/db/executor"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/"
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Stamp role hint once so gatekeeper stays network-free after magic-link login
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let dest = next
      if (user) {
        const { data: roleRows } = await supabaseAdmin.rpc("exec_sql", {
          q: `SELECT rol FROM v2.perfiles WHERE id = ${sqlStr(user.id)}::uuid LIMIT 1`,
        })
        const rol =
          Array.isArray(roleRows) && roleRows[0]?.rol
            ? String(roleRows[0].rol)
            : "visor"
        cookieStore.set(ROLE_COOKIE, rol, roleCookieOptions())
        // Only override home when caller left "next" at default
        if (rawNext === "/" || !searchParams.get("next")) {
          dest = rol === "inquilino" ? "/portal" : "/"
        }
      }
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
