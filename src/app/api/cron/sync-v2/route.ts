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
    const syncRows = await execute(`SELECT v2.sync_desde_raw() AS result`)
    const sync = (syncRows[0] as { result: unknown })?.result

    const critRows = await execute(`SELECT v2.recalcular_criticos() AS result`)
    const criticos = (critRows[0] as { result: unknown })?.result

    return NextResponse.json({ success: true, sync, criticos })
  } catch (e) {
    console.error("[cron/sync-v2]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
