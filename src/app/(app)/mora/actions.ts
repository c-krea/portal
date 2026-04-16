"use server"

import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { runInterestAccrual, type InterestAccrualSummary } from "@/lib/interest-engine"

const schema = z.object({
  accrualDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
})

export type AccrualState = {
  success?: boolean
  error?: string
  summary?: InterestAccrualSummary
}

export async function calcularIntereses(
  _prev: AccrualState,
  formData: FormData,
): Promise<AccrualState> {
  const parsed = schema.safeParse({
    accrualDate: formData.get("accrualDate"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Fecha inválida" }
  }

  try {
    const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
    const companyId = String(companies[0].id)

    const summary = await runInterestAccrual(companyId, parsed.data.accrualDate)

    revalidatePath("/mora")
    revalidatePath("/facturas")
    revalidatePath("/clientes")

    return { success: true, summary }
  } catch (e) {
    console.error(e)
    return { error: "Error al calcular intereses. Intente de nuevo." }
  }
}
