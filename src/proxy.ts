import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh session — MUST call getUser() for cookie refresh to work
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — allow through always
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/auth/confirm") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/offline"
  ) {
    return supabaseResponse
  }

  // No session → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => res.cookies.set(name, value))
    return res
  }

  // Role-based routing: inquilino → /portal, admin/others → /(app)
  // Uses exec_sql RPC (public schema) to avoid PostgREST schema-exposure dependency
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: roleRows } = await admin.rpc("exec_sql", {
    q: `SELECT rol FROM v2.perfiles WHERE id = '${user.id}'::uuid LIMIT 1`,
  })
  const rol = Array.isArray(roleRows) && roleRows[0] ? String(roleRows[0].rol) : undefined

  function redirectWithCookies(url: URL): NextResponse {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => res.cookies.set(name, value))
    return res
  }

  if (rol === "inquilino") {
    if (!pathname.startsWith("/portal")) {
      const url = request.nextUrl.clone()
      url.pathname = "/portal"
      return redirectWithCookies(url)
    }
  } else {
    if (pathname.startsWith("/portal")) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return redirectWithCookies(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|sw.js|icons/|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
