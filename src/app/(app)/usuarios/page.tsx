import { PageHeader } from "@/components/layout/page-header"
import { InfoTip } from "@/components/pagos/info-tip"
import { getPortalTenants, getUsuarios } from "@/lib/data/usuarios"
import { currentPeriodo } from "@/lib/periodo"
import { TabSwitcher } from "./tab-switcher"
import { SendEmailModal } from "./send-email-modal"
import { UsuariosUsoChart } from "./uso-chart"

function ingresoPeriodo(iso: string): string {
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "America/Bogota" }))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthIndex(yyyyMM: string): number {
  const [y, m] = yyyyMM.split("-").map(Number)
  return y * 12 + (m - 1)
}

export default async function UsuariosPage() {
  const [tenants, admins] = await Promise.all([
    getPortalTenants(),
    getUsuarios(),
  ])

  const periodo = currentPeriodo()
  const ahora = monthIndex(periodo)
  let esteMes = 0
  let mesPasado = 0
  let masDeDos = 0
  let nunca = 0
  for (const t of tenants) {
    if (!t.lastSignIn) {
      nunca++
      continue
    }
    const dist = ahora - monthIndex(ingresoPeriodo(t.lastSignIn))
    if (dist <= 0) esteMes++
    else if (dist === 1) mesPasado++
    else masDeDos++
  }

  // "Este mes" IS the Activos KPI population by construction: dist <= 0 counts
  // tenants whose last sign-in month (America/Bogota) is the current month
  // (a future-dated sign-in is impossible — auth timestamps are always past).
  const activos = esteMes
  const total = tenants.length
  const inactivos = total - activos
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  // All four bars always render — a zero bucket is information here.
  const uso = [
    { name: "Este mes",       value: esteMes,   fill: "#10b981" },
    { name: "Mes pasado",     value: mesPasado, fill: "#f59e0b" },
    { name: "Más de 2 meses", value: masDeDos,  fill: "#f43f5e" },
    { name: "Nunca",          value: nunca,     fill: "#cbd5e1" },
  ]

  return (
    <>
      <PageHeader title="Usuarios">
        <SendEmailModal tenants={tenants} admins={admins} />
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-1 flex-col justify-center rounded-[10px] border border-slate-200 bg-white p-4">
            <p className="text-[34px] font-bold tracking-tight tabular-nums text-slate-900">
              {activos}{" "}
              <span className="align-middle text-base font-semibold text-slate-400">
                ({pct(activos)}%)
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-base text-slate-600">
              Activos este mes
              <InfoTip text="Inquilinos que ingresaron al portal este mes." />
            </p>
          </div>

          <div className="flex flex-1 flex-col justify-center rounded-[10px] border border-slate-200 bg-white p-4">
            <p className="text-[34px] font-bold tracking-tight tabular-nums text-slate-900">
              {inactivos}{" "}
              <span className="align-middle text-base font-semibold text-slate-400">
                ({pct(inactivos)}%)
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-base text-slate-600">
              Inactivos este mes
              <InfoTip text="No ingresaron al portal este mes. El gráfico los agrupa por antigüedad del último ingreso: mes pasado, más de 2 meses y nunca." />
            </p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Uso del portal
          </h2>
          <div className="flex flex-1 items-center p-6">
            {total === 0 ? (
              <p className="w-full py-8 text-center text-sm text-slate-500">
                Sin inquilinos
              </p>
            ) : (
              <UsuariosUsoChart data={uso} />
            )}
          </div>
        </div>
      </div>

      <TabSwitcher tenants={tenants} admins={admins} />

      <p className="mt-3 text-xs text-slate-400">
        Inquilinos: clic en el email para editar. Administración: cuentas de solo lectura del panel.
      </p>
    </>
  )
}
