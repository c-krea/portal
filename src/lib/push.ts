import webpush from "web-push"
import { execute } from "@/lib/db/executor"

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
  const subs = await execute(
    `SELECT endpoint, p256dh, auth FROM v2.push_subscriptions WHERE user_id = '${userId}'::uuid`
  )

  if (!subs.length) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: String(sub.endpoint), keys: { p256dh: String(sub.p256dh), auth: String(sub.auth) } },
        JSON.stringify(payload)
      )
    )
  )

  const sent = results.filter((r) => r.status === "fulfilled").length
  return { sent, total: subs.length }
}

export async function sendPushToAll(payload: PushPayload) {
  const subs = await execute(
    `SELECT endpoint, p256dh, auth FROM v2.push_subscriptions`
  )

  if (!subs.length) return { sent: 0 }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: String(sub.endpoint), keys: { p256dh: String(sub.p256dh), auth: String(sub.auth) } },
        JSON.stringify(payload)
      )
    )
  )

  return { sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length }
}
