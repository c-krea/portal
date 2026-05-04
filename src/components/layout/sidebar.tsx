"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"
import { NAV_ITEMS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationToggle } from "@/components/notification-toggle"

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
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex w-[220px] flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-[max(20px,env(safe-area-inset-top))]">
        <Image src="/ckrea-logo.png" alt="C-Krea" width={36} height={36} className="shrink-0" />
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
        <Link
          href="/configuracion"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <Settings className="h-5 w-5 shrink-0 text-slate-400" />
          Configuración
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white w-full">
            <User className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="truncate">{displayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <DropdownMenuLabel className="text-xs text-slate-500 font-normal truncate">
              {displayName}
            </DropdownMenuLabel>
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
