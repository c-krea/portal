"use server"

import webpush from "web-push"
import { supabaseAdmin } from "@/lib/db/executor"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const { data: subs } = await supabaseAdmin
    .schema("v2")
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (!subs?.length) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  const sent = results.filter((r) => r.status === "fulfilled").length
  return { sent, total: subs.length }
}

export async function sendPushToAll(payload: PushPayload) {
  const { data: subs } = await supabaseAdmin
    .schema("v2")
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")

  if (!subs?.length) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  return { sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length }
}
