import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/db/executor"
import { signOut } from "@/app/(auth)/login/actions"
import { LogOut, Zap } from "lucide-react"

async function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </button>
    </form>
  )
}

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
    .from("profiles")
    .select("full_name, tenant_id, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "tenant") redirect("/")

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-slate-700" />
            <span className="text-base font-semibold text-slate-900">
              Portal del Inquilino
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-slate-500">{profile?.full_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
