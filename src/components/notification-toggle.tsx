"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function NotificationToggle() {
  const [status, setStatus] = useState<"loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed">("loading")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") { setStatus("denied"); return }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? "subscribed" : "unsubscribed")
    })
  }, [])

  async function subscribe() {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setStatus("denied"); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const json = sub.toJSON()
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      setStatus("subscribed")
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus("unsubscribed")
    } finally {
      setBusy(false)
    }
  }

  if (status === "unsupported" || status === "loading") return null

  if (status === "denied") {
    return (
      <Button variant="ghost" size="sm" className="gap-2 opacity-50" disabled title="Notificaciones bloqueadas en el navegador">
        <BellOff className="h-4 w-4 text-slate-400" />
        <span className="text-xs">Notificaciones bloqueadas</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={status === "subscribed" ? unsubscribe : subscribe}
      disabled={busy}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : status === "subscribed" ? (
        <Bell className="h-4 w-4 text-emerald-500" />
      ) : (
        <BellOff className="h-4 w-4 text-slate-400" />
      )}
      <span className="text-xs">
        {status === "subscribed" ? "Notificaciones activas" : "Activar notificaciones"}
      </span>
    </Button>
  )
}
