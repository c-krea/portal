"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import { NAV_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useTransition } from "react"

type SidebarProps = {
  displayName: string
  signOutAction: () => Promise<void>
}

export function Sidebar({ displayName, signOutAction }: SidebarProps) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
          <span className="text-sm font-bold text-slate-900">CK</span>
        </div>
        <span className="text-sm font-semibold tracking-wide text-white">C-KREA</span>
      </div>

      <div className="mx-4 border-t border-slate-700" />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
              isActive(href)
                ? "bg-blue-500 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0",
                isActive(href) ? "text-white" : "text-slate-400",
              )}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mx-4 border-t border-slate-700" />
      <div className="flex flex-col gap-1 px-3 py-4">
        {/* User display */}
        <div className="mb-1 truncate px-3 py-1 text-xs text-slate-500">
          {displayName}
        </div>

        <Link
          href="/configuracion"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <Settings className="h-5 w-5 shrink-0 text-slate-400" />
          Configuración
        </Link>

        <button
          onClick={() => startTransition(() => signOutAction())}
          disabled={pending}
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {pending ? "Saliendo..." : "Cerrar Sesión"}
        </button>
      </div>
    </aside>
  )
}
