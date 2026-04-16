import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db/client"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { signOut } from "@/app/(auth)/login/actions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Load profile for display name
  const profileRows = await db
    .select({ fullName: profiles.fullName, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  const profile = profileRows[0] ?? null
  const displayName = profile?.fullName ?? user.email ?? "Usuario"

  return (
    <>
      <Sidebar displayName={displayName} signOutAction={signOut} />
      <main className="ml-[220px] flex min-h-screen flex-1 flex-col">
        <div className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </>
  )
}
