/**
 * Vercel Cron — Daily interest accrual
 * Schedule: 0 6 * * * (01:00 COT = 06:00 UTC)
 *
 * Protected by CRON_SECRET env var.
 * Runs runInterestAccrual for every company, idempotent per (invoice, date).
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"
import { runInterestAccrual } from "@/lib/interest-engine"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const companies = await db.execute(sql`SELECT id FROM companies`)
    const today = new Date().toISOString().slice(0, 10)
    const results = []

    for (const company of companies as Array<Record<string, unknown>>) {
      const result = await runInterestAccrual(String(company.id), today)
      results.push({ companyId: company.id, ...result })
    }

    return NextResponse.json({ success: true, date: today, results })
  } catch (e) {
    console.error("[cron/accrual]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
