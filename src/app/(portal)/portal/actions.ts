"use server"

import { createClient } from "@/lib/supabase/server"
import { getPortalProfile, getPortalElectricityInvoiceData, type PortalElectricityInvoiceData } from "@/lib/data/portal"
import { isValidPeriodo } from "@/lib/security/validators"

export async function fetchElectricityInvoiceForDownload(
  unitId: string,
  periodo: string,
): Promise<PortalElectricityInvoiceData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  if (!isValidPeriodo(periodo)) return null

  const profile = await getPortalProfile(user.id)
  if (!profile) return null

  // Security: unitId must belong to this tenant
  if (!profile.allUnitIds.includes(unitId)) return null

  return getPortalElectricityInvoiceData(unitId, periodo)
}
