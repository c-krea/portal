# Changelog — C-Krea PayControl

## [Unreleased]

### Session 79 — 2026-08-26: tenant Total a Pagar includes electricity

#### Fixed
- **The portal Total a Pagar number was rent only.** Electricity already showed on the pay-energy button and never entered the headline. The big number now is Siesa rent + that same energy total, with an **Energía** line under the invoices. Pronto pago still cuts rent only. On the local twin, Fusión Grafik went from **$10.483.459** to **$10.965.509** (+ **$482.050** light).

#### Notes
- Pay online is unchanged: rent and energy stay two steps.
- Did not change mora or the rent formula. The unused detail modal was left unused.

### Session 78 — 2026-08-26: password reset survived the mail scanner

#### Fixed
- **Password-reset (and welcome) emails died before the person clicked.** The email used a one-time secret link that mail apps open to "check" it. The link was already used when they clicked. Emails now open our portal; the token is only used after they click **Continuar**, then they set the new password.

#### Notes
- Old emails stay dead. After this is live, send **one** new email.
- Same extra click on first-time "create your password" welcome emails.

### Session 77 — 2026-08-26: remaining payment queries fenced; Locales shows who left still owing

#### Fixed
- **Four more pages still hit `vista_pagos` without the Pagos shield.** Reportes, the tenant portal payment list, the dashboard recaudado figure, and the payment-confirmation cron. They do not time out today (~70ms, one scan) but they share the 8s ceiling and recaudo has doubled in two weeks. Same `MATERIALIZED` fence as Pagos / ficha del cliente. 2026 totals on the local twin unchanged: **$1.694.516.741,77** recaudado, **$107.715.494** pronto pago.

#### Added
- **Locales → Ya salieron.** People with no active contract who still owe now sit in their own block under the occupancy table, so cobro does not mix them with current tenants. Today on the local twin: Pedraza **$7.260.656** and Punto Acrílico **$4.818.675**. Names from the original ticket are stale — most of those units are occupied again.

#### Notes
- Did not change what "paid" means, mora maths, or the `vista_pagos` view.
- WOR-58 (add electricity to Total a Pagar) was not in this ship — the live headline is Siesa rent, electricity is a separate pay button.

### Session 76 — 2026-08-26: `/pagos` late-filter now matches the mora card

#### Fixed
- **The table's "Desde mora" filter under-reported late payments.** It only looked at days-late; the mora card also counts cash applied to an older invoice. Tenants paying last month's bill a few days into this month showed as "Primeros 10 días" in the table and as mora on the card. On the local twin the filter was hiding **$13.490.363 in August** and **$19.431.732 in July**. The table now uses the card's rule. Collection totals did not move.

#### Changed
- **KPI and table labels now name the two different universes.** "Recaudado" is cash against this month's invoices; the table is all cash received in the month, including late bills. The numbers were always different on purpose; they no longer look like a missing-cash bug.

#### Notes
- Do not "simplify" late to `días > 0`. Siesa's due date is wrong on invoices before May 2026, so that shortcut doubles mora in January and December while looking fine in July/August.
- Verified locally (never prod) on 2025-12, 2026-01, 2026-07, 2026-08: chip mora = card mora, row counts and totals unchanged.

### Session 75 — 2026-08-26: `/pagos` died on a statement timeout

#### Fixed
- **The Pagos page threw "Error al cargar" instead of loading.** The three queries behind the page each re-scanned `siesa_raw.recaudo` (330k+ rows) up to **40 times** and took ~5 s apiece; the page fires all three concurrently against the **8 s `statement_timeout`** PostgREST inherits from the `authenticator` role. Past that line Postgres cancelled the statement, `execute()` threw, and the `(app)` error boundary replaced the whole page. Current month was intermittent, older months failed outright — and it got worse every day, because `recaudo` grows with each ERP sync.
- **Cause was an un-fenced view, not the financial logic.** `v2.vista_pagos` is a view over `recaudo` with no index usable for its filters (`cruce LIKE 'FVS-%'`, `id_zona = 'Z40'`, `valor_final < $1B`). Postgres inlined it into the `NOT EXISTS` anti-join of the electricity-dedup rule and re-planned it as a nested loop — one full seq scan of `recaudo` per candidate row. The view is now materialised **once** per query as a `vp AS MATERIALIZED` CTE that every downstream CTE reads from, turning the nested-loop anti-join into a single hash anti-join over 3.114 rows.

#### Notes
- **No financial logic, no DB object and no migration changed.** Pure query-shape fix; `siesa_raw` untouched (still read-only). Results verified byte-identical against the old queries on **2026-01** — the heaviest month that actually exercises the electricity-dedup exclusion (7 inquilinos excluded): 147 rows vs 147, zero rows in either direction of a two-way `EXCEPT ALL`, same total **$192.867.355**; KPI query likewise identical ($126.679.059, 50 documentos).
- Measured end-to-end through the real `exec_sql` wrapper: **~5.000 ms → 646 ms** on 2026-01, and 4.860 ms → 373 ms on the bucket query for 2026-08. Roughly 8× headroom under the timeout.
- The 8 s ceiling comes from `ALTER ROLE authenticator SET statement_timeout`; `service_role` has no `rolconfig` of its own and `SET ROLE` does not re-apply role settings, so every app query runs under it. Worth remembering for any other page built on `vista_pagos`.
- **Verified against a full local twin on 2026-08-26** (fix authored 10-Aug, landed today). Local Docker DB loaded with the complete `siesa_raw.recaudo` — **639.168 rows / 76.651 Z40 / 306 MB**, an exact copy of prod, with prod's index set and the same inherited 8 s ceiling. The old code failed **every** month tested (2025-12, 2026-01, 2026-07, 2026-08), all three queries, at the 8 s line; un-timed it ran 5.9–16.6 s. The new code ran 80–198 ms throughout. Results identical on all four months: row counts 173/147/90/83 matched, row content matched, table totals matched ($229.251.648 / $192.867.355 / $217.644.065 / $186.514.029) and KPI totals matched ($148.151.850 / $126.679.059 / $164.178.403 / $146.067.125).
- **`vp` now selects the whole view** rather than hand-listing six columns, matching how `tenant-detail.ts` fences the same view. Formal review returned SHIP (no P0/P1); re-verified identical to both the pre-fix code and the shipped fix on all four months.
- **`scripts/test-db-sync.sh` now loads `recaudo`.** It previously copied the table's structure but not its rows, which made `/pagos` untestable locally. Streamed prod→local a quarter at a time (12 slices) instead of one long `COPY` that drops the pooler's SSL; `SKIP_RECAUDO=1` opts out. Added an `ANALYZE` step — a freshly `COPY`ed table has no statistics, so without it the planner behaves unlike prod and any local performance measurement is invalid.
- **`recaudo` has nearly doubled since the fix was written** — 330k rows at authoring, 639k two weeks later. The original measurement said the current month was "intermittent"; by 26-Aug the current month failed outright. The growth curve was real.

### Session 73 — 2026-08-20: Preview builds fixed, CLAUDE.md thinned

#### Fixed
- **Every Vercel Preview build had been failing for nine days.** `src/lib/push.ts` called
  `webpush.setVapidDetails()` at module load, so importing the file was enough to run it — and Next
  runs that during build-time page-data collection for `/api/cron/notifications`. The VAPID
  variables exist only in Vercel's Production scope, so Preview threw
  `No subject set in vapidDetails.subject`. Push is now configured on first send instead, so a build
  that never sends a notification never needs the credentials. Missing credentials throw a named
  error rather than being hidden behind `process.env.X!`. Production was unaffected throughout.

#### Changed
- **`CLAUDE.md` cut 1440 → 940 words.** It now carries repo facts only — stack, financial rules,
  DB and isolation conventions, Siesa integration. Org/IT context, Supabase access paths and the
  deploy-author constraint moved to a git-ignored `.claude/CLAUDE.local.md`, so the file is safe to
  share with anyone who opens the repo.

#### Added
- Five documents that had been untracked since May, including `docs/isolation-checklist.md` — which
  `CLAUDE.md` already pointed at, so that reference had been dangling.
- `integracion_supabase/` added to `.gitignore`: it was a clone of IT's own GitLab repo carrying its
  own `.env` and a 68 MB venv. Now deleted from disk.

#### Notes
- Open, not fixed: the notifications cron writes its dedup row before sending, so a genuine push
  misconfiguration would suppress a notification permanently. Detail in `docs/JOURNAL.md`.

### Session 72 — 2026-08-12: First meter reading is a $0 baseline

#### Fixed
- **Local 806 billed $2.252.800 for its first reading.** Harold Castiblanco moved 307→806 last week and submitted 2.734 kWh with no previous row. The write path treated "no previous" as anterior = 0 and charged the whole meter. July 806 row set to handover baseline (2.734,7 / 2.734,7 / 0 kWh / $0). Backup: `docs/backups/lecturas_medidor_806_baseline_20260812_backup.csv`.
- **First reading with no previous row no longer bills.** Shared rule in `src/lib/lectura-consumo.ts`: no previous → anterior = actual, kwh = 0, total = $0. Wired into tenant `submitLectura` and admin `registrarLectura`. Portal and admin forms say "punto de partida — este mes no se cobra". Zero-kWh rows no longer appear as an energy invoice.

#### Notes
- Photo of the 806 DTS238 read **2.734,7** (they typed 2.734). Baseline stored at 2.734,7.
- 806 `tiene_medidor` flipped false → true.
- 307 July energy ($219.000, entered by operaciones) left as-is — last month at the old unit. Portal no longer shows 307 (contract closed 2-Aug).

### Session 71 — 2026-08-10: Reading day moves off Sundays and holidays

#### Fixed
- **The meter-reading day was lost whenever the 9th fell on a Sunday or a holiday.** The 9th of August 2026 was a Sunday, so tenants found the form closed on the only day it opens and had no way to submit on Monday either — the gate was a hard `getDate() === 9` copy-pasted in three places. The reading day now **moves forward** to the next day that is neither a Sunday nor a Colombian holiday. Saturday is a normal working day at Ckrea and does not move it. Still exactly one reading day per month, so the "sin lectura → 1,5× el promedio" deadline stays unambiguous.
- **The move repeats until it lands on a valid day.** Ley Emiliani puts most Colombian holidays on a Monday, so a Sunday 9th very often falls onto a holiday Monday. Real case: **May 2027** — the 9th is a Sunday, the 10th is Ascensión del Señor, so the reading day is the 11th. A single-step rule would have opened the portal on a national holiday.

#### Added
- **`src/lib/festivos.ts`** — all 18 Colombian holidays computed per year (fixed dates, Ley Emiliani transfers to the following Monday, and the five Easter-relative days off a Gregorian Easter). No yearly table to maintain. Verified against the official 2026, 2027 and 2028 calendars, including the non-transferable cases (20-jul-2027 stays on Tuesday, 1-may-2027 stays on Saturday).

#### Notes
- `periodo` is month-based (`lecturaPeriodo()`), so a reading sent on a moved day books to the same previous month as one sent on the 9th — no period drift, no risk of the month-gap double-billing from Session 69.
- The rule lives in one place (`lecturaDay()` / `isLecturaWindow()` in `src/lib/periodo.ts`) and is used by the portal page, the server action and the dashboard banner — the three copies of the old day-9 check are gone.
- Tenant-facing copy now names the actual day for the current month ("Envío disponible solo el 10 de agosto") instead of a flat "el día 9", which would send tenants back to a closed form on a moved month.
- Admin entry at `/medidores` was never day-gated; it is untouched.

### Session 70 — 2026-07-22: Stale-sync notice in the tenant portal

#### Fixed
- **Tenants were shown late-interest that grew every day on invoices they had already paid.** `getPortalCartera` computes interest as `vr_vencido × tasa/366 × (CURRENT_DATE − vencimiento)` — a live date against frozen balances. With the Siesa push dead since **11-Jul**, any tenant who paid after that still sat in `cartera` as overdue while their estimated interest climbed daily. 15 tenants, $99.4M in frozen balances. While data is stale the portal now **hides** the "Cuenta en mora" banner and the interest figure, and the Estado de Cuenta card goes neutral **"Sin confirmar"** — never a false "Al Día" either.

#### Added
- **"Información de pagos desactualizada" notice** on the tenant dashboard. Fires only when the last Siesa push is over 24 h old (`getSyncFreshness()` over `siesa_raw.cartera.siesa_synced_at`) and clears itself when the ERP resumes — no code edit, no redeploy. The "last data" date is read from the DB; only the expected recovery date (`NORMALIZACION_ESPERADA`) is hand-written.

#### Notes
- The pagos page showing **$0 for "11 al 30"** in July was **not** a filter bug — verified day by day that `v2.vista_pagos` drops no Z40 FVS payment (raw count == view count every day). Totals reconcile exactly: temprano $54.291.090 (19 pagos), mora $11.561.606 (6). There simply is no payment after 9-Jul in the DB.
- `formatDate()` parses `"2026-07-11"` as UTC midnight → would print a day early on any server behind UTC. Used `formatDateShort()` (local midnight) instead.
- **"Próximo Pago" can still read "vencido"** for a paid invoice while the ERP is frozen. Left as-is on purpose — it shows a due date, not a growing charge.
- Root cause is outside the portal: `siesa_raw` is read-only and the push is IT-controlled (Reymon). Escalation pending.

### Session 69 — 2026-07-14: Medidores — month-gap double-billing + two code holes

#### Fixed
- **Locals 502, 307 and 309 were billed ~2× for June energy.** None of the three sent a reading in the 1–9 June window, so no May row existed. When they submitted on 9 July, both `submitLectura` and `registrarLectura` fell back to "last reading, any period" — which was **April** — so June's consumo silently spanned May+June. Portal showed 489,1 / 705,6 / 89,5 kWh against the admin's 239 / 336 / 51. Fixed in DB: the 3 missing May readings loaded from the admin's Excel, the 3 June rows recomputed. June now lands on the admin's Excel to the peso: **$194.750 / $282.150 / $42.800**.
- **Month picker offered the current month.** `/medidores` and `/medidores/facturas` built their month tabs from `new Date()`, so in July "Jul" was selectable — but a reading always belongs to the *previous* month. An admin picked it by mistake on 9 July and created two orphan rows (locals 510, 520; tarifa 0, total $0, duplicating June). Picker now caps at `lecturaPeriodo()`; the two orphan rows deleted.

#### Added
- **`⚠ Salto de período` badge** on the admin medidores table — fires whenever a reading's previous reading isn't the immediately-prior month, i.e. the kWh cover more than one month. Non-blocking (a new tenant's first reading legitimately spans), but the gap can never pass silently again. Backed by `prevPeriodo` / `saltoPeriodo` on `MedidorAdminRow` and `mesAnterior()` in `src/lib/periodo.ts`.

#### Notes
- Full read-only audit of every reading since April: chain, kWh math and money were otherwise **exact** — all 157 May+June rows had `tarifa` matching the group invoice and `total = MROUND(kwh × tarifa, 50)` to the peso. Only the 5 gap rows and the 2 orphans were wrong.
- Locals **506A** and **507** also show a gap, but correctly — both tenants moved in 29-May, so their April row is a handover baseline. Confirmed by admin. Left as-is.
- **309 recorded, not charged**: its 38,5 kWh of May consumption predates the current tenant (took over 15-May). Reading stored, `total_energia = 0`, reason in `notas`. Billing decision deferred.
- **506B (CICLO CREATIVO)** has an active contract and only one reading ever (April) — no May, no June, never billed. Open follow-up.
- Nothing was double-charged: verified in `siesa_raw` that no energy invoice exists for any of these locals, any month. Backup of the 8 touched rows: `docs/backups/lecturas_medidor_fix_20260714_backup.csv`.

### Session 68 — 2026-07-11: Pronto-pago window fix (tenant portal + staff page)

#### Fixed
- **Pronto-pago discount vanished on the 10th of every month.** The tenant portal gated the discount on a fixed calendar cutoff (`todayDay <= 10`), so on the 11th it disappeared for everyone — even though a 1st-of-month invoice's 10-day window (counted from the 2nd, since invoices are cut mid-day on the 1st) runs through the 11th. Replaced with a **per-invoice** deadline: eligible while `today ≤ fecha_factura + 10 días`. Now self-adjusts for invoices billed on the 2nd (valid through the 12th). Files: `src/lib/data/portal.ts`, `src/app/(portal)/portal/page.tsx`, `cartera-breakdown.tsx`, `wompi-button.tsx`.
- **Staff "Locales" page aligned** — same per-invoice window (was on the old `todayDay <= 10` bug + a current-month-only filter), and its pronto-pago now computes on the **net canon (`ventas`, pre-IVA)** instead of the full balance (`saldo`), which had inflated the discount by ~19% (IVA) and disagreed with the tenant portal. Files: `src/lib/data/tenant-detail.ts`, `src/app/(app)/locales/[id]/page.tsx`.

#### Notes
- Review caught two would-be bugs: (1) `siesa_raw.cartera.fecha_factura` is `timestamptz` → returned an ISO string that broke the date parse → silently zeroed the discount for all (fixed with a `::date` cast, mirrors `fecha_vence`); (2) the staff page built "today" from UTC server time, not Bogotá, so it would have expired PP a day early every evening 19:00–24:00 COT (fixed to `America/Bogota`, matching the portal).
- Shared date rule extracted to `src/lib/pronto-pago.ts` (`isPpDateEligible`) so tenant + staff views can't drift.
- Business rule confirmed by Esteban: 1st-of-month invoice → PP deadline the **11th** (invoice cut mid-day → the 1st is a partial day, count from the 2nd). Diverges 1 day from the ERP's own `fecha_pronto_pago` (mostly prints the 10th; inconsistent field, not used directly). Read-only — no ERP/DB writes.
- **Known follow-up:** the tenant portal applies one `pronto_pago_pct` to all of a tenant's units; the staff page uses per-unit rates. Affects exactly 1 multi-unit tenant with mixed rates (REBELARTE). Not fixed in this drop.

### Session 67 — 2026-07-10: Client detail page timeout fix (perf)

#### Fixed
- **Client detail page (`/locales/[id]`) crashed with "Error al cargar" for heavy clients.** Root cause: `getTenantPayments` referenced the `vista_pagos` view (a full 130K-row `recaudo` scan) inside a correlated `NOT EXISTS`, re-scanning the whole table once per payment row (~148× for IMAGENN) → **19 s** per page → exceeded the 8 s `statement_timeout` → the query was cancelled → the page threw. Hit every client with enough payment history (looked like "broken client links"; the URL was always valid — it was a timeout, not a 404).
- **Fix:** materialize the tenant's payment rows once (`WITH mine AS MATERIALIZED`) and run all dedup against that ~150-row set. **19,043 ms → 124 ms (~150×).** Output verified byte-identical vs the old query for IMAGENN (147 rows), FAJARDO (82) and Tatiana Contreras (heaviest `months_to_drop` path) — no numbers change. Other 3 detail-page queries already sub-ms. One file: `src/lib/data/tenant-detail.ts`.

### Session 66 — 2026-07-10: Mora page → DIAN interest method

#### Added
- **`v2.tasa_interes_mora`** — monthly DIAN mora rate (art. 635 E.T.). Admin enters the month's rate on the Mora page; July 2026 seeded at 26,79% E.A.
- **Local test DB** (Docker) for Ckrea — `npm run dev:test` / `db:sync`, guard script, docs in CLAUDE.md. All dev/testing now runs off prod.

#### Changed (Mora page)
- **Interest now follows the admin's DIAN method** — `vr_vencido × (tasa_mes ÷ 366) × días vencidos`, counted from the due date. Fixes three bugs: the double 30-day grace (was undercharging ~30 days), the fixed 2%/mo rate (now the monthly DIAN rate), and the hidden 1–30-day-overdue invoices (all now shown).
- Old ERP `fecha_vence` bug auto-corrected (due date = invoice + 30 when the ERP date is wrong).
- Page reorganized: monthly rate input, real interest KPIs (active tenants), expandable per-invoice detail per tenant, Cartera Jurídica shown separately with its own subtotal. Interest charged on FVS invoices only.
- Result: the page now matches the admin's Excel method invoice-by-invoice (IMAGENN test client reconciled).
- **Tenant portal aligned** — `getPortalCartera` interest now uses the same DIAN rate + due-date logic, so the tenant's estimate always matches the admin page (verified: IMAGENN identical per invoice).
- **Docs reconciled** — CLAUDE.md Rule C + `financial-rules-engine-spec.md` marked: mora billing = DIAN art. 635, superseding the old 0,05%/día.

### Session 64 — 2026-07-01: Shared `user-admin` Edge Function (multi-app login creation)

#### Added (Supabase — live, not in git)
- **`user_admin` schema** with 3 locked tables (`apps`, `leads`, `audit_log`). RLS enabled, no policies, not exposed to the API — only the function touches them (via a direct DB connection).
- **`user-admin` Edge Function** — one shared, guarded door that lets each app's "Lead" create logins and manage their own Lead list, without any app ever holding the service_role key. Actions: `create_login`, `add_lead`, `remove_lead`, `list_leads`, `list_audit`.
- **Auth model:** caller sends their own login token; function validates it via `getUser()`, checks the `leads` list for that `app_key`, then acts. Master key stays inside the function. Deployed `verify_jwt=false` (identity checked in-function) so browser apps' CORS preflight works and the public anon key is rejected as a badge.
- **Red-team hardening vs the spec:** logins are app-stamped with the caller's own `app_key` (fires that app's existing profile trigger; anti-spoof strips any injected `app`); duplicate email returns the existing `user_id` instead of a dead-end error; last-Lead removal blocked atomically; password ≥8; soft 20/min create cap.
- Seeded known apps `ckrea`, `rutas`, `ric`. Verified end-to-end against the live function (throwaway app, cleaned up). RIC first-Lead seed deferred at German's request.

### Session 63 — 2026-06-24: Data-layer caching across all heavy pages (Vercel CPU)

#### Performance / caching (built, NOT yet deployed)
- **Vercel Fluid CPU was dominated by ckrea-portal (81% of the 4h pool).** Every admin page is server-rendered on each visit (login-gated → dynamic), recomputing heavy financial SQL from scratch every time.
- **Added a 30-minute data-layer cache** (`src/lib/cache.ts`) wrapping the heavy read queries for dashboard, pagos, gastos, locales, mora, proyecciones, facturas, and medidores. Financial SQL/math unchanged — only wrapped. Heavy pages now compute once per 30 min instead of on every visit.
- **Complete, centralized cache invalidation:** every write refreshes the affected caches — daily ERP sync, financial-rule edits, projection edits, electricity-bill saves, meter readings (admin + tenant), and tenant-contact edits. New cached domains are covered automatically via one central tag list.
- **One knob:** `CACHE_TTL_SECONDS` (30 min) + `CACHE_TAGS` in a single file. Verified across 4 independent multi-agent review rounds + a green production build.

### Session 62 — 2026-06-24: 9 missing May energy invoices restored

#### Data (May 2026 energy)
- **9 units had a May meter reading but $0 energy** (101, 118, 119, 210, 212, 305, 311, 503, 801). Their consumption was never calculated during the June 10 manual reconciliation — the reading was captured but kWh and cost were left at 0. Because the portal only shows months with consumption > 0, these tenants couldn't see or pay their May energy bill (reported by local 305's tenant).
- **Fix:** recomputed kWh (reading − previous) and cost (kWh × tarifa, rounded to 50) with the same verified formula; readings untouched. Restored **$1.232.800** of billable May energy. All 9 tenants now see and can pay their May bill. CSV backup saved to `docs/backups/`.
- **Not a code bug:** both the tenant and admin reading forms compute kWh correctly — this was a one-time manual-entry gap. Verified: every value re-derived, tarifas match the official May utility invoices, no other month affected (the one remaining zero — April unit 111 — is the intentional vacant-unit zeroing from Session 61).

### Session 61 — 2026-06-09/10: Electricity flow overhaul

#### Portal del inquilino (medidor)
- **Photo uploads no longer crash:** photos are shrunk in the browser (2400px JPEG) before upload — iPhone HEIC converted automatically, any phone photo now ~1 MB. Server limit raised 5→10 MB as safety net.
- **Friendly error screen:** portal failures now show a Spanish "Algo salió mal / Reintentar" card (reported to Sentry) instead of the generic "Application error".
- **Readings trusted as submitted:** no auto-classification or "se revisará con urgencia" messages; simple confirmation. Submit disabled until all 5 digits entered (prevents zero-reading lockout).
- **"Total estimado energía" → "Valor a pagar".**
- **Correct billing month:** the day-9 reading is stored under the month it measures (previous month), computed server-side. Pending energy charges no longer disappear from the dashboard on days 1–8.

#### Admin (medidores)
- **"Alerta" column:** only two visual tags — "Sin lectura" (gray) and "⚠ Revisar" (amber, >40% off 3-month average or 0 kWh). No more Crítico/Pendiente/Aprobado badges.
- **Photo viewer fixed:** "Ver" now opens meter photos (was silently failing).
- **Pages default to the measurement month** (previous month), matching where day-9 readings actually live.

#### Data (May 2026 reconciliation)
- May billing reconciled against admin Excel: 74 readings, 65 billed, $13,696,150 — verified peso-for-peso. Test/duplicate rows removed, 3 missing locals loaded, vacant locals zeroed (meter baselines kept).

### Session 60 — 2026-06-05: Clear "link expired" message on password-setup screen

#### Auth (`/auth/confirm`)
- **Expired/used links no longer fail silently:** when a password-setup or reset link is dead (already used, or superseded by a newer link), the screen now shows a clear message — *"El enlace expiró o ya fue usado. Por seguridad cada enlace funciona una sola vez. Solicita uno nuevo abajo."* — instead of silently bouncing to the login page (which looked like "password creation failed").
- **"Solicitar nuevo enlace" button:** all error cases now show a full-width button to request a fresh link, styled to match the login screen. Working links are unaffected.

#### Pagos / cartera vencida (`v2.vista_pagos`) — 2026-06-08
- **Partial & installment payments no longer dropped:** the payments view de-duplicated on `(tenant + invoice + day)`, which silently discarded a *second* real payment made against the same invoice on the same day. Re-keyed the de-dup to the ERP's unique movement id (`row_id_mov`). Restored **54 real payments = $ 66.137.912** across all history (verified: 0 true duplicates, 0 reversals, 0 new duplicate rows).
- **Flagged by admin** for Renato Fajardo ($ 295.500) + Galindo Polidoro ($ 2.800.000); 3 more were also being hidden (Arriero $ 2.000.000, Patarroyo $ 1.062.062, Rebelarte $ 178.800). Overdue-payment totals now match Siesa.

### Session 55 — 2026-05-14: Tenant email auto-creates auth account + security hardening

#### Tenant login setup (`/usuarios`)
- **Email saves = account created:** setting a tenant's email in the edit modal now automatically creates their Supabase Auth account and links it to their unit. No separate "Create Account" step needed for new tenants.
- **Both email paths unified:** `updatePortalEmail` and `updateTenantInquilino` now behave identically — both auto-create if no account exists, both sync `v2.perfiles.email` on update.
- **Sync order fixed:** on email change for existing accounts, `v2.perfiles` updates before `auth.users` — prevents split-brain if the second write fails.
- **Orphan cleanup:** if perfil insert fails after auth user creation, the orphaned auth account is deleted automatically so the tenant can be retried cleanly.

#### Security
- **Auth guard on all server actions in `/usuarios`:** all 5 actions now verify the caller's session and role before executing. An inquilino-role user can no longer escalate privileges via direct POST.
- **`assertUuid` on `empresaId`:** DB-sourced UUID now validated before interpolation in all affected actions.
- **`sqlStr()` on `rol` field:** was interpolated raw in `updateAdminUser`; now escaped consistently.

### Session 54 — 2026-05-12: Electricity billing overhaul

#### Facturas de Energía form (`/medidores/facturas`)
- **Tarifa input replaces kWh input:** admin now enters tarifa ($/kWh) directly; kWh edificio = valor ÷ tarifa computed automatically and shown read-only. Prevents the wrong-field entry that inflated charges 16×.
- **Cascade on save:** saving a tarifa triggers `UPDATE lecturas_medidor` for all units in that building group for the same period.

#### Electricity total calculation
- **MROUND(50) everywhere:** changed from `Math.round(×250)` to `Math.round(×50)` matching Excel formula `=MROUND(kwh×tarifa,50)`. Applied in admin registration, portal submission, and tarifa cascade SQL.
- **Decimal precision on lectura_actual:** `step="1"` → `step="0.1"` — integer-only input was silently dropping meter reading decimals, causing kWh errors up to 0.8 kWh/unit.

#### Data fixes (April 2026)
- **84 April readings bulk-loaded** from `history of energy usage.xlsx` with correct decimal anterior/actual values.
- **Jan/Feb/Mar decimal corrections:** all 84 units corrected from `energia historico.xlsx`; 81/81 units clean per period.
- **CRA2710065 tarifa corrected:** 805.95 → 805.49 (cross-verified vs billing Excel). Cascaded to 32 units.
- **Unit 126 grupo_energia:** NULL → CRA2710065.
- **Cross-verification:** 82/84 April units match billing Excel exactly. Open: unit 111 and 506B pending admin clarification.

### Session 53 — 2026-05-11: Admin meter reading — unblock + photo upload

#### Admin manual reading form (`/medidores`)
- **Fixed critical save failure:** `tarifa_kwh` and `total_energia` were sent as `null` when no electricity invoice exists yet — DB NOT NULL constraint rejected every insert. Now defaults to `0`; re-register after entering the invoice to populate cost.
- **Fixed wrong kWh calculation:** previous reading lookup was hardcoded to calendar-prior month (April — zero readings). Now falls back to the most recent available period (March 2026). Label shows the actual period used.
- **Fixed duplicate form field:** readonly `lecturaAnterior` input had `name` attribute alongside a hidden fallback input — ambiguous FormData. Cleaned to single hidden input.
- **Photo upload added:** admin can now attach a meter photo when registering a reading manually. Stored in R2 (`medidores/YYYY-MM/local-{unit}-{ts}.jpg`).
- **Direct camera capture:** "Tomar foto" button opens rear camera immediately on mobile; "Adjuntar foto" opens gallery/file picker. Both feed the same upload.
- **Audit trail:** `submitted_by` now set to the authenticated admin's user ID on every admin-entered reading.

### Session 52 — 2026-05-05: Medidores Excel export + ERP electricity auto-fill

#### Medidores — Excel Export
- New "Exportar Excel" button on `/medidores` page, inline with year/month filters
- Downloads single-period `.xlsx` with two sheets: Facturas Energía + Consumo por Local
- Facturas sheet: 6 rows (one per address group) with dirección, proveedor, fecha, valor, kWh, tarifa + totals row
- Consumo sheet: all metered units with tenant name, address, lec. anterior/actual, kWh, total COP + totals row

#### Medidores — ERP Auto-fill
- `valor_factura` for all 6 electricity groups now auto-populated from Siesa — no manual entry needed for the peso amount
- Matched by contract number pattern in ERP `notas` field (6 contracts, one per address group)
- `kwh_factura` computed from sum of tenant meter readings for that address group and period
- `fecha_factura` shown as YYYY/MM (billing period from ERP — no exact day stored)
- Blue "ERP" badge in Facturas de Energía form on auto-filled rows
- Address labels updated to match ERP text exactly (e.g. "CARRERA 27 #10-65")
- Admin-saved records always take priority over ERP fallback

### Session 51 — 2026-05-04: Portal Inquilino — PP, Medidor multi-local, Wompi, Usuarios

#### Portal Inquilino — Pronto Pago
- "Total a Pagar" muestra saldo con descuento PP incluido días 1–10, por factura del periodo actual
- Badge PP% + monto ahorrado (−$X) alineado a la derecha del grand total
- Cartera breakdown: lista de facturas siempre visible, sub-detalle (arrend/IVA/ret) colapsable por fila
- PP −$X visible inline en cada fila junto a "Al día/Vencida"

#### Portal Inquilino — Wompi
- Modal "Pagar en línea" rediseñado: selector de locales compacto (solo números), dos filas copiables (NIT/cédula + total)
- Referencia siempre es NIT (PJ) o cédula (PN) — nunca número de local
- Saldos en modal incluyen descuento PP cuando aplica
- Modal permanece abierto al hacer clic en "Ir a pagar"
- "Incluye PP X% · Válido hasta DD/MM" cuando PP activo

#### Portal Inquilino — Medidor multi-local
- Página de medidor activada (era "Próximamente")
- Tabs por local para inquilinos con múltiples unidades; ✅ en tab si ya enviaron ese mes
- Server action valida que `localId` pertenece al tenant (seguridad)
- Nueva función `getPortalMedidorRef` en portal.ts (lectura anterior + tarifa + submitted flag)

#### Admin — Usuarios
- Edit modal simplificado: solo email y teléfono editables; razón social, NIT y contratos bloqueados (vienen del ERP)
- Email único para email_contacto + portal_email + auth.users simultáneamente

#### Admin — Locales ficha cliente
- KPI "Saldo Total" muestra saldo con PP en días 1–10, por unidad con tasa propia del contrato

#### DB
- Cuenta inquilino.test@ckrea.co transferida a Rebelarte Comunicacion Visual SAS (3 locales)
- `v2.inquilinos.tipo_persona` expuesto en PortalProfile para diferenciar NIT/cédula en Wompi

### Session 50 — 2026-05-04: PWA + Push Notifications

#### PWA — installable app
- Web app manifest (`public/manifest.json`) with full field set: id, scope, display_override, dir, lang, categories, launch_handler, shortcuts, scope_extensions, prefer_related_applications
- Service worker (`public/sw.js`): cache-first for static assets, network-only for data, offline block page
- Offline detector component: full-screen overlay fires instantly on connection loss — prevents stale payment data from being read
- `proxy.ts` public-route allowlist updated to pass manifest.json, sw.js, icons/ without auth

#### Icons — cross-platform
- Root cause found: `ckrea-logo.png` has opaque white pixels — fixed by stripping near-white (R,G,B > 220) before compositing on dark background
- Generated: apple-touch-icon 180×180 (iOS), icon-192, icon-512, maskable-512, favicon-32, favicon-16
- All icons: dark slate-900 background, circular mask with transparent corners for browser tab
- Safe area insets added to MobileNav, sidebar, and portal header — fixes iPhone status bar overlap in PWA mode

#### Push notifications infrastructure
- VAPID keys generated; `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` added to Vercel env
- `v2.push_subscriptions` table with RLS
- `POST/DELETE /api/push` — save/remove subscriptions per authenticated user
- `lib/push.ts` — `sendPushToUser()` and `sendPushToAll()` server actions
- `NotificationToggle` component: fully wired subscribe/unsubscribe with loading state
- Profile dropdown in sidebar (replaces logout button): user icon → dropdown with notification toggle + red logout

#### Notification cron (`/api/cron/notifications`, 8am COT daily)
- `v2.push_notification_log` table — unique constraint on (user_id, type, reference_id) prevents duplicate sends
- 7 notification types for clients:
  - Payment due in 3 days (once per invoice via factura key)
  - Payment due today (once per invoice)
  - First overdue — fires on financia = 31, first day past grace period (once per invoice)
  - Mora escalation — Mondays only, once per week per user
  - Lease expiring — exactly 60 and 30 days before fecha_fin
  - Meter reading reminder — day 7 of month if no reading submitted for current period
  - Payment confirmed — yesterday's `vista_pagos` payments, once per docto+cruce

### Session 49 — 2026-05-03: Locales + Portal deep review

#### Locales list (`/locales`)
- KPI cards replaced: Cartera total/En mora/Recaudado → Vacantes/Canon Mensual Neto/Contratos por vencer
- Entrada filter: URL-driven `?entrada=X` updates KPI cards server-side
- Filter UI consolidated: single "Filtros" button with expandable Estado + Entrada panel, active chip row
- Unit chips show `E1·101` entrada prefix

#### Per-client detail (`/locales/[id]`)
- Card renamed "Datos del Cliente" → "Datos del Inquilino"; nombre corto removed (razonSocial from ERP is source of truth)
- Email + Teléfono always visible with `—` fallback
- Contracts card: entrada inline, DD/MM/YYYY start date, canon labels c/IVA vs s/IVA, PP/Dto removed
- Cartera table: Local column (unit from sucursal), Mora column uses correct interest-days (financia-30)
- KPI: "Interés Acumulado" → "Interés Est.", warning threshold >$1,000, "Días en Mora" uses accurate interest-days
- "Al Día" green banner when client has no open invoices
- Payment history: paginated 10/page with ellipsis nav, timing column, invoice month label, total histórico footer

#### Interest formula corrected
- Rule C: interest starts day 31 (not day 11). Formula: `GREATEST(0, financia - 30) × 0.05%/day`
- `financia` (days since invoice date) used throughout — bypasses Siesa `fecha_vence` misconfiguration in pre-May invoices
- Portal interest estimate now DB-driven via `v2.reglas_financieras`

#### Data sources fixed
- `v2.proyecciones` fully removed — canon now from `siesa_raw.ocupacion` in all queries
- Portal mora detection: `lastPago + 35d` → `cartera.vencido > 0` (live from Siesa)
- Portal next payment: `lastPago + 30d` → earliest `fecha_vence` from open invoices
- `getPortalContratos` canon/discount: v2 → siesa_raw.ocupacion with ORDER BY + razon_social guard
- NIT validation guard in `getPortalCartera`
- Unit extraction: REVERSE/SPLIT_PART (safe) instead of REGEXP_MATCHES (drops rows on no match)

#### Linear
- WOR-80 created: future improvement — interest on historical daily balance for partial payers
