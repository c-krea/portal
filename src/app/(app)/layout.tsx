import { cookies } from "next/headers"
import { AppShell } from "@/components/layout/app-shell"
import { SIDEBAR_PINNED_COOKIE } from "@/lib/constants"
import { requireStaff } from "@/lib/auth/session"
import { signOut } from "@/app/(auth)/login/actions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireStaff()
  const displayName = profile.nombreCompleto
  // Default: collapsed rail (more room for the reports); the user can pin it open.
  const pinned = (await cookies()).get(SIDEBAR_PINNED_COOKIE)?.value === "1"

  return (
    <AppShell displayName={displayName} signOutAction={signOut} initialPinned={pinned}>
      {children}
    </AppShell>
  )
}
