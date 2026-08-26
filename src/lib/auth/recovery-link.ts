const DEFAULT_SITE = "https://ckrea.com.co"

export function siteUrl(site?: string): string {
  const raw =
    site ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE
  return raw.replace(/\/$/, "")
}

/** Portal recovery URL. Never the Supabase /auth/v1/verify link (email scanners consume that). */
export function buildRecoveryUrl(hashedToken: string, site?: string): string | null {
  const token = hashedToken.trim()
  if (!token) return null
  const url = new URL("/auth/confirm", `${siteUrl(site)}/`)
  url.searchParams.set("token_hash", token)
  url.searchParams.set("type", "recovery")
  return url.toString()
}
