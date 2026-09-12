import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"
import { requireStaff } from "@/lib/auth/session"
import { isValidUuid } from "@/lib/security/validators"
import { getPortalProfileByTenantId } from "@/lib/data/portal"
import { PortalDashboard } from "@/app/(portal)/portal/portal-dashboard"
import { InfoTip } from "@/components/pagos/info-tip"
import { PortalPreviewBottomNav } from "./portal-preview-bottom-nav"

export default async function LocalPortalPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaff()

  const { id } = await params
  if (!isValidUuid(id)) notFound()

  const profile = await getPortalProfileByTenantId(id)
  if (!profile) notFound()

  const unitsLabel =
    profile.allUnits.length > 1
      ? `Locales ${profile.allUnits.join(" · ")}`
      : `Local ${profile.allUnits[0]}`

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* ── Staff preview banner — always visible while scrolling. The sticky
          slot lives on the wrapper so the dark card itself is unchanged. ── */}
      <div className="sticky top-0 z-10 mx-auto max-w-4xl px-4 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-sm">
          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="font-semibold">Vista previa</span>
            <InfoTip
              text={`Estás viendo a ${profile.razonSocial} · ${unitsLabel}. Solo lectura — no se pueden hacer pagos ni enviar lecturas desde aquí.`}
            />
          </div>
          <Link
            href={`/locales/${id}`}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* ── Tenant portal header (static replica — the real portal layout calls
          requireInquilino() and would bounce staff, so it is never reused here.
          Static, not sticky, because the banner above already owns the sticky-top
          slot; the profile tile is non-interactive so staff can never trigger the
          tenant's signOut/notifications from inside a preview) ── */}
      <header className="mt-4 border-b border-slate-200 bg-white shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/ckrea-logo.png" alt="C-Krea" width={28} height={28} className="shrink-0" />
            <span className="text-base font-semibold text-slate-900">Portal del Inquilino</span>
          </div>
          <span aria-hidden="true" className="flex items-center justify-center rounded-lg p-2">
            <User className="h-5 w-5 text-slate-500" />
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 pb-24">
        <PortalDashboard profile={profile} readOnly />
      </main>
      <PortalPreviewBottomNav />
    </div>
  )
}
