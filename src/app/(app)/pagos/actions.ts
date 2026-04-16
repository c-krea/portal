"use server"

import { db } from "@/lib/db/client"
import { payments } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { reconcilePayment } from "@/lib/reconciliation"

const schema = z.object({
  tenantId: z.string().uuid("Seleccione un cliente"),
  fechaRecaudo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  valorAplicado: z.coerce.number().positive("El monto debe ser mayor a 0"),
  concepto: z.string().optional(),
  notes: z.string().optional(),
})

export type ActionState = {
  success?: boolean
  error?: string
  message?: string
}

export async function registrarPago(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    tenantId: formData.get("tenantId"),
    fechaRecaudo: formData.get("fechaRecaudo"),
    valorAplicado: formData.get("valorAplicado"),
    concepto: formData.get("concepto") || undefined,
    notes: formData.get("notes") || undefined,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { tenantId, fechaRecaudo, valorAplicado, concepto, notes } = parsed.data

  try {
    const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
    const companyId = String(companies[0].id)

    // Insert payment record
    const inserted = await db
      .insert(payments)
      .values({
        companyId,
        tenantId,
        fechaRecaudo,
        valorAplicado: String(valorAplicado),
        valorFinal: String(valorAplicado),
        concepto: concepto ?? null,
        notes: notes ?? null,
      })
      .returning({ id: payments.id })

    const paymentId = inserted[0].id

    // Reconcile: invoices FIFO (with PP) then cartera FIFO
    const reconciliation = await reconcilePayment(tenantId, paymentId, valorAplicado, fechaRecaudo)

    revalidatePath("/pagos")
    revalidatePath("/mora")
    revalidatePath("/clientes")
    revalidatePath("/facturas")

    const { itemsCleared, totalApplied, remainder, allocations, ppTotal } = reconciliation

    let message = "Pago registrado exitosamente"
    if (allocations.length > 0) {
      message += `. Aplicado a ${allocations.length} concepto${allocations.length > 1 ? "s" : ""}`
      if (itemsCleared > 0) {
        message += ` (${itemsCleared} saldado${itemsCleared > 1 ? "s" : ""})`
      }
      if (ppTotal > 0) {
        message += `. Descuento pronto pago aplicado: $${ppTotal.toLocaleString("es-CO")}`
      }
      if (remainder > 0) {
        message += `. Saldo sin aplicar: $${remainder.toLocaleString("es-CO")}`
      }
    } else {
      message += ". Sin cartera abierta para este cliente."
    }

    return { success: true, message }
  } catch (e) {
    console.error(e)
    return { error: "Error al registrar el pago. Intente de nuevo." }
  }
}
