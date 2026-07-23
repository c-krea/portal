import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { requireStaff } from "@/lib/auth/session"
import { signOut } from "@/app/(auth)/login/actions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireStaff()
  const displayName = profile.nombreCompleto

  return (
    <>
      <Sidebar displayName={displayName} signOutAction={signOut} />
      <main className="ml-0 lg:ml-[220px] flex min-h-screen w-full flex-col">
        <MobileNav displayName={displayName} signOutAction={signOut} />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-[1440px] mx-auto">{children}</div>
      </main>
    </>
  )
}
