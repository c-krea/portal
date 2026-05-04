export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getPortalTenants, getUsuarios } from "@/lib/data/usuarios"
import { TabSwitcher } from "./tab-switcher"
import { SendEmailModal } from "./send-email-modal"
import { Mail, UserCheck, CheckCircle2 } from "lucide-react"

export default async function UsuariosPage() {
  const [tenants, admins] = await Promise.all([
    getPortalTenants(),
    getUsuarios(),
  ])

  const withEmail   = tenants.filter(t => t.portalEmail).length
  const withAccount = tenants.filter(t => t.authUserId).length
  const recentActive = tenants.filter(t => {
    if (!t.lastSignIn) return false
    return Date.now() - new Date(t.lastSignIn).getTime() < 30 * 24 * 60 * 60 * 1000
  }).length

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Usuarios" />
        <SendEmailModal tenants={tenants} admins={admins} />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 -mt-2">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <span className="text-slate-500">Inquilinos activos: </span>
          <span className="font-semibold text-slate-900">{tenants.length}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <Mail className="h-3 w-3 shrink-0 text-blue-400" />
          <span className="text-slate-500">Email: </span>
          <span className="font-semibold text-blue-700">{withEmail}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <UserCheck className="h-3 w-3 shrink-0 text-emerald-500" />
          <span className="text-slate-500">Cuenta: </span>
          <span className="font-semibold text-emerald-700">{withAccount}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
          <span className="text-slate-500">Activos 30d: </span>
          <span className="font-semibold text-emerald-700">{recentActive}</span>
        </div>
      </div>

      <TabSwitcher tenants={tenants} admins={admins} />

      <p className="mt-3 text-xs text-slate-400">
        Inquilinos: clic en el email para editar. Administración: cuentas de solo lectura del panel.
      </p>
    </>
  )
}
