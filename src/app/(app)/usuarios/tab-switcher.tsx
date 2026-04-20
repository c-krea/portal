"use client"

import { useState, useTransition } from "react"
import { Building2, ShieldCheck, CheckCircle2, CircleDashed, Mail, UserCheck, UserPlus, Loader2 } from "lucide-react"
import { EmailEditor } from "./email-editor"
import { EditAdminModal } from "./edit-admin-modal"
import { EditTenantModal } from "./edit-tenant-modal"
import { createTenantAccount } from "./actions"
import type { PortalTenantRow, UsuarioRow } from "@/lib/data/usuarios"

function CreateAccountButton({ tenantId }: { tenantId: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    start(async () => {
      const res = await createTenantAccount(tenantId)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
      {error && <p className="text-xs text-rose-600 max-w-[160px] text-right">{error}</p>}
    </div>
  )
}

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
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          onClick={() => setTab("inquilinos")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === "inquilinos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Inquilinos del Portal</span>
          <span className="sm:hidden">Inquilinos</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {tenants.length}
          </span>
        </button>
        <button
          onClick={() => setTab("admins")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === "admins"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
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
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Local</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Inquilino</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email Portal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Último Acceso</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const hasAccount = !!t.authUserId
                  const hasEmail   = !!t.portalEmail
                  return (
                    <tr key={t.tenantId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">{t.units}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{t.nombre}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate-600">
                        {t.portalEmail ?? <span className="italic text-slate-400">Sin email</span>}
                      </td>
                      <td className="px-4 py-3">
                        {hasAccount ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /><span className="hidden sm:inline">Cuenta activa</span><span className="sm:hidden">✓</span>
                          </span>
                        ) : hasEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            <Mail className="h-3 w-3" /><span className="hidden sm:inline">Email listo</span><span className="sm:hidden">Email</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            <CircleDashed className="h-3 w-3" /><span className="hidden sm:inline">Sin configurar</span><span className="sm:hidden">—</span>
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-400">{lastSignInLabel(t.lastSignIn)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {hasEmail && !hasAccount && (
                            <CreateAccountButton tenantId={t.tenantId} />
                          )}
                          <EditTenantModal tenant={t} />
                        </div>
                      </td>
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
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Rol</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Último Acceso</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Creado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                      Sin usuarios administrativos registrados
                    </td>
                  </tr>
                ) : (
                  admins.map((u) => {
                    const roleCfg = ROLE_LABELS[u.role] ?? { label: u.role, cls: "bg-slate-100 text-slate-600" }
                    return (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleCfg.cls}`}>
                            <UserCheck className="h-3 w-3" />
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-xs font-medium text-slate-700">
                          {lastSignInLabel(u.lastSignIn)}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-400">
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
