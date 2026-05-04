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
      <DropdownMenuTrigger className="flex items-center justify-center rounded-lg p-2 hover:bg-slate-100 transition-colors">
        <User className="h-5 w-5 text-slate-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs text-slate-500 font-normal truncate">
          {displayName}
        </div>
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
