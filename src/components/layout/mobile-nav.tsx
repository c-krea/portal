"use client"

import { useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, LogOut, Settings } from "lucide-react"
import { NAV_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"

type Props = {
  displayName: string
  signOutAction: () => Promise<void>
}

export function MobileNav({ displayName, signOutAction }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/ckrea-logo.png" alt="C-Krea" width={28} height={28} className="shrink-0" />
          <span className="text-sm font-semibold tracking-wide text-slate-900">C-KREA</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-slate-900 transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <Image src="/ckrea-logo.png" alt="C-Krea" width={32} height={32} className="shrink-0" />
            <span className="text-sm font-semibold tracking-wide text-white">C-KREA</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-4 border-t border-slate-700" />

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                isActive(href)
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive(href) ? "text-white" : "text-slate-400")} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mx-4 border-t border-slate-700" />
        <div className="flex flex-col gap-1 px-3 py-4">
          <div className="mb-1 truncate px-3 py-1 text-xs text-slate-500">{displayName}</div>
          <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
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
    </>
  )
}
