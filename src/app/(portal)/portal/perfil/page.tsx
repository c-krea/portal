export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPortalProfile } from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import Link from "next/link"
import {
  ArrowLeft,
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
      <span className="w-40 shrink-0 text-sm text-slate-400">{label}</span>
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

  return (
    <div className="space-y-5">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al portal
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
          <Building2 className="h-7 w-7 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {profile.nombreCorto ?? profile.razonSocial}
          </h1>
          <p className="text-sm text-slate-500">
            Local {profile.unitNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Contact card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Section title="Información de Contacto" />
          <Row icon={Hash}        label="NIT / Cédula"    value={profile.nit} />
          <Row icon={Briefcase}   label="Razón social"    value={profile.razonSocial} />
          {profile.contactoNombre && (
            <Row icon={User}      label="Representante"   value={profile.contactoNombre} />
          )}
          <Row icon={Mail}        label="Email"           value={profile.email} />
          <Row icon={Phone}       label="Teléfono"        value={profile.telefono} />
          {profile.entrada && (
            <Row icon={MapPin}    label="Entrada"         value={profile.entrada} />
          )}
          <Row icon={Store}       label="Local"           value={profile.unitNumber} />
        </div>

        {/* Contract card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Section title="Condiciones del Contrato" />
          <Row
            icon={CalendarDays}
            label="Vigencia"
            value={
              <span className="flex items-center gap-1.5">
                {formatDate(profile.fechaInicio)}
                <ArrowRight className="h-3 w-3 text-slate-300" />
                {profile.fechaFin ? formatDate(profile.fechaFin) : "Vigente"}
              </span>
            }
          />
          <Row icon={TrendingUp}  label="Canon base"      value={formatCOP(profile.canonBase)} />
          <Row
            icon={Percent}
            label="Descuento fase"
            value={profile.descuentoPct != null ? `${profile.descuentoPct}%` : null}
          />
          <Row
            icon={Percent}
            label="Pronto pago"
            value={profile.prontoPagoPct != null ? `${profile.prontoPagoPct}%` : null}
          />
        </div>

      </div>
    </div>
  )
}
