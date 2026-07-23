import { requireInquilino } from "@/lib/auth/session"
import { signOut } from "@/app/(auth)/login/actions"
import Image from "next/image"
import { PortalBottomNav } from "@/components/layout/portal-bottom-nav"
import { PortalProfileDropdown } from "@/components/layout/portal-profile-dropdown"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireInquilino()

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/ckrea-logo.png" alt="C-Krea" width={28} height={28} className="shrink-0" />
            <span className="text-base font-semibold text-slate-900">Portal del Inquilino</span>
          </div>
          <PortalProfileDropdown
            displayName={profile.nombreCompleto || "Inquilino"}
            signOutAction={signOut}
          />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 pb-24">{children}</main>
      <PortalBottomNav />
    </div>
  )
}
