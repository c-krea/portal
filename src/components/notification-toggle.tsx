"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"

type Permission = "default" | "granted" | "denied"

export function NotificationToggle() {
  const [permission, setPermission] = useState<Permission>("default")

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission as Permission)
    }
  }, [])

  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null

  async function toggle() {
    if (permission === "granted") {
      // Can't revoke — send user to browser settings
      alert(
        "Para desactivar las notificaciones, ve a la configuración de tu navegador y bloquea los permisos para este sitio."
      )
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result as Permission)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      title={permission === "granted" ? "Notificaciones activas" : "Activar notificaciones"}
      className="gap-2"
    >
      {permission === "granted" ? (
        <Bell className="h-4 w-4 text-emerald-500" />
      ) : (
        <BellOff className="h-4 w-4 text-slate-400" />
      )}
      <span className="text-xs">
        {permission === "granted" ? "Notificaciones activas" : "Activar notificaciones"}
      </span>
    </Button>
  )
}
