import { PageHeader } from "@/components/layout/page-header"
import { LecturaForm } from "@/components/medidores/lectura-form"
import { getUnitsWithMeters, getMeterReadings } from "@/lib/data/medidores"
import { formatCOP } from "@/lib/formatters"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export default async function MedidoresPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo } = await searchParams

  const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
  const companyId = String(companies[0].id)

  const [units, readings] = await Promise.all([
    getUnitsWithMeters(companyId),
    getMeterReadings(companyId, periodo),
  ])

  const totalKwh = readings.reduce((s, r) => s + r.kwh, 0)
  const totalEnergia = readings.reduce((s, r) => s + r.totalEnergia, 0)

  return (
    <>
      <PageHeader title="Medidores de Energía" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left: form + unit status */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Registrar Lectura</h2>
            <LecturaForm units={units} />
          </div>

          {/* Units with meter summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Locales con medidor ({units.length})
            </h2>
            <div className="space-y-2">
              {units.length === 0 ? (
                <p className="text-xs text-slate-400">Sin locales con medidor configurado</p>
              ) : (
                units.map((u) => (
                  <div key={u.unitId} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700">{u.unitNumber}</span>
                    <span
                      className={
                        u.hasReading
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {u.hasReading ? `${u.lastPeriodo} · ${u.lastKwh} kWh` : "sin lectura"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: readings table */}
        <div className="lg:col-span-3">
          {/* KPIs */}
          {readings.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Lecturas</p>
                <p className="text-2xl font-bold text-slate-900">{readings.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Total kWh</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalKwh.toLocaleString("es-CO")}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Total energía</p>
                <p className="text-2xl font-bold text-slate-900">{formatCOP(totalEnergia)}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {readings.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm font-medium text-slate-500">Sin lecturas registradas</p>
                <p className="mt-1 text-xs text-slate-400">
                  Use el formulario para ingresar lecturas de medidores.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Local</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Período</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Lect. Ant.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Lect. Act.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">kWh</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Tarifa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-sm text-slate-700">{r.unitNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{r.periodo}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{r.lecturaAnterior.toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{r.lecturaActual.toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{r.kwh.toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatCOP(r.tarifaKwh)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCOP(r.totalEnergia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
