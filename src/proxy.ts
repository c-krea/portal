import { ROLE_COOKIE } from "@/lib/auth/session-cookie"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Gatekeeper:
 * - getUser() once → refreshes session cookies (required; Server Components can't always write cookies)
 * - NO database / service-role / role SQL here
 * - Role routing uses login-stamped ckrea-rol cookie only
 * - Passes x-user-id / x-user-email so layouts skip a second Auth round-trip
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth (recovery/magic-link must not touch session)
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
    return NextResponse.next({ request })
  }

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      res.cookies.set(name, value, opts),
    )
    return res
  }

  // Fast role lane from login cookie (layouts still re-check from DB cache)
  const rol = request.cookies.get(ROLE_COOKIE)?.value
  if (rol === "inquilino" && !pathname.startsWith("/portal")) {
    const url = request.nextUrl.clone()
    url.pathname = "/portal"
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      res.cookies.set(name, value, opts),
    )
    return res
  }
  if (rol && rol !== "inquilino" && pathname.startsWith("/portal")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      res.cookies.set(name, value, opts),
    )
    return res
  }

  // Strip any client-supplied identity headers, then stamp verified values
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete("x-user-id")
  requestHeaders.delete("x-user-email")
  requestHeaders.set("x-user-id", user.id)
  requestHeaders.set("x-user-email", user.email ?? "")

  const authCookies = supabaseResponse.cookies.getAll()
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  authCookies.forEach((cookie) => response.cookies.set(cookie))
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|sw.js|icons/|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
