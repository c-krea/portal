# C-Krea — current state
canonical: self
updated: 2026-08-12 (Session 72)

## Live
- Prod: https://ckrea.com.co — Ready (`ed5bddd`)
- DB: shared Supabase `v2` + read-only `siesa_raw` (Z40). Never test on prod.

## Just shipped
- First meter reading with **no previous row** = handover baseline, **$0**. Rule in `src/lib/lectura-consumo.ts`.
- Local **806** (Harold Castiblanco, moved 307→806): July row is 2.734,7 / 2.734,7 / 0 kWh / $0. `tiene_medidor=true`.
- Reading day (Session 71): the 9th, moves forward off Sunday + Colombian holidays. Saturday is a working day.

## Open / not this session
- **307 July energy $219.000** — last month at old unit, entered by operaciones. Portal no longer shows 307 (contract closed 2-Aug). Collect off-portal if still unpaid.
- **Notifications cron** still checks the wrong period (this month vs previous) → reminder fires for everyone. Session 71 leftover.
- **506B** — active contract, no May/June readings. Old follow-up.
- Linear free-plan cap — could not file the 806 issue. No open C-Krea issues in CLI.
- **Notifications cron writes its dedup row before sending** (`push_notification_log` insert
  precedes `sendPushToUser`). A genuine push misconfiguration would suppress that notification on
  every later run. Latent, found Session 73.
- **`src/lib/push.ts` builds SQL by string interpolation.** IDs come from our own DB today. Low
  risk, worth a cleanup pass.
- **The Siesa sync connects as the Postgres superuser**, not a role scoped to `siesa_raw`. Contradicts
  `docs/isolation-checklist.md`. Fix is IT's, via Esteban — scoped role + rotate the password if it
  has travelled. Found Session 73.

## Money rules (do not redefine)
A pronto pago · B phase discount · C mora DIAN · D gastos (water flat, electricity metered).
Invoice: canon − phase → IVA 19% − pronto pago + gastos + mora.

## Medidores
- Periodo = previous month (Bogotá). Day-9 window may move; periodo does not.
- No previous row → anterior = actual, kwh = 0. A stored previous of 0 is a real reading.
- Zero-kWh rows are not energy invoices.
