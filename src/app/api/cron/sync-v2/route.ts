/**
 * Vercel Cron — Sync siesa_raw → v2
 * Schedule: 30 * /6 * * * (offset 30min vs IT 6h push)
 * Calls v2.sync_desde_raw() which is additive-only:
 *   - new NITs (raw zona Z40) → v2.inquilinos
 *   - new locales (ocupacion) → v2.locales
 *   - new contracts (no active per inquilino+local) → v2.contratos
 */

import { NextResponse } from "next/server"
import { execute } from "@/lib/db/executor"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await execute(`SELECT v2.sync_desde_raw() AS result`)
    const result = (rows[0] as { result: unknown })?.result
    return NextResponse.json({ success: true, ...((result ?? {}) as object) })
  } catch (e) {
    console.error("[cron/sync-v2]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
