"use server"

import { getAuthUser, requireStaffAction } from "@/lib/auth/session"
import { getPortalProfile, getPortalProfileByTenantId, getPortalElectricityInvoiceData, type PortalElectricityInvoiceData } from "@/lib/data/portal"
import { isValidPeriodo, isValidUuid } from "@/lib/security/validators"

export async function fetchElectricityInvoiceForDownload(
  unitId: string,
  periodo: string,
  previewTenantId?: string,
): Promise<PortalElectricityInvoiceData | null> {
  if (!isValidPeriodo(periodo)) return null

  // Staff preview ("Ver portal"): the viewer is staff, not the tenant, so there
  // is no tenant login session to resolve — authorize via staff role and scope
  // to the previewed tenant's own units with the same ownership check as below.
  if (previewTenantId !== undefined) {
    if (!isValidUuid(previewTenantId)) return null
    const staff = await requireStaffAction()
    if ("error" in staff) return null

    const profile = await getPortalProfileByTenantId(previewTenantId)
    if (!profile) return null

    // Security: unitId must belong to the previewed tenant
    if (!profile.allUnitIds.includes(unitId)) return null

    return getPortalElectricityInvoiceData(unitId, periodo)
  }

  const user = await getAuthUser()
  if (!user) return null

  const profile = await getPortalProfile(user.id)
  if (!profile) return null

  // Security: unitId must belong to this tenant
  if (!profile.allUnitIds.includes(unitId)) return null

  return getPortalElectricityInvoiceData(unitId, periodo)
}
