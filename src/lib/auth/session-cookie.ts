import type { NextRequest } from "next/server"

/** Lightweight role hint for the gatekeeper — not security (layouts still verify). */
export const ROLE_COOKIE = "ckrea-rol"

/** @supabase/ssr v0.10+ cookie format: "base64-" + base64url(JSON.stringify(session)) */
const SUPABASE_COOKIE_PREFIX = "base64-"

function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return ""
  return url.split(".")[0]?.split("//")[1] ?? ""
}

/**
 * Read Supabase session cookie locally (no network).
 * Used only to decide "looks logged in?" at the door — real auth stays in layouts/API.
 */
export function getSessionFromRequest(request: NextRequest): {
  accessToken: string | null
  refreshToken: string | null
} {
  const ref = projectRef()
  if (!ref) return { accessToken: null, refreshToken: null }

  const cookies = request.cookies.getAll()
  const base = cookies.find((c) => c.name === `sb-${ref}-auth-token`)
  const chunks = cookies
    .filter((c) => new RegExp(`^sb-${ref}-auth-token\\.\\d+$`).test(c.name))
    .sort((a, b) => {
      const ai = parseInt(a.name.split(".").pop()!, 10)
      const bi = parseInt(b.name.split(".").pop()!, 10)
      return ai - bi
    })

  const raw =
    chunks.length > 0 ? chunks.map((c) => c.value).join("") : base?.value

  if (!raw) return { accessToken: null, refreshToken: null }

  let jsonStr: string
  if (raw.startsWith(SUPABASE_COOKIE_PREFIX)) {
    const encoded = raw.slice(SUPABASE_COOKIE_PREFIX.length)
    try {
      const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
      const padded = b64 + "==".slice(0, (4 - (b64.length % 4)) % 4)
      jsonStr = atob(padded)
    } catch {
      return { accessToken: null, refreshToken: null }
    }
  } else {
    jsonStr = raw
  }

  try {
    const session = JSON.parse(jsonStr) as {
      access_token?: string
      refresh_token?: string
    }
    return {
      accessToken: session?.access_token ?? null,
      refreshToken: session?.refresh_token ?? null,
    }
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

function isJwtExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number }
    return typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}

/**
 * Cheap "looks signed in" check for the gatekeeper.
 * Access token still valid OR refresh token present → let page load;
 * layouts call getUser() and refresh the real session there.
 */
export function looksAuthenticated(request: NextRequest): boolean {
  const { accessToken, refreshToken } = getSessionFromRequest(request)
  if (!accessToken && !refreshToken) return false
  if (accessToken && !isJwtExpired(accessToken)) return true
  // Access expired but refresh present → allow through so layout can refresh
  return !!refreshToken
}

export function roleCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  }
}
