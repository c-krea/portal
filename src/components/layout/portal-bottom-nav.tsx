"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Zap, CreditCard, User } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/portal",         label: "Inicio",  icon: Home },
  { href: "/portal/medidor", label: "Medidor", icon: Zap },
  { href: "/portal/pagos",   label: "Pagos",   icon: CreditCard },
  { href: "/portal/perfil",  label: "Perfil",  icon: User },
]

export function PortalBottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/portal") return pathname === "/portal"
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[60px] py-2"
          >
            <Icon className={cn("h-5 w-5", active ? "text-blue-500" : "text-slate-400")} />
            <span className={cn("text-[10px] font-medium", active ? "text-blue-500" : "text-slate-400")}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
