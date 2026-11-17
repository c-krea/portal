import { NextResponse } from "next/server"

/**
 * Guard for Vercel Cron routes. Returns a 401 response when the request is not
 * authorized, or null when it may proceed.
 *
 * Fails closed when CRON_SECRET is unset or blank: comparing against
 * `Bearer ${undefined}` would otherwise let the literal header
 * "Bearer undefined" through.
 */
export function rejectUnauthorizedCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
