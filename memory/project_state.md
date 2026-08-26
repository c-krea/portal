# C-Krea — current state
canonical: self
updated: 2026-08-26 (Session 76)

## Live
- Prod: https://ckrea.com.co — Ready (`198e4e2` on `main`; Session 76 pagos chip is on a PR, not merged yet)
- DB: shared Supabase `v2` + read-only `siesa_raw` (Z40). Never test on prod. Local twin: Docker `:54622`, `npm run dev:test` / `npm run db:sync` (now loads `recaudo`).

## Just shipped
- **Session 76 (PR, not on prod until merge):** `/pagos` "Desde mora" filter now uses the mora card's rule (older invoice period OR days-late > grace). August was hiding $13.490.363; July $19.431.732. KPI vs table universes labelled, maths unchanged.
- **Session 75:** `/pagos` no longer dies on the 8s statement timeout — `vp AS MATERIALIZED` fence. Sync script now loads `recaudo` locally.
- First meter reading with **no previous row** = handover baseline, **$0**. Rule in `src/lib/lectura-consumo.ts`.
- Reading day (Session 71): the 9th, moves forward off Sunday + Colombian holidays. Saturday is a working day.

## Open / not this session
- **WOR-277** — fence `vista_pagos` in `reportes.ts`, `portal.ts`, `dashboard.ts`, `api/cron/notifications/route.ts` before they hit the 8s ceiling.
- **WOR-278** — no replayable migration history (1 file vs 57/82/18).
- Optional: compute the mora `bucket` once on the server so SQL CASE and `bucketFor` cannot drift.
- **307 July energy $219.000** — last month at old unit, entered by operaciones. Portal no longer shows 307 (contract closed 2-Aug). Collect off-portal if still unpaid.
- **Notifications cron** still checks the wrong period (this month vs previous) → reminder fires for everyone. Session 71 leftover.
- **506B** — active contract, no May/June readings. Old follow-up.
- **Notifications cron writes its dedup row before sending** (`push_notification_log` insert
  precedes `sendPushToUser`). A genuine push misconfiguration would suppress that notification on
  every later run. Latent, found Session 73.
- **`src/lib/push.ts` builds SQL by string interpolation.** IDs come from our own DB today. Low
  risk, worth a cleanup pass.
- **The Siesa sync connects as the Postgres superuser**, not a role scoped to `siesa_raw`. Contradicts
  `docs/isolation-checklist.md`. Fix is IT's, via Esteban — scoped role + rotate the password if it
  has travelled. Found Session 73.
- Two untracked business files at repo root: `Borrador Cuenta de Cobro…pdf`, `SIESA connexion.xlsm`.

## Money rules (do not redefine)
A pronto pago · B phase discount · C mora DIAN · D gastos (water flat, electricity metered).
Invoice: canon − phase → IVA 19% − pronto pago + gastos + mora.

## Medidores
- Periodo = previous month (Bogotá). Day-9 window may move; periodo does not.
- No previous row → anterior = actual, kwh = 0. A stored previous of 0 is a real reading.
- Zero-kWh rows are not energy invoices.
