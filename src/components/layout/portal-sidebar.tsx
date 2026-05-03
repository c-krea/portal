"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Zap, CreditCard, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTransition } from "react"

const NAV_ITEMS = [
  { href: "/portal",         label: "Inicio",  icon: Home },
  { href: "/portal/medidor", label: "Medidor", icon: Zap },
  { href: "/portal/pagos",   label: "Pagos",   icon: CreditCard },
  { href: "/portal/perfil",  label: "Perfil",  icon: User },
]

type Props = {
  displayName: string
  signOutAction: () => Promise<void>
}

export function PortalSidebar({ displayName, signOutAction }: Props) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function isActive(href: string) {
    if (href === "/portal") return pathname === "/portal"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex w-[220px] flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <Zap className="h-5 w-5 text-blue-400 shrink-0" />
        <span className="text-sm font-semibold tracking-wide text-white">Portal Inquilino</span>
      </div>

      <div className="mx-4 border-t border-slate-700" />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                active
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — icon-only logout */}
      <div className="mx-4 border-t border-slate-700" />
      <div className="flex items-center justify-end px-4 py-4">
        <button
          onClick={() => startTransition(() => signOutAction())}
          disabled={pending}
          title="Cerrar Sesión"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  )
}
