import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { executeDml, sqlStr } from "@/lib/db/executor"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await executeDml(`
    INSERT INTO v2.push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES ('${user.id}'::uuid, ${sqlStr(endpoint)}, ${sqlStr(keys.p256dh)}, ${sqlStr(keys.auth)})
    ON CONFLICT (user_id, endpoint) DO UPDATE SET
      p256dh = EXCLUDED.p256dh,
      auth   = EXCLUDED.auth
  `)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint } = await req.json()

  const { endpoint: ep } = await req.json()
  if (ep) {
    await executeDml(
      `DELETE FROM v2.push_subscriptions WHERE user_id = '${user.id}'::uuid AND endpoint = ${sqlStr(ep)}`
    )
  }

  return NextResponse.json({ ok: true })
}
