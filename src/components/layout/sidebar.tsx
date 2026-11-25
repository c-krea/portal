"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Pin, PinOff, Settings, User } from "lucide-react"
import { NAV_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useState, useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationToggle } from "@/components/notification-toggle"

type SidebarProps = {
  displayName: string
  signOutAction: () => Promise<void>
  pinned: boolean
  onTogglePin: () => void
}

/**
 * Desktop sidebar. Pinned: always open, content shifts right (AppShell).
 * Unpinned: a narrow icon rail that opens over the content on hover/focus.
 */
export function Sidebar({ displayName, signOutAction, pinned, onTogglePin }: SidebarProps) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [hover, setHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const expanded = pinned || hover || menuOpen

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  // Labels fade out with the rail; icons stay put so nothing jumps.
  const label = cn("truncate transition-opacity duration-150", expanded ? "opacity-100" : "opacity-0")

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false)
      }}
      className={cn(
        "hidden overflow-hidden bg-slate-900 transition-[width,box-shadow] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:flex-col",
        expanded ? "w-[13.75rem]" : "w-16",
        expanded && !pinned && "shadow-2xl shadow-slate-900/40",
      )}
    >
      {/* Logo + pin */}
      <div className="flex items-center gap-3 px-3.5 pb-5 pt-[max(20px,env(safe-area-inset-top))]">
        <Image src="/ckrea-logo.png" alt="C-Krea" width={36} height={36} className="shrink-0" />
        <span className={cn("flex-1 text-sm font-semibold tracking-wide text-white", label)}>C-KREA</span>
        <button
          type="button"
          onClick={onTogglePin}
          title={pinned ? "Ocultar menú (se abre al pasar el mouse)" : "Fijar menú abierto"}
          aria-label={pinned ? "Desfijar menú" : "Fijar menú"}
          aria-pressed={pinned}
          tabIndex={expanded ? 0 : -1}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white",
            label,
          )}
        >
          {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      </div>

      <div className="mx-3 border-t border-slate-700" />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ icon: Icon, label: text, href }) => (
          <Link
            key={href}
            href={href}
            title={expanded ? undefined : text}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
              isActive(href) ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white",
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", isActive(href) ? "text-white" : "text-slate-400")} />
            <span className={cn("whitespace-nowrap", label)}>{text}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mx-3 border-t border-slate-700" />
      <div className="flex flex-col gap-1 px-3 py-4">
        <Link
          href="/configuracion"
          title={expanded ? undefined : "Configuración"}
          className="flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <Settings className="h-5 w-5 shrink-0 text-slate-400" />
          <span className={cn("whitespace-nowrap", label)}>Configuración</span>
        </Link>

        <DropdownMenu onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            title={expanded ? undefined : displayName}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <User className="h-5 w-5 shrink-0 text-slate-400" />
            <span className={cn("whitespace-nowrap", label)}>{displayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <div className="px-2 py-1.5 text-xs text-slate-500 font-normal truncate">{displayName}</div>
            <DropdownMenuSeparator />
            <div className="px-1 py-1">
              <NotificationToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => startTransition(() => signOutAction())}
              disabled={pending}
              className="text-rose-500 focus:text-rose-500 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {pending ? "Saliendo..." : "Cerrar Sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
