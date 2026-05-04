import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/db/executor"
import { signOut } from "@/app/(auth)/login/actions"
import Image from "next/image"
import { PortalBottomNav } from "@/components/layout/portal-bottom-nav"
import { PortalProfileDropdown } from "@/components/layout/portal-profile-dropdown"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabaseAdmin
    .schema("v2")
    .from("perfiles")
    .select("nombre_completo, inquilino_id, rol")
    .eq("id", user.id)
    .single()

  if (profile?.rol !== "inquilino") redirect("/")

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/ckrea-logo.png" alt="C-Krea" width={28} height={28} className="shrink-0" />
            <span className="text-base font-semibold text-slate-900">Portal del Inquilino</span>
          </div>
          <PortalProfileDropdown
            displayName={profile?.nombre_completo ?? "Inquilino"}
            signOutAction={signOut}
          />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 pb-24">{children}</main>
      <PortalBottomNav />
    </div>
  )
}
