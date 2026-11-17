import { NextResponse } from "next/server"
import { execute, executeDml } from "@/lib/db/executor"
import { moraVencEfecExpr } from "@/lib/data/mora"
import { sendPushToUser } from "@/lib/push"
import { rejectUnauthorizedCron } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function cop(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount)
}

function dateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

// Returns true and logs if notification hasn't been sent yet; false if duplicate.
async function tryLog(userId: string, type: string, refId: string): Promise<boolean> {
  try {
    await executeDml(
      `INSERT INTO v2.push_notification_log (user_id, type, reference_id)
       VALUES ('${userId}'::uuid, '${type}', '${refId}')`
    )
    return true
  } catch {
    return false
  }
}

async function notify(
  userId: string,
  type: string,
  refId: string,
  payload: { title: string; body: string; url?: string },
  results: string[]
) {
  const ok = await tryLog(userId, type, refId)
  if (!ok) return
  await sendPushToUser(userId, payload)
  results.push(`${type}:${userId}`)
}

export async function GET(req: Request) {
  const unauthorized = rejectUnauthorizedCron(req)
  if (unauthorized) return unauthorized

  const today = new Date()
  const todayStr = dateStr(today)
  const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3)
  const in3DaysStr = dateStr(in3Days)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = dateStr(yesterday)
  const dayOfMonth = today.getDate()
  const isMonday = today.getDay() === 1
  const weekRef = `${today.getFullYear()}-W${String(Math.ceil(today.getDate() / 7)).padStart(2, "0")}`
  const currentPeriodo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`

  const results: string[] = []

  // ── All subscribed tenants ────────────────────────────────────────
  const users = await execute(`
    SELECT DISTINCT
      ps.user_id,
      i.nit,
      i.nombre_corto,
      u.id       AS unit_id,
      c.fecha_fin::text AS fecha_fin,
      p.inquilino_id
    FROM v2.push_subscriptions ps
    JOIN v2.perfiles   p ON p.id = ps.user_id AND p.rol = 'inquilino'
    JOIN v2.inquilinos i ON i.id = p.inquilino_id
    JOIN v2.contratos  c ON c.inquilino_id = i.id AND c.estado IN ('activo','critico')
    JOIN v2.locales    u ON u.id = c.local_id
  `)

  for (const user of users) {
    const userId    = String(user.user_id)
    const nit       = user.nit ? String(user.nit) : null
    const nombre    = user.nombre_corto ? String(user.nombre_corto) : "Inquilino"
    const unitId    = String(user.unit_id)
    const fechaFin  = user.fecha_fin ? new Date(String(user.fecha_fin)) : null
    const inquilinoId = String(user.inquilino_id)

    // ── Cartera checks ──────────────────────────────────────────────
    // Vencimiento canónico (mora.ts): fecha_factura + 30. El ERP aún emite
    // fechas a 10 días en 6 facturas abiertas, que avisaban ~20 días antes.
    // El trigger "first overdue" (financia=31, día-31) ya es correcto y no se toca.
    if (nit) {
      const vencEfec = moraVencEfecExpr("c.fecha_vence::date", "c.fecha_factura::date")
      const cartera = await execute(`
        SELECT
          c.factura,
          ROUND(c.saldo)::int                                        AS saldo,
          (${vencEfec})::date                                        AS fecha_vence_efec,
          GREATEST(0, CURRENT_DATE - c.fecha_vence::date)::int      AS dias_mora,
          COALESCE(c.financia, 0)::int                               AS financia
        FROM siesa_raw.cartera c
        WHERE c.documento = '${nit}'
          AND c.factura LIKE 'FVS-%'
          AND c.saldo > 0
      `)

      // Payment due in 3 days — once per invoice
      for (const row of cartera.filter((r) => String(r.fecha_vence_efec) === in3DaysStr)) {
        await notify(userId, "due3d", `${nit}-${row.factura}`, {
          title: "Pago próximo a vencer",
          body: `${nombre}, tu factura de ${cop(Number(row.saldo))} vence en 3 días.`,
          url: "/portal/pagos",
        }, results)
      }

      // Payment due today — once per invoice
      for (const row of cartera.filter((r) => String(r.fecha_vence_efec) === todayStr)) {
        await notify(userId, "due0d", `${nit}-${row.factura}`, {
          title: "Pago vence hoy",
          body: `${nombre}, tu factura de ${cop(Number(row.saldo))} vence hoy. Evita intereses de mora.`,
          url: "/portal/pagos",
        }, results)
      }

      // First overdue (financia = 31) — once per invoice
      for (const row of cartera.filter((r) => Number(r.financia) === 31)) {
        await notify(userId, "overdue", `${nit}-${row.factura}`, {
          title: "Pago vencido",
          body: `${nombre}, tu factura de ${cop(Number(row.saldo))} entró en mora, con intereses de mora según la tasa vigente de la Superintendencia Financiera.`,
          url: "/portal/pagos",
        }, results)
      }

      // Mora escalation — Mondays, once per week per user
      if (isMonday) {
        const inMora = cartera.filter((r) => Number(r.financia) > 31)
        if (inMora.length > 0) {
          const total   = inMora.reduce((s: number, r) => s + Number(r.saldo), 0)
          const maxDays = Math.max(...inMora.map((r) => Number(r.dias_mora)))
          await notify(userId, "mora_weekly", `${userId}-${weekRef}`, {
            title: "Recordatorio de mora",
            body: `${nombre}, llevas ${maxDays} días en mora con ${cop(total)} pendiente. Contáctanos para ponerte al día.`,
            url: "/portal/pagos",
          }, results)
        }
      }
    }

    // ── Lease expiring — once per threshold ─────────────────────────
    if (fechaFin) {
      const daysLeft = Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft === 60 || daysLeft === 30) {
        await notify(userId, `lease${daysLeft}d`, userId, {
          title: "Contrato próximo a vencer",
          body: `${nombre}, tu contrato vence en ${daysLeft} días. Contacta al administrador para renovar.`,
          url: "/portal",
        }, results)
      }
    }

    // ── Meter reading reminder — day 7, once per period ─────────────
    if (dayOfMonth === 7) {
      const meterRows = await execute(`
        SELECT id FROM v2.lecturas_medidor
        WHERE local_id = '${unitId}'::uuid AND periodo = '${currentPeriodo}'
        LIMIT 1
      `)

      if (meterRows.length === 0) {
        await notify(userId, "meter", `${userId}-${currentPeriodo}`, {
          title: "Lectura de medidor pendiente",
          body: `${nombre}, tienes 3 días para registrar tu lectura de energía de ${currentPeriodo}.`,
          url: "/portal/medidor",
        }, results)
      }
    }

    // ── Payment confirmation — yesterday's payments ──────────────────
    const payments = await execute(`
      WITH mine AS MATERIALIZED (
        SELECT * FROM v2.vista_pagos WHERE inquilino_id = '${inquilinoId}'
      )
      SELECT docto, cruce, valor_final::int AS valor
      FROM mine
      WHERE fecha_recaudo = '${yesterdayStr}'
    `)

    for (const pago of payments) {
      const ref = `${String(pago.docto)}-${String(pago.cruce)}`
      await notify(userId, "payment_confirmed", ref, {
        title: "Pago registrado",
        body: `${nombre}, tu pago de ${cop(Number(pago.valor))} ha sido registrado exitosamente.`,
        url: "/portal/pagos",
      }, results)
    }
  }

  return NextResponse.json({ sent: results.length, detail: results })
}
