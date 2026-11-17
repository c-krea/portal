import { NextResponse } from "next/server"
import { execute } from "@/lib/db/executor"
import { bustAllCaches } from "@/lib/cache"
import { rejectUnauthorizedCron } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const unauthorized = rejectUnauthorizedCron(request)
  if (unauthorized) return unauthorized

  try {
    const syncRows = await execute(`SELECT v2.sync_desde_raw() AS result`)
    const sync = (syncRows[0] as { result: unknown })?.result

    const critRows = await execute(`SELECT v2.recalcular_criticos() AS result`)
    const criticos = (critRows[0] as { result: unknown })?.result

    // ERP sync refreshed all derived data — invalidate every cached snapshot so
    // the next read recomputes from the fresh data (stale-while-revalidate: a
    // viewer mid-window may see one last cached copy before it refreshes).
    bustAllCaches()

    return NextResponse.json({ success: true, sync, criticos })
  } catch (e) {
    console.error("[cron/sync-v2]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
