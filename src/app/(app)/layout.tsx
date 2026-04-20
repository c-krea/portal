import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/db/executor"
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
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single()
  const displayName = profileData?.full_name ?? user.email ?? "Usuario"

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
