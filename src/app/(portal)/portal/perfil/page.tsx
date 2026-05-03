export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPortalProfile, getPortalContratos } from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import {
  Building2,
  Briefcase,
  Hash,
  User,
  Mail,
  Phone,
  CalendarDays,
  TrendingUp,
  Percent,
  ArrowRight,
  MapPin,
  Store,
  DoorOpen,
} from "lucide-react"

function Section({ title }: { title: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {title}
    </p>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <Icon className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
      <span className="w-28 sm:w-40 shrink-0 text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value ?? "—"}</span>
    </div>
  )
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getPortalProfile(user.id)
  if (!profile) redirect("/portal")

  const contratos = await getPortalContratos(profile.tenantId)

  const unitsLabel = profile.allUnits.length > 1
    ? `Locales ${profile.allUnits.join(" · ")}`
    : `Local ${profile.unitNumber}`

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
          <Building2 className="h-7 w-7 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {profile.nombreCorto ?? profile.razonSocial}
          </h1>
          <p className="text-sm text-slate-500">{unitsLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">

        {/* Contact card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Section title="Información de Contacto" />
          <Row icon={Hash}      label="NIT / Cédula"  value={profile.nit} />
          <Row icon={Briefcase} label="Razón social"  value={profile.razonSocial} />
          {profile.contactoNombre && (
            <Row icon={User}    label="Representante" value={profile.contactoNombre} />
          )}
          <Row icon={Mail}      label="Email"         value={profile.email} />
          <Row icon={Phone}     label="Teléfono"      value={profile.telefono} />
          <Row
            icon={Store}
            label={profile.allUnits.length > 1 ? "Locales" : "Local"}
            value={profile.allUnits.join(", ")}
          />
        </div>

        {/* Contract card — one block per unit */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Section title="Condiciones del Contrato" />
          {contratos.map((c, i) => (
            <div key={c.unidad}>
              {contratos.length > 1 && (
                <p className="mt-3 first:mt-0 mb-1 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                  Local {c.unidad}
                </p>
              )}
              {c.entrada && (
                <Row icon={DoorOpen}    label="Entrada"       value={`Entrada ${c.entrada}`} />
              )}
              <Row
                icon={CalendarDays}
                label="Vigencia"
                value={
                  <span className="flex items-center gap-1.5">
                    {formatDate(c.fechaInicio)}
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    {c.fechaFin ? formatDate(c.fechaFin) : "Vigente"}
                  </span>
                }
              />
              <Row icon={TrendingUp} label="Canon base"   value={formatCOP(c.canonBase)} />
              <Row
                icon={Percent}
                label="Descuento fase"
                value={c.descuentoPct != null ? `${c.descuentoPct}%` : null}
              />
              <Row
                icon={Percent}
                label="Pronto pago"
                value={c.prontoPagoPct != null ? `${c.prontoPagoPct}%` : null}
              />
              {i < contratos.length - 1 && (
                <div className="my-3 border-t border-slate-100" />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
