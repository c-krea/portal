"use client"

import { useState } from "react"
import { Building2, ShieldCheck, CheckCircle2, CircleDashed, Mail, UserCheck } from "lucide-react"
import { EmailEditor } from "./email-editor"
import { EditAdminModal } from "./edit-admin-modal"
import type { PortalTenantRow, UsuarioRow } from "@/lib/data/usuarios"

function lastSignInLabel(iso: string | null): string {
  if (!iso) return "Nunca"
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  if (diffDays < 30) return `Hace ${diffDays} días`
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  admin:   { label: "Admin",    cls: "bg-violet-100 text-violet-800" },
  finance: { label: "Finanzas", cls: "bg-blue-100 text-blue-800" },
  viewer:  { label: "Consulta", cls: "bg-slate-100 text-slate-700" },
}

export function TabSwitcher({
  tenants,
  admins,
}: {
  tenants: PortalTenantRow[]
  admins: UsuarioRow[]
}) {
  const [tab, setTab] = useState<"inquilinos" | "admins">("inquilinos")

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setTab("inquilinos")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "inquilinos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Inquilinos del Portal
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {tenants.length}
          </span>
        </button>
        <button
          onClick={() => setTab("admins")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "admins"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Administración
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {admins.length}
          </span>
        </button>
      </div>

      {/* Inquilinos table */}
      {tab === "inquilinos" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Local", "Inquilino", "Email Portal (login)", "Estado", "Último Acceso"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const hasAccount = !!t.authUserId
                  const hasEmail   = !!t.portalEmail
                  return (
                    <tr key={t.tenantId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">{t.units}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{t.nombre}</td>
                      <td className="px-5 py-3">
                        <EmailEditor tenantId={t.tenantId} initialEmail={t.portalEmail} />
                      </td>
                      <td className="px-5 py-3">
                        {hasAccount ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />Cuenta activa
                          </span>
                        ) : hasEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            <Mail className="h-3 w-3" />Email listo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            <CircleDashed className="h-3 w-3" />Sin configurar
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{lastSignInLabel(t.lastSignIn)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admins table */}
      {tab === "admins" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Nombre", "Email", "Rol", "Último Acceso", "Creado", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                      Sin usuarios administrativos registrados
                    </td>
                  </tr>
                ) : (
                  admins.map((u) => {
                    const roleCfg = ROLE_LABELS[u.role] ?? { label: u.role, cls: "bg-slate-100 text-slate-600" }
                    return (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{u.fullName}</td>
                        <td className="px-5 py-3 text-slate-500">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleCfg.cls}`}>
                            <UserCheck className="h-3 w-3" />
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-medium text-slate-700">
                          {lastSignInLabel(u.lastSignIn)}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("es-CO", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-3">
                          <EditAdminModal user={u} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
