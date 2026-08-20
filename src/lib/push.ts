import webpush from "web-push"
import { execute } from "@/lib/db/executor"

let configured = false

function configure() {
  if (configured) return

  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Push not configured: VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must all be set."
    )
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure()
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
  configure()
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
