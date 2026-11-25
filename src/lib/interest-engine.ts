/**
 * Rule C — Late-Interest Accrual (Intereses de Mora)
 *
 * v2 architecture: vista_facturas derives from siesa_raw and exposes no portal-tracked
 * status/saldo. Interest accrual is computed on-demand from vista_cartera_actual.dias_mora
 * (see reportes/dashboard) instead of being persisted into a portal-side ledger.
 *
 * This function is a no-op kept for the accrual cron (api/cron/accrual).
 * Phase F removes the legacy `interest_accruals` table; this signature stays intact so
 * callers don't break.
 */

export type AccrualResult = {
  invoiceId: string
  unitNumber: string
  clienteName: string
  periodo: string
  daysOverdue: number
  overdueBalance: number
  interestAmount: number
  cumulativeInterest: number
}

export type InterestAccrualSummary = {
  accrualDate: string
  processed: number
  skipped: number
  totalInterest: number
  results: AccrualResult[]
  errors: string[]
}

export async function runInterestAccrual(
  _empresaId: string,
  accrualDate: string,
): Promise<InterestAccrualSummary> {
  return {
    accrualDate,
    processed: 0,
    skipped: 0,
    totalInterest: 0,
    results: [],
    errors: [],
  }
}
