/**
 * Vercel Cron — Daily interest accrual
 * Schedule: 0 6 * * * (01:00 COT = 06:00 UTC)
 *
 * Protected by CRON_SECRET env var.
 * Runs runInterestAccrual for every company, idempotent per (invoice, date).
 */

import { NextResponse } from "next/server"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { runInterestAccrual } from "@/lib/interest-engine"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const empresaId = await getEmpresaCkreaId()
    const today = new Date().toISOString().slice(0, 10)
    const result = await runInterestAccrual(empresaId, today)

    return NextResponse.json({ success: true, date: today, results: [{ companyId: empresaId, ...result }] })
  } catch (e) {
    console.error("[cron/accrual]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
