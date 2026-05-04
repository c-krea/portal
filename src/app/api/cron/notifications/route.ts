import { NextResponse } from "next/server"
import { supabaseAdmin, execute } from "@/lib/db/executor"
import { sendPushToUser } from "@/lib/push"

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

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  const todayStr = dateStr(today)
  const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3)
  const in3DaysStr = dateStr(in3Days)
  const dayOfMonth = today.getDate()
  const isMonday = today.getDay() === 1
  const currentPeriodo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`

  // All inquilino users with push subscriptions
  const users = await execute(`
    SELECT
      ps.user_id,
      i.nit,
      i.nombre_corto,
      u.id   AS unit_id,
      c.fecha_fin::text AS fecha_fin
    FROM v2.push_subscriptions ps
    JOIN v2.perfiles p   ON p.id = ps.user_id AND p.rol = 'inquilino'
    JOIN v2.inquilinos i ON i.id = p.inquilino_id
    JOIN v2.contratos  c ON c.inquilino_id = i.id AND c.estado IN ('activo','critico')
    JOIN v2.locales    u ON u.id = c.local_id
    GROUP BY ps.user_id, i.nit, i.nombre_corto, u.id, c.fecha_fin
  `)

  if (!users.length) return NextResponse.json({ sent: 0 })

  const results: string[] = []

  for (const user of users) {
    const userId = String(user.user_id)
    const nit = user.nit ? String(user.nit) : null
    const nombre = user.nombre_corto ? String(user.nombre_corto) : "Inquilino"
    const unitId = String(user.unit_id)
    const fechaFin = user.fecha_fin ? new Date(String(user.fecha_fin)) : null

    // ── Cartera checks ────────────────────────────────────────────
    if (nit) {
      const cartera = await execute(`
        SELECT
          ROUND(c.saldo)::int                                        AS saldo,
          c.fecha_vence::date                                        AS fecha_vence,
          GREATEST(0, CURRENT_DATE - c.fecha_vence::date)::int      AS dias_mora,
          COALESCE(c.financia, 0)::int                               AS financia
        FROM siesa_raw.cartera c
        WHERE c.documento = '${nit}'
          AND c.factura LIKE 'FVS-%'
          AND c.saldo > 0
      `)

      // Payment due in 3 days
      const dueIn3 = cartera.filter((r) => String(r.fecha_vence) === in3DaysStr)
      if (dueIn3.length > 0) {
        const total = dueIn3.reduce((s: number, r) => s + Number(r.saldo), 0)
        await sendPushToUser(userId, {
          title: "Pago próximo a vencer",
          body: `${nombre}, tu factura de ${cop(total)} vence en 3 días.`,
          url: "/portal/pagos",
        })
        results.push(`due3d:${userId}`)
      }

      // Payment due today
      const dueToday = cartera.filter((r) => String(r.fecha_vence) === todayStr)
      if (dueToday.length > 0) {
        const total = dueToday.reduce((s: number, r) => s + Number(r.saldo), 0)
        await sendPushToUser(userId, {
          title: "Pago vence hoy",
          body: `${nombre}, tu factura de ${cop(total)} vence hoy. Evita intereses de mora.`,
          url: "/portal/pagos",
        })
        results.push(`due0d:${userId}`)
      }

      // First overdue day (financia = 31 → just crossed grace period)
      const firstOverdue = cartera.filter((r) => Number(r.financia) === 31)
      if (firstOverdue.length > 0) {
        const total = firstOverdue.reduce((s: number, r) => s + Number(r.saldo), 0)
        await sendPushToUser(userId, {
          title: "Pago vencido",
          body: `${nombre}, tienes ${cop(total)} en mora. Ya empiezan a correr intereses del 0.05% diario.`,
          url: "/portal/pagos",
        })
        results.push(`overdue:${userId}`)
      }

      // Mora escalation — Mondays only, for all active mora > 31
      if (isMonday) {
        const inMora = cartera.filter((r) => Number(r.financia) > 31)
        if (inMora.length > 0) {
          const total = inMora.reduce((s: number, r) => s + Number(r.saldo), 0)
          const maxDays = Math.max(...inMora.map((r) => Number(r.dias_mora)))
          await sendPushToUser(userId, {
            title: "Recordatorio de mora",
            body: `${nombre}, llevas ${maxDays} días en mora con ${cop(total)} pendiente. Contáctanos para ponerte al día.`,
            url: "/portal/pagos",
          })
          results.push(`mora:${userId}`)
        }
      }
    }

    // ── Lease expiring ────────────────────────────────────────────
    if (fechaFin) {
      const daysLeft = Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft === 60 || daysLeft === 30) {
        await sendPushToUser(userId, {
          title: "Contrato próximo a vencer",
          body: `${nombre}, tu contrato vence en ${daysLeft} días. Contacta al administrador para renovar.`,
          url: "/portal",
        })
        results.push(`lease${daysLeft}d:${userId}`)
      }
    }

    // ── Meter reading reminder (day 7, no reading yet) ────────────
    if (dayOfMonth === 7) {
      const { data: reading } = await supabaseAdmin
        .schema("v2")
        .from("lecturas_medidor")
        .select("id")
        .eq("local_id", unitId)
        .eq("periodo", currentPeriodo)
        .maybeSingle()

      if (!reading) {
        await sendPushToUser(userId, {
          title: "Lectura de medidor pendiente",
          body: `${nombre}, tienes 3 días para registrar tu lectura de energía de ${currentPeriodo}. Hazlo desde el portal.`,
          url: "/portal/medidor",
        })
        results.push(`meter:${userId}`)
      }
    }
  }

  return NextResponse.json({ sent: results.length, detail: results })
}
