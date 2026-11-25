"use client"

import { useState, type ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { cn } from "@/lib/utils"
import { SIDEBAR_PINNED_COOKIE } from "@/lib/constants"

type Props = {
  displayName: string
  signOutAction: () => Promise<void>
  /** From the cookie, so the first paint already has the right layout. */
  initialPinned: boolean
  children: ReactNode
}

/** Staff layout: collapsible desktop sidebar (pin persisted in a cookie) + content. */
export function AppShell({ displayName, signOutAction, initialPinned, children }: Props) {
  const [pinned, setPinned] = useState(initialPinned)

  function togglePin() {
    const next = !pinned
    setPinned(next)
    document.cookie = `${SIDEBAR_PINNED_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <div data-app-shell className="flex w-full">
      <Sidebar displayName={displayName} signOutAction={signOutAction} pinned={pinned} onTogglePin={togglePin} />
      <main
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200",
          pinned ? "lg:pl-[13.75rem]" : "lg:pl-16",
        )}
      >
        <MobileNav displayName={displayName} signOutAction={signOutAction} />
        <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
