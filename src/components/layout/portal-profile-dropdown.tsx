"use client"

import { useTransition } from "react"
import { User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationToggle } from "@/components/notification-toggle"

type Props = {
  displayName: string
  signOutAction: () => Promise<void>
}

export function PortalProfileDropdown({ displayName, signOutAction }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline truncate max-w-[120px]">{displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56">
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
  )
}
