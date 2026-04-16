"use server"

import { db } from "@/lib/db/client"
import { invoices } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { generateInvoicesForPeriod } from "@/lib/invoice-engine"

const schema = z.object({
  year:  z.coerce.number().int().min(2024).max(2030),
  month: z.coerce.number().int().min(1).max(12),
})

export type EmitState = { success?: boolean; error?: string }

export async function emitirFactura(id: string): Promise<EmitState> {
  try {
    const updated = await db
      .update(invoices)
      .set({ status: "emitida" })
      .where(eq(invoices.id, id))
      .returning({ id: invoices.id, status: invoices.status })

    if (updated.length === 0) return { error: "Factura no encontrada" }

    revalidatePath("/facturas")
    revalidatePath(`/facturas/${id}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: "Error al emitir factura" }
  }
}

export type GenerateState = {
  success?: boolean
  error?: string
  message?: string
  created?: number
  skipped?: number
  errors?: string[]
}

export async function generarFacturas(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const parsed = schema.safeParse({
    year:  formData.get("year"),
    month: formData.get("month"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Período inválido" }
  }

  const { year, month } = parsed.data

  try {
    const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
    const companyId = String(companies[0].id)

    const result = await generateInvoicesForPeriod(companyId, { year, month })

    revalidatePath("/facturas")

    if (result.created === 0 && result.skipped > 0) {
      return {
        success: true,
        message: `Todas las facturas del período ya existen (${result.skipped} omitidas).`,
        created: 0,
        skipped: result.skipped,
        errors: result.errors,
      }
    }

    const periodoStr = `${year}-${String(month).padStart(2, "0")}`
    return {
      success: true,
      message: `${result.created} factura${result.created !== 1 ? "s" : ""} generada${result.created !== 1 ? "s" : ""} para ${periodoStr}.${result.skipped > 0 ? ` ${result.skipped} omitida${result.skipped !== 1 ? "s" : ""} (ya existían).` : ""}`,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    }
  } catch (e) {
    console.error(e)
    return { error: "Error al generar facturas. Intente de nuevo." }
  }
}
