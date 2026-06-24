# C-Krea PayControl — Development Journal

---

## Session 62 — 2026-06-24: Client comment review — local 120 mora confusion + 9 missing May energy invoices

**Reports (admin/clients via German).**
1. Local 120 (BECERRA MATEUS AGUSTINA): tenant says portal shows May mora but she already paid; only owes June.
2. Local 305: tenant says no May energy invoice appears in the portal.

**#1 Local 120 — no bug (explanation).**
- Cartera: only June open (FVS-74586, $3.629.500, *corriente*, due Jun 30). `vr_vencido = 0` on every line. Tenant is right.
- Confusion = payment-history badge. "33 días mora" sits on a payment dated **04/05**, but that payment settled the **April** invoice (issued Apr 1, paid May 4 = 33 days). Her May invoice (issued May 2) was paid May 29 = 27 days = on time. Portal computes `dias_desde_factura = fecha_recaudo − fecha_factura` — correct; the badge just describes which invoice the payment cleared, not the calendar month of the payment date.
- "47 pagos en mora" card = her lifetime count (47 of 65 payments late since Jan 2024) — correct, not current debt.
- Verdict: presentation confusion, not data. Offered to relabel the badge ("Factura de abril · 3 días tarde") — deferred, not applied.

**#2 Local 305 — real bug, fixed (9 units).**
- 305 submitted May reading 5908 (vs prior 5790.2 = 117.8 kWh) but `kwh` stored as **0** → hidden because `getPortalElectricityPeriodos` filters `kwh > 0`.
- Blast radius: **9 units** across 4 groups (101, 118, 119, 210, 212, 305, 311, 503, 801), all created Jun 10 16:56–19:02, all reading-present/kwh-0, all `pendiente`, no photos.
- Root cause: **NOT a code bug.** Both `submitLectura` (portal, sets `aprobado`, day-9-only) and `registrarLectura` (admin) compute kWh correctly. These 9 were direct manual entries during the Session 61 reconciliation that left kWh at 0. One-time data gap.
- Fix: `UPDATE v2.lecturas_medidor` on the 9 rows — `kwh = actual − anterior`, `total = MROUND(kwh × tarifa, 50)`. Restored **$1.232.800**. CSV backup at `docs/backups/lecturas_medidor_may2026_kwh0_backup_20260624.csv`.

### Decisions
- 🎯 Local 120 = correct data; confusion is the payment-history label (payment date vs the invoice month it cleared). UX relabel offered, deferred.
- 🎯 9 May energy rows recomputed and billed; readings trusted as entered (manual, `pendiente`, no photo).

### Learnings
- 💡 Manual reconciliation inserts bypass the form's kWh computation — **always recompute kwh/total after any direct insert.** Latent-scan: `lectura_actual > lectura_anterior AND (kwh IS NULL OR kwh = 0)`.
- 💡 The portal month-picker hides any energy month with `kwh = 0`, so a reading-present/kwh-0 row is invisible to the tenant — silent revenue loss, not just a display glitch.

### Files changed
- DB: `UPDATE v2.lecturas_medidor` (9 rows, periodo 2026-05) — applied via MCP, view/data only, no deploy
- `docs/backups/lecturas_medidor_may2026_kwh0_backup_20260624.csv` (new — before-state backup)
- `CHANGELOG.md`, `docs/JOURNAL.md`, `memory/project_state.md`

---

## Session 61 — 2026-06-09/10: Electricity overhaul — photo uploads, May reconciliation, periodo convention

**Reports (live, during day-9 window).** (1) Tenants hitting "Application error" when submitting meter photo; (2) unit 115 showed $0 to pay; (3) admin couldn't open meter photos; (4) request to verify the whole electricity money-path.

**Root causes found.**
1. **Photo crash:** photos sent as base64 through server action; 5 MB body limit ⇒ real photo ceiling ~3.7 MB. Modern phone photos (4–9 MB) rejected *before* code ran; no error boundary in `(portal)` → generic crash. R2 evidence: surviving June photos capped at ~3 MB.
2. **$0 / "May ghost month":** day-9 reading measures the PREVIOUS month but portal labeled it current month. June-9 submissions stored as `2026-06` while admin's Excel called the same numbers May ⇒ duplicate/zero readings. Verified: 31/32 portal "June" kwh == Excel May consumo exactly.
3. **Photo viewer:** `window.open("", "_blank", "noopener")` returns `null` by spec → signed URL never assigned.

**Fixes shipped.**
- Client-side shrink to 2400px JPEG q85 before upload (HEIC→JPG free, ~6 MB→~1 MB), body limit 5→10 MB, `(portal)/error.tsx` boundary reporting to Sentry (commit `a16838a`).
- Trust-the-tenant model: drop ±20/40 auto-classification; admin "Alerta" column = visual-only tags (`Sin lectura` gray, `⚠ Revisar` amber at >40% vs 3m avg or 0 kWh, derived live from desvPct). Photo viewer fixed (commit `f99dcb7`).
- **May reconciliation (DB, user-approved, CSV backup first):** deleted 309 test row (15,235 kWh ≈ $12M!), relabeled 31 June rows → May + recomputed with May tarifa, inserted 107/314/505 from Excel, zeroed 9 vacant locals + April-111 (kept lecturas as baseline). Final: May = 74 rows, 65 billed, $13,696,150 — matches `energia ckrea.xlsx` peso-for-peso.
- **Periodo convention blindaje:** `src/lib/periodo.ts` = single source; `lecturaPeriodo()` = previous month (Bogotá), computed server-side (form's periodo input removed). Admin pages (`/medidores`, `/medidores/facturas`, lectura-form) default to measurement month.
- **Code review (2 agents) caught 5 real bugs, all fixed:** empty-digits ⇒ 0-reading lock for new tenants (min(1) + button gate); admin pages defaulting to wrong month; dashboard energy charge vanishing days 1–8 (fallback to latest month with data); duplicated periodo fn; stale PDF props.

### Decisions
- 🎯 **Trust the tenant:** all readings accepted as submitted; tags are optional visual checks, never blocking. System must run itself in one day.
- 🎯 **Day-9 reading = previous month's periodo** — permanent convention, single helper.
- 🎯 306 April: Excel had typo (7812.6 vs 7612.6); DB correct, kept. 111 April: vacant, zeroed.
- 🎯 Excel (`energia ckrea.xlsx`) = authoritative for April/May; live simulation of submitLectura reproduced Excel totals 64/64.

### Learnings
- 💡 The real reading cadence is offset: meters read day 9 measure the month that just closed. Any "current month" default in this domain is wrong.
- 💡 `window.open(url-less, "_blank", "noopener")` always returns null — can't assign location afterward.
- 💡 Reconcile BEFORE loading admin spreadsheets: Excel "Medida 31 Mayo" was computed backwards (m01 − consumo) for 30 locals; trusted consumo, derived lectura = m01 + consumo.
- ⚠️ ~57% cost recovery vs utility invoices (Apr: tenants $15.9M vs invoices $27.9M) — flagged, pending business review.

### Files changed
`medidor/{page,form,actions}`, `(portal)/{page,error}`, `(app)/medidores/{page,facturas/page}`, `lectura-form`, `medidores-admin-table`, `lib/periodo.ts` (new), `lib/pdf/electricity-invoice`, `facturas-download-button`, `next.config.ts`.

---

## Session 60 — 2026-06-05: Unit 314 "password setup failing" — root cause + UX fix

**Report.** Admin tried to set up portal access for unit 314's client; the "create your password" link "kept failing" — password never got created.

**Investigation (systematic-debugging).**
- Unit 314 = OKAR DISTRIBUCIONES SAS (`ventasokar1984@gmail.com`). Joined via `siesa_raw.ocupacion.local = 'E3L314'` → `documento` → `v2.inquilinos.nit`.
- Account is **not new**: created 2026-05-21, `has_password = true`, `last_sign_in_at = 2026-06-05 16:41` (signed in fine *before* the reset was sent). So the client already had working access.
- Reset sent 16:58 (`recovery_sent_at`), `updated_at` = same → password never changed afterward.
- **Auth logs smoking gun:** `GET /verify` → `403 "One-time token not found — Email link is invalid or has expired"`, referer `/auth/confirm`, ~17:12. Token was dead on arrival.

**Root cause (two layers).**
1. The recovery link was already consumed / superseded. These links are single-use, and **sending a new link invalidates all older ones** — admin "trying several times" + clicking an older email = guaranteed "token not found." (Email-scanner prefetch is a secondary suspect.)
2. **Our bug:** `/auth/confirm` only handled the success hash (`#access_token`). On the error hash (`#error=…&error_code=otp_expired`) or missing tokens it `router.replace("/login?error=link_invalido")` — silent bounce, no explanation → looked like "password creation failed."

**Fix (`src/app/(auth)/auth/confirm/page.tsx`).** Detect the error/no-token hash and render the existing error card with a clear Spanish message + a full-width **"Solicitar nuevo enlace"** button (styled to match login). Success path untouched. Confirmed link flow is **implicit** (hash), per a successful tenant's `login_method: implicit` log — so the `?code=` PKCE callback was correctly left alone.

### Decisions
- 🎯 **Scope = UX/messaging fix only.** German confirmed 314 = same tenant (OKAR), who already has access. Did not send a new link or touch the deeper link-hardening.
- 🎯 **Committed to `main` + pushed** (`ec1fb28`), single file, author `gburgos293@gmail.com`. Vercel auto-deploys.

### Learnings
- 💡 **"One-time token not found" ≠ "expired".** It means the token row is gone — already used, or **superseded by a newer generateLink for the same user**. Resending a reset kills the prior link.
- 💡 **Each recovery/welcome link is single-use, clicked once, newest only.** Operational rule for admin: send one, tell client to open the *latest* email and click *once*.
- ⚠️ **`git remote` still points at old repo name** (`Ckrea-Portal-1.git`); GitHub redirects the push. Update sometime.

### Files changed
- `src/app/(auth)/auth/confirm/page.tsx` — error/no-token hash now shows error card + retry button instead of silent `/login` bounce

### Session-end pointers
- ADRs: none
- Lessons: confirm single-use/supersede behavior of Supabase recovery links (candidate memory)
- State: no schema/state change
- Linear: none

---

## Session 60 (cont.) — 2026-06-08: Cartera vencida payments — `vista_pagos` dropped real partial payments

**Report.** Admin + ERP engineer found a difference in overdue-account ("cartera vencida") payments for two tenants: Renato Fajardo ($ 295.500) and Galindo Polidoro ($ 2.800.000), both labeled receipt "RK-3014". German's clue: it relates to `siesa_raw` (the real ERP data).

**Investigation (systematic-debugging, all read-only first).**
- Renato $ 295.500 = `001-RK-3014` (cruce FVS-71543, 2026-05-11, VENCIDO). Galindo $ 2.800.000 = `001-RK-3002` (cruce FVS-72723, 2026-05-04, VENCIDO) — admin mislabeled it RK-3014; real receipt is RK-3002. Both real, `Eliminado=false`.
- **Portal (`v2.vista_pagos`) vs raw mismatch:** portal showed only ONE payment per invoice/day. Galindo's $ 2.800.000 and Renato's $ 295.500 were missing.
- **Root cause:** view CTE used `SELECT DISTINCT ON (r.documento, r.cruce, r.fecha_recaudo) ... ORDER BY ..., r.docto` — collapsed all payments sharing tenant+invoice+day to one, dropping the rest by lowest docto. Tenants pay one invoice via several receipts (installments/abonos) → those got silently discarded.
- **Blast radius (whole history):** 54 real payments dropped = **$ 66.137.912**. Verified **0** true duplicates, **0** negatives/reversals among them (so the de-dup had zero legitimate value). 5 recent + 49 historical, 5 tenants in the recent set.
- **`Eliminado` discovery (and why I paused):** the view has NO `Eliminado` filter and was emitting 2.869 rows / **$ 4.6 B** vs 230 live rows / $ 403 M. Checked before any "keep all rows" fix. Found a *perfectly clean* date split (0 live rows before 2026-04-07, 0 deleted rows after 2026-04-06, **0 negatives**) → `Eliminado=true` = valid historical payments aged out of the ERP's ~2-month rolling export window (refresh-only sync, no DELETE), **not** annulments. So: keep them (pages filter by month); do NOT add an `Eliminado` filter (would erase real history).

**Fix (migration `fix_vista_pagos_dedup_preserve_partial_payments`).** `recaudo.row_id_mov` is 100% unique (3405/3405). Re-keyed de-dup to `DISTINCT ON (r.row_id_mov)` — every real movement preserved, only an exact re-push could ever collapse. Everything else (4 filters, columns, joins, `Eliminado` behavior) unchanged.

**Verification (after apply).** View 2.869 → **2.923 rows** (+54), $ 4.632.438.288 → **$ 4.698.576.200** (+$ 66.137.912, exactly the restored payments). Both tenants now show both payments. Duplicate-row check = **0**.

### Decisions
- 🎯 **De-dup keyed on ERP unique id, not business keys.** Business-key de-dup (tenant+invoice+day) is wrong for a tenant who pays one invoice in multiple receipts — proven common in the data (e.g. ACRIGROUP FVS-72715 paid in 4 installments).
- 🎯 **`Eliminado=true` kept as valid aged history** — not filtered out. Confirmed via clean date boundary, not annulment.
- 🎯 Canonical `docs/foundation/01_schema_erd/v2/02_vistas.sql` updated to match deployed view + memory `recaudo_data_model.md` corrected (old "001-RK dedup" guidance was the bug).

### Learnings
- 💡 **`DISTINCT ON (business keys)` on payments is a latent money bug** — collapses legitimate same-day partial payments. Realizes the warning in `feedback_distinct_on_deterministic.md`. Use the ERP's unique movement id.
- 💡 **No true RK/001-RK duplicate pairs exist in `siesa_raw`** — that was an Excel-era artifact. The de-dup it was built for is obsolete; it only caused harm.
- 💡 **`Eliminado` = rolling-window aging marker, not "deleted/annulled".** Clean date cutoff (~last 2 months = false). Likely explains part of the old Power BI gap (some hidden payments fell in benchmarked months).

### Files changed
- DB migration `fix_vista_pagos_dedup_preserve_partial_payments` (applied to prod via MCP — view only, instant, no deploy)
- `docs/foundation/01_schema_erd/v2/02_vistas.sql` — canonical view synced + commented
- `memory/recaudo_data_model.md` — corrected stale de-dup guidance
- `CHANGELOG.md`, `docs/JOURNAL.md`, `memory/project_state.md`

### Session-end pointers
- ADRs: none (view fix, documented in canonical SQL)
- Lessons: `recaudo_data_model.md` updated; candidate memory on `Eliminado` rolling-window semantics
- State: `v2.vista_pagos` de-dup corrected (schema change — view)
- Linear: none

---

## Session 59 — 2026-05-14: Tenant email auth setup + security hardening

🎯 **Manual auth account created for unit 309 (TURISMO MAGICO S&M SAS)** — `portal_email` was already set but no `auth.users` entry existed. Inserted auth user + identity + perfil directly via SQL.

🎯 **Email save now auto-creates auth account** — `updateTenantInquilino` and `updatePortalEmail` both updated: if no perfil exists when an email is set, the auth account and perfil are created automatically. Previously this was a silent no-op requiring a separate "Create Account" button.

⚙️ **5 security fixes applied to `actions.ts`** (all server actions in `/usuarios`):
- Auth guard (session + rol check) on all 5 actions — previously any authenticated user could call them directly
- Sync order: `v2.perfiles` before `auth.users` on email update (prevents split-brain)
- Orphan auth cleanup: `deleteUser` in catch if perfil insert fails
- `assertUuid(empresaId)` before DB interpolation
- `sqlStr()` on `rol` field in `updateAdminUser`

💡 **Code review surfaced the auth guard gap** — server actions are callable as direct POST requests; middleware only guards page navigation. The pattern from `mora/actions.ts` (`createClient` → `getUser` → `perfiles.rol` check) is the standard for all sensitive actions.

⚠️ **`updatePortalEmail` was diverging** from `updateTenantInquilino` — same logical operation, different outcomes. Unified: both paths now auto-create and sync identically.

### Session-end pointers
- ADRs: none
- Lessons: none
- State: project_state.md unchanged
- Linear: none

## Session 58 — 2026-05-14: Portal demo-readiness + medidor chart + Wompi UX + mobile layout

### Mobile layout (appended after ship)

⚙️ **Perfil page** — switched from 2-column grid to single full-width column. All text scales down on mobile (`text-xs sm:text-sm`), card padding tighter (`p-3 sm:p-5`), Row component icon/gap reduced. Desktop unchanged.

⚙️ **Pagos KPI cards** — on mobile switched from 3-column grid to 1-column stack with horizontal row layout per card (icon+label left, value right). Sub-labels use `text-[11px]` instead of `text-[10px]` to avoid iOS Safari auto-inflation. Desktop 3-column grid unchanged.

⚙️ **Pagos table** — reduced cell padding and font size on mobile only (`px-2 sm:px-4`, `text-xs sm:text-sm`).

### Session-end pointers (updated)
- ADRs: none
- Lessons: none
- State: project_state.md updated
- Linear: none

---

## Session 58 — 2026-05-14: Portal demo-readiness + medidor chart + Wompi UX

### What happened

⚙️ **Medidor tab** — chart now visible every day (was hidden on non-day-9). Form still locked to day 9. `HistorialChart` ownership moved from `MedidorForm` to `page.tsx` so component is pure form only.

🐛 **Portal demo fixes (7 bugs):**
- Empty payments table showed blank white box → "Sin pagos registrados" empty state added
- `impuesto!` / `retenciones!` non-null assertions replaced — could render "$ NaN" on screen
- All day-of-month logic (`todayDay`, `currentPeriodo`, `daysFromNow`, fallback `nextPaymentDate`) normalized to `America/Bogota` timezone — server runs UTC, Colombia is UTC−5, mismatch was ±5h
- Meter reading preview appeared after 1 digit → now waits for all 5
- Tenant in mora with no `fechaVence` showed "Al Día / future date" → now shows "VENCIDO"
- Dead `allFilled = true` constant removed from medidor form

🎯 **Wompi modal UX:**
- Amber warning added to both Arriendo and Energía steps: "en el campo '# Local' de Wompi ingrese su NIT/Cédula, no el número de su local"
- `docLabel` handles PJ → NIT, PN → Cédula, null → Documento
- Redundant yellow "Total todos los locales" aggregate card removed from Energía step
- "Total a pagar" renamed to "Total energía a pagar"
- `totalElectricity` now `Math.round`ed before copying to clipboard

### Session-end pointers
- ADRs: none
- Lessons: none (timezone pattern self-evident; Wompi field names documented in code)
- State: project_state.md — needs update (portal demo-ready, Wompi UX improved)
- Linear: none

---

## Session 57 — 2026-05-14: Full security audit + PostgREST elimination + auth reset fix

### What happened

Deep code review across the entire app (5 parallel review agents). Found and fixed two critical security gaps and a fundamental architectural dependency on PostgREST schema exposure.

### Decisions

🎯 **PostgREST eliminated entirely.** All `.schema("v2")` REST calls replaced with `exec_sql` (reads) and `exec_dml` (writes) RPCs. `sqlStr()` helper in executor.ts for safe text interpolation. App no longer depends on which schemas are exposed in Supabase PostgREST config — changes to that setting can never break the app.

🎯 **Public routes must bypass `getUser()` in proxy.ts.** Recovery sessions (AMR=otp) get silently refreshed into regular sessions by `@supabase/ssr` inside `getUser()`. Once degraded, `updateUser({ password })` fails because Supabase requires the otp AMR claim. Fix: public-route check now runs *before* the session client is even created.

🎯 **`SITE_URL` (no NEXT_PUBLIC_ prefix) for server-side reset links.** `NEXT_PUBLIC_` vars are baked at build time — changing them in Vercel requires a redeploy. Server-side `redirectTo` in password reset now reads `SITE_URL` (runtime) first, falling back to `NEXT_PUBLIC_SITE_URL`.

### Security fixes shipped

- Auth guard on `/api/medidores/export-energia` and `/facturas/export` (were unauthenticated)
- Auth guard on `archivos` server actions (delete/download/list)
- Open redirect fixed in `/api/auth/callback` (`next` param must start with `/`)
- Role check (admin/finanzas) on `calcularIntereses` mora action
- MIME type allowlist on photo uploads (jpeg/png/webp only)
- `unitNumber` sanitized to alphanumeric before use in R2 key path

### Correctness fixes shipped

- `submitLectura`: prevRows query now filters `AND periodo < '${periodo}'` (was fetching own row on retry)
- `submitLectura`: blocks resubmission of already-approved readings
- `getPortalContratos`: LATERAL now `ORDER BY ingreso DESC` (was `precio DESC` → wrong phase)
- `getPortalTenants`: includes `critico` contracts (was `activo` only → tenants invisible)
- `updateTenantInquilino`: `portal_email` synced alongside `email_contacto`
- Notifications cron: `maxDuration = 60` added (was silently timing out)
- `archivos-client`: `router.refresh()` instead of `window.location.reload()`
- `sendSystemEmail`: stale `ckrea-portal.vercel.app` fallback replaced with `ckrea.com.co`

### Learnings

⚠️ **PostgREST schema exposure is a silent failure point.** Config was `public, satelites` only — every `.schema("v2")` call failed with 406. All reads worked (via exec_sql RPC) but every write was silently broken. Never detected because all data was inserted via MCP/migrations during development. Rule: never use `.schema()` calls; always use exec_sql/exec_dml.

⚠️ **`@supabase/ssr` degrades recovery sessions inside `getUser()`.** If middleware calls `getUser()` on a recovery-session request, the token refresh strips the `otp` AMR claim. `updateUser({ password })` then returns 422. Fix: public auth routes must be returned before ANY session handling.

💡 **`NEXT_PUBLIC_` vars are build-time only.** Changing in Vercel requires redeploy. Use private env vars (`SITE_URL`) for server-side config that changes without a rebuild.

### Session-end pointers
- ADRs: none
- Lessons: feedback files — PostgREST elimination pattern, recovery session guard
- State: project_state.md needs update (security hardened, PostgREST removed, auth flow fixed)
- Linear: none

---

## Session 56 — 2026-05-12: Portal electricity payment fix + SQL injection hardening

### Root cause

Tenant portal showed only "Arriendo" in the Wompi payment modal — no "Energía" button. Root: `portal/page.tsx` called `getPortalElectricityInvoiceData(unitId, periodo)` with `currentPeriodo(now)` = `2026-05`. Billing model is **previous month** — May bills April consumption. `lecturas_medidor` has 84 rows for `2026-04`, zero for `2026-05` → query returned null → `hasElectricity = false` → button hidden.

### Fixes shipped

- **`prevPeriodo()` helper** in `portal/page.tsx`: `new Date(year, month-1, 1)` (JS month=-1 safely rolls to December prior year). `electricidadPeriodo` used only for electricity calls; rent/cartera remain on current month.
- **`assertUuid()` guards** added to 7 portal data functions that were missing input validation before SQL string interpolation: `getPortalProfile`, `getPortalPagos`, `getPortalPagosPage`, `getPortalPagosKpis`, `getPortalMedidorRef`, `getPortalMedidorStatus`, `getPortalContratos`. Pre-existing gap caught in code review.
- **Minor security fixes** (pre-existing): `getMeterPhotoSignedUrl` rejects keys containing `..` (path traversal); `MedidoresAdminTable` pre-opens window before async call (popup blocker fix).

### Decisions

- 🎯 `electricidadPeriodo = prevPeriodo(now)` is a permanent business rule: portal always shows the previous month's electricity invoice. If billing timing changes, update this call site and `isMedidorDay` check together.

### Learnings

- ⚠️ Two period variables in the same page component (`periodo` for rent, `electricidadPeriodo` for electricity) must be named clearly — sharing one `periodo` var was the root cause.
- ⚠️ Code review found 7 pre-existing SQL injection vectors in portal.ts. The electricity functions already had `assertUuid()` guards — non-electricity functions were missed when initially written.

### Session-end pointers
- ADRs: none
- Lessons: none (rule captured in Decisions above)
- State: project_state.md updated (electricity period fix + portal security hardening)
- Linear: none

---

## Session 55 — 2026-05-12: Electricity billing overhaul — decimal precision, MROUND(50), tarifa form

### Root cause investigation

Admin entered April reading for unit 101 → showed $1,426,013 instead of ~$88,000. Root: electricity invoice form had **kWh field** but admin entered the **tarifa** ($/kWh) there. System computed tarifa = $10,354,010 ÷ 805.95 = $12,847/kWh → inflated every unit in CRA2710065.

### Fixes shipped

- **Facturas de Energía form redesign:** replaced kWh input with tarifa ($/kWh) input. System now computes kWh edificio = valor ÷ tarifa automatically. kWh shown as read-only.
- **MROUND(50):** changed total calculation from `Math.round(×250)` → `Math.round(×50)` to match Excel formula `=MROUND(E2*$L$2,50)`. Applied in 3 places: admin registration, portal submission, tarifa cascade.
- **Decimal step fix:** `lectura_actual` input `step="1"` → `step="0.1"` — integer-only was silently dropping meter reading decimals (root cause of 419 vs 418.3 kWh discrepancy on unit 102).

### Data corrections

- **Jan/Feb/Mar readings:** all 84 units had `lectura_anterior`/`lectura_actual` stored as integers (decimals stripped). Corrected from `energia historico.xlsx` → 81/81 units clean per period.
- **April bulk load:** 84 units loaded from `history of energy usage.xlsx` with correct decimal readings. Upsert used MROUND(50) × tarifa from `facturas_energia`.
- **CRA2710065 tarifa:** 805.95 → 805.49 (cross-verified against `energi consumo abril.xlsx` billing reference). Cascade updated all 32 units in group.
- **Unit 126:** `grupo_energia` was NULL → set to CRA2710065.

### Cross-verification result

82/84 April units match Excel billing exactly. Open items:
- ⚠️ Unit 111: DB=88.6 kWh / $71,350 vs Excel=$0 (data dispute — pending admin confirmation)
- ⚠️ Unit 506B: DB=100.8 kWh / $81,250 vs Excel=$0 (not included in billing Excel — pending clarification)

### Decisions

- 🎯 MROUND multiplier confirmed as **50** from Excel formula `=MROUND(E2*$L$2,50)`.
- 🎯 Tarifa is the admin input; kWh edificio is derived — avoids the wrong-field entry that caused the original bug.
- 🎯 `lectura_actual` allows 1 decimal (`step=0.1`); tarifa allows 2 decimals (`step=0.01`); valor is integer.

### Learnings

- 💡 Historical kWh values (Jan–Mar) had correct decimal precision but anterior/actual were integers. Storing only kwh with decimals while rounding the source readings breaks chain continuity for future months.
- 💡 When MROUND target is unknown: reverse-engineer from 2 units with different kWh. Same tarifa, different kWh → same rounding step → 50 confirmed when 250 was inconsistent.
- ⚠️ Always verify tarifa before bulk-loading April readings. Four buildings had wrong tarigas (admin had entered number in wrong field) — would have generated millions in incorrect charges.

### Session-end pointers
- ADRs: none
- Lessons: electricity_billing_rules.md (tarifa=input, kWh=derived; MROUND=50)
- State: project_state.md needs update (April readings loaded, billing verified)
- Linear: none

## Session 54 — 2026-05-11: Admin meter reading unblock + photo upload

### What happened

⚠️ **Gotcha — NOT NULL trap on first-ever reading day.** `tarifa_kwh` and `total_energia` are `NOT NULL` with no DB default. Admin action was sending `null` for both when no electricity invoice existed yet → every save silently rejected. Fixed: defaults to `0`, re-register once invoice is entered.

⚠️ **Gotcha — April 2026 was never recorded.** Admin form looked up previous reading by calendar-prior month (April). Zero April readings → `lecturaAnterior = 0` → `kwh = entire meter value`. Fixed: falls back to most recent available period (March). Label now shows the actual source period.

🎯 **Decision — `submitted_by` required on admin entries too.** Added auth check + `user.id` to admin registration action. Full audit trail: every reading in DB now knows which account entered it.

💡 **Learning — R2 credentials fail silently as "Resolved credential object not valid".** The AWS SDK v3 doesn't throw at `S3Client` construction if env vars are undefined — it throws at first API call. Missing env vars in Vercel were the root cause of photo upload failures. Fix: verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` in Vercel production env.

💡 **Learning — `capture="environment"` on `<input type="file">` opens rear camera directly on mobile.** Use two separate hidden file inputs (one with `capture`, one without) + two buttons to give the user the choice without forcing one mode.

### Session-end pointers
- ADRs: none
- Lessons: none (learnings are transient UI/infra — not worth a standalone memory file)
- State: project_state.md — admin reading workflow now unblocked; May 2026 readings in progress
- Linear: none

---

## Session 53 — 2026-05-05: Medidores Excel export + ERP electricity auto-fill

### What happened
- 🎯 **Decision:** `valor_factura` for all 6 electricity groups auto-filled from `siesa_raw.estado_resultados` using contract number patterns in `notas` field (359580, 359581, 359583, 354985, 902329, 359585). Admin still enters `kwh_factura` manually from paper receipt — ERP does not store kWh.
- 🎯 **Decision:** Tarifa is fixed from the receipt (valor ÷ kwh), NOT from sum of tenant readings. Missing tenant = pays 0, tarifa for everyone else unchanged. C-Krea absorbs the gap. 1.5× penalty = incentive only, not a math fix.
- 🎯 **Decision:** direccion labels updated to match ERP text exactly (e.g. "CARRERA 27 #10-65" not "Cra 27 10 65 (F2)") — single source of truth is ELECTRICITY_GROUPS constant, drives both UI and export.
- 💡 **Learning:** siesa_raw.estado_resultados has 6 distinct electricity bills per month (one per C-Krea address group), not 3. Earlier confusion was from querying only cuenta=51353001. Full query needs accounts 51353001 + 52353001 + 73353001. "Calle 11 #27-47" (354988) = Raymond shared bill, not C-Krea.
- 💡 **Learning:** siesa_raw stores billing month as integer (202603) but no exact invoice date. Date shown as "YYYY/MM" in export — matches ERP as closely as possible without inventing a day.
- ⚠️ **Gotcha:** Export route was querying `v2.facturas_energia` directly, bypassing the ERP fallback in `getElectricityInvoices`. Fixed by calling the shared function instead of inline SQL.
- ⚙️ **Workflow:** Excel export button moved from PageHeader to inline with year/month filters in MedidoresFilter component — more natural UX next to the period selector.

### Files changed
- `src/lib/data/electricity.ts` — ELECTRICITY_GROUPS + contrato mapping, ERP fallback in getElectricityInvoices, computed kWh from readings, YYYY/MM date
- `src/app/api/medidores/export-energia/route.ts` (new) — single-period xlsx export via getElectricityInvoices
- `src/app/(app)/medidores/page.tsx` — export button removed from PageHeader
- `src/app/(app)/medidores/facturas/page.tsx` — export button added next to filters (later moved to component)
- `src/app/(app)/medidores/facturas/invoice-form.tsx` — blue ERP badge on auto-filled rows
- `src/components/medidores/medidores-filter.tsx` — export button inline with filters
- `package.json` / `package-lock.json` — xlsx (SheetJS) added

### Session-end pointers
- ADRs: none
- Lessons: none (gotchas above sufficient)
- State: project_state.md — add electricity ERP auto-fill shipped
- Linear: none linked this session

## Session 52 — 2026-05-04: Portal PP, Medidor multi-local, Wompi, Usuarios

### What happened
- 🎯 **Decision:** PP en portal inquilino aplica solo a facturas del periodo actual (`periodo_int === currentPeriodInt`), no a cartera vencida de meses anteriores. Lógica distinta al admin — aquí es "precio de acción", no proyección.
- 🎯 **Decision:** Referencia Wompi = NIT/cédula siempre (no número de local), diferenciada por `tipo_persona PJ/PN`. Un solo pago cubre todos los locales con NIT como clave de búsqueda en Siesa.
- 🎯 **Decision:** Edit modal de usuarios bloqueado a solo email + teléfono. Razón social, NIT y condiciones de contrato vienen del ERP — editarlos localmente genera divergencia silenciosa.
- 💡 **Learning:** `tipo_persona` (PJ/PN) no estaba en `PortalProfile`. Hay que agregarlo explícitamente en la query de `getPortalProfile` — no viene implícito por el JOIN.
- ⚠️ **Gotcha:** Cuenta transferida (inquilino.test → Rebelarte) rompió el portal momentáneamente por sesión cacheada en el browser. Solución: logout + login fuerza recarga del perfil. No fue error de código.
- ⚙️ **Workflow:** Para medidor multi-local, cargar `getPortalMedidorRef` para todos los locales en paralelo en el server component y pasar el array al client component. Evita waterfalls y mantiene el form como client-only.

### Files changed
- `src/app/(portal)/portal/page.tsx` — PP logic, CarteraBreakdown, WompiButton props
- `src/app/(portal)/portal/cartera-breakdown.tsx` (new) — collapsible invoice breakdown client component
- `src/app/(portal)/portal/wompi-button.tsx` — multi-unit, NIT ref, copy rows, modal stays open
- `src/app/(portal)/portal/medidor/page.tsx` — activado, multi-unit tabs
- `src/app/(portal)/portal/medidor/form.tsx` — UnitMedidorData, tabs, localId hidden field
- `src/app/(portal)/portal/medidor/actions.ts` — localId validation against allUnitIds
- `src/app/(app)/locales/[id]/page.tsx` — PP KPI card días 1–10
- `src/app/(app)/usuarios/edit-tenant-modal.tsx` — solo email + teléfono
- `src/app/(app)/usuarios/actions.ts` — updateTenantInquilino simplificado, updateTenantContract removido
- `src/lib/data/portal.ts` — getPortalMedidorRef (new), tipoPersona en PortalProfile

### Session-end pointers
- ADRs: none
- Lessons: none (gotchas ya en JOURNAL)
- State: project_state.md — actualizar fase portal inquilino a activo
- Linear: none vinculado esta sesión

## Session 51 — 2026-05-04: PWA + Push Notifications

### Goal
Make the portal installable as a PWA on iPhone and Android, fix icons, wire push notifications end-to-end with 7 client-facing notification types.

### What happened
- 🎯 **Decision:** Serve manifest as `public/manifest.json` (static) not `app/manifest.ts` (route handler). Root cause: Next.js 16 uses `proxy.ts` as middleware (renames `proxy.js` → `middleware.js` at build time). The route handler was being intercepted by auth middleware and returning 307 → /login.
- ⚠️ **Gotcha:** `ckrea-logo.png` has opaque white pixels as background — not transparent. `sharp`'s background fill only covers transparent areas, so setting a dark background left the white logo background intact. Fix: strip pixels where R,G,B > 220 to alpha=0 before compositing.
- ⚠️ **Gotcha:** iOS caches `apple-touch-icon` aggressively. Even deleting and re-adding the PWA doesn't always clear it. Fix: rename the file (e.g. `-v3`) so iOS fetches a new URL it has never cached.
- 💡 **Learning:** Next.js 16 breaking change — middleware file is now `proxy.ts`, not `middleware.ts`. Compiled as `proxy.js` → renamed to `middleware.js` at build time. This is why `"ƒ Proxy (Middleware)"` appears in build output.
- 💡 **Learning:** For dedup of push notifications, use a `UNIQUE(user_id, type, reference_id)` table and attempt an INSERT — if it conflicts (already sent), skip. Cleaner than querying first.
- ⚙️ **Workflow:** Test icon pixel colors locally with `sharp().raw().toBuffer()` before committing — avoids deploy-test-fix loops.
- 🎯 **Decision:** Offline = hard block. Payment portal must not show stale data. `OfflineDetector` covers runtime connection loss; SW covers navigation failures.
- 🎯 **Decision:** Payment confirmation notification uses 24h delay (ERP syncs every 3h; check `vista_pagos WHERE fecha_recaudo = yesterday`). Avoids race with ERP push window.

### Files changed
- `public/manifest.json` (new) — full PWA manifest
- `public/sw.js` (new) — service worker with cache-first static, network-only data, offline block
- `public/icons/` (new) — 6 icon sizes, all with white-stripped dark-background circular treatment
- `src/app/icon.png` (new) — replaces default Next.js favicon
- `src/components/pwa-register.tsx` (new) — SW registration with scope + updateViaCache
- `src/components/offline-detector.tsx` (new) — full-screen offline overlay
- `src/components/notification-toggle.tsx` — fully wired push subscribe/unsubscribe
- `src/components/layout/sidebar.tsx` — profile dropdown replaces logout
- `src/components/ui/dropdown-menu.tsx` (new) — shadcn dropdown
- `src/app/api/push/route.ts` (new) — subscribe/unsubscribe endpoint
- `src/app/api/cron/notifications/route.ts` (new) — 7 notification types with dedup
- `src/lib/push.ts` (new) — sendPushToUser, sendPushToAll
- `src/app/layout.tsx` — manifest link, icons metadata, offline detector, pwa register
- `src/app/(portal)/layout.tsx` — safe area insets
- `src/components/layout/mobile-nav.tsx` — safe area insets
- `src/proxy.ts` — allowlist manifest.json, sw.js, icons/ paths
- `next.config.ts` — sw.js + manifest.json cache headers
- `vercel.json` — /api/cron/notifications at 8am COT
- `package.json` — web-push added
- DB migrations: `v2.push_subscriptions`, `v2.push_notification_log`

### Session-end pointers
- ADRs: none
- Lessons: none (gotchas above are sufficient)
- State: project_state.md should note PWA shipped + push notifications live
- Linear: none

---

## Session 50 — 2026-05-04: Auth emails + domain launch

### Goal
Set up tenant auth emails (welcome + reset password), wire Brevo, connect ckrea.com.co to Vercel.

### What happened
- 🎯 **Decision:** Use `admin.generateLink({ type: 'recovery' })` + Brevo instead of Supabase's built-in email — full control over template, no SMTP config in Supabase dashboard.
- ⚠️ **Gotcha:** `admin.generateLink()` uses implicit flow (token in URL fragment `#access_token=...`), not PKCE (`?code=...`). Our `/api/auth/callback` Route Handler never saw the token. Fix: added client-side `/auth/confirm` page that reads the fragment and calls `supabase.auth.setSession()`.
- ⚠️ **Gotcha:** Brevo `@getbrevo/brevo` v5 has a completely new API (`BrevoClient` + `brevo.transactionalEmails.sendTransacEmail()`). The old v3 class-based API (`TransactionalEmailsApi`, `SendSmtpEmail`) no longer exists.
- 💡 **Learning:** Cloudflare + Vercel A record approach works fine despite "DNS Change Recommended" warning. Root domain needs an `A @` record; www needs `CNAME www → cname.vercel-dns.com`. Both DNS only (grey cloud) — orange cloud blocks Vercel SSL provisioning.
- ⚙️ **Workflow:** Welcome email doubles as password-setup flow — admin creates account (no password), welcome email contains recovery link → tenant clicks → sets password. No separate invite flow needed.

### Files changed
- `src/lib/email/index.ts` (new) — Brevo client, `sendWelcomeEmail`, `sendPasswordResetEmail`
- `src/app/(auth)/forgot-password/` (new) — page + form + action
- `src/app/(auth)/update-password/` (new) — page + form + action
- `src/app/(auth)/auth/confirm/` (new) — client-side fragment handler
- `src/app/api/auth/callback/route.ts` (new) — PKCE fallback
- `src/app/(app)/usuarios/send-email-modal.tsx` (new) — welcome/reset picker modal
- `src/app/(app)/usuarios/actions.ts` — `sendSystemEmail` action added
- `src/app/(app)/usuarios/page.tsx` — SendEmailModal wired
- `src/app/(app)/usuarios/tab-switcher.tsx` — "Creado" column removed
- `src/components/auth/login-form.tsx` — forgot password link added
- `src/proxy.ts` — new public routes added
- `package.json` — `resend` → `@getbrevo/brevo`

### Session-end pointers
- ADRs: none
- Lessons: none (Brevo v5 API + Cloudflare gotchas captured inline above)
- State: project_state.md — update: auth email system live, domain ckrea.com.co launched
- Linear: none

---

## Session 49 — 2026-05-03: Full locales + portal review + financial rule correction

### Goal
Deep review of locales list, locales per-client, and tenant portal pages. Fix data accuracy issues, improve UX, correct financial rules.

### What happened

🎯 **Decision — Rule C corrected: interest starts day 31, not day 11**
German clarified the full payment timeline: days 1–10 = PP window, days 11–30 = normal payment (no interest), day 31+ = mora at 0.05%/day. Prior CLAUDE.md said "starts day 11" — wrong. Interest formula updated to `GREATEST(0, financia - 30)` using `siesa_raw.cartera.financia` (days since invoice date). `financia` bypasses the Siesa `fecha_vence` misconfiguration where pre-May invoices had `fecha_vence = day 10` (PP date) instead of `day 30` (actual due date). May+ invoices have the correct `fecha_vence = day 30`.

🎯 **Decision — v2.proyecciones fully removed from codebase**
Both `getClienteRows()` and `getTenantContracts()` were reading canon from the retired `v2.proyecciones` table (stale Excel snapshot, missing 12 tenants, doubled BECERRA). Both now query `siesa_raw.ocupacion` directly.

🎯 **Decision — nombreCorto removed from per-client page**
ERP's `razonSocial` is now the single source of truth. `nombreCorto` was a manually-maintained field that drifted from ERP reality. Removed from `TenantDetail` type, query, and display.

⚙️ **Locales list page changes**
- KPI cards: replaced Cartera total + En mora + Recaudado → Vacantes + Canon Mensual Neto + Contratos por vencer (60 days)
- Entrada filter: URL-driven `?entrada=X` updates KPI cards server-side. All 3 data functions accept entrada param with `ENTRADA_RE` validation.
- Filter UI: replaced tab strip + entrada pills with single "Filtros" button → expandable panel with Estado + Entrada sections + active chip row.
- Unit chips show `E1·101` format.

⚙️ **Per-client detail page changes**
- "Datos del Cliente" → "Datos del Inquilino"
- Email + Teléfono always visible (— when empty, no more conditional hide)
- Contracts card: entrada inline with unit (`Local 516 · E5`), start date DD/MM/YYYY, canon c/IVA vs s/IVA label, PP/Dto removed
- Cartera table: new Local column (unit from sucursal via REVERSE/SPLIT_PART), Mora column uses `diasInterest` (GREATEST(0, financia-30)), MoraBadge thresholds calibrated to interest-days scale
- KPI cards: "Interés Acumulado" → "Interés Est.", warning threshold raised to >$1,000, "Días en Mora" shows correct interest-days not inflated dias_mora, "Saldo Total" subtitle "incl. facturas vigentes"
- "Al Día" green banner when cartera is empty
- Payment history: paginated (10/page) with ellipsis navigation, timing column (días desde factura, green ≤30d / rose >30d), invoice month label (`feb. 2026`), total histórico footer (all-time totals via SUM OVER())

⚙️ **Portal tenant pages changes**
- Mora detection: `lastPago + 35d` → `cartera.vencido > 0` (live from Siesa)
- Interest estimate: now DB-driven via `v2.reglas_financieras` rate, uses `maxDiasInterest` not raw `dias_mora`
- Next payment: `lastPago + 30d` → earliest `fecha_vence` from open invoices
- `getPortalContratos` canon/discount: `v2.contratos` → `siesa_raw.ocupacion` with ORDER BY + razon_social guard
- `getPortalProfile`: added `ORDER BY u.unidad` before LIMIT 1 (multi-unit tenant determinism)
- Portal pagos: NaN page guard, capped at totalPages, PaginationBar with ellipsis
- Portal cartera: NIT validation guard, unidad via REVERSE/SPLIT_PART, `financia` field added

⚠️ **Gotcha — REGEXP_MATCHES drops rows**
Using `(REGEXP_MATCHES(col, pattern))[1]` in a SELECT list is a set-returning function — returns empty set when no match, silently dropping the entire row. MEDIOS IMPRESOS showed "Al Día" (no cartera rows) because the initial regex approach dropped all rows. Fix: always use `REVERSE(SPLIT_PART(REVERSE(col), ' ', 1))` which always returns a string.

💡 **Learning — Siesa fecha_vence misconfiguration**
Pre-May invoices: `fecha_vence = fecha_pronto_pago = invoice + 10 days` (PP date, not real due date). May+ invoices: `fecha_vence = invoice + 29 days` (real 30-day due date). Use `financia` (days since invoice date) for all mora/interest calculations — it's invariant to this misconfiguration.

🔵 **WOR-80 created**: Interés mora — calcular sobre saldo histórico diario. Current formula understates interest for partial payers (uses current saldo not historical daily balance).

### Session-end pointers
- ADRs: none
- Lessons: financial_rules_payment_timeline.md (new — Rule C correction + Siesa fecha_vence finding)
- State: project_state.md — update locales + portal review status
- Linear: WOR-80 created (future interest improvement)

---

## Session 48 — 2026-05-03: Gastos siesa_raw migration + Medidores form overhaul

### Goal
Migrate gastos page from manual v2.gastos to live siesa_raw data. Full medidores admin review and form improvements.

### What happened

🎯 **Decision — Gastos source of truth → siesa_raw.estado_resultados, ccosto='285'**
v2.gastos had manual entries (only 4 months, April incomplete). siesa_raw has 15 months of live ERP data. Filter: `ccosto = '285'` = CENTRAL KREATIVA. Account codes mapped to 8 categories via CASE WHEN.

🎯 **Decision — April manual data was $12.8M short**
Manual entry had 5 rows for April ($34.9M). siesa_raw shows $47.8M. Confirmed Jan–Mar matched exactly; April was abandoned mid-entry. Siesa is canonical from now on.

⚙️ **Gastos UI additions this session**
- Year/month dropdowns replace period tab strip. Year KPI = Acumulado (current year) or Total (past year).
- Table: color dots per category, vs-anterior % + absolute delta column, % of total column.
- Detail panel: click row → shows per-account breakdown below table, one open at a time.
- Pie chart: reverted to pie after testing horizontal bar + stacked 6-month bar. Simpler wins.

⚠️ **Gotcha — electricity_invoices table confusion**
Memory said `electricity_invoices` + `electricity_group` were shipped. Actually live tables are `facturas_energia` + `grupo_energia`. Memory was using wrong column/table names. Corrected.

🎯 **Decision — Medidores form: remove tarifaKwh field**
Form now auto-looks up tarifa from `facturas_energia` for the period + unit's `grupo_energia`. If invoice not entered yet, reading saves without cost; cost fills when invoice arrives (existing propagation in `saveFacturasEnergia` handles it).

🎯 **Decision — lectura_anterior auto-filled from readingsByPeriodo map**
`getUnitsWithMeters` now returns last 6 readings as a JSON map keyed by period. Form derives correct previous reading based on selected period (not just "most recent"). Selecting March → pulls February reading. Bug was using `lastLecturaActual` which was always most recent regardless of period selected.

💡 **Learning — DB decimal .00 was display artifact**
All lectura_actual/anterior end in `.00` but stored as numeric integers. `9057.00 = 9057` in PostgreSQL numeric comparison — no update needed, JS Number() drops trailing zeros automatically.

⚙️ **Medidores bug fixes**
- `revalidatePath("/facturas")` → `/medidores/facturas` (form never refreshed page after save)
- 4 non-metered internal units (808–821 group) excluded via EXISTS filter
- Period dropdown: last 3 months only, locks if reading already exists for unit+period
- WOR-47 banner removed (feature works, not yet released)
- Facturas button moved inline with page title

### Session-end pointers
- ADRs: none
- Lessons: erp_ocupacion_model.md N/A — update feature_electricity_billing.md with correct table names (`facturas_energia`, `grupo_energia`)
- State: project_state.md — update gastos source, medidores form status
- Linear: none

---

## Session 47 — 2026-05-03: Mobile/WhatsApp — Full client portal mobile UI/UX

### Goal
Complete mobile UI/UX for the tenant (inquilino) portal — both layout and data accuracy.

### What shipped

**Navigation & layout:**
- Bottom tab nav (`PortalBottomNav`) — Inicio / Medidor / Pagos / Perfil, fixed at bottom, safe-area aware, shows on all screen sizes
- Portal header: C-Krea logo (replaces Zap icon), "Portal del Inquilino" title, icon+text logout button
- Portal sidebar (`PortalSidebar`) created then reverted — user decided to keep mobile layout consistent across all screen sizes

**Portal Home (Inicio) redesign:**
- Removed historial de pagos table, medidor card, and "Volver al portal" links
- 4 full-width cards: ProfileCard (simplified) → Estado de Cuenta → Próximo Pago → Total a Pagar
- All cards use consistent layout: label + big number + subtext
- ProfileCard shows all units (`allUnits[]` — "Locales 101 · 118" for multi-unit tenants)
- "Total a Pagar" now reads live from `siesa_raw.cartera` (not stale formula from v2.contratos)
- Invoice breakdown per unit with canon / IVA / retención detail, unit label from `cartera.sucursal`

**Medidor page (Phase 2 parking):**
- Form code saved to `form.phase2.tsx`
- Page shows "Próximamente" + historial de uso only
- Linear WOR-79 created: "Phase 2 — Medidores Eléctricos: portal tenant submission"
- Historial chart updated to support multiple series (one line per unit, colored)

**Pagos page:**
- Removed "Volver al portal", removed broken Vencimiento/Concepto columns
- KPIs: Total Pagado · % En Plazo (≤30d) · Promedio días · Pagos en Mora (>30d)
- Row badges: "En plazo · Xd" (green) / "X días mora" (red) — based on `fecha_recaudo - fecha_factura`
- Header shows all units for multi-unit tenants

**Perfil page:**
- Removed "Volver al portal"
- Header shows all units
- Fetches all contracts via `getPortalContratos()` — one block per unit with its own entrada, canon, dates, discounts
- `entrada` now shown per-unit (correct — different units can have different entrances)

### siesa_raw findings (critical — updated memory)

- **cartera.sucursal** = unit identifier (`"MEDIOS IMPRESOS S.A.S. 101"`) — last word = unit number. Replace amount-matching approach entirely.
- **Correct cartera→documentos join**: `d.documento = '001-' || c.factura` NOT NIT+period (Cartesian product bug for multi-unit tenants).
- **fecha_vencimiento in recaudo is BROKEN** — stores payment application date (= fecha_recaudo always). Use `fecha_recaudo - fecha_factura` for timing.
- **ERP pushes 3× per day** (00:00, 08:00, 15:00 Bogotá). Portal data ≤8h stale.
- **Recaudo history**: Jan 2024 → present (2,834 rows). Full history safe.
- **Documentos**: ~5-month rolling window (IT-managed).
- **Cartera**: current open invoices only — Jan 2024 date = old unpaid debt, not history.
- **Unit per payment (history)**: not possible — cartera drops paid invoices, recaudo/documentos have no sucursal.

### Decisions
- Portal data must use siesa_raw directly — v2 tables may have Excel residue. Memory updated in `siesa_raw_layer.md`, `recaudo_data_model.md`, `pagos_mora_logic.md`.
- 30-day threshold for mora/en-plazo portal-wide (matches grace period rule).
- Phase 2 (medidores OCR + form) parked. WOR-79 created.

---

## Session 46 — 2026-05-03: Proyecciones rewrite — live siesa_raw + phase discount fix

### Goal
Verify and ship the proyecciones page rewrite before pushing to prod. Deep audit of old vs new data source, UI polish, and DB documentation.

### What shipped
- **Proyecciones anual rewrite** (was started in prior session, verified + polished this session). All 3 query functions (`getProyeccionBreakdown`, `getProyeccionDetalle`, `getProyeccionMensual`) now read live from `siesa_raw.ocupacion` instead of frozen `v2.proyecciones`. 79 tenants, auto-updates when ERP changes.
- **Phase discount expiry bug fixed** (critical): `mes_dcto_end` was returning `13` (= apply discount all year) when the phase end date was before the projection year. Should be `0` (= no discount). Fixed in all 3 functions. Impact: recovered $137.9M/year in projections that were being falsely discounted.
- **UI**: Replaced tiny inline breakdown strip with 4 visible cards below the main Piso/Esperado/Techo row: Canon Bruto · Descuentos de Fase · Bonus PP No Usado · Recaudo Esperado. Matching live page style.
- **New component**: `MensualDetalleTable` — sortable client-side table for the mensual invoice breakdown view.
- **`docs/db-schema-reference.md`** created: complete column-level reference for every siesa_raw + v2 table, join patterns, projection logic, phase discount rules, ex-tenant cartera pattern.
- **Memory updated**: `erp_ocupacion_model.md` rewritten (removed dead sync-csf refs, added phase fix, discount conflict patterns, ex-tenant cartera rule). `project_state.md` updated.

### 🎯 Decision — v2.proyecciones is permanently retired for forward projections
Verified gaps: 12 missing tenants, BECERRA 120 doubled ($6.1M vs $3.05M), ALARCON 312 ghost through Sep 2026. IPC-inflated rates ~5.9% above ERP. Going forward: any "what will we collect" query derives from siesa_raw.ocupacion. v2.proyecciones kept only for year-start baseline comparison if ever needed.

### 🎯 Decision — Phase discount source: siesa_raw rate + v2.contratos expiry
ERP pushes the current step rate (50%→30%→20%→0% as phase progresses). Portal uses `o.descuento` as the current rate but applies it only while `mes <= mes_dcto_end` (derived from `c.descuento_hasta_mes`). If phase expired before the projection year → 0% for the whole year, regardless of what ERP still shows (stale ERP data pattern confirmed on 4 tenants).

### 💡 Key finding — 25 discount conflicts between ERP and portal contract records
3 patterns: (A) ERP=0%, portal has phase% → phase correctly expired, ERP is right. (B) ERP < portal → phase stepping down, ERP is right. (C) ERP=50%, portal lower → ERP not yet updated after expiry, portal overrides with 0% via expiry fix. Only Pattern C is a real data issue; Siesa admin needs to clean up 4 tenants.

### ✅ Accuracy verified
Jan 2026: projection esperado $238.9M vs actual siesa_raw.documentos $236.6M = <1% error. Strong validation that siesa_raw is the right source.

### ⚠️ Open (WOR-78)
Mid-year phase step-downs (50%→30%→20%) not modeled. Portal applies current ERP rate flat for the active phase period. Needs phase timeline per contract stored in v2.contratos.

---

## Session 45 — 2026-04-30: Repair sync_desde_raw + auto-critico + unify Cartera Jurídica

### Goal
Unit 311 (ROSERO GUZMAN, ingreso 2026-04-16) showed empty on portal despite ERP showing it occupied. Root cause: Session 44 dropped 5 cols from `siesa_raw.ocupacion`; `v2.sync_desde_raw()` still referenced them and was failing silently. Same diagnosis explained units 503, 505, 804. Fix the sync, automate critico promotion/demotion, auto-terminate contracts when ERP drops the tenant, and (Part B) merge ex-inquilinos with open balance into the existing Cartera Jurídica section.

### What shipped
- **`v2.sync_desde_raw()` rewritten** (migration `v2_sync_repair_post_dropped_cols`). Stripped refs to dropped cols (`estado`, `uno`, `once`, `veintiuno`, `critico`). New contracts default to `estado='activo'`. Updates fire only on contracts WHERE `estado IN ('activo','critico')`. Insert existence check matches the same scope so a tenant returning to a unit after `terminado` re-inserts cleanly. **Auto-terminate**: any active/critico contract whose `(inquilino_id, local_id)` pair vanished from `siesa_raw.ocupacion` flips to `terminado` with `fecha_fin = COALESCE(c.fecha_fin, CURRENT_DATE)`. Guarded by `v_ocupacion_count > 0` so an empty raw load can't wipe everything. Returns extended JSONB (adds `contratos_terminated` + `ocupacion_rows`).
- **`v2.recalcular_criticos(p_threshold_dias int DEFAULT 60)`** (new). Promotes `activo → critico` when tenant's `MAX(dias_mora) > 60` with `vr_vencido > 0`. Demotes `critico → activo` when no longer crosses threshold. SECURITY DEFINER. Returns JSONB `{promoted, demoted}`.
- **`/api/cron/sync-v2`** now calls both functions in sequence (`sync_desde_raw` then `recalcular_criticos`) and returns both payloads. Cron runs 05:30 COT.
- **Manual backfill** (this session, can't wait until 05:30): 4 contracts inserted (311, 503, 505, 804), 28 updated, 15 critico demoted to activo (down from ERP-side critico flag to data-driven >60 days). Final state: 75 activo + 5 critico + 4 vacant locales (111, 313, 506A, 806).
- **Cartera Jurídica unified** (Part B). `getJuridicaRows()` in `src/lib/data/mora.ts` now selects tenants where `juridica = true` OR no active/critico contract exists, both with `vr_vencido > 0`. Single section on `/mora`; no separate "ex-inquilinos" block. LATERAL join prefers active contract for unit display, falls back to most-recent terminated contract by `fecha_fin DESC`. Verified: 2 rows surface — PEDRAZA (jurídica=true, 170d, $7.26M) + PUNTO ACRILICO (no active contract, 841d, $4.82M).
- **`src/app/(app)/mora/page.tsx`**: removed planned ex-inquilinos JSX block. Subtitle on Cartera Jurídica reads "Inquilinos jurídicos + ex-inquilinos con saldo pendiente · No incluida en totales de mora".

### 🎯 Decision — ERP is source of truth, no portal-side overrides
German's call. Portal must never carry a manual "this tenant is gone" flag that diverges from Siesa. If admin doesn't close the contract in Siesa, portal will keep showing it active. Auto-terminate fires only when the (tenant, local) pair literally disappears from `siesa_raw.ocupacion`. Means ALARCON 312 (physically empty per German, ERP says occupied) keeps showing as active until ERP admin closes it.

### 🎯 Decision — Critico is data-driven, not ERP-flagged
ERP's `siesa_raw.ocupacion.critico` was dropped Session 44. Replaced with nightly recalc against `vista_cartera_actual.dias_mora`. Single threshold (60 days) parameterizable. Decoupled from however ERP flags critico — portal computes from cartera reality.

### 🎯 Decision — Merge ex-inquilinos into Cartera Jurídica (revision)
Original plan was a separate "Ex-inquilinos con cartera abierta" section at the bottom of `/mora`. Revised mid-session: same UX intent (these don't count toward active mora KPIs), same display (table with unit + days + balance). Fewer sections, cleaner page. The OR clause makes the data join trivial.

### 💡 Learning — Sync function failed silently after column drop
`v2.sync_desde_raw()` referenced `o.uno`, `o.once`, etc. After Session 44's `DROP COLUMN`, every cron run errored with `column o.uno does not exist`. The cron route caught the exception, logged it, returned 500 — but no alert wired up, so portal data simply froze. **Future**: any DDL on `siesa_raw.*` must grep all `v2.*` PL/pgSQL functions for col refs before applying.

### ⚠️ Gotcha — Auto-terminate guard saved a wipe scenario
Initial draft of `sync_desde_raw` rewrote contracts unconditionally based on raw rows. If raw load is empty (loader script crashes after truncate), every active contract would auto-terminate. Added `v_ocupacion_count > 0` guard before the terminate block. Counted rows BEFORE the per-row loop, used as gate. Same pattern worth applying to any "reconcile from raw" function.

### Verified
- `npm run build` clean.
- Manual `SELECT v2.sync_desde_raw()`: `{contracts_inserted: 4, contracts_updated: 28, contracts_terminated: 0, ocupacion_rows: 84}`.
- `SELECT v2.recalcular_criticos()`: `{promoted: 0, demoted: 15}`.
- `vista_cartera_actual` for ex-inquilinos query: 2 rows as expected (PEDRAZA + PUNTO ACRILICO).
- Cron route returns both JSONBs in 200 response when called with bearer.

### Session-end pointers
- ADRs: none
- Lessons: none new (sync-failure pattern recorded inline above; if it recurs, promote to `feedback_*.md`)
- State: `project_state.md` update warranted — sync repair shipped, critico now auto-computed
- Linear: none (no open C-Krea WOR issues this session)

---

## Session 44 — 2026-04-29: Drop dead cols from siesa_raw.ocupacion

### What shipped
- `ALTER TABLE siesa_raw.ocupacion DROP COLUMN critico, veintiuno, once, uno, estado` — 5 cols gone (migration `drop_ocupacion_unused_cols`). IT is dropping these from ERP source too, so xlsx imports will stop sending them.
- `scripts/load_siesa_raw.py` — removed 5 entries from rename map so loader doesn't choke if cols still appear.
- `docs/foundation/01_schema_erd/v2/01_tablas.sql:130, 162` — comments updated to reflect actual source cols.

### Audit before drop
- Grepped code for refs: `proyecciones.ts` joins `siesa_raw.ocupacion` but only reads `o.descuento` + `o.pronto_pago` → safe.
- v2 `contratos.estado` + `'critico'` enum value → different table, untouched.
- DB views/RPCs reading these cols → none.

### Why
Dead columns. v1 schema mapped them to `flag_uno/once/veintiuno/critico` on contracts but v1 schema was dropped Phase K. ERP also dropping them. Cleanup before next xlsx load.

---

## Session 43 — 2026-04-29: Dashboard math + UX overhaul

### Goal
Full dashboard review post-Phase K. Fix the biggest design lie (`proyectado` was probability-weighted — the number bouncing around as PP history shifted), tighten the chart, tighten the polish.

### What shipped
- **Realistic floor formula.** `proyectado` (gross × pp_historico_pct × IVA) → `piso` = `(canon − descuento_proyectado) × (1 − pp_pct/100) × 1.19`. Per-contract PP rate from Siesa source-of-truth (mostly 10%, 14 contracts at 0/20/30%). Companion `techo` = same without the PP factor (theoretical ceiling). Numbers settle: piso=$2.56B, techo=$2.84B.
- **Cash-only KPI.** Total Recaudado now shows `recaudado` ($849M) — money in bank — not `recaudado + ppOtorgado` ($896M). Comparing vs piso requires cash-only because piso already nets PP out (see Gotcha below).
- **Empresa filter everywhere.** All v2 queries on dashboard route filter `empresa_id = '${empresaId}'` via `getEmpresaCkreaId()`. Today's data is C-Krea-only because cron is C-Krea-only, but the guard is now explicit.
- **Aging buckets collapsed.** 61_90 + 90+ → single `critica` (>60 días) bucket. Matches the 4-row visual, no longer carries dead categories.
- **Chart redesign.** Vertical bar layout: stacked recaudo + PP + pendiente = piso, then `techoExtra` (slate-light) extends to techo as visual cap. Tooltip shows %vsPiso (cash/piso) + %vsTecho ((cash+PP)/techo). Legend names the four bands.
- **Polish.** Semantic `<section>`/`<h2>` + ARIA, slate-400 → slate-500/600 contrast, `<p>` titles → `<h2>`, table headers gain Piso + Techo columns, skeleton loading.tsx mirrors layout, freshness stamp bottom-right, `Math.round` instead of `clamp(...vh...)` text scaling.
- **Subtitle minimalism (this session, late).** KPI cards trimmed: "Recaudo Proyectado 2026" subtitle = "Piso realista c/IVA", "Total Recaudado" subtitle = "33% alcanzado" — nothing else. Dropped esperado-percent marker line + PP otorgado side note. German wants the dashboard to read at a glance; extras live in the chart.

### 🎯 Decision — Honor Siesa as source-of-truth for PP rates
German described PP as "always 10%, with 20/30% coming from phases stacked on top". DB query revealed 14 contracts at 0/20/30%. Choice: codify what data says, not what spec says. Reason: Siesa is system of record; if data deviates from spec, treat data as truth and let the deviation surface in numbers.

### 🎯 Decision — Floor model over probabilistic
Old model multiplied gross by `pp_historico_pct` (an aggregate per-tenant historical PP rate). Number jumped around every time PP history recomputed. Replaced with deterministic floor: assume everyone takes their per-contract PP rate. Pros: stable number, conservative posture, headroom always positive (techo − piso = upside). Cons: actual recaudado will overshoot when tenants pay late (no PP given). That overshoot is the "good news" surface — emerald wedge above piso line.

### 🎯 Decision — Defer cartera juridica view
`v2.contratos.juridica` field carries two concepts (legal collection process + persona jurídica taxonomy). Today only 1 tenant flagged. CKR-22 (open) splits the field. Today: keep `juridica = false` filter on mora queries, do not build the separate jurídica view yet — wait for the field split.

### 💡 Learning — Achievement math: don't add PP back to cash
Trap: piso = canon × (1 − PP) × IVA. SUM(piso) is the cash floor *after* PP is netted out. Cash paid by on-time tenants exactly equals piso (PP appears separately as a discount line). Comparing achievement therefore needs cash alone: `recaudado / piso`. Adding PP back gives `(recaudado + PP) / piso`, which double-counts the discount and inflates achievement % by ~5pp. Original code did this in three places (KPI card, chart tooltip, table % column). All fixed. Saved as `feedback_pp_double_count.md`.

### 💡 Learning — `recaudado` semantics: cash, not invoiced
`v2.vista_pagos.valor_final` = what tenant paid, period. PP is a discount line (`pronto_pago_aplicado`), not part of the cash. Total Recaudado KPI now reads as "money in bank" not "canon settled" — matches mental model of anyone scanning the dashboard for "how much did we collect".

### ⚠️ Gotcha — `revalidate = 300` on dashboard doesn't fully cache
Set the page to `revalidate = 300` to cache between visits (cron syncs daily 05:30 COT, 5-min cache is fine). But `(app)/layout.tsx` reads `auth.getUser()` to gate the route, which forces dynamic. Net effect: cache directive is documentation, not behavior. Real caching needs the auth check moved out of the layout (deferred to Pass 4 / service-role cleanup).

### ⚠️ Gotcha — Service-role still reading on dashboard
Dashboard queries go through `supabaseAdmin` + `exec_sql` RPC, bypassing RLS. Today's `empresa_id` filter is the explicit guard. Pass 4 (deferred) must add RLS policies to every v2 table and switch to user-session client. Until then, the only thing protecting Raymond data from a C-Krea user is "the cron only writes C-Krea data" + "every query has `empresa_id = '00000000-0000-0000-0000-000000000001'`".

### Verified
- `npm run build` clean.
- Live numbers checked: piso $2.56B, techo $2.84B, cash $849M, PP $47M, cobrado-total $896M.
- Chart renders. Tooltip math correct. Table aligns.

### Session-end pointers
- ADRs: none
- Lessons: `feedback_pp_double_count.md` (new)
- State: none — Phase K still current
- Linear: none updated. CKR-22 (juridica split) still open as blocker for separate jurídica view.

---

## Session 42 — 2026-04-28: Phase K — `public` schema cleanup (final)

### Goal
After Phase G migrated the portal to `v2.*`, `public` still held dead helpers, an event trigger, 11 zombie enums, and 2 tables that duplicated v2 (`profiles`, `meter_readings`). Drop everything that wasn't load-bearing so `public` is reduced to the copilot prototype + the two RPCs that auth/Supabase actually need.

### What shipped (4 sub-phases, all DB-only)
- **K.1** — `DROP TABLE public.electricity_invoices` (empty, 0 refs).
- **K.4** — `handle_new_user()` rewritten: removed `INSERT INTO public.profiles` block, kept `v2.perfiles` write + role-text-to-`v2.rol_usuario` mapping. K.4 is the prerequisite for K.5 (FK from public.profiles to auth.users blocks the drop otherwise).
- **K.5** — `DROP TABLE public.profiles CASCADE` (7 rows, all mirrored to v2) + `DROP TABLE public.meter_readings CASCADE` (1180 rows; 1178 mirrored, 2 orphans tied to a Phase I-deleted local). CASCADE removed 3 RLS policies + 2 update_updated_at triggers + 1 FK.
- **K.6** — Dropped 4 `user_*` helpers, `update_updated_at`, `get_collections_dedup`, `rls_auto_enable` fn + `ensure_rls` event trigger, 11 zombie enums.

### 🎯 Decision — `public` ↔ `v2` rename rejected
German floated swapping the schema names so `v2` becomes `public` (the default). I pushed back:
- 36 portal files explicitly call `.schema('v2')` (Phase G's whole point). Rename would either break them or force another global edit.
- `auth.users` trigger binds to `public.handle_new_user` by name. `supabase.rpc('exec_sql')` resolves only against `public`. Renaming `public` requires keeping a redirect schema or rewiring both. Rewiring risk > aesthetic gain.
- Outcome: `v2.*` stays canonical via explicit `.schema('v2')`. `public` becomes the legacy/copilot namespace.

### 🎯 Decision — copilot frozen, not deleted
WhatsApp copilot lives in a separate Docker repo (`integracion_supabase/`, untracked nested git project). German confirmed it's a one-off demo prototype, not continuing. Decision: tables `agent_chat_history` + `agent_budget_state` stay live so the prototype runs for tomorrow's demo; no further development. Tasks #8 (Phase H), #57 (K.2), #58 (K.3), #62 (K.7) all abandoned.

### 💡 Learning — DROP order matters when FKs and triggers cascade
K.4 must run before K.5: `public.meter_readings.submitted_by` FKs to `public.profiles`, and `handle_new_user` writes to `public.profiles` on every signup. If K.5 ran first, the live trigger would error on next signup. Sequence: rewrite trigger → drop dependent table → drop primary table → drop helpers that read primary.

### 💡 Learning — `ensure_rls` event trigger was a Phase G blind spot
The event trigger auto-enabled RLS on every new `public.*` table created. Harmless, but invisible — easy to forget when auditing schema state. Scrubbed in K.6 since we're not creating `public.*` tables anymore. Worth a generic check next time a "what magic is running on schema events?" question comes up: `SELECT * FROM pg_event_trigger`.

### ⚠️ Gotcha — 2 unmirrored `meter_readings` rows
`public.meter_readings` had 1180 rows, `v2.lecturas_medidor` had 1178. Two orphans (`a8c0c5aa…`, `b44c07e8…`) pointed to deleted local `9286be5e…` — that local was a Phase I Excel-residue casualty (E1L126). Intentional drop, documented in `meter_readings_pre.sql` manifest. Reaffirms Phase I's orphan-cleanup choice.

### Verified
- `npm run build` clean post-K.6.
- v2 vistas: `vista_pagos=2701`, `vista_facturas=419`, `vista_cartera_actual=39`, `vista_mora_buckets=1` (unchanged).
- `v2.sync_desde_raw()` idempotent: 0/0/0/0/0/0.
- Final `public` surface: 2 copilot tables + `exec_sql` + `handle_new_user`. Nothing else.

### Pending follow-ups
- None. Phase K closes the v2 migration arc that started with Phase F.

### Session-end pointers
- ADRs: none
- Lessons: feedback_v2_excel_residue.md still applies (Phase K removed the last public residue path; Phase J upserts cover refresh)
- State: project_state.md should be updated — Phase K shipped, copilot frozen
- Linear: none — Phase K was task #54, not a Linear issue

---

## Session 41 — 2026-04-28: Phase J — sync UPSERT (refresh only)

### Goal
Replace `v2.sync_desde_raw()` INSERT-only with UPSERT so ERP changes (rent, estado, flags) actually reach the portal. Closes the staleness gap that caused Phase I's manual cleanup.

### Scope decisions (with German)
- All 3 v2 tables sourced from siesa_raw get UPSERT: `inquilinos`, `locales`, `contratos`. Recaudo/cartera/documentos already exposed via vistas — no copy, no sync needed.
- **No freeze on locales `oficina`/`mantenimiento`** — building reorg in progress, ERP wins. (Initial draft had a CASE protecting them; German removed it.)
- **No freeze on contratos `terminado`/`vencido`** — sync can rescue a wrongly-set terminado. Trade-off acknowledged: future multi-row scenarios (historical terminado + new activo same pair) clobber both. Not possible today (0 terminado).
- **No DELETE** — deferred. Ex-tenants stay until "Ya salieron" UI lands (WOR-75 / IT decision).

### What shipped
`v2.sync_desde_raw()` rewritten as `CREATE OR REPLACE`:
- inquilinos: `ON CONFLICT (empresa_id, nit) DO UPDATE` refresh `razon_social` only. Portal-only fields preserved.
- locales: `ON CONFLICT (empresa_id, codigo) DO UPDATE` refresh `unidad`/`entrada`/`estado='arrendado'`. No estado freeze.
- contratos: separate UPDATE/INSERT (no UNIQUE constraint to use ON CONFLICT). Match on `(inquilino_id, local_id)` regardless of estado. NOT EXISTS check on insert blocks dupes.
- Every UPDATE has `IS DISTINCT FROM` filter → idempotent.
- Return JSON now includes `*_inserted` AND `*_updated` per table.

Final SQL: `backups/sync_desde_raw_phase_J.sql`. Rollback: `backups/sync_desde_raw_pre_J.sql`.

### ⚠️ Gotcha — non-deterministic `nit_razon` flicker
First idempotency run was NOT zero: 2 inquilinos kept flipping. Investigation revealed `siesa_raw.cartera.cliente` and `recaudo.cliente` carry both clean names AND dirty `"<NAME> - CREDITO A 60 DIAS PP 5%"` variants on the same date for 16 NITs. `DISTINCT ON (nit) ORDER BY nit, dt DESC NULLS LAST` picked one non-deterministically per run.

**Fix:** source priority — `ocupacion` (IT-curated, clean) > `recaudo` > `cartera`, with final `razon_social ASC` tiebreaker. Six inquilinos settled to clean ocupacion names on the next run; subsequent runs = 0.

### 💡 Learning — `DISTINCT ON` needs deterministic ORDER BY
Any `DISTINCT ON` whose ordering can produce ties is a latent idempotency bug. Always add a fully-deterministic tiebreaker (alphabetic or numeric ID), or upstream data needs to be ranked. Cost of the bug: function silently looks "almost idempotent" but pollutes audit telemetry forever and produces phantom diffs that hide real changes.

### Verified
- Pre: 90 inquilinos / 84 locales / 76 contratos.
- Run 1: 0/45/0/2/0/63. (Big refresh — Excel residue + flag drift since Phase G.)
- Run 2: 0/2/0/0/0/0 → exposed bug.
- Run 4 (post-fix): 0/6/0/0/0/0.
- Run 5–6: 0/0/0/0/0/0 ✅.
- Audit gate: 0 orphans across inquilinos/locales/contratos. Counts unchanged 90/84/76.

### Pending follow-ups
- **Sync frequency** — Hobby caps cron at 1×/day (verified Vercel docs). Stay Hobby + Phase J UPSERT now; revisit Pro upgrade or external cron (cron-job.org / GitHub Actions) when 24h lag bites. Manual "Sync now" admin button is the cheap workaround.
- **Multi-row contratos guard** — add when first `terminado` lands.

### Session-end pointers
- ADRs: none
- Lessons: feedback_v2_excel_residue.md updated (Phase J closes refresh gap), new feedback_distinct_on_deterministic.md (DISTINCT ON tiebreaker rule)
- State: project_state.md unchanged
- Linear: none — Phase J was task #47, not a Linear issue

---

## Session 40 — 2026-04-28: Phase I — align v2 to Siesa truth

### Goal
Reconcile a "91 locales" count showing in the portal vs the expected ~85, and confirm v2 mirrors Siesa exactly — so any leftover discrepancy is an ERP-side fix, not a portal bug.

### What we found
- v2.locales had **91 rows** vs siesa_raw.ocupacion's **84**. Audit revealed **7 orphans** (codes only in v2, not in ERP): `E8L801–805,807` and `E1L126`. ⚠️ Gotcha
- Cross-check expanded the scope: **15 v2.contratos** failed the (NIT + codigo) match against `siesa_raw.ocupacion` — three patterns:
  - **Pattern A** (6): zone-8 dupes — same tenant on E8L *and* Z8L codes (Excel + ERP both copied in).
  - **Pattern B** (7): tenant active in v2 but ERP says unit `Critico` (vacante) — ex-tenants with open cartera.
  - **Pattern C** (2): tenant changed in v2, ERP still has old tenant (E1L120 BECERRA→GUZMAN, E1L121 NEOGRAFICK→SIERRA).
- Inquilinos audit = **0 orphans**. All 90 trace to recaudo/cartera/documentos by NIT (even ELKIN/DINAMO who weren't in `ocupacion`).

### 🎯 Decision — root cause
Phase G's data migration filled `v2.*` from BOTH `public.*` (Excel-origin) AND `siesa_raw.*` (ERP). When Phase F dropped `public.*`, the rows already copied into v2 stayed. Plus `v2.sync_desde_raw()` is INSERT-ONLY with `ON CONFLICT (codigo) DO NOTHING` — never refreshes, never deletes — so Excel residue persisted indefinitely.

### What shipped (migration `phase_i_align_v2_to_siesa_truth_v3`)
- **Moved** 78 `lecturas_medidor` from E8L → Z8L counterparts (preserve historical readings for the 5 same-tenant zone-8 units).
- **Moved** 84 `proyecciones` from orphan contratos → ERP-matching contratos (also `local_id`). Same logic — Excel had projections on E8L; Z8L had none.
- **Dropped** 83 `proyecciones` for vacante/unknown units (no ERP tenant to repoint to).
- **Dropped** 15 orphan `contratos`. **Dropped** 7 orphan `locales`. **Dropped** 2 lecturas (E1L126 — no Z replacement).
- **Updated** 5 Z8L estados `disponible` → `arrendado` (fix for stale state since INSERT-ONLY sync never refreshed them).
- Inquilinos preserved (90 rows). Ex-tenants kept for cartera tracking.

### Final state (every v2 table audited)
| Table | v2 | Source | Orphans |
|---|---|---|---|
| locales | **84** | siesa_raw.ocupacion | 0 ✅ |
| contratos | **76** | siesa_raw.ocupacion (NIT+codigo) | 0 ✅ |
| inquilinos | 90 | siesa_raw.* (any table by NIT) | 0 ✅ |
| proyecciones | 816 | derived | 0 ✅ |
| lecturas_medidor | 1178 | portal-side | 0 ✅ |

Locales now matches `siesa_raw.ocupacion` row-for-row. Any future discrepancy is a Siesa-side data fix.

### 💡 Learning — audit pattern for v2 staleness
For any v2 table that should mirror ERP:
```sql
SELECT v2.<table>.<key>
FROM v2.<table> v
LEFT JOIN siesa_raw.<source> s ON s.<key> = v.<key>
WHERE s.<key> IS NULL;  -- rows in v2 not in ERP
```
The pattern caught the zone-8 dupes plus E1L126 in one query. Saved as `feedback_v2_excel_residue.md`.

### ⚠️ Gotcha — proyecciones has TWO FK columns
`v2.proyecciones` has both `contrato_id` AND `local_id` pointing at v2 base tables. First migration attempt updated only `contrato_id` and got a 23503 FK error from the orphan locale delete. Always update *both* when repointing — checked schema before retry.

### ⚙️ Workflow
- Used `apply_migration` (not `execute_sql`) so the data fix is logged in supabase migration history. DDL-style audit trail for a DML cleanup.
- Validation block at the end of the migration ran the same orphan-detection queries — every counter came back 0 inside the same transaction.

### Linear
- **WOR-75 created** (open): "Locales — show 'Ya salió' section for ex-tenants with open cartera". 9 ex-tenants now have inquilino + open cartera but no active contrato — needs a UI flag so the team can chase cobro without confusing them with current occupants.

### Pending follow-ups
- **Phase J** (task #47): upgrade `sync_desde_raw()` from INSERT-only to UPSERT (refresh estado, canon, etc.) and optionally delete-on-missing. Without this, ERP-side updates won't reach v2 — same staleness problem will recur.
- siesa_raw external sync service (IT-side) still buggy — sync_batches stuck `in_progress`, no error_message captured. Out of portal scope.

### Session-end pointers
- ADRs: none
- Lessons: feedback_v2_excel_residue.md (new)
- State: project_state.md unchanged (still Phase G shipped + Phase I cleanup)
- Linear: WOR-75 opened (stays open by design — UI work)

---

## Session 39 — 2026-04-28: Account audit + new ERP column `row_id_mov`

### Goal
Answer "who has access to Supabase besides admin and bots?" + tighten anything found + add new column IT delivered in updated xlsx.

### Account audit findings
- **DB roles with login**: `postgres` (you), `siesa_sync` (IT bot, hardened earlier), `authenticator` (Supabase internal). Nothing else worth noting.
- **Auth users (portal humans)**: 7 total. 4 admins (you + `lburgos`, `operaciones`, `tecnologia` @reymon.com.co), 2 viewers, 1 test tenant. All scoped to C-Krea via `company_id`.
- **`service_role`**: bypasses RLS by Supabase design. Backend-only key. Reminded German not to leak it.
- **Studio/SQL access**: NOT controlled via SQL — managed at supabase.com → Project Settings → Members. Asked German to verify only he is a member there. **No action taken in DB** (correct call — wrong layer).

### New column: `siesa_raw.recaudo.row_id_mov`
**Driver:** IT updated `SIESA connexion.xlsx`. Cartera supposedly got new `RowId` and `RowIdTercero` (already existed in our schema since day 1, mapped in loader). Recaudo got `RowIdMov` (column S, int64) — genuinely new.

**Migration `siesa_raw_recaudo_add_row_id_mov`:**
```sql
ALTER TABLE siesa_raw.recaudo ADD COLUMN row_id_mov BIGINT;
```
Nullable, no default, no backfill. Existing 3,221 rows stay NULL until IT runs next sync (or we re-run the loader).

**Loader update (`scripts/load_siesa_raw.py`):** added `"RowIdMov": "row_id_mov"` to `SHEETS["recaudo"]["rename"]`. Without this, loader would silently drop the column even after IT delivers it (loader restricts to known cols via `df[cols]`).

### Worth flagging for later (not done)
`row_id_mov` is Siesa's per-movement unique ID. Once backfilled, makes a much cleaner natural key for `recaudo` than the current `(docto, cruce, fecha_recaudo, valor_aplicado)` (nullable parts forced surrogate UUID PK). Future cleanup once we know `row_id_mov` is never null:
```sql
ALTER TABLE siesa_raw.recaudo ADD CONSTRAINT recaudo_row_id_mov_unique UNIQUE (row_id_mov);
```

### Decisions
- Don't backfill row_id_mov today — wait for IT's next sync.
- Don't touch cartera — `row_id` and `row_id_tercero` already there.
- Don't add `UNIQUE` constraint yet — can't guarantee non-null until backfill confirmed.

---

## Session 38 — 2026-04-28: Phase G COMPLETE — v2 migration shipped

### Goal
Finish G.2–G.7 in one push: data migration → ongoing sync → 36 portal files refactored across 6 subgrupos → build/lint → preview → merge to main → production.

### G.2 — Data migration ✓
FK-ordered single-transaction load: empresas (hardcoded NIT) → inquilinos (UNION raw+legacy) → locales → contratos → proyecciones → tipos_gasto/gastos → reglas_financieras → lecturas_medidor → facturas_energia → perfiles. Drill A 3-tenant gate passed. Helpers rewritten to read `v2.perfiles`.

### G.3 — Ongoing raw→v2 sync ✓
- `v2.sync_desde_raw()` SQL function tested idempotent (re-run = 0 changes).
- Vercel cron route `/api/cron/sync-v2` daily 05:30 COT (had to drop from every-6h after Hobby plan caps cron to 1×/day).

### G.4 — 36 portal files refactored across 6 subgrupos
1. Auth + perfiles (4)
2. Inquilinos + locales + mora (6)
3. Pagos + recaudo (3)
4. Facturas + proyecciones (8)
5. Gastos + medidores + portal (12)
6. Configuración (3)

Field renames everywhere: `tenant_id→inquilino_id`, `unit_id→local_id`, `company_id→empresa_id`, `status→estado`, `name→razon_social`, `unit_number→unidad`, `unit_code→codigo`, `full_name→nombre_completo`, `total_amount→monto_total`, `validation_status→estado_validacion`, `tipo_gasto_id`, `electricity_group→grupo_energia`, `year→anio`, `month→mes`, `contract_id→contrato_id`, `rule_key→clave`, `rule_value→valor`, `description→descripcion`.

Pattern shifts:
- `execute("SELECT id FROM companies LIMIT 1")` → `getEmpresaCkreaId()` (lazy cache helper, lookup by NIT 900123456).
- 4 canonical recaudo filters now baked into `v2.vista_pagos` — portal callers stopped re-deduping/filtering.
- `invoice-engine.ts` and `reconciliation.ts` reduced to **no-op stubs** (Siesa emits invoices upstream now).
- Supabase upserts moved to `.schema("v2").from(...)` everywhere; `onConflict` keys verified against actual UNIQUE constraints before each write.

### G.5 — Build + lint + types ✓
`npm run build` clean (14.2s compile, 12.6s types). Lint = 9 errors / 14 warnings, all **pre-existing** (verified by stashing refactor and re-running). Refactor introduced 0 new lint errors.

### G.6 — Preview deploy ✓
- Auto-deploy from push didn't fire (Vercel project not configured to deploy non-main branches).
- Forced via `vercel deploy --yes` on `refactor/v2-migration`. First attempt failed: `Hobby accounts are limited to daily cron jobs. This cron expression (30 */6 * * *) would run more than once per day.`
- Fix: `30 */6 * * *` → `30 5 * * *` (daily 05:30 COT). Re-deployed → Ready.
- Preview URL gated by Vercel SSO (auth wall, expected for previews). German manually verified all admin tables fill in.

### G.7 — Merge to main + production deploy ✓
- `git checkout main && git merge --no-ff refactor/v2-migration && git push origin main`.
- Production deploy 1m, status Ready.
- `/login` → 200, `/portal` → 307 redirect (expected unauth flow). No 500s in runtime logs.

### Decisions locked (worth remembering)
1. **Cron frequency capped by plan**: Vercel Hobby = 1×/day per cron. If ever 2 schedules conflict, raise the question of upgrading rather than working around.
2. **vista_facturas vs vista_cartera_actual unjoinable**: `doc_id` (e.g. `001-FVS-69739`) ≠ `documento` (e.g. `60344275`). Hardcoded `saldo=0`, `status="emitida"`; cartera tracking lives on its own page.
3. **invoice-engine/reconciliation are dead code in v2 world**. Stubbed signatures preserved so callers don't break, but bodies return zero/no-op. Mark for delete in cleanup pass.

### Errores y fixes
- `v2.contratos` missing `grace_period_days` → hardcoded `null` in `PortalProfile` (type already nullable).
- `vista_pagos` missing `id`/`status`/`concepto` → synthetic `ROW_NUMBER() OVER (...)::text AS id`, hardcode `status="RECAUDADO"`, `concepto=null`.
- `v2.proyecciones` missing `pronto_pago_proyectado` → dropped from upsert + monthly breakdown SELECT.
- `v2.gastos` missing `is_allocated` → hardcoded `false`.

### Linear
- WOR-? G refactor closed via merge commit.

### Pending — Phase F + H (NEXT SESSIONS)
- **Phase F**: archive 25 old `public.*` tables now that nothing reads them. Blocked-on-G is now unblocked.
- **Phase H**: copilot tool surface (separate session, not data-migration related).

### Session-end pointers
- ADRs: none new (decisions captured in CHANGELOG/journal narrative)
- Lessons: feedback_vercel_cron_hobby.md (new — capture cron 1×/day cap)
- State: project_state.md needs update (Phase G done, F+H pending)
- Linear: G refactor closed via merge

---

## Session 37 — 2026-04-28: Phase G.0 + G.1 — v2 migration kickoff

### Goal
Start portal refactor `public.*` → `v2.*`. G.0 mapping doc + G.1 infrastructure (helpers, RLS, PostgREST exposure, Drizzle schema, TS helpers).

### Decisions locked
1. Sync raw→v2: IT cron 6h (already scripted) + portal cron offset 30min.
2. 3 orphan legacy tables (`payment_applications`, `invoice_line_items`, `interest_accruals`): DELETE in Phase F (post-G).
3. Branch: `refactor/v2-migration` (no main direct — 35-file scope).
4. Multi-empresa: solo C-Krea.
5. Estructura > tiempo.

### G.0 — Mapping doc shipped
`docs/foundation/01_schema_erd/v2/G_migration_map.md`. 25 `public.*` → 12 v2 + 4 vistas + 10 deletes. Field renames, file inventory (35 portal files, NOT 17 as prior estimate), cron schedule, RPC list, gates per phase.

### G.1 — Infrastructure shipped
1. Branch `refactor/v2-migration` created.
2. `.gitignore` + `.claude/` + `backups/`.
3. **Migration `v2_g1_helpers_and_rls`**:
   - Helpers `v2.user_empresa_id()`, `v2.user_rol()`, `v2.user_inquilino_id()` (read `public.profiles` transitorio, mapean enum legacy → v2: admin→admin, finance→finanzas, viewer→visor, tenant→inquilino).
   - RLS ON en 12/12 tablas v2.
   - 45 policies espejo de `public.*` (admin/finanzas/inquilino + special `agente_chat` per-user, special `lecturas_medidor` tenant-reads-own).
4. **PostgREST**: `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, v2, graphql_public, storage'` + `NOTIFY pgrst, 'reload config'`.
5. **Service_role grants**: ALL ON ALL en v2 + ALTER DEFAULT PRIVILEGES.
6. **Drizzle TS**: `src/lib/db/schema/v2/{enums,tables,index}.ts` — 12 tablas + 6 enums con `pgSchema('v2')`.
7. **Helpers TS**: `src/lib/db/v2.ts` (`v2()` retorna `supabaseAdmin.schema('v2')`) + `src/lib/empresa.ts` (`getEmpresaCkreaId()` lazy + cache per server boot, lookup por NIT `900123456`).
8. **Verificación**: `npx tsc --noEmit` clean. SQL counts cuadran: 12 tablas + 4 vistas + 9 funciones + 45 policies.

### Findings críticos
- **C-Krea UUID**: `00000000-0000-0000-0000-000000000001` (en `public.companies`). Estrategia G.2: PRESERVAR → `public.profiles.company_id` matchea `v2.empresas.id` automático, no rewrite de auth.
- **siesa_co_id**: `044`, **canal**: `R08`, **ccosto**: `285`.
- **Arquitectura validada**: 12 tablas son ERP-mirror o portal-puro; resto (filtros, totales, vistas Drill A) son vistas/RPC. 9 portal-pure + 3 hybrid (locales/contratos/inquilinos guardan campos portal-only que vista no puede: `juridica`, `grupo_energia`, `fecha_fin`).

### Errores y fixes
- Migración 1ª intento: `ERROR: 42704: type "rol_usuario" does not exist`. Causa: enums viven en schema `v2`, no en search_path. Fix: schema-qualify todos los CASE expressions a `v2.rol_usuario`.
- Query `companies.ruc` falló (col no existe). Fix: `SELECT *`, encontrado `nit` correcto.

### Pendiente — G.2 (NEXT SESSION)
Data migration FK-ordered en una transacción:
1. `v2.empresas` (hardcode UUID + NIT)
2. `v2.inquilinos` (UNION raw + LEFT JOIN public.tenants — captura ex-arrendatarios con deuda)
3. `v2.locales` (raw.ocupacion + LEFT JOIN public.units para grupo_energia, area_m2)
4. `v2.contratos` (raw.ocupacion + LEFT JOIN public.contracts para fecha_fin, ipc)
5. `v2.proyecciones` (public.projections, drop pronto_pago_proyectado)
6. `v2.tipos_gasto` (mapeo enum)
7. `v2.gastos`
8. `v2.reglas_financieras`
9. `v2.lecturas_medidor` (mapeo enum)
10. `v2.facturas_energia` (vacía hoy)
11. `v2.perfiles` (auth.users + public.profiles, mapeo enum)

Después G.2: reescribir helpers `v2.user_*()` para leer `v2.perfiles` (no más `public.profiles`).

**Gate G.2**: row counts cuadran + Drill A 3-tenant (IMAGENN/MARTINEZ/REBELARTE) totales idénticos.

### Pointers
- Memory: `~/.claude/projects/-Users-workspace-Portal-Ckrea/memory/g_migration_state.md` (estado completo, IDs, FK order, decisiones).
- Mapping doc: `docs/foundation/01_schema_erd/v2/G_migration_map.md`.
- Branch: `refactor/v2-migration` (G.1 changes uncommitted en working tree).

---

## Session 36 — 2026-04-28: RLS on siesa_raw (defense-in-depth)

### Goal
Add Row-Level Security on the 5 `siesa_raw` tables so only the IT sync role (`siesa_sync`) can read/write, on top of existing GRANTs.

### Pre-state audit
- Inserter = DB role `siesa_sync` (login). 145 batches `source_system='siesa'` (last 2026-04-28 15:31). 13 batches `xlsx_phase_c` from local loader (`postgres`).
- GRANTs: `siesa_sync` had SELECT/INSERT/UPDATE on all 5 tables. `anon`/`authenticated`/`service_role` had **none** — already grant-blocked.
- RLS = OFF on all 5 tables. No policies.
- Schema not in PostgREST exposure (no `usage` to anon/auth) → REST API can't see it.

### Decision
Belt-and-suspenders. GRANTs already lock the door; RLS adds an in-room guard. Done because Supabase Advisor flags non-RLS tables and we want explicit deny semantics.

### Migration applied: `siesa_raw_rls_phase1`
```sql
ALTER TABLE siesa_raw.{cartera,recaudo,documentos,ocupacion,sync_batches}
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY siesa_sync_all ON siesa_raw.<table>
  FOR ALL TO siesa_sync USING (true) WITH CHECK (true);
```
- `postgres` (table owner) bypasses RLS automatically → local loader keeps working.
- `sync_batches` included — without it IT batch protocol breaks.
- Single `FOR ALL` policy chosen over split per-cmd: simpler, same effect (siesa_sync has no DELETE grant anyway).

### Verification
All 5 tables: `relrowsecurity=true`, policy `siesa_sync_all` → `{siesa_sync}` → cmd ALL. Confirmed via `pg_policies` query.

### Watch next
- Next IT sync run should produce a fresh `sync_batches` row with `source_system='siesa'`. Failure = RLS misconfig (unlikely — `siesa_sync` has explicit `FOR ALL` policy).
- No notification needed to IT — their connection string and credentials unchanged.

### Rollback (if ever needed)
```sql
DROP POLICY siesa_sync_all ON siesa_raw.<table>;
ALTER TABLE siesa_raw.<table> DISABLE ROW LEVEL SECURITY;
```

### Follow-up: role attribute tighten (same session, 2026-04-28)

**Problem:** Audit revealed `siesa_sync` was created with three admin flags that bypassed our new RLS:
- `rolcreaterole=true` — could create new DB users
- `rolcreatedb=true` — could create databases
- `rolbypassrls=true` — **skipped RLS entirely**, making the just-added policy useless against this role

**Fix (`siesa_sync_role_tighten`):**
```sql
ALTER ROLE siesa_sync NOCREATEROLE NOCREATEDB NOBYPASSRLS;
```

**Verified:** all 3 flags now false. Role is minimal-privilege:
- can: login, USAGE on `siesa_raw`, SELECT/INSERT/UPDATE on 5 tables
- cannot: create roles/dbs, bypass RLS, ALTER/DROP/TRUNCATE/DELETE, touch any other schema

**Why it slipped through:** original `siesa_raw_schema_phase1` migration created the role without explicit `NOCREATEROLE NOCREATEDB NOBYPASSRLS`. Postgres defaults are role-dependent — Supabase managed envs sometimes inherit liberal defaults. Lesson: future migrations creating roles must declare these flags explicitly.

---

## Session 35 — 2026-04-26: Drill A 3-tenant deep-dive + vista bug fixes (Phase C.5)

### Goal
Verify v2 design against real raw data via end-to-end traces of 3 inquilinos with distinct profiles. Reconcile factura → recaudo → cartera per tenant. Catch any vista bugs before applying Phase D.

### Drill A — 3 inquilinos walked end-to-end

| Inquilino | NIT | Tipo | Locales | Canon/mes | Estado | Mora avg | Cartera abierta | Saldo a favor |
|---|---|---|---|---|---|---|---|---|
| IMAGENN & PUNTO SAS | 900809088 | PJ | 5 (E5) | $14.5M | Critico | +44d | $46.6M | 0 |
| MARTINEZ CADENA | 53113929 | PN | 2 (E1) | $5.18M | Activo | -0.6d | 0 | $1.83M |
| REBELARTE COMUNICACION | 901729544 | PJ | 3 (E4+Z8) | $4.85M | Activo | -0.5d | 0 | $8.16M |

Reconciliación cierra al peso en los 3:
- IMAGENN: facturado Q1 $51.23M − pagado en mismo periodo $5M = cartera abierta $46.6M ✓
- MARTINEZ: 4 meses facturado $24.65M brutos − descuentos PP $1.04M = $23.6M; pagado $24.3M; cartera $0 ✓
- REBELARTE: facturas + descuentos cuadran con depósitos previos ($8.16M) y mora −0.5d.

### Bugs found + fixed

1. **NIT `.0` artifact** (pandas float→str). 78/78 filas en `ocupacion.documento`, 317/317 en `documentos.tipo_cliente`. Otras columnas NIT (recaudo, cartera, documentos.doc) limpias. Fix loader: `strip_dot_zero=[cols]` config + `str.removesuffix('.0')` post-rename. Re-run loader idempotente. Las 78 ocupacion duplicadas (viejas .0 + nuevas clean) resueltas con `DELETE FROM ocupacion WHERE documento LIKE '%.0'`. Total ocupacion 84 ✓ (78 NIT + 6 vacantes null).
2. **`vista_cartera_actual` join wrong**: usaba `inquilinos.nit = cartera.cliente`. Real: `cartera.cliente` es razón social + términos de crédito (`'KIADOM ... - CREDITO A 10 DIAS PP 10%'`). Fix: `cartera.documento`. `cliente` ahora expuesto como `razon_social_raw`.
3. **`vista_facturas` join wrong**: mismo bug — `documentos.cliente` es razón social. Fix: `documentos.doc` (NIT). Renombré `documento` → `doc_id` (factura ID) y `prefijo_doc` ahora usa `SPLIT_PART(documento, '-', 2)` para extraer FVS/RK/NVS de `'001-FVS-69736'`.

Verified post-fix: ocupacion 59 NITs → 59 in recaudo, 59 in documentos, 50 in cartera (9 al día sin saldo). Joins funcionan ✓.

### Hallazgos no obvios

- **`documentos` tiene 2 tipos de filas** para inquilinos PP: `tipo='Facturas'` (FVS-) y `tipo='Descuentos'` (`001-RK -` 2025+ o `044-CN -` 2024). Las Descuentos llevan `ventas` negativa, sin IVA/retenciones — son PP del 10% como docto contable separado de la factura. `vista_facturas` debe filtrar `tipo='Facturas'` o exponer `is_factura` flag (TODO #11).
- **PP captado en 2 sistemas**: `recaudo.pronto_pago` (real-time, al cobro) + `documentos tipo='Descuentos'` (cierre contable). Misma transacción vista de 2 ángulos — no double-count. IMAGENN tiene PP solo en recaudo 2024, no en docs (rolling 4 meses no captura).
- **Descuento de fase YA aplicado en `documentos.ventas`** (no separado). MARTINEZ E1L107 fact ventas $3,285,000 = $3,650,000 × 0.9. PP+fase stack confirmado: factura ya con desc fase, PP se aplica al cobro como docto adicional.
- **Anomalía REBELARTE Z8L803**: facturó $1,160,000 en ene-feb pero $1,219,160 desde mar. Cambio fase contractual mid-Q1. ERP es source of truth, no normalizar.
- **PJ retefuente 3.5%** confirmado en IMAGENN ($395,815 / $11,309,000) y REBELARTE ($75,600 / $2,160,000). MARTINEZ PN tiene retenciones=0 ✓.
- **Saldos a favor reales**: REBELARTE $8.16M acumulados en 6 RK/NCF/CN-, MARTINEZ $1.83M depósito 2024-11-27. `vista_cartera_actual saldo > 0` los excluye correctamente. Design call para portal UI diferido.

### Lessons

- **No asumir tipo de columna por nombre**: `cliente` parecía obvio NIT. Sample real disipó. Drill antes de aplicar.
- **Pandas float→str perdura**: cualquier columna NIT/ID que en xlsx sea numérica entra con `.0`. Cleaner explícito por columna en loader.
- **3-tenant drill > 1-tenant**: el patrón Descuentos (RK-/CN-) era invisible en IMAGENN. MARTINEZ + REBELARTE lo destaparon.
- **Verify join correctness con overlap drill**: `COUNT(DISTINCT a.col) FILTER (WHERE b.col IS NOT NULL)` post-fix detecta JOINs muertos rápido.

### Status

- Phase C.5 ✓ explorado, vistas corregidas.
- Phase D ⏸ bloqueado por task #11 (decisión `tipo='Facturas'` en vista_facturas).
- Drill B (reconciliación 2026Q1 portfolio-wide) y Drill C (column glossary) pendientes.
- Linear WOR-71 sigue abierto (tipo_cliente IT mapping).

---

## Session 34 — 2026-04-26: v2 simplified schema designed + raw data loaded (Phases A→C)

### What we did

Major DB refactor. Goal: collapse `public.*` (25 tables, mixed concerns, repeated bugs around `siesa_clasificacion`, PP exclusivity, dedup) into a small derive-everything-from-raw model. New v2 lives in `docs/foundation/01_schema_erd/v2/`. **Schema NOT yet applied to prod** — sequenced as A (design) → B (backup) → C (load raw) → D (apply, deferred) → E–H (verify, archive, refactor portal, copilot).

### Phase A — v2 design

Wrote 3 SQL files. All Spanish naming. Lessons baked in.

- `01_tablas.sql` — 12 tables (empresas, perfiles, inquilinos, locales, contratos, proyecciones, lecturas_medidor, facturas_energia, tipos_gasto, gastos, reglas_financieras, agente_chat) + 6 enums + indexes + `update_updated_at` trigger via DO block. Circular FK perfiles.inquilino_id → inquilinos.id handled.
- `02_vistas.sql` — 4 views derive from `siesa_raw.*` + LEFT JOIN inquilinos by NIT:
  - `vista_pagos`: 4 canonical filters (`cruce LIKE 'FVS-%'` + dedup via DISTINCT ON + `valor_final < 1B` + `id_zona='Z40'`)
  - `vista_cartera_actual`: bucket_mora CASE + en_mora_real (dias>30)
  - `vista_facturas`: `id_co='044' AND id_canal='R08'`
  - `vista_mora_buckets`: aggregate excluding juridica
- `03_rpcs.sql` — 5 RPCs (obtener_recaudo, obtener_cartera_actual, obtener_buckets_mora, obtener_recaudo_vs_proyectado, obtener_resumen_inquilino). All SECURITY INVOKER, GRANTed to authenticated + service_role, REVOKEd from public/anon. **`siesa_clasificacion` never accepted as filter.**

### Phase B — backup

Two artifacts in `backups/`:
- `schema_snapshot_20260426.sql` — manually-assembled DDL via MCP (39 KB, 827 lines): 11 enums, 25 public + 5 siesa_raw tables, all PKs/UNIQUEs/FKs/CHECKs, 46 indexes, 7 functions, 15 triggers. **Not** included: RLS policies, grants, row data.
- `ckrea_pre_v2_20260426_213512.dump` — pg_dump custom format, 535 KB, 326 TOC entries (full data + RLS + FKs).

### Phase C — load raw from `SIESA connexion.xlsx`

Wrote `scripts/load_siesa_raw.py` (pandas + psycopg2 execute_values). Idempotent UPSERT via row_hash (MD5 of canonical tuple). Single sync_batch per sheet. Loaded:

- cartera 125 rows
- recaudo 3221 rows
- ocupacion 84 rows
- documentos 419 rows  → **3849 total**

Sanity check confirmed: 4 canonical filters work clean on raw data. Raw recaudo ~18% higher than legacy `public.payments` — proves new xlsx is more authoritative than the old import.

### Connection saga (resolved)

`pg_dump` and `psql` from local can't reach Supabase via direct port 5432 on free tier. Fix path:

1. Stale local DB password → user reset in Supabase Settings → Database
2. Pooler URL **required** (project-prefixed user): `postgres.<project_ref>:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres`
3. `.env.local` DATABASE_URL updated. Production Vercel env var still pending update.

### Schema rigidity bugs found & fixed during load

Real ERP data violated NOT NULL on natural-key columns. Two surgical migrations applied:

- `siesa_raw_recaudo_nullable_cruce`: row `001-RE-657` had null `cruce`. Dropped PK on `(docto, cruce, fecha_recaudo, valor_aplicado)`, added surrogate `id uuid` PK, recreated as `recaudo_natural_key UNIQUE NULLS NOT DISTINCT (...)`.
- `siesa_raw_ocupacion_nullable_documento`: row `E1L111` had null `documento` (vacant locale, estado=Critico). Same surrogate-id + UNIQUE NULLS NOT DISTINCT pattern.

Loader updated to use `ON CONFLICT ON CONSTRAINT recaudo_natural_key` / `ocupacion_natural_key`.

### Why this matters

ERP becomes the only source of truth. No more silent drift between `public.payments` and recaudo exports. PP, dedup, and the $4.2B FUSION GRAFIK outlier are all enforced in one place (`vista_pagos`) — every consumer (portal, copilot AI, RPCs) sees the same numbers.

### Pending — explicit user redirect

User redirected before Phase D: **next session must START with raw data exploration** ("clarification and understanding of that data") before applying v2 schema. Concrete first task: profile each siesa_raw.* table (counts, distinct values, null distributions, anomalies, prefixes), walk through example rows, map every xlsx column to plain-language meaning. Only then resume Phase D.

### Other pending

- Phase D: apply v2 schema (after data understanding)
- Phase E: verify totals via new RPCs vs Power BI
- Phase F: rename `public.*` → `_archive_*`
- Phase G: refactor portal code to read views/RPCs
- Phase H: copilot tool surface (separate repo) → same RPCs
- Vercel env var DATABASE_URL → new pooler URL with current password

---

## Session 33 — 2026-04-25: Phase 1 — `siesa_raw` landing schema shipped + IT integration guide

### What we did

IT team has live SQL connection to Siesa and asked where to push the 4 raw exports (Cartera, Recaudo, Documentos, Ocupacion, all already filtered to C-Krea zone Z40 / canal R08). Decided **Option B**: separate landing schema (`siesa_raw`) for the IT job to UPSERT into, then portal ETL refactors `public.*` from there in Phase 2. Reasons over Option A (direct write to portal tables):

- Isolation: schema lives outside PostgREST, no risk of leaking through API routes or RLS holes
- Idempotency: IT re-runs are safe via `row_hash` change detection (MD5 of canonical column tuple)
- Auditability: every row links to `siesa_raw.sync_batches` (id, started_at, finished_at, source, row_count, status, error)
- Phase 2 is a pure refactor — no external coupling to swap

### Phase 1 shipped (migration `siesa_raw_schema_phase1` applied)

5 tables created:
- `siesa_raw.sync_batches` — audit log (id, started_at, finished_at, source, row_count, status, error)
- `siesa_raw.cartera` — PK `row_id` (Siesa already exposes a per-row id)
- `siesa_raw.recaudo` — composite PK `(docto, cruce, fecha_recaudo, valor_aplicado)` (no single Siesa unique key)
- `siesa_raw.documentos` — PK `documento`
- `siesa_raw.ocupacion` — composite PK `(documento, local)` (one tenant can hold multiple locales)

Every raw table carries 3 meta columns: `siesa_synced_at`, `sync_batch_id` (FK), `row_hash`.

Permissions: new role `siesa_sync` gets `SELECT, INSERT, UPDATE` on the schema. `anon` and `authenticated` revoked. **No RLS** — access is controlled by grants only since the schema is not exposed via PostgREST.

### IT-facing guide

`docs/integrations/SIESA-Raw-Import-Guide-IT.html` — single self-contained Spanish page with: connection params, full DDL of the 5 tables, Raymond filter rules, idempotent UPSERT pattern, batch protocol (open → insert → close), operational notes. First draft was ~700 lines (TOC + redundant mapping tables + full Python script + expanded FAQs); rewrote to ~260 lines after user feedback — kept all technical substance, dropped the duplication.

### Why this matters

Schema source-of-truth is now ERP, full stop. Portal stops carrying assumptions; it derives. Phase 2 will rewrite `getPagos*`, cartera, ocupación queries to read through views/materialized tables fed from `siesa_raw`, preserving portal-only columns (juridica, pp_historico_pct, electricity_group) on the public side without touching ingest.

### Gotcha for next session

Tables are not visible by default in Supabase Table Editor — it lands on `public`. Use the schema dropdown to switch to `siesa_raw`. Documented this for the user mid-session; worth remembering.

### Pending

- Deliver `siesa_sync` password to IT via secure channel (not in repo, not in docs)
- Phase 2: ETL function `refresh_from_siesa_raw()` + portal table refactor (Linear issue to be opened)

---

## Session 32 — 2026-04-24: WOR-69 — pp_historico_pct backfill bug fix

### What we did

Closed WOR-69. Original `pp_historico_pct` backfill (Session 30) had two compounding bugs:

1. **Double-counted paired rows.** Siesa emits two rows per cash movement (`RK` + `001-RK`). Old denominator counted both, halving the visible PP rate.
2. **Skipped NO PROYECTADO PP wins.** Real PP-applied invoices that landed in Siesa's `NO PROYECTADO` bucket were excluded from both numerator and denominator, so the actual PP behavior never made it into the rate.

Combined effect: most tenants stuck on or near the 17.99% global fallback even when they pay early consistently.

### Fix

New backfill (`scripts/backfill-pp-historico.sql`, idempotent):
- Deduplicate on `(tenant_id, siesa_cruce, fecha_recaudo)` — collapses RK pair to one cash movement.
- Filter to `siesa_cruce LIKE 'FVS-%'` + `valor_final < 1B` (matches `getPagos*` filters in `src/lib/data/pagos.ts`).
- Numerator = deduped rows where `pronto_pago_aplicado > 0`. No classification gate.
- Denominator = all deduped rows.
- ≥10 deduped pagos → real per-tenant rate. <10 → global rate (computed from same dataset).

### Impact

| metric | before | after |
|---|---|---|
| global PP rate | 17.99% | 38.07% |
| avg per-tenant PP rate | 22.93% | 41.94% |
| tenants with real (non-fallback) rate | 51 | 62 |
| 2026 `recaudo_esperado` | $3,039M | $2,987M (−$51.9M) |

The drop is correct: more PP discount expected → less net cash projected. Projections now match what these tenants actually do.

### Examples

- ACRIGROUP: 1.69% → 7.26% (was missing 7 of 9 PP wins from NO PROYECTADO + dedup)
- NIETO VILLALBA: 17.99% (fallback) → 67.50% (40 real payments emerged from RK dedup)
- NC GRAPHICS: 17.99% (fallback) → 50% (10 deduped pagos, 5 PP wins surfaced)

### Why save the SQL as a script

Original backfill was a one-off ad-hoc query — not in any migration or script. WOR-69 made me reverse-engineer it from the data. Now `scripts/backfill-pp-historico.sql` is the canonical formula. Re-runnable after every payments sync if/when we want a fresh recompute.

---

## Session 31 — 2026-04-24: Pagos month filter + classification rewrite + NC GRAPHICS fix

### What we did

Reviewed and shipped Section 3 of `docs/REVIEW_PLAN.md`. Three concerns bundled.

**Pagos month filter** — `/pagos?month=YYYY-MM` dropdown. KPIs, buckets, and table all scope to the chosen month. URL is the source of truth (shareable + back/forward survives).

**Payment classification rewrite** (resolves the long-running Power BI gap chase):
- Dropped `siesa_clasificacion IN ('RECAUDADO','VENCIDO')` filter — proven unreliable: the same payment shows different values on duplicate rows. See `docs/audits/payment-classification-logic.md`.
- New filter: `siesa_cruce LIKE 'FVS-%'` (real invoice payments — excludes NVS credit notes, RK reversals).
- Dedup paired RK + 001-RK rows (Siesa emits both for one cash movement).
- Exclude standalone 001-RK entries whose per-tenant total matches the prior month's electricity bill (those are electricity payments, not canon receipts).
- Hard cap `valor_final < 1,000,000,000` to drop the $4.2B FUSION GRAFIK April 2024 data-entry error.
- New buckets `temprano` (day 1–10) / `tardio` (day 11+) / `mora` (tenant has prior-month outstanding cartera) — driven by date and cartera saldo, not Siesa classification.

**NC GRAPHICS contract fix**: their `pronto_pago_pct` was 0 (only contract of 78 set to 0). Real Siesa data shows they DO get 10% PP every cycle. Updated to 10. Linear WOR-69 tracks the related undercount in `pp_historico_pagos` (NO PROYECTADO classification excluded from histórico calc).

### Why this matters

Pagos KPIs were silently wrong before today. Bucket sums didn't reconcile to the KPI total because the classification field disagreed with itself across rows. Anyone comparing portal → Power BI was chasing an unanswerable question. Now the rules are: invoice-side filter (FVS-) + dedup + electricity carve-out, all documented in audits/.

---

## Session 30 — 2026-04-24: PP histórico + CKR-20 (PP+phase stacking) closure

### What we did

Reviewed the uncommitted PP histórico per-tenant model (Section 2 of `docs/REVIEW_PLAN.md`). Verified `tenants.pp_historico_pct` populated in production (65/66 tenants, avg 22.93%, max 54.84%, 51 with ≥10 payments). Confirmed against real Siesa data that **PP + phase discount STACK**, contradicting the mutual-exclusivity rule originally shipped.

### CKR-20 closed: removed mutual exclusivity from all 8 spots

Stripped the `CASE WHEN p.descuento_proyectado > 0 THEN 0 ELSE … END` (or equivalent) wrapper from:
- `src/lib/invoice-engine.ts:209` — invoice generation engine
- `src/lib/data/dashboard.ts:18` — portfolio total
- `src/lib/data/reportes.ts:112` — proyectado vs real chart
- `src/lib/data/pagos.ts:116` — proyectado_mes KPI
- `src/lib/data/proyecciones.ts` — 4 spots (breakdown, detalle, mensual)

DB sanity check on 2026 projections:
- Conservative max (no PP): $3,113,676,785
- OLD mutex PP: $57,518,108
- NEW stack PP: $73,702,168 (**+$16.2M previously missed**)

### Why this matters

A tenant in their phase-discount window who pays before day 10 still earns PP. We were under-discounting expected revenue. New "Recaudo esperado" projects ~0.5% lower for 2026 — closer to actual Power BI behavior (the 0.68 collection-rate hypothesis stays open as a separate question).

### Sidebar reorder (UX)

Moved Locales from position 4 (between Mora and Pagos) to position 5 (right below Pagos). German preference — Locales is a static reference, sits closer to billing flow.

---

## Session 29 — 2026-04-24: ERP Ocupación sync + data discrepancies audit

### What we did

Extended `scripts/sync-csf.ts` to include the `ckrea-ocupacion` endpoint (3rd sync target, alongside cartera + payments). Ran dry-run, surfaced 15 real discrepancies, and produced a verification doc for the CKREA manager to reconcile against ERP.

### The ERP-as-source-of-truth decision

From now on, ERP (Siesa) is the single source of truth for occupancy. Portal syncs FROM ERP, never the reverse. This formalizes the workflow: when a tenant leaves, admin closes contract in ERP → Portal auto-updates on next sync. No more manual corrections in Portal DB.

### Tenant identity model (confirmed — no schema changes needed)

- **NIT = permanent tenant identity.** Same legal entity = same `tenants.id` forever.
- **Contracts are lifecycle units.** Come and go. `status = 'activo' | 'critico' | 'vencido' | 'terminado'`.
- **Cartera ties to `tenant_id`, not to contract.** Debt persists across contract lifecycle — a tenant can leave the local but keep an outstanding balance.

This model works with existing schema. The fix is process, not code.

### The ERP data problem — 4 patterns found

Cross-referenced ERP (`Ocupacion SIESA.xlsx`, 84 occupied rows) against Portal DB. ERP reports only `Activo` (56) + `Critico` (28) — never `Inactivo`. All 85th+ units = vacant by omission.

1. **Contracts not closed when tenant leaves** (4 units): 111, 312, 313, 506A. ERP still shows `Critico` months after tenant physically left. Manager's Excel confirmed them vacant.
2. **Records missing NIT/nombre** (4 units): 311, 503, 505, 804. ERP has canon + `Critico` status but `DOCUMENTO` and `RAZON_SOCIAL` are NULL. Portal has the real tenant (all have active payment history + cartera).
3. **Tenant mismatch ERP vs Portal** (3 units): 120 (Becerra vs Fabian), 121 (Neografick vs Sonia Sierra), 126 (Dinamo in Portal, absent in ERP).
4. **Multi-local consolidation mismatch**: IMAGENN & PUNTO has 4 locals (508/510/512/514) — ERP splits canon by local ($2.99M/$2.73M/$2.84M/$2.74M), Portal has all $11.309M consolidated in 508. Totals match.

### Sync script extensions

- Added `CKREA_COMPANY_ID` constant
- Added `DISPONIBLES_OVERRIDE = ['312','313','506A']` — manager-confirmed vacant despite ERP. Bypass until ERP admin closes them.
- **Fantasma detection**: `!nit || !erpNombre` → auto-terminate DB contract with reason `ERP_SIN_INQUILINO`. (Disabled until manager confirms — these 4 turned out to be real active tenants with missing NIT in ERP, not vacants)
- **Multi-row per LOC dedup**: prefer `Activo` > `Critico` > first. (Moot — all 84 LOCs are unique.)
- CLI flags: `APPLY` (default false = dry-run), `DEBUG`
- Diff types: `UNIDAD_NO_EN_DB`, `SIN_CONTRATO_EN_DB`, `INQUILINO_DIFERENTE`, `CANON_DIFERENTE`, `DEBE_TERMINAR`

### Sync NOT applied

Dry-run surfaced suspicious items where auto-termination would delete real tenants (the 4 fantasmas are active with debt). Decision: **do not apply sync until manager verifies the list**. Sent `docs/revision-ocupacion-erp.html` to manager for verification.

### Deliverable

- `docs/revision-ocupacion-erp.html` — professional Spanish doc for CKREA manager. Structure: context → 4 tables (one per category) → patterns → proposed workflow → next steps. Print-friendly CSS (`@media print`). Manager verifies against physical reality → admin fixes ERP → Portal syncs automatically.

### Key gotcha for future

**ERP never uses `Inactivo`.** Only `Activo` + `Critico`. A local disappears from the ocupacion endpoint when vacant (or gets a fantasma row with NULL NIT). Any sync logic that assumes `ESTADO = 'Inactivo'` exists is wrong — caught this on first dry-run when 50 false positives surfaced.

**Null NIT + canon present ≠ vacant.** It's a data entry gap — the contract exists in ERP with canon but no tenant link. Requires manual verification before treating as vacant.

---

## Session 28 — 2026-04-23: Supabase IT Connection Guide

### What we did

No code shipped. Full session focused on unblocking IT's sync script and documenting the integration clearly.

### Root cause found — siesa_sync connection failure

IT ran the corrected Python script (keyword args, no URL) and still got `Tenant or user not found`. Investigated via Supabase MCP — user exists, can login, has password. Real cause: **PgBouncer (port 6543) keeps its own user registry separate from PostgreSQL**. Users created via SQL are not auto-registered in PgBouncer. Pooler doesn't know the user → rejects connection.

Fix: switch to **port 5432** (direct connection, no pooler). Different host: `db.bosylehvmtwtqkrlievy.supabase.co`. No suffix needed on username. For a sync script, direct connection is perfectly fine.

### 24/7 sync discussion

User wants Supabase always up to date, not just 3x/day. Decision: **cron job every 5 minutes** is the right approach — not a persistent connection. Script is idempotent (upsert), safe to run 288x/day. 5-minute lag is practically real-time for a rental payment portal. IT configures via Task Scheduler (Windows) or cron (Linux).

### Docs created this session

- `docs/supabase-fix-conexion.html` — already existed, reviewed with user
- `docs/supabase-it-guide.html` — **new**. Full IT reference: context + architecture diagram, connection fix with working Python code, test script, 3 endpoint field mapping tables (payments/cartera/tenants), common errors table. Tone: collaborative reference, not a wall. Password placeholder — German sends separately.
- `docs/csf-integration-options.html` — reviewed for context (not modified)

### Key gotcha for future

`Tenant or user not found` from Supabase pooler does NOT always mean wrong username format. If keyword args + correct suffix still fails, the user was created via SQL and is not registered in PgBouncer. Fix = port 5432, not PgBouncer config.

### IT firewall theory — ruled out

IT suggested corporate firewall blocking Supabase IPs. Ruled out: firewall block → timeout/refused, not a FATAL response. Getting FATAL = reaching the pooler = network is fine.

---

## Session 27 — 2026-04-22: Electricity Billing Research + Medidor Portal UX

### What we did

Deep research session: analyzed Excel `Consumo Energia xlocales 2026.xlsx` (15 months, Jan 2025–Mar 2026), cross-referenced with DB, and designed the full electricity billing feature. No code shipped yet — research and design only.

Also shipped several medidor portal UX improvements (same session).

---

### Medidor portal UX shipped

**Digit input redesign** (`src/app/(portal)/portal/medidor/form.tsx`):
- Replaced single number input with 5 individual digit boxes + 1 red crossed-out box
- Red box = decimal digit on real meter — always changing, so crossed out, non-editable
- Auto-advance on type, backspace goes back, paste fills all 5
- Hidden input submits the 5 digits joined as whole number

**Live preview panel** (appears as digits are typed):
- Lectura anterior / Lectura este mes / Diferencia / Total estimado energía
- Total only shows once all 5 digits filled AND tarifa > 0
- `tarifaKwh` fetched from previous period's meter_readings row

**Submitted state redesign** (`src/app/(portal)/portal/medidor/page.tsx`):
- "Lectura anterior del mes" — now large, prominent (slate card)
- "Lectura enviada este mes" — same green card
- "Consumo del mes" — new blue card showing the difference in kWh

**Zero-padding display** — all meter readings in the portal now show as 5-digit zero-padded strings (`09057` not `9,057.8`). Helper `meterDisplay(value)` = `String(Math.floor(value)).padStart(5, "0")`.
- Applied ONLY to this medidor client view + electric bill context. Not in admin views.

**Bug fixes**:
- `prevRows` query now excludes current period (`AND periodo < '${periodo}'`) so lectura anterior doesn't accidentally return the current month's own reading
- `withinDeadline` temporarily hardcoded to `true` for testing — **must revert to `today <= 10` before go-live**

---

### Electricity billing — full research findings

#### How the current Excel works (source of truth)
File: `Consumo Energia xlocales 2026.xlsx` — 15 monthly sheets.

**The formula (Excel column F):**
```
Pago = MROUND( consumo_kWh × tarifa , 50 )
```

**Tarifa derivation:**
```
tarifa = Valor Factura (total COP) ÷ kWh Factura (utility's reported kWh)
```
This is computed ONCE per invoice per month. Same tarifa applied to all units on that invoice.

**Important:** Unit meter total ≠ utility invoice kWh (~43% discrepancy in Jan 2025). Different measurement periods (meters read 7th–7th, utility bills 19th–19th). This is expected and normal — the formula still works because tarifa is derived from the invoice, not from summing all unit meters.

#### The 6 invoices — confirmed unit mapping

| Address | Provider | Units |
|---------|----------|-------|
| Cra 27 10 65 (F2) | NUE | 101–126, 801–807 |
| Cra 27 10 71 (IMPARES) | ENEL | 201, 203, 205, 207, 209, 211, 213 |
| Cra 27 10 73 (PARES) | ENEL | 202, 204, 206, 208, 210, 212, 214 |
| Calle 11 27 33 (IMPARES) | NEU | 501, 503, 505, 507, 509, 511, 513, 515, 517, 519 |
| Calle 11 27 39 (PARES) | NEU REYMON | 502, 504, 506A, 506B, 508, 510, 512, 514, 516, 518, 520 |
| Cra 27 10 79 | ENEL | 301–416 |

506A and 506B confirmed as separate units in DB (`ENT5-506A`, `ENT5-506B`).
Units 808–821 (internal C-Krea departments) do NOT pay electricity — excluded from billing.

#### Monthly workflow (real process)
1. End of month: utility sends 6 invoices (one per address above)
2. Admin inputs for each invoice: `Valor Factura` (COP) + `kWh Factura`
3. Portal computes `tarifa = valor ÷ kwh`
4. Each unit's charge = `MROUND(consumo × tarifa, 50)` using its address group's tarifa
5. Client submits reading days 1–10 of following month

#### Historical data status
- All data in `meter_readings` up to March 2026 was imported from ERP/Excel — `submitted_by = null`
- `tarifa_kwh` column is unreliable for historical data (0 for most units, import errors for some like 108–109 showing 3664.43)
- `total_energia` column IS correct (imported pre-calculated from Excel)
- Treat all pre-portal data as legacy — don't try to recalculate from tarifa_kwh

---

### Proposed DB design (not yet built — pending approval)

**1. Tag units with their address group (one-time):**
```sql
ALTER TABLE units ADD COLUMN electricity_group text;
-- values: 'CRA2710065', 'CRA2710071', 'CRA2710073',
--         'CLL112733', 'CLL112739', 'CRA2710079'
```

**2. New table `electricity_invoices`:**
```sql
CREATE TABLE electricity_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  periodo text NOT NULL,           -- '2026-04'
  electricity_group text NOT NULL, -- which of the 6 addresses
  direccion text NOT NULL,         -- human label
  proveedor text NOT NULL,         -- NUE, ENEL, NEU, NEU REYMON
  fecha_factura date,
  valor_factura numeric NOT NULL,
  kwh_factura numeric NOT NULL,
  tarifa_kwh numeric GENERATED ALWAYS AS (valor_factura / kwh_factura) STORED,
  created_at timestamptz DEFAULT now()
);
```

**Charge calculation per unit per month:**
```
unit_total_energia = MROUND(unit_kwh × invoice.tarifa_kwh, 50)
```

### Open decisions before building
- Admin screen: one page with 6 invoice rows per month, or separate form per invoice?
- Does the charge get written back to `meter_readings.total_energia` once admin enters invoice, or computed on the fly?
- Decimal cleanup in DB: 1,142 rows with decimal lecturas need to be floored — awaiting green light

---

## Session 26 — 2026-04-21: Recaudo Data Pipeline Audit

### What we did

Deep audit of why payment numbers differ between the portal and Power BI. Traced every filter from the original Excel setup through the live ERP sync. Full findings in `docs/recaudo-cartera-audit.md`.

### Key findings

1. **Excel data was pre-cleaned by the accounting team** — it already had credit notes, reversals, and noise removed before we received it. Our queries worked because the data was already clean, not because the queries were robust.

2. **001-RK duplication exists in BOTH Excel and ERP** — this was confirmed by a live test (a $301,000 payment appears twice in both). So the duplication is consistent and expected, not a problem introduced by the ERP sync.

3. **`siesa_clasificacion` is completely unreliable** — proved three ways:
   - Filtering to RECAUDADO + VENCIDO gives a negative all-time total (-$4.6B)
   - NO PROYECTADO alone totals $12.6B all-time (impossible for real rent)
   - Live test (MATICES COMUNICACION VISUAL SAS, NIT 900547519): the same payment gets RECAUDADO on the `001-RK` row and NO PROYECTADO on the `RK` row. Same money, same date, different classification. Never use this field as a filter.

4. **`siesa_cruce` is the reliable filter** — FVS = real invoice payment. NVS = credit note. RK = reversal. Only FVS rows represent genuine rent collection.

5. **One Siesa data entry error confirmed** — FUSION GRAFIK SAS (NIT 900984500), RK-485 + 001-RK-485, cruce FVS-45643, $4,215,750,000 each. Handled by a value threshold filter, not deletion.

### The 4 correct filters (apply in this order)

| Order | Filter | What it removes |
|-------|--------|-----------------|
| 1st | Zona = C-KREA | Other companies (applied at sync time via NIT matching) |
| 2nd | `siesa_cruce LIKE 'FVS-%'` | Credit notes, reversals, cancellations |
| 3rd | 001-RK dedup | Bookkeeping duplicate rows |
| 4th | `valor_final < 1,000,000,000` | Siesa data entry errors |

### Results with correct filters — March 2026

| Portal (4 filters) | Power BI | Gap |
|--------------------|----------|-----|
| $242,322,859 | $236,800,000 | $5.5M (2.3%) |

Gap is small and unexplained. Previous gap before this audit was much larger (portal showed wrong numbers in both directions depending on which broken filter was applied).

### What changed in the codebase

Applied all 4 filters to `src/lib/data/pagos.ts` — all three functions updated:

**`getPagosKPIs`** — added `siesa_cruce LIKE 'FVS-%'` and `valor_final < 1000000000` to the `deduped` CTE. The 001-RK dedup was already there. Removed the old `siesa_clasificacion` filter.

**`getPagosBuckets`** — same two filters added to its `deduped` CTE.

**`getPagos`** — same three filters added. Also fixed a pre-existing bug: `LEFT JOIN contracts ON tenant_id` was duplicating rows for the 12 multi-unit tenants. Replaced with a correlated subquery for `unit_number` (same pattern used in `getPagosBuckets`).

**Verified in DB before and after**: March 2026 KPI = $242,322,859. Bucket totals (temprano $113.4M + tardio $99.6M + mora $29.3M) = $242.3M exactly. KPI and buckets are now consistent.

### Open questions

- Why does the row count jump from ~50 to 128+ per month starting May 2025? Possible Siesa config change.
- What explains the remaining $5.5M gap vs Power BI for March 2026?

---

## Session 25 — 2026-04-21: PP Histórico + Pagos Month Filter (v2.7.0)

### What shipped

- **Pagos month filter**: URL-based `?month=YYYY-MM` param. KPI cards + table both filter to selected month. Dropdown shows last 12 months. Defaults to current month. "Mes anterior" KPI compares to the month before the selected one.
- **Sidebar reorder**: Resumen → Proyecciones → Mora → Pagos → Gastos → Medidores → Locales → Usuarios
- **PP histórico feature** (biggest change):
  - DB: `pp_historico_pct NUMERIC(5,2)` + `pp_historico_pagos INTEGER` added to `tenants` table
  - Backfilled per-tenant historical PP usage rate from all payments (tenants with ≥10 payments get real rate; <10 get 17.99% global fallback)
  - All projection queries updated to apply expected PP per-tenant, per-row
  - Phase discount exclusion enforced: `CASE WHEN p.descuento_proyectado > 0 THEN 0 ELSE pp_pct × pp_historico_pct END`
  - Dashboard `getProyectadoVsReal` + `getPortfolioStats` updated to use expected projection
  - Proyecciones UI: new "Recaudo esperado" KPI card, formula explainer updated, chart uses `proyectadoEsperado`, detail table has "PP hist." column with green/amber/grey badges

### Key decisions

- **Expected vs conservative**: switched from conservative (PP=0) to expected (PP × historical rate). Conservative was making cumplimiento always look low. Expected is more realistic for day-to-day tracking.
- **Per-tenant, never global**: each tenant's historical rate is applied individually. Global average (17.99%) only used as temporary fallback for thin-history tenants (<10 payments).
- **Phase discount exclusivity bug fixed**: original implementation wrongly applied `c.pronto_pago_pct` to ALL 12 months including those with active phase discounts. Fix: per-row CASE WHEN check on `p.descuento_proyectado > 0`.
- **No stored data changed**: `projections` table unchanged. Expected PP computed on the fly in query layer. Means rates auto-refresh as payment history grows.
- **PP hist. badge**: grey = fallback (<10 payments), amber = low-moderate usage, green = ≥30% usage rate.

### Monthly impact (conservative → expected)

- Jan–May: −$2.1–2.8M/month (many phase discounts still active → PP blocked for those months)
- Jun–Dec: −$6.0–6.6M/month (phase discounts expire → more contracts PP-eligible)
- Annual total: ~$3,113M → ~$3,079M expected

### Data facts confirmed

- 66 tenants updated with PP rates
- Highest PP usage: IN DESIGN 55%, MI MUG 53%, TICETTE STILE 50%
- Lowest: BECERRA 0% (140 payments, never once), FUSION GRAFIK 1%, IMPROEXPRESS 2%
- IMAGENN (biggest tenant): 6% — minimal impact on projection

---

## Session 23 — 2026-04-20: Meter Validation Upgrade (v2.6.0)

### What shipped
- **Hybrid validation**: seasonal same-month avg (primary) → full-history avg (fallback) → auto-approve (no history)
- **Three tiers**: `aprobado` ±20%, `revision` ±40%, `critico` >40% or kwh=0
- **Admin badge**: `🚨 Crítico` added to ValidationBadge (was falling through to grey "Pendiente")
- **DB constraint**: updated `meter_readings_validation_status_check` to allow `critico`
- **Column rename**: "vs Prom.3m" → "vs Histórico" (reflects actual logic)
- **Step fix**: meter input `step="0.01"` — was `step="1"` which blocked decimal min values

### DB review findings (all 82 units)
- 57 units: valid April 2025 data → seasonal avg used
- 14 units: no valid April (vacant or started after Apr 2025) → full-history avg
- 2 units (506A/506B): zero history → auto-approve
- 8 units had April 2025 = 0 kWh (vacant that month) → fixed: now fall back to full-history avg instead of auto-approving everything
- Notable large seasonal vs full-hist gaps: 516 (april=109 vs hist=385), 508 (221 vs 342), 121 (54 vs 162) — seasonal is correct here, those tenants genuinely changed usage

### Key decisions
- Option B (seasonal) chosen over Option C (statistical) — 15 months of data not enough for reliable σ
- Fallback uses ALL available history, not just last 3 months — more robust for newer units with 2–10 months of data
- Zero April kWh treated as "no valid seasonal reference" — falls through to full-history (prevents auto-approving everything for formerly-vacant units)

### Manual tests run
- ✅ Aprobado: 100.2 kWh (+8% vs April ref 92.8) → aprobado
- ✅ Revision: 125.2 kWh (+35%) → revision
- ✅ Critico: 159.2 kWh (+71%) → critico (after fixing DB constraint)
- DB constraint fix: was missing `critico` → upsert failed silently with "Error al guardar"

### Pending
- CKR-19: revert `withinDeadline = true` → `today <= 10` after demo (2026-04-20)

---

## Session 22 — 2026-04-20: Google Drive Photo Upload + Meter Auto-Validation (v2.5.0)

### What shipped
- **Google Drive integration**: tenant photos upload to `Medidores C-Krea / Local {N} / YYYY-MM.pdf` via OAuth2 refresh token (not service account — personal Gmail has no SA storage quota)
- **PDF conversion**: all images (JPG/PNG) auto-converted to PDF via `pdf-lib` before upload. Fallback: upload raw if format unsupported (WebP, HEIC)
- **Drag-and-drop**: drop zone highlights blue on hover, accepts JPG/PNG/PDF. Base64 via FileReader → hidden input (DataTransfer→input.files unreliable in React server actions)
- **Auto-validation**: already existed — ±10% vs promedio_3m → `aprobado`/`revision`
- **DB**: added `foto_drive_id` column to `meter_readings`
- **Inline preview**: after submit → `router.refresh()` → locked state shows embedded Google Drive iframe (360px). Works for PDFs and images.
- **Admin table**: "Foto" column with "Ver" Drive link
- **Demo fix**: deadline bypassed (`withinDeadline = true`) — CKR-19 tracks revert

### Key decisions
- **OAuth2 refresh token > service account** for personal Gmail Drive. SA has no storage quota on personal folders. Shared Drives require workspace. OAuth2 with refresh token uploads as the real user.
- **Base64 hidden input** is the only reliable way to pass files through React server actions with drag-and-drop. `DataTransfer→input.files` works for click-to-select but not guaranteed for programmatic sets in server action forms.
- **iframe with `/preview` URL** renders Drive files inline — no CORS issues, works for PDF + images.
- **`router.refresh()` in useEffect** after `state.success` triggers server component re-render — picks up fresh DB data including `foto_drive_id` for the iframe.

### Gotchas
- `revalidatePath` causes server component remount → wipes React state (blob URLs, base64). Never rely on local state for post-submit display — use server state or action return values.
- `Readable.from(Buffer)` unreliable in Vercel serverless for googleapis media upload — use `new Readable(); stream.push(buf); stream.push(null)` instead.
- Google Drive OAuth consent screen must be "Published" (not Testing) to authorize with secondary Gmail accounts without adding test users.

### Pending next session
- **Meter validation equation upgrade**: current is ±10% vs promedio_3m (last 3 months). Decision pending on Option B (seasonal reference: same month prior years + 3m trend) vs Option C (statistical: mean ± 2σ). 15 months of data available (Jan 2025 → Mar 2026). German to provide context on which approach fits.

---

## Session 21 — 2026-04-19: Full Admin Mobile Pass (v2.4.0)

### What shipped
- **Route rename**: `/clientes` → `/locales` everywhere (nav, links, actions, revalidatePaths)
- **Proyecciones**: KPI text-sm mobile, formula hidden, chart overflow-x-auto minWidth:540, DetalleTable meta.className column hiding
- **Mora**: KPI cards smaller, MoraTable progressive hiding (Facturas sm, Saldo total md)
- **Pagos**: hide Fecha + Concepto on mobile
- **Gastos**: KPI smaller, GastosChart explicit height fix (same Recharts flex chain bug as dashboard), GastosTable meta.className via TanStack module augmentation
- **Locales**: tabs overflow-x-auto + shrink-0, table meta.className, text-xs throughout
- **Locales detail**: KpiCard truncate, Pagos 3-col, CarteraTable meta.className
- **Medidores**: grid-cols-2 KPIs, controls flex-wrap, table hide pattern
- **Usuarios**: stats grid-cols-2, tab bar flex-1, tables text-xs, edit-tenant modal stacks (grid-cols-1 lg:grid-cols-2) + max-h-[90vh] scroll, all inputs/buttons text-xs
- **Facturas**: table text-xs, 4-col mobile progressive hiding

### Key decisions / patterns established
- **Recharts always needs explicit px height** — `height="100%"` inside flex chain = 0. Use `style={{ height: Npx }}` on wrapper div. Now applied consistently: dashboard, proyecciones chart (overflow-x-auto wrapper), gastos pie.
- **TanStack column hiding via meta.className** — add `declare module "@tanstack/react-table" { interface ColumnMeta<TData, TValue> { className?: string } }` then apply `meta.className` in both th and td. Used in: GastosTable, ClientesTable, CarteraTable.
- **Custom table hiding** — add `hide?: string` field to COLS array, apply in th/td map. Used in: MoraTable, MedidoresAdminTable, DetalleTable.
- **Mobile text sizing pattern**: `text-sm sm:text-xl` for KPI values in 2-col grids, `text-xs` for tables/tabs, `truncate` on COP values to prevent overflow.

---

## Session 20 — 2026-04-19: Mobile, Portal P2, Tenant Accounts (v2.3.0)

### What shipped
- **WOR-56**: `createTenantAccount` server action + "Crear cuenta" button in Usuarios/Inquilinos tab. Flow: sales enters email → click button → auth account created (`email_confirm: true`, no password) → tenant uses forgot-password to set their own.
- **WOR-58**: Portal Total a Pagar now computes `canon × (1−descuento%) × 1.19 + electricidad`. "Ver detalle" modal with full line-item breakdown (canon, descuento, IVA, electricidad, PP footnote). Button moved to card top-right. Gray text simplified to "Arrendamiento + electricidad".
- **WOR-59**: Admin medidores year+month selector (2025/2026). All 1,180 readings accessible. Previously only Jan–Apr 2026 were reachable.
- **Mobile pass 1** (portal + admin layout): hamburger nav + slide-out drawer, sidebar hidden on mobile, `ml-0 lg:ml-[220px]`, responsive padding, all major grids fixed (`grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), gastos 70/30 stacks on mobile, mora aging buckets stack, portal pagos table hides columns on mobile, perfil grid stacks.
- **Mobile pass 2** (dashboard): RecaudoCard table hides PP/Recaudo cols on mobile, Desglose de Mora items get `py-4` on mobile, RendimientoChart switched to horizontal bars (`layout="vertical"`) — solves thin-bar problem on mobile, explicit `height: 380` for Recharts reliability.

### Key decisions
- **WOR-60 deferred**: "Ver detalle" modal already covers tenant charge breakdown. Invoices only useful once admin billing workflow is automated.
- **WOR-57 deferred**: Sales team handles tenant onboarding in person — no magic link flow needed. Tenants use forgot-password.
- **Recharts `height="100%"` unreliable in flex chains**: Always give ResponsiveContainer a numeric pixel parent (`style={{ height: 380 }}`). `absolute inset-0` trick also unreliable — Recharts uses ResizeObserver which needs a real DOM height at mount time.
- **Horizontal bars for mobile chart**: Switching `layout="vertical"` in Recharts solves thin-bar problem without hiding data or adding popup complexity. Tabla tab already provides full detail.

### Mobile review status (admin sidebar order)
- ✅ Dashboard — done (grids, desglose, chart)
- ⬜ Locales — next
- ⬜ Mora
- ⬜ Pagos (admin)
- ⬜ Gastos — layout fixed, table columns may still need review
- ⬜ Proyecciones
- ⬜ Facturas
- ⬜ Medidores
- ⬜ Usuarios

---

## Session 19 — 2026-04-19: Usuarios Admin + Mobile Portal (v2.2.0)

### What happened

**Mobile portal fixes:**
- Portal layout: `px-4 sm:px-6`, name hidden on mobile, `py-6 sm:py-8`
- Dashboard grid: `grid-cols-1 sm:grid-cols-3`, banner stacks vertically, Concepto col `hidden sm:table-cell`
- Medidor page + form: both `grid-cols-2` → `grid-cols-1 md:grid-cols-2`

**Usuarios page full rebuild:**
- Two-tab layout: Inquilinos del Portal + Administración
- Stats strip: total tenants / email configured / cuenta activa / activos últimos 30d
- `getPortalTenants()`: switched from `MIN()` per-unit to `JSON_AGG(JSON_BUILD_OBJECT(...) ORDER BY u.unit_number)` — gets all contracts for multi-unit tenants. Reads `auth.admin.listUsers()` for real portal emails + lastSignIn. Auto-backfills `portal_email` on each page load to heal drift (units 101/118 had auth accounts but null `portal_email` in DB).
- `EditTenantModal`: two-card layout matching perfil page. Left: contact info (NIT, razón social, nombre corto, email contacto, teléfono, email portal). Right: per-unit contract tabs (appears when `unitContracts.length > 1`) + contract fields. Amber confirmation dialog before save.
- `EditAdminModal`: name/email/role. Same amber confirmation pattern.
- `updateTenantUser` server action: updates tenants + auth sync + unit (single only) + per-contract fields.
- Auth sync pattern enforced everywhere: any email write → also `auth.admin.updateUserById()`.
- Representante field removed (Siesa ERP artifact).
- $ and % symbols removed from number inputs (NumInput is plain input, no affixes).
- Usuarios added to NAV_ITEMS in `src/lib/constants.ts` — was missing entirely.

### Key decisions
- `JSON_AGG` over `MIN()` for contracts — `MIN()` silently discards all but one contract's data for multi-unit tenants. Non-obvious bug, easy to miss.
- `Promise.resolve(supabaseBuilder)` for backfill array — `PostgrestFilterBuilder` is `PromiseLike` not `Promise`, so `Promise<unknown>[]` type fails unless wrapped.
- Two-step amber confirm modal on all destructive edits — consistent UX pattern now used in both admin and tenant modals.
- No inline email editor in table — removed EmailEditor from row, all editing goes through modal now.

### Errors caught before deploy
1. `const` declarations inside `return {}` block — JS syntax error, not valid object literal. Moved declarations above return.
2. `setRole(e.target.value)` — `string` not assignable to `"admin" | "finance" | "viewer" | "tenant"` union. Fixed with `as UsuarioRow["role"]` cast.
3. `PostgrestFilterBuilder` not assignable to `Promise<unknown>` — backfill push array type mismatch. Fixed with `Promise.resolve()` wrapper.

### Files changed
- `src/lib/constants.ts` — Usuarios nav item
- `src/lib/data/usuarios.ts` — UnitContract type, getPortalTenants() full rewrite, getUsuarios() lastSignIn
- `src/app/(app)/usuarios/actions.ts` — updatePortalEmail, updateTenantUser, updateAdminUser
- `src/app/(app)/usuarios/edit-admin-modal.tsx` (new)
- `src/app/(app)/usuarios/edit-tenant-modal.tsx` (new)
- `src/app/(app)/usuarios/tab-switcher.tsx` (new)
- `src/app/(app)/usuarios/page.tsx` — stats + TabSwitcher
- `src/app/(portal)/layout.tsx`, `portal/page.tsx`, `portal/medidor/page.tsx`, `portal/medidor/form.tsx` — mobile

---

## Session 17 — 2026-04-17: PP Reconciliation Model + Dashboard Tab Toggle (v2.1.0)

### What happened

**Pronto pago fix (projections):**
- Root cause found: `pronto_pago_proyectado` was pre-applied to all 899 projection rows, assuming 100% of clients would pay within 10 days. Wrong.
- PP is conditional — only granted when a client actually pays ≤ day 10 of the month.
- Fixed: zeroed all 899 rows in DB via Supabase MCP. Set `newPP = 0` in `actions.ts`. Removed PP from all SQL formulas in `proyecciones.ts`, `reportes.ts`, `dashboard.ts`.
- Impact: ~8M (Feb) and ~9M (Mar) gap between projected and recaudado is now correctly explained as PP actually granted to early payers — visible as dark emerald in the chart.

**PP reconciliation model (Option B chosen):**
- Projection stays immutable. PP tracked on payment records (`pronto_pago_aplicado` column).
- Reconciliation formula: Proyectado = Recaudo neto + PP otorgado + Pendiente.
- Dashboard chart now shows 3 stacked segments: emerald (cash received) / dark emerald (PP granted) / navy (truly unpaid).
- Saved as architectural decision in memory: `decision_pp_visualization.md`.

**Dashboard RecaudoCard:**
- Inline chart div replaced with `RecaudoCard` client component.
- Tab toggle (Gráfica / Tabla) in same h-[480px] fixed-height card — no scroll added.
- Table view: compact monthly breakdown (Mes | Proyectado | Recaudo neto | PP otorgado | Pendiente | %) with color badges (✓ emerald ≥100%, amber ≥80%, rose <80%, — future).
- Footer totals removed from card — already visible in KPI cards above.

**Gastos page redesign:**
- Month tabs (ENE/FEB/MAR/ABR) added, matching Medidores pattern. URL: `?periodo=2026-01`.
- Bar chart replaced with filled pie chart (8 categories). Legend + % below, COP on hover only.
- Layout: 70/30 split — table card left, pie card right. Sort icons removed. Date as MM/YY.

### Key decisions
- PP never deducted in projections or invoices. Only applied at actual payment time.
- RecaudoCard tab toggle preferred over scroll or separate page section — keeps dashboard compact.
- Reconciliation table removed from proyecciones page (wrong context — it's a dashboard view, not a projections view).
- Ficha cliente PP phase deferred — payment history table already shows PP per row. No new KPI card added yet.

### Files changed
- `src/lib/data/proyecciones.ts`, `reportes.ts`, `dashboard.ts`
- `src/app/(app)/proyecciones/actions.ts`, `proyecciones/page.tsx`
- `src/components/dashboard/rendimiento-chart.tsx`, `recaudo-card.tsx` (new)
- `src/app/(app)/page.tsx`
- `src/lib/data/gastos.ts`, `src/app/(app)/gastos/page.tsx`
- `src/components/gastos/gastos-chart.tsx`, `gastos-table.tsx`

---

## Session 16 — 2026-04-16: Mora + Locales UX Overhaul (v2.0.0)

### What happened

**Cartera Jurídica:**
- Added `tenants.juridica boolean` column. Tenants flagged `juridica=true` excluded from all mora KPIs and appear in separate "Cartera Jurídica" table below mora table.
- Magda Pedraza (unit 503) flagged. PUNTO ACRILICO created manually with $4.818.675 balance, NIT='PENDIENTE'. WOR-46 in Linear to fill missing data.
- Why: legal cases distort operational mora KPIs.

**Locales tab (renamed from Clientes):**
- One row per client (not per unit). Unit badges as chips. Canon = sum of active contracts.
- Inactivos tab: shows vacant units (no active contract) via `getVacantUnitRows()`. Non-clickable "Vacante" rows.
- Default sort: Al Día → canon desc, Mora/Críticos/Todos → saldo pendiente desc.
- Tab filter in URL (`?tab=en_mora`) — browser back preserves filter.

**BackButton:** `router.back()` replaces hardcoded `/clientes` href. Always returns to correct previous URL.

**Multi-unit contract fix:** `getTenantDetail(unitNumber?)` now filters by unit. Mora + Locales links pass `?unit=XXX`.

**Cartera per-business confirmed:** Siesa invoices the business not the unit. Detail page shows all cartera at tenant level — correct behavior.

### Key decisions
- `juridica` flag is tenant-level (not contract-level)
- Inactivos = vacant units (operational question: which spaces are free?), not inactive tenant history
- Cartera stays tenant-level — don't attempt per-unit split

### Files changed
- `src/lib/data/mora.ts`, `dashboard.ts`, `clientes.ts`, `tenant-detail.ts`
- `src/components/mora/mora-table.tsx`, `clientes/clientes-table.tsx`
- `src/components/shared/back-button.tsx` (new)
- `src/app/(app)/mora/page.tsx`, `clientes/[id]/page.tsx`

---

## Session 15 — 2026-04-16: Gastos import, dashboard polish, medidores OCR prototype

### What happened

**Dashboard:** Removed "Saldo Pendiente" KPI (4→3). Renamed "Desglose de Cartera" → "Desglose de Mora" with meaningful buckets: Mora Crítica (>60d), Mora Activa (31-60d), Intereses, Promedio Días. SQL computes both buckets in a single CASE query — no extra round trip.

**Mora table dup key:** React warning "Encountered two children with the same key" — root cause: tenants with multiple units each appeared once per unit, all sharing the same `tenantId` as React key. Fixed with composite `tenantId-unitNumber`.

**Gastos import from ERP:**
- Jan 2026 ($69.8M): from C-KREA GB.xlsx "4. GASTOS" sheet — 15 line items
- Feb/Mar/Apr 2026 ($142.2M): from ckrea.xlsx "Estado de resultados" sheet — Siesa journal entries grouped by account family → mapped to 11 gasto_types
- Total: 40 rows, $212M. Power BI shows $214.18M — $2.2M gap = April still in progress
- Reconciliation confirmed: Jan ERP total = Jan manual sheet total = $69.8M ✓
- Account code family mapping: 5205x→nómina, 52352501→acueducto, 52353001→energía, 52350506→vigilancia, 52501501→reparaciones, etc.

**Gastos page redesign:**
- KPIs: Total YTD / Promedio mensual / Último mes / Total registros (replaced asignado/pendiente — never used)
- Stacked Recharts bar chart: month on X, 8 category colors stacked. Custom tooltip shows all categories + total.
- Key learning: `is_allocated` flag was designed for cost allocation to units — but ALL gastos are building-level operating costs (only electricity allocated per unit via medidores). Flag is irrelevant; removed from UI.

**WOR-47 Medidores OCR — feature design + prototype:**

Business logic confirmed:
- All 84 units have electricity meters (updated in DB)
- Validation: compare new reading vs AVG of last 3 months ±10% → auto-approve or flag
- No photo by day 10 → charge promedio_3m × 1.5 (incentive to submit)
- Channel: same portal, tenant login (Supabase Auth role), ruta (tenant)/
- Storage: Google Drive API + Cloud Vision OCR (needs GCP service account from IT)

Admin prototype built (Phase 1):
- Period tabs (Ene/Feb/Mar/Abr)
- KPI strip: Total / Registradas / Sin lectura / Total kWh
- Table: 84 units with sort, filter, desviación% vs promedio 3m, status badges
- Blue banner showing WOR-47 params for awareness

### Decisions made
- Gastos are NOT allocated to individual units (only electricity is, via medidores)
- Medidores OCR feature: Linear WOR-47, spec at docs/features/WOR-47-medidores-ocr.md
- ±10% tolerance, 1.5× factor high, 10-day deadline — all confirmed

### Pending (next session)
- WOR-47 Phase 2: schema update + auto-validation logic
- WOR-47 Phase 3/4: OCR + tenant portal (needs GCP account from IT first)
- CKR-13: SOLORZANO payment + NEOGRAFICK tenant still open
- Interest rate confirm: 2%/month in DB vs 1.5%/month in spec

---

## 2026-04-16 — Vercel DB Fix (IPv6 root cause) + Demo Prep

### Problem
Site showed "application error: client-side exception" on every page after login. Spent several attempts debugging connection strings before finding the real root cause.

### Root cause (confirmed via exhaustive testing)
Supabase DB host `db.bosylehvmtwtqkrlievy.supabase.co` resolves to **IPv6 only** (`2600:1f18:2e13:9d5a:...`). Vercel Lambda is **IPv4 only** — physically no TCP path exists. All 4 pooler variants also failed (shared pooler `aws-0-us-east-1` returned "Tenant or user not found" even locally, meaning this project isn't registered in the shared pool).

Key diagnostic command that revealed it: `node -e "const dns=require('dns').promises; dns.lookup('db.bosylehvmtwtqkrlievy.supabase.co').then(r=>console.log(r.address))"` → showed IPv6 address.

### Fix
Created `exec_sql(q text) returns jsonb` Postgres function (service_role only, SECURITY DEFINER). Created `src/lib/db/executor.ts` that calls this via Supabase JS admin client over HTTPS (`bosylehvmtwtqkrlievy.supabase.co` = Cloudflare IPv4). Migrated all 29 files.

### Lessons
- Always check if the DB host resolves to IPv4 or IPv6 before assuming pooler issues
- `echo "..." | vercel env add` appends `\n` — always use `printf`. Bit us twice this session.
- Supabase free tier projects may not be registered in shared Supavisor pooler — don't assume pooler works
- The `exec_sql` RPC pattern is the correct long-term approach for this Supabase project on Vercel

### Also added this session
- `loading.tsx` + `error.tsx` at `(app)/` layout level — covers all 11 pages with spinner + graceful error boundary

## 2026-04-16 — Mora Polish, Cartera Import, Grace Period, Auth Fix

### What happened

**Cartera was empty after payments import:** `import_data.py` wipes cartera in its truncation order. Re-imported 118 rows from ckrea.xlsx Cartera sheet. 3 skipped: PUNTO ACRILICO (not in tenants), NEOGRAFICK (CKR-13). Fixed NaN `valor_vencido` on not-yet-due rows (Excel blank cells → Python `float('nan')` → Postgres NaN). Fixed negative `dias_mora` rows.

**Mora page polished:**
- Table: clickable rows → client detail, unit badge, separate Vencido + Saldo columns
- Bucket cards: switched to saldo pendiente (interest = $0 since cron hasn't run)
- Clientes `[id]` payment history: Recibo (RK-XXXX) + Factura (FVS-XXXXX) columns, clasificacion badge, totals footer, limit 50

**Root cause of $156M vs Power BI $60-75M:**
- Siesa Cartera export marks everything past due date as VrVencido immediately (0-day grace)
- April 2026 invoices (due Apr 11, 5 days overdue) = $84.8M, driving up the total
- With 30-day grace filter applied: $67.6M / 11 clients → matches Power BI exactly
- Key learning: always check what "grace period" the reference system uses before comparing totals

**Grace period implementation:**
- `grace_period_days = 30` set in `financial_rules` table
- `getGracePeriod()` shared utility in `configuracion.ts` — imported by dashboard, mora, reportes
- All mora KPIs now consistent and runtime-configurable from Configuración page
- No deploy needed to change threshold

**IMAGENN concentration flag (CKR-15):**
- After grace filter, IMAGENN = $29.8M of $67.6M total (44%). 3 invoices, max 63 days.
- Not a data bug — they genuinely have 4+1 units at ~$13M/invoice. Needs payment plan check.

**Vercel issues found and fixed:**
1. `CRON_SECRET` had trailing space → cron handler auth check failed → builds errored (5s builds)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Production was `"\n"` (blank newline) → all logins silently returned "credentials incorrect" for every user
3. Both fixed, redeployed. Pattern: env var corruption is hard to debug because the generic error message hides the real cause. Always `vercel env pull` to verify actual values when auth mysteriously breaks.

**New user created:**
- `operaciones@reymon.com.co`, role `finance`, email confirmed
- Trigger `handle_new_user` uses `user_role` enum — passing "finanzas" fails silently with 500. Correct value is "finance".

**Vercel-specific gotcha added to memory:**
- `NEXT_PUBLIC_*` vars bake into the build at compile time. If the value was wrong at build time, changing it in Vercel requires a redeploy (empty commit) to take effect.

---

## 2026-04-16 — Payments Import Session

### What happened

**Analyzed ckrea.xlsx (Siesa/CSI export) — 5 sheets:**
- `Recaudo` = payments history (3,134 rows, 2,696 ARRENDAMIENTOS = C-Krea rental payments, Jan 2024 → Apr 2026)
- `Cartera` = outstanding balances (already in DB)
- `Ocupacion` = tenant/contract data (already imported)
- `Documentos` = Siesa invoice list (used for Siesa CSV export format)
- `Estado de resultados` = P&L journal entries (not rental payments)

**Workflow decision recorded:**
- Siesa is source of truth: creates invoices (FVS-XXXXX) + receipts (RK-XXXXX)
- Portal = management/analytics layer reading from Siesa exports
- Long-term: direct API key to CSI for push-back
- IT questions saved to memory: `it_questions_siesa.md` (API format, sync frequency, RK numbering, etc.)

**Tenant NIT fix:**
- All tenants were imported with fake `IMPORT-XXX` NITs — real NITs not captured in original import
- 62 tenants updated with real NITs via name-matching from Ocupacion + Recaudo sheets
- 3 skipped pending confirmation (units 120, 121, 209) → CKR-13 created
- Units 209 (PROHERCOL=901148181), 120 (GUZMAN=1023891322), 121 (SONIA=1013660654) confirmed same session and updated
- 65 total tenants: 65 now have real NITs (100%)
- NEOGRAFICK (new unit 121 tenant) + BECERRA as unit 120 current occupant: NITs still needed for tenant records, not payments

**Payments import:**
- 2,695 / 2,696 ARRENDAMIENTOS payments imported into `payments` table
- Only SOLORZANO RAMIREZ KELLY ALEXANDRA (NIT 53154279, 1 payment 2026-03-02, $3,225,000) skipped — not in tenant DB
- Cross-validated: PP total exact match ($218,993,654), net total diff = exactly her 1 payment ($3,225,000)
- Siesa fields stored: `siesa_docto` (RK-XXXX), `siesa_cruce` (FVS/NVS reference), `siesa_clasificacion`
- CKR-13 updated with final status

**Design note — historical payments vs reconciliation:**
- Imported payments are read-only history from Siesa. NOT run through `reconcilePayment`.
- Cartera table already has correct saldos from Siesa snapshot — no re-reconciliation needed.
- New payments entered via portal form going forward use reconciliation engine normally.

### Decisions
- Import ARRENDAMIENTOS only — skip NACIONALES REYMON (other company), SERV.PUB, INTERESES MORA
- NVS (credit notes, negative valorFinal) imported as-is — needed for audit trail
- Historical payments: display-only, not reconciled against portal cartera

### Next session
- Polish mora page with real payment data
- Polish clientes/[id] page with payment history

---

## 2026-04-16 — Financial Rules Corrections + Mora Redesign Session

### What happened

**PP mutual exclusivity rule (Rule A correction)**
- New rule confirmed: PP (pronto pago 10%) only applies in months where NO phase discount is active. Clients with 10/20/30/43% phase discount get PP = 0 during those months; PP kicks in only after phase expires.
- `invoice-engine.ts`: one-line fix — `prontoPagoRef = descuentoFase > 0 ? 0 : roundCOP(netCanon * prontoPagoPct / 100)`
- `financial-rules-engine-spec.md §2.4`: added point 4 documenting the mutual exclusivity rule

**DB projection data fix**
- 199 rows in `projections` had `pronto_pago_proyectado > 0` AND `descuento_proyectado > 0` simultaneously — wrong per new rule
- Total bad PP zeroed: ~$48M COP
- SQL: `UPDATE projections SET pronto_pago_proyectado = 0 WHERE descuento_proyectado > 0 AND pronto_pago_proyectado > 0`
- Verified 0 remaining wrong rows after update

**Proyecciones table — PP% column fixed + sortable**
- `getProyeccionDetalle` query: `PP%` now computed as `CASE WHEN MAX(descuento_proyectado) > 0 THEN 0 ELSE pronto_pago_pct END` — clients with any phase discount in 2026 show `—`, not 10%
- Extracted table to `src/components/proyecciones/detalle-table.tsx` (client component) with click-to-sort on all columns. Active column shows ↑/↓ indicator. No extra icons added.

**Unit 505 (Tatiana Contreras) — annual lump sum**
- Confirmed: paid full year upfront as single payment, 43% discount on annual total
- DB NOT touched — monthly projections still show 20% (wrong) but left intentionally pending investigation
- `financial-rules-engine-spec.md §9.8`: updated with confirmed treatment + pending note
- Linear CKR-12 created: "Unit 505 (Tatiana Contreras) — annual lump sum billing not modeled"

**Discount distribution verified against DB**
- 30% contracts: 7 in DB but only 2 still active past April (211 ends May, 805 ends June). Projections already encode correct expiry months.
- 20% contracts: 25 in DB → 24 effectively (505 should be 43%, left as-is pending CKR-12)
- 10% contracts: 11 in DB, all end June. Matches user data.

**Mora page — full redesign**
- Removed `AccrualForm` ("Calcular Intereses de Mora" / "Ejecutar Acumulación") — cron handles daily accrual automatically
- Kept 4 top KPIs: Cartera Vencida | Clientes | Prom. Días | Interés Acum.
- Added 3 aging-bucket KPI cards (new row below):
  - 0–30 días (amber left border + pill badge)
  - 31–60 días (orange left border + pill badge)
  - 61+ días (rose left border + pill badge)
  - Each shows: interest accumulated as big KPI + `X clientes` inline label. No full colored background — white cards with left border accent only.
- Simplified table: replaced TanStack/multi-column table with clean 4-column view: Arrendatario | Días en mora (colored badge) | Meses pendientes | Total
- `getMoraRows()` query: added `COUNT(c.id) AS meses_pendientes`
- Table headers always visible even when empty (empty state inside tbody)
- Click-to-sort on all 4 columns

### Gotchas
- `projections.pronto_pago_proyectado` was seeded with PP values even for phase-discount months — always zero out this column when phase discount is active
- `c.pronto_pago_pct` (contract rate) ≠ effective PP for the year — must compute from projections data for correct display
- Unit 505: do NOT generate monthly invoices for her until CKR-12 is resolved

---

## 2026-04-16 — UI Polish + Dashboard Redesign Session

### What happened

**Proyecciones page — full redesign**
- Replaced year-coverage table with data-rich layout: 4 KPI breakdown cards (canon bruto, descuentos+PP, IVA, total neto c/IVA), formula explainer bar, monthly bar chart, per-contract detail table
- Monthly chart: Recharts direct (not Tremor) — dark navy bars, rounded tops, hover tooltip shows full monthly breakdown (canon bruto → descuentos → PP → base neta → IVA → total neto)
- Detail table: 78 rows, Local | Arrendatario | Desde (dd/mm/yy) | Meses transcurridos | Canon/mes | Dcto% | PP% | Neto anual c/IVA | Estado
- "Generar proyecciones" hidden as floating gear icon (fixed bottom-right) → modal overlay
- New data fns: `getProyeccionBreakdown`, `getProyeccionDetalle`, `getProyeccionMensual` (all with full breakdown columns)

**Dashboard redesign**
- Removed "Todos los Proyectos" and "Todos los Estados" filter dropdowns
- Replaced dual grouped bars with single stacked bar: emerald fills from bottom (recaudado), navy on top (remainder = proyectado − recaudado). Total bar height = proyectado always.
- Tooltip shows: Proyectado | Recaudado | Cumplimiento %
- Desglose de Cartera card: each item `flex-1` (equal 25% height), fluid font sizes via `clamp()` with vh units — scales with viewport, never breaks layout
- Layout: `max-w-[1440px]` centered, natural scroll restored (was briefly viewport-locked, reverted)

**Reportes deleted**
- `/reportes` page and `recaudo-chart.tsx` deleted — dashboard now shows the same proyectado vs recaudado chart
- `getProyectadoVsReal` from `reportes.ts` reused in dashboard (no duplication)

**Sidebar cleanup**
- "Dashboard" → "Resumen" (Spanish)
- Proyecciones moved to #2 slot (right below Resumen)
- Usuarios and Configuración hidden from nav (pages still exist at their URLs)

**Admin user**
- Password set for germanwarfare07@gmail.com: `Testadmin2025*` (via Supabase SQL crypt)

### Decisions made
- Recharts used directly (not Tremor) for all new charts — gives access to `radius`, `stackId`, `Cell`, custom tooltips without wrapper limitations
- Stacked bar chosen over grouped bars: saves horizontal space, visually intuitive (green "fills up" the navy projection)
- `clamp(min, Xvh, max)` for fluid typography inside fixed-height flex cards — pure CSS, no JS resize observers needed
- Reportes removed entirely rather than redirected — no value having a separate page with same data as dashboard

### Next session
- Review remaining routes live: /clientes, /clientes/[id], /mora, /gastos, /pagos, /facturas, /medidores
- Commit all session changes + push to Vercel
- Test CRON_SECRET endpoint
- Add Vercel domain to Supabase Auth redirect URLs
- Linear cleanup: WOR-43/44/45 (wrong workspace), CKR-1→4

---

## 2026-04-16 — Project Setup Session

### What happened
- Created project docs: PRD, Financial Rules Engine spec, UI/UX Guide, initial SQL schema, ERD
- Bootstrapped Next.js 16 + TypeScript + Tailwind v4 + App Router
- Initialized shadcn/ui
- Installed core deps: Drizzle ORM, Supabase client, TanStack Table v8, React Hook Form, Zod, Tremor, Lucide React
- Created project docs: CLAUDE.md, CHANGELOG.md, context.md, JOURNAL.md
- Configured .env.local with Supabase URL + keys

### Decisions made
- Project lives in `/Users/workspace/Ckrea-portal/` (uppercase folder, npm name `ckrea-portal`)
- Reference docs moved to `docs/` subfolder
- Using single dedicated email for all services (Supabase, Vercel, Sentry, PostHog, Linear)
- PostHog deferred to launch phase

---

## 2026-04-16 — Infrastructure Completion Session

### What happened
- Connected Supabase MCP to new C-Krea account (old MCP token pointed to wrong Supabase account with Paxco/Palma projects)
- Applied full 21-table schema to Supabase (`bosylehvmtwtqkrlievy`) via MCP migrations
- Applied RLS + helper functions (`public.user_company_id()`, `public.user_role()`, `public.user_tenant_id()`)
- Connected Linear to correct workspace (`ckrea-portal` / CKR prefix, not old WOR workspace)
- Sentry wired up via wizard
- `.npmrc` → `legacy-peer-deps=true` (needed for Tremor + Sentry with React 19)

### Gotchas / lessons learned
- **Supabase MCP auth schema blocked**: Can't create functions in `auth` schema via MCP migrations — "permission denied for schema auth". Workaround: helper functions go in `public` schema instead. Functionally identical.
- **Not all tables have `company_id`**: `contract_phases`, `invoice_line_items`, `payment_applications`, `interest_accruals`, `gasto_allocations` — these join to parent tables for company scoping. RLS policies for these use EXISTS subquery, not direct `company_id` check.
- **Drizzle config needs dotenv**: `drizzle.config.ts` must import `dotenv` and call `config({ path: '.env.local' })` — env vars not auto-loaded from .env.local by drizzle-kit.
- **Linear workspace confusion**: Linear CLI defaults to last authenticated workspace. Always use `--workspace ckrea-portal` flag or verify with `linear auth status` before creating issues.
- **Supabase MCP reconnect**: To switch accounts, go to supabase.com → account → Access Tokens → generate new token → update in Claude MCP settings. The MCP config lives in claude.ai OAuth, not in local settings.json.

### Decisions made
- RLS helper fns in `public` schema (not `auth`) — MCP restriction, not a design choice. Note in CLAUDE.md if this causes confusion later.
- Record-keeping workflow formalized: Linear (active work) / CHANGELOG (what shipped) / JOURNAL (why + learnings). Added to CLAUDE.md.

### Still pending
- Apply seed data (`docs/foundation/05_seed_validation/002_seed_data.sql`) — companies + initial data
- Clean up Linear: delete wrong WOR workspace issues (WOR-43, 44, 45), review CKR-1 through CKR-4 onboarding placeholders

---

## 2026-04-16 — Knowledge Graph & Workflow Setup

### What happened
- Added Knowledge Graph + Obsidian Wiki + Reusable Functions sections to CLAUDE.md
- Ran graphify on full project: 183 nodes, 213 edges, 38 communities
- Outputs: `graphify-out/graph.html` (interactive), `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`
- Established three-record workflow: Linear / CHANGELOG / JOURNAL — written into CLAUDE.md permanently

### Key graph findings
- God nodes: C-Krea PayControl Portal (25 edges), API Routes spec (15), Financial Rules spec (14)
- Financial Rules Engine is the most cross-cutting doc — bridges invoicing, payments, Siesa, and API communities simultaneously
- RLS policies connect all 3 user roles across separate doc files — good signal of consistency
- 65 weakly-connected nodes flagged (projection scripts, seed SQL snippets) — expected at this stage

### Decisions made
- Wiki path for this project: `~/ObsidianVault/ckrea-wiki/` (set in CLAUDE.md)
- Graphify to rebuild after any session touching >3 code files (per CLAUDE.md global rule)
- night-review deferred — not relevant until codebase has real components

### Gotchas
- graphify cache save fails if a node's source_file is a directory path ('public') instead of a file — minor bug in graphify, doesn't affect graph output
- RLS helper fns in `public` schema (not `auth`) — MCP restriction, not design choice

---

## 2026-04-16 — Seed Data Applied

### What happened
- Applied full seed data (`002_seed_data.sql`) to Supabase in chunks via MCP `execute_sql`
- Split into 9 sections due to 21K-line file size (no psql available, MCP has payload limits)
- Sections 1-4 (company, tenants, units, contracts) applied manually in main session
- Sections 5-9 (projections, cartera, financial rules, gasto types, gastos) applied via subagent

### Final counts
| Table | Count |
|-------|-------|
| companies | 1 (Central Kreativa) |
| tenants | 59 |
| units | 85 (84 occupied + 1 disponible) |
| contracts | 78 |
| projections | 1020 (85 units × 12 months) |
| cartera | 250 |
| financial_rules | 5 |
| gasto_types | 11 |
| gastos | 9 (Jan 2026 sample) |

### Gotchas
- **No psql on machine**: Had to split file into MCP chunks. For future large seeds, consider installing psql or using Supabase CLI `db push`.
- **Projections = 1020 not 1008**: Seed file covers 85 units (including unit 126 disponible with 0-value rows), not 84. Summary comment in SQL was wrong.
- **Seed is idempotent**: All INSERTs use ON CONFLICT DO NOTHING / DO UPDATE. Safe to re-run.

### Decisions made
- Applied seed as-is from generated file — no manual edits needed
- DB now has real production data (tenants, units, contracts, cartera snapshot from real xlsx)

---

## 2026-04-16 — UI Build Session (Part 1)

### What happened
- Built full layout: sidebar (dark slate-900, 220px, Spanish nav, active state via usePathname), page-header, root layout (Inter font, lang=es)
- Dashboard (`/`): 4 KPI cards + Desglose de Cartera + Tremor BarChart (2026 projections) — all real DB data
- Mora page (`/mora`): 3 KPI cards + TanStack Table (sortable by dias_mora, global search, severity badge)
- Clientes page (`/clientes`): full tenant list with tab filters (Todos/Activos/En Mora/Críticos/Inactivos), status dots, sortable columns
- Wired Drizzle to real DB; fixed DATABASE_URL pooler bug

### Gotchas / lessons learned
- **Supabase transaction pooler (port 6543) fails** with "Tenant or user not found" — not a password issue, Supavisor bug. Fix: use direct connection `db.[project].supabase.co:5432` with username `postgres` (not `postgres.[project_ref]`).
- **Session pooler (port 5432 on pooler host) also fails** — same bug. Direct host only.
- **Data rule established**: server components use `db` (Drizzle). Supabase client (`createClient`) reserved for auth + client-side realtime only.
- **Next.js 16 RSC payload**: `curl` on a server-component page won't find text strings in raw HTML — content is in JS script tags as RSC payload. Use Python regex on the payload JSON to verify.
- **Drizzle db client**: `max: 1` for Next.js server components (serverless — each request gets its own connection).

### Decisions made
- DATABASE_URL = `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` going forward
- Supabase admin client approach (service role key) scrapped — Drizzle handles all server queries
- Status derivation (al_dia/en_mora/critico/inactivo) done in data layer (`deriveStatus`), not in components

### Still pending
- `/clientes/[id]` — tenant detail page
- `/reportes`, `/usuarios`

---

## 2026-04-16 — UI Part 2 Session

### What happened
- Built `/clientes/[id]`: tenant detail page — info card, contract+unit card, cartera KPI strip, sortable cartera table (CarteraTable client component), contract phases timeline, payment history with "Registrar Pago" link
- Built `/gastos`: KPI strip + sortable/filterable GastosTable; category/method label maps inline
- Built `/pagos`: split layout (form left, history right); RegistrarPagoForm uses `useActionState` + server action; server action validates with Zod, inserts to `payments` table, revalidates path
- Data layers: `tenant-detail.ts` (4 queries), `gastos.ts` (2 queries), `pagos.ts` (2 queries)
- Server action: `src/app/pagos/actions.ts` — Zod v3 uses `.issues` not `.errors` for safeParse result
- Build clean, all 3 pages verified against real DB data

### Gotchas
- **Zod v3 API change**: `parsed.error.issues[0]` not `parsed.error.errors[0]` — v3 renamed the array
- **z.coerce.number() message param**: `invalid_type_error` not valid in this Zod version; use `.positive("msg")` only
- **DISTINCT ON for pagos tenant query**: prevents duplicate rows when tenant has multiple contracts (use `DISTINCT ON (t.id)` then sort in JS)
- **Next.js 16 params**: `params` is a Promise — must `await params` in server components

### Decisions made
- CarteraTable as client component (sortable), rest of tenant detail is pure server RSC
- RegistrarPagoForm resets via `formRef.current.reset()` on `state.success` — no router.refresh needed since server action calls `revalidatePath`
- Payment insert: `valorFinal = valorAplicado` (simplified — pronto pago calc not wired yet, Phase 2)

### Still pending
- `/reportes` — analytics/reporting
- `/usuarios` — user management
- Payment → cartera reconciliation (Phase 2)
- Invoice generation flow (Phase 2)

---

## 2026-04-16 — UI Part 3 Session

### What happened
- Built `/reportes`: 4 KPI cards + Recaudo Mensual bar chart + Proyectado vs. Recaudado comparison chart + Antigüedad de Cartera aging table with inline % progress bars
- Built `/usuarios`: profile list with role badges (admin/finance/viewer/tenant), active status, tenant link, empty state (profiles table empty until auth wired)
- Data layers: `src/lib/data/reportes.ts` (4 queries), `src/lib/data/usuarios.ts` (1 query)
- Build clean, all 11 routes in route table

### Gotchas
- **Tremor BarChart RSC boundary**: `valueFormatter` is a function — can't pass from server to client across RSC boundary. Fix: always wrap Tremor charts in a `"use client"` component that defines formatters internally. Same pattern as `rendimiento-chart.tsx`.
- `/usuarios` empty state is correct — no rows in profiles until Supabase Auth registers a user.

### Decisions made
- Aging buckets: `0` (al día, ≤0 dias_mora), `1_30`, `31_60`, `61_90`, `90+`
- Invite user button intentionally disabled — auth needed (Phase 2)
- `proyectado` from `projections.canon_proyectado` (per-unit monthly canon), not invoices table (empty at this stage)

### Still pending
- Linear cleanup: WOR-43, WOR-44, WOR-45; review CKR-1 through CKR-4
- Phase 2: payment → cartera reconciliation
- Phase 2: invoice generation + Siesa XML
- Phase 2: Supabase Auth + user management

## 2026-04-16 — Auth Session

### What happened
- Wired Supabase Auth end-to-end: login page, session proxy, protected layout, sidebar logout
- Restructured app into route groups: `(app)/` (protected, sidebar) and `(auth)/` (login, no sidebar)
- Applied DB migration 003: trigger `on_auth_user_created` on `auth.users` → auto-inserts into `public.profiles`
- Build clean, proxy registered (shown as `ƒ Proxy (Middleware)` in route table)

### Gotchas
- **Next.js 16 renamed middleware → proxy**: file must be `proxy.ts` (not `middleware.ts`), exported fn must be named `proxy` not `middleware`. The build warns and ignores `middleware.ts`. Docs at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- **Route group restructure breaks component imports**: `registrar-pago-form.tsx` imported from `@/app/pagos/actions` — updated to `@/app/(app)/pagos/actions`. Any new components referencing page-level actions must use the route group path.
- **Trigger trigger uses `SECURITY DEFINER`**: needed because auth.users INSERT happens in auth schema context; function runs as owner (postgres) to INSERT into public.profiles.

### Decisions made
- Profile `role` seeded from `raw_user_meta_data.role` — so admin can set role at invite time via Supabase dashboard or API
- Fallback role = `viewer` (safest default)
- `(app)/layout.tsx` loads profile for display name; falls back to `user.email` if profile not found yet

### Still pending
- Create first admin user via Supabase dashboard (auth + profile trigger fires automatically)
- Phase 2: payment → cartera reconciliation
- Phase 2: invoice generation + Siesa XML export

## 2026-04-16 — Payment Reconciliation Session

### What happened
- Built `src/lib/reconciliation.ts`: FIFO allocation engine
- Updated `registrarPago` action: insert payment → reconcile → revalidate /mora + /clientes
- Success message surfaces reconciliation result (N facturas applied, M cleared, remainder if any)
- Build clean

### How reconciliation works
1. Fetch tenant's open cartera items (saldo > 0), ordered by fecha_factura ASC (oldest first)
2. For each item: apply min(remaining_payment, item.saldo) → update saldo + valor_vencido in-place
3. Stop when payment fully consumed or no more open items
4. Returns: totalApplied, remainder, per-item allocations, itemsCleared count

### Decisions made
- Cartera updated in-place (not immutable) — Siesa sync will overwrite when it next runs. This is acceptable: cartera is a Siesa snapshot, not a ledger.
- valor_vencido reduced proportionally with saldo (simplified: newVencido = max(0, vencido - applied))
- interes_acumulado NOT touched — that's Siesa's domain
- No payment_applications records created — those require invoice_id which doesn't exist yet (Phase C)

### Still pending
- Phase C: invoice generation + Siesa XML export

## 2026-04-16 — Invoice Generation Session (Phase C)

### What happened
- Built invoice-engine.ts: full computation per spec §6
- Built /facturas page with GenerateForm, period filter, KPI panel
- Build clean, 13 routes

### How engine works
1. Query all active contracts + LEFT JOIN projections for period (year+month)
2. Skip contracts already invoiced for the period (idempotent)
3. Per contract: canonEffective = projection.canonProyectado ?? contract.canonBase
4. descuentoFase = projection.descuentoProyectado ?? (canonBase * descuentoPct/100)
5. netCanon = canonEffective - descuentoFase
6. IVA = netCanon * 0.19 (on net, NOT on PP — per spec §6.2)
7. prontoPagoRef = netCanon * prontoPagoPct/100 (reference only, applied at payment time)
8. gastos = $29,947 water flat (electricity skipped — no meter readings in DB yet)
9. total = netCanon + IVA + gastos (PP NOT deducted — tenant earns it)
10. Insert invoice + line items (canon, descuento if>0, iva, pronto_pago ref if>0, gasto_acueducto)

### Decisions made
- invoice total = WITHOUT PP deduction (spec confirms: PP is a reward applied at payment, not baked in)
- subtotalProntoPago stored as reference on invoice (so UI can show "pay by X to save Y")
- status = 'borrador' on creation (not auto-emitted)
- electricity gastos skipped: no meter_reading data in DB yet (Phase 3: add meter reading input)
- Generation is idempotent: existing invoices for period are skipped, not overwritten

### Gotchas
- Drizzle insert type inference narrows array element type to first element's literal. Fix: explicit `LineItemInsert[]` type annotation before .push()
- projections table has contractId nullable (LEFT JOIN), so some units may not match. Falls back to canonBase.

### Still pending
- Invoice emission (status borrador → emitida) + PDF/print view
- Electricity meter readings input + gasto_energia line item
- Siesa XML export (Phase 3)
- PP application at payment time (link payment → invoice → apply PP credit)

---

## 2026-04-16 — Phase 3 Session (Invoice Emission, PP, Medidores, Siesa Export)

### What happened

**Phase 3A — Invoice emission + PP at payment:**
- Added `emitirFactura` server action → status borrador → emitida
- Built `/facturas/[id]` detail page with line items, totals, PP reference row, print CSS
- Extended `reconcilePayment` signature: now takes `paymentId` + `fechaRecaudo`
- Reconciliation now hits portal `invoices` first (FIFO oldest-first), THEN `cartera` (Siesa snapshot)
- PP logic: if `fechaRecaudo <= invoice.fecha_pronto_pago` → deduct `subtotal_pronto_pago` from effective saldo before applying payment
- `payment_applications` rows inserted per invoice touched
- Invoice → `pagada` if saldo=0, `parcial` if partial

**Phase 3B — Electricity meter readings:**
- Migration 004: `meter_readings` table (unit_id, periodo, lectura_anterior, lectura_actual, kwh, tarifa_kwh, total_energia) — UNIQUE(unit_id, periodo), RLS
- Drizzle schema: `meterReadings` added
- `/medidores` page: shows units with `has_electricity_meter=true`, register readings, kWh + total KPIs
- `registrarLectura` action: onConflictDoUpdate (safe to re-enter same unit+period)
- Invoice engine: LEFT JOINs `meter_readings` per period → `gasto_energia` line item added when reading exists

**Phase 3C — Siesa export (basic):**
- Siesa XML spec blocked — no format doc, need meeting with Siesa team
- Decision: export CSV matching exact Documentos sheet column order from `ckrea.xlsx`
- `GET /facturas/export?periodo=YYYY-MM` → CSV download
- Hardcoded constants from real data: `id_canal=R08`, `id_co=044`, `auxiliar=42201006`, `tipo_cliente=1003`
- Button on facturas page with note "formato XML FVS pendiente reunión Siesa"

### Gotchas
- Supabase trigger function name is `public.update_updated_at()` NOT `public.set_updated_at()` — verify before writing any new migration
- `reconcilePayment` signature changed: now `(tenantId, paymentId, amount, fechaRecaudo)` — any future callers must update

### Decisions made
- PP: effective_saldo = saldo - ppRef (if within window). Payment must cover the discounted amount fully to earn PP. If payment < effectiveSaldo, no PP applied.
- Siesa export: CSV format now, XML FVS after Siesa meeting. Columns exact-match ckrea.xlsx Documentos sheet.
- meter_readings tarifa_kwh stored per-reading (admin inputs it) — no separate financial_rules entry needed

### Still pending
- Create first admin user: Supabase dashboard → Auth → Add user → raw_user_meta_data: `{"full_name":"...", "role":"admin"}`
- Linear cleanup: WOR-43, WOR-44, WOR-45 (wrong workspace); review CKR-1 through CKR-4
- Siesa XML FVS export (after meeting with Siesa team)
- Interest accrual cron (daily 0.05%/day on overdue invoices)

---

## 2026-04-16 — Business Rule Clarifications (German)

### Clarifications confirmed in session

**Aseo/Cafeteria billing:** NOT billed to tenants. Only water ($29,947 flat) and electricity (metered) are passed through. Invoice engine is correct as-is. Remove aseo from any "missing" notes.

**Electricity metering:** Intentionally manual. A person must physically read each unit's meter. The `/medidores` page handles this correctly — it is NOT automatic by design. The system records the reading, computes the amount, and includes it in the next invoice generation.

**PP + partial payment:** Confirmed — any partial payment loses PP eligibility entirely. If a tenant has interest accruals on an invoice, partial payment does NOT qualify for PP. Implementation in reconciliation is correct.

**Payment application order:** Confirmed as correct (interest first, then rent/principal). In current real data there is essentially no interest yet (Rule C is new), so all payments are applied to rent. Rule C accruals will make this more relevant going forward.

**Lower priority backlog (not building now — review later):**
- Settings page (financial rules management UI — IVA, PP rate, interest rate editable)
- Siesa XML FVS export (after meeting with Siesa team)
- Credit notes / NVS reversals (§9.7)
- IPC auto-compute for 2027+ (currently handled by seeded projections for 2026)
- Annual prepayment edge case (§9.8 — one tenant)
- Interest accrual cron (daily automation — Vercel cron or Supabase Edge Function)
- Mobile sidebar hamburger menu

---

## 2026-04-16 — Invoice Engine Correction (Water)

**Correction:** Water ($29,947) is included in the canon — NOT a separate line item on the invoice. Removed `gasto_acueducto` line item and `WATER_FLAT` from `subtotalGastos`.

Invoice gastos now = electricity only (metered via `/medidores`). If no meter reading for the period, `subtotalGastos = 0`.

**Invoice total formula (corrected):**
`total = netCanon + IVA + electricidad`
Where `electricidad = 0` if no meter reading exists for the period.

**Payment order confirmed:** Interest (mora) first → then rent principal. Correct as implemented.

---

## 2026-04-16 — Pre-Phase 4 Audit Notes

### DB state (confirmed clean)
- 0 invoices in DB — no stale water-billed invoices to clean up
- 22 critico contracts all have only flag_critico=true, no other billing flags → day 1 default is correct (only option)
- Projections: 85 contracts × 12 months = 1,020 rows covering all of 2026, 0 fallbacks

### 2027 limitation (backlog — non-blocking for 2026)
When projections run out (Jan 2027+), invoice engine falls back to:
- canon = contract.canon_base (no IPC adjustment applied)
- descuento = contract.descuento_pct (static rate, phase expiry NOT respected — discount won't auto-expire in correct month)

Fix when approaching 2027: seed new projections OR add IPC computation + phase calendar to invoice engine.

### Other confirmed behaviors
- Interest engine skips borrador invoices — correct, don't charge interest on unissued invoices
- invoice.saldo = pure principal only (interest tracked separately in subtotal_interes)
- revalidatePath('/clientes') missing from emitirFactura — minor, add when noticed

---

## 2026-04-16 — Session Wrap-Up + Phase 4 Plan

### 2027 Projection Plan (confirmed with German)
Build a **Projection Generator** UI inside the portal (Phase 4):
- Admin inputs: IPC rate (e.g. 5.1%) + optional per-contract overrides
- System generates `projections` rows for the new year: `new_canon = last_dec_canon * (1 + ipc_rate) + extra`
- Phase discount schedules reset/configured per contract for the new year
- No manual SQL or Excel needed — fully self-serve

### Phase 4 Backlog (priority order, ready for next session)
1. **Admin user creation** — Supabase dashboard → Auth → Add user → raw_user_meta_data: `{"full_name":"German Burgos","role":"admin"}` — needed to test the portal end-to-end
2. **Settings page** (`/configuracion`) — view/edit financial rules: IVA rate, PP rate, mora rate, water flat
3. **Interest accrual cron** — Vercel cron job daily at 01:00 COT calling `runInterestAccrual`
4. **Projection generator** (`/proyecciones`) — IPC + extras UI to seed next-year projections
5. **Linear cleanup** — close WOR-43/44/45, review CKR-1→4
6. **Siesa XML FVS** — after meeting with Siesa team
7. **Mobile nav** — sidebar hamburger for < 768px

### Final state entering Phase 4
- 16 routes, all building clean
- All 4 financial rules implemented (A PP, B phase discounts, C interest, D electricity)
- Auth + RLS working
- v1.2.1 in CHANGELOG
- DB clean: 0 invoices, 78 contracts, 85 units, 59 tenants, 2026 projections 100% covered

## 2026-04-16 — Phase 4 + Vercel Deployment Session

### What happened
- Built Phase 4 items: /configuracion, /proyecciones, /api/cron/accrual, vercel.json
- Connected GitHub repo: https://github.com/Gburg293/Ckrea-Portal.git
- Fought through Vercel deployment — 4 separate blockers resolved
- v1.3.0 now LIVE on Vercel

### Phase 4 delivered
- `/configuracion` — inline editor for 5 financial rules (IVA, PP window, mora rate, grace period, IPC%)
- `/proyecciones` — IPC projection generator: coverage table + pending contracts preview + generate form
- `/api/cron/accrual` — Vercel Cron route (daily 01:00 COT = 06:00 UTC), CRON_SECRET protected
- `vercel.json` — cron schedule `0 6 * * *`
- `src/lib/data/configuracion.ts`, `src/lib/data/proyecciones.ts` — data layers
- Sidebar: added Proyecciones (TrendingUp) + Configuración (Settings)

### Vercel deployment — bugs hit and fixed

**Bug 1: Export error on /proyecciones, /reportes, etc.**
- Cause: Next.js tries to statically render pages at build time on Vercel even when they have async DB calls
- Fix: `export const dynamic = "force-dynamic"` on ALL 12 (app) pages
- Pattern: every page with DB queries needs this

**Bug 2: Vercel Hobby commit author block**
- Cause: Hobby plan requires commit author email = Vercel account owner email
- Vercel account: germanwarfare07@gmail.com
- Fix: `git config user.email "germanwarfare07@gmail.com"` — must be set before every commit
- Saved to memory: feedback_vercel_commit_author.md

**Bug 3: Wrong env var name**
- Cause: NEXT_PUBLIC_SUPABASE_ANON_KEY was saved in Vercel as NEXT_PUBLIC_SUPABASE_ANON (missing _KEY)
- Effect: Supabase client init failed on every request → 500 on all pages
- Fix: removed wrong var, added correct NEXT_PUBLIC_SUPABASE_ANON_KEY via CLI
- Lesson: always verify env var names with `vercel env ls` after adding

**Bug 4: Env vars added after build**
- NEXT_PUBLIC_ vars baked at build time — adding after deploy doesn't help
- Fix: push new commit to trigger fresh build after adding/fixing env vars

### Vercel env vars (all 4 required)
- `NEXT_PUBLIC_SUPABASE_URL` — https://bosylehvmtwtqkrlievy.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon JWT (208 chars)
- `SUPABASE_SERVICE_ROLE_KEY` — service role JWT
- `DATABASE_URL` — direct DB host (NOT pooler)
- `CRON_SECRET` — any random string (needed for /api/cron/accrual)

### Decisions made
- Projection formula: `new_canon = round(last_canon * (1 + ipc/100))`, descuento carries forward as same %
- `onConflictDoNothing` on projection inserts — idempotent, safe to re-run
- force-dynamic on all (app) pages — no static pre-rendering attempted

### Next session
- Walk live site end-to-end (all 18 routes)
- Create admin user in Supabase Auth (germanwarfare07@gmail.com + raw_user_meta_data role:admin)
- Fix any bugs found in live testing
- Then: Linear cleanup, mobile nav, CRON_SECRET env var add

---

## 2026-04-22 — Power BI meeting prep + invoice analysis + financial rule discoveries

### What happened

**CSF sync:** `npm run sync-csf` — 2,797 payments + 171 cartera confirmed. No new data since last sync.

**Power BI projection gap ($162M vs $239M):**
- Our March projection: $239M (75 active contracts, canon − descuento + IVA 19%)
- Power BI March projection: $162M
- Gap: $77M (−32%). Tested all formula variants — none explain it.
- Strongest hypothesis: $239M × 68% ≈ $162M exactly. Power BI likely applies a historical collection rate, not total invoiced amount. Need to confirm at meeting.

**Power BI recaudo gap ($231M vs $236M) — continued from prior session:**
- Added projection gap section + question 8 to `docs/powerbi-meeting.html`.
- File is self-contained HTML presentation for today's alignment meeting.

**Excel "Facturas Ckrea Enero.xlsx" analysis:**
- 79 rows (January 2026 invoices). Excel SALDO total: $210.5M. DB January payments: $194.7M. Gap: $15.8M.
- Root cause: Excel = invoice basis (what was billed in Jan). DB = cash basis (what was received in Jan).
- ~12 clients paid Jan invoice in Feb → in Excel, not in Jan DB.
- 3 clients (VISUAL GRAPHIC, FAJARDO, FUSION GRAFIK) paid prior-period invoices in Jan → in DB Jan, not in Excel.
- Several clients barely paid in Jan (TATIANA $125K vs $2.7M billed, PROHERCOL $43K, PEDRAZA $100K).
- Excel date errors: MATICES 123/125 show "2026-11-10" (November) — typo, likely Jan/Feb.

**Retefuente discovery (3.5% withholding tax):**
- Column O of Excel. Applied to base_neta (pre-IVA) for PJ (juridical/company) clients.
- Formula: PJ total = (canon − descuento) × 1.155 [= 1.19 − 0.035]. PN unchanged (× 1.19).
- `tenants.juridica` field: only 2/66 marked true — ~30 company clients (SAS, SA, etc.) are wrong.
- Impact is tiny today (only 2 PJ in DB) but significant once data fixed. Linear: CKR-22 (data fix) → CKR-21 (formula).

**PP + phase discount STACK (rule reversal):**
- Prior rule: PP = 0 when phase discount active (mutual exclusivity). Enforced everywhere.
- New finding: MEDIOS IMPRESOS Jan invoice = 20% phase discount AND 10% PP both applied simultaneously.
- Both discounts apply: phase reduces base, then PP is 10% of that same base. They are NOT mutually exclusive.
- Linear: CKR-20 to fix code. Need to remove `CASE WHEN descuento_proyectado > 0 THEN 0` from ~6 spots.
- Also need to update `project_state.md` critical gotcha + financial-rules-engine-spec.md.

### Decisions made

- Invoice basis vs cash basis is an intentional design difference between Excel and portal. DB is authoritative for actual cash flow.
- Do NOT add retefuente to projections until juridica data is fixed first (CKR-22 blocks CKR-21).
- PP stacking fix (CKR-20) is highest priority code change — pure code, no data dependency.

### Files changed this session

- `docs/powerbi-meeting.html` — added projection gap section + open question 8
- `docs/powerbi-meeting-prep.md` — Key Finding 7 (electricity matching confirmed)
- No code changes to portal — analysis session only

---

## 2026-04-29 — Users page review (6 fixes)

Page-by-page audit reached `/usuarios`. Six findings, all fixed in one pass.

### Bugs fixed

1. **`ROLE_LABELS` keys mismatched DB enum.** `tab-switcher.tsx` keyed labels by `finance`/`viewer` but DB enum is `finanzas`/`visor` (confirmed via `edit-admin-modal.tsx`). Result: every finanzas/visor user fell to the default grey badge with a raw enum string instead of the proper colored chip + Spanish label. Fix: rename keys to match enum.
2. **`edit-tenant-modal.handleConfirm` redundant inquilino writes.** For a 3-unit tenant, `updateTenantUser` was called 3 times — each call re-wrote the same identity fields (nombre, NIT, email, telefono, contacto). Auth email sync was also run N times. Split into two actions: `updateTenantInquilino` (1 write for shared fields + auth sync) + `updateTenantContract` (per unit: contract + local). Modal now does 1 + N.
3. **`createTenantAccount` swallowed perfil patch error.** Auth user got created, then perfil UPDATE ran without checking `error`. If the patch failed (RLS, schema drift), the function returned `success: true` but the user existed in auth without `inquilino_id`/`rol` link → broken portal access. Fix: capture `perfilError` and surface it.
4. **`listUsers({ perPage: 1000 })` hardcoded cap.** Both `getUsuarios` and `getPortalTenants` would silently truncate at 1000 auth users. Replaced with `listAllAuthUsers()` helper that paginates until <1000 returned.
5. **`getPortalTenants` writes during read.** The function backfilled `portal_email` from auth.users on every render — a side-effect during a SELECT. Slow if many drift, surprising for a "data layer" function, and unnecessary because the response already used `authEmail ?? portal_email` for display. Dropped the writes entirely.
6. **No UUID/email validation in actions.** `inquilinoId`/`userId`/`contractId`/`localId` were trusted raw. Email check was `.includes("@")` (accepts `@`, `@@`, `a@`). Added `assertUuid` to all action params, new `isValidEmail`/`assertEmail` helpers in `lib/security/validators.ts` (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`), and a role whitelist on `updateAdminUser`.

### Lessons

- **Side-effects during reads are a smell.** Even when the write "looks safe" (idempotent backfill), it makes the function unpredictable, slow, and harder to reason about. Either the read is canonical and writes are redundant (drop them), or auth.users is canonical and the DB column should be removed. Don't paper over the divergence on every page load.
- **Multi-entity update actions need clear ownership.** The "do everything for this tenant" action looked convenient but the per-unit loop revealed the design was wrong. One action per entity = N+1 calls but no redundant writes and clearer error messages.
- **Always check role/enum keys against the DB.** ROLE_LABELS bug was visible for months — labels rendered fine for the only seeded role (admin), so finanzas/visor users would have shown the default style and never been caught until someone added one.

### Files changed

- `src/lib/security/validators.ts` — `isValidEmail`/`assertEmail` + `EMAIL_RE`
- `src/lib/data/usuarios.ts` — `listAllAuthUsers` paginator, dropped `getPortalTenants` backfill side-effect
- `src/app/(app)/usuarios/actions.ts` — split `updateTenantUser` → `updateTenantInquilino` + `updateTenantContract`; UUID/email validation; role whitelist; `createTenantAccount` perfil error capture
- `src/app/(app)/usuarios/edit-tenant-modal.tsx` — `handleConfirm` calls inquilino once + contract per unit
- `src/app/(app)/usuarios/tab-switcher.tsx` — `ROLE_LABELS` keys match DB enum; removed unused `EmailEditor` import

---

## 2026-05-11 — Cloudflare R2 storage + Archivos page + Google Drive removal (Session 54)

### What happened

Replaced Google Drive with Cloudflare R2 as the single file storage system. Built an admin archive page at `/archivos`. Scaffolded electricity invoice PDF template (WIP, continues next session).

### Decisions

- 🎯 **R2 over Google Drive.** Drive OAuth token fragile (refresh rotation), no CDN, poor programmatic UX. R2 is S3-compatible, CDN-backed, simpler auth. Decision final — Drive is gone.
- 🎯 **File browser built in portal (`/archivos`), not external.** Avoids relying on Drive UI for daily admin access. One page, filtered by type + period.
- 🎯 **Manual PDF generation first.** Two buttons on facturas energía: "Generar Todas" + per-unit "Generar". Auto on day 9 deferred until workflow is stable.
- 🎯 **Electricity invoices only (PDF phase 1).** Canon invoices deferred. Portal-only (no email) for now.

### Gotchas

- ⚠️ **R2 TLS handshake fails for ~30–60 min after first R2 activation.** Cloudflare provisions the S3 endpoint asynchronously after payment method is added. `openssl s_client` returns alert 40 / no certificate until provisioning completes. Wait it out — not a credentials issue.
- ⚠️ **R2 free tier requires payment method on file even for $0 usage.** Without a card, the S3 API endpoint stays unprovisioned (TLS fails). Dashboard shows the bucket but the API is dark.
- 💡 **`foto_drive_id` DB column now stores R2 object key**, not a Drive file ID. Column name is stale — rename to `foto_key` in a future migration if it causes confusion.

### Files changed

- `src/lib/r2/client.ts`, `files.ts`, `meter-photos.ts` — R2 client + utilities
- `src/app/(app)/archivos/` — new archive page (page, client, actions)
- `src/components/ui/badge.tsx`, `select.tsx` — shadcn components added
- `src/lib/constants.ts` — Archivos nav item
- `src/lib/pdf/electricity-invoice.tsx` — PDF scaffold (WIP)
- `src/app/(portal)/portal/medidor/actions.ts` — Drive → R2 upload swap
- Deleted `src/lib/google-drive.ts`, uninstalled `googleapis` + `pdf-lib`

### Session-end pointers
- ADRs: none
- Lessons: none (R2 provisioning gotcha above is sufficient)
- State: project_state.md needs update (storage = R2, Drive removed)
- Linear: none

---

## 2026-05-02 — Sentry rewire to new org + PostHog install + Vercel relink

Setup session. Production observability stack rewired to new owner accounts after the Vercel project transfer and the Sentry workspace move.

### What happened

**Vercel transfer recovery.**
- Vercel project moved to new account `gburgos293-6994` (team `transfer-05daf62d`). Local `.vercel/project.json` still pointed at the old org so `vercel ls` came back empty.
- `vercel logout` → `vercel login` (new email) → `rm -rf .vercel` → `vercel link`. Declined the "overwrite `.env.local`" prompt — would have nuked Supabase/Drizzle/Google secrets.
- Diff via `vercel env pull .env.vercel.prod` confirmed prod env is complete: DATABASE_URL, Supabase ×3, Google OAuth ×4, CRON_SECRET. Preview env is mostly empty but unused. Temp pulls deleted after diff.

**Sentry org swap.**
- Old wiring pointed to `workspace-qi` / `javascript-nextjs` with a hardcoded DSN in 3 init files. Old org no longer accessible.
- Pulled new project keys via `curl https://sentry.io/api/0/projects/reymon/ckrea/keys/` (no `sentry-cli api` subcommand exists).
- New: org `reymon`, project `ckrea`, DSN `…@o4511318111748096.ingest.us.sentry.io/4511322017038336`.
- `next.config.ts` org/project updated; 3 init files (`sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`) now read `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` first with the new DSN as fallback.
- Tightened sample rates: `tracesSampleRate: NODE_ENV==='development' ? 1.0 : 0.1`. Added `includeLocalVariables: true` server-side per skill.
- Vercel env: added `SENTRY_AUTH_TOKEN`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`. `sentry-cli login --auth-token …` stored to `~/.sentryclirc`.
- Verified end-to-end with a smoke `Sentry.captureMessage` from a temporary `node` script — event landed in dashboard within ~15s.

**PostHog install (App Router).**
- Installed `posthog-js`. New `src/components/posthog-provider.tsx` wraps client init + manual `$pageview` capture (App Router has no auto-router events; `capture_pageview: false`, `capture_pageleave: true`, `person_profiles: 'identified_only'`).
- Wrapped root layout. `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` in `.env.local` and Vercel (Production + Development; Preview skipped).
- Confirmed live events firing.

**Cleanup.**
- Removed two dead Google service-account vars from `.env.local` (`GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`). Code uses OAuth (CLIENT_ID/SECRET/REFRESH_TOKEN), not service account. The 4 OAuth vars + `GOOGLE_DRIVE_FOLDER_ID` stay — tenant photo upload depends on them.
- Service account `ckrea-medidores@…iam.gserviceaccount.com` still exists in GCP — flagged for later deletion if confirmed unused everywhere.
- Deleted Sentry wizard demo files: `src/app/sentry-example-page/` and `src/app/api/sentry-example-api/`.

### Decisions

- 🎯 **`scripts/sync-csf.ts` stays.** German clarified: ERP pushes to Supabase ~every 6 hours, but the local pull script is kept on purpose as a manual top-up between push windows. Do not archive or delete CSF env vars / the script / `npm run sync-csf`. New memory: `erp_push_model.md`.
- 🎯 **CSF env vars belong only in `.env.local`, never in Vercel.** Script runs from German's Mac. The portal never calls CSF.
- 🎯 **Defaulted PostHog region to US** (`us.i.posthog.com`). Swap is one line if the project turns out to be EU.
- ⚠️ **Vercel Hobby commit-author block now needs `gburgos293@gmail.com`.** The old constraint of `germanwarfare07@gmail.com` (memory `feedback_vercel_commit_author.md`) is stale — the new Vercel account owns the project. That memory needs updating before the next deploy.

### Learnings

- 💡 **`vercel env add` accepts only one environment per call.** `vercel env add NAME production preview development` → "Invalid number of arguments". Run three times.
- 💡 **`sentry-cli api …` subcommand does not exist.** Use `curl` against `https://sentry.io/api/0/...` with the bearer token to fetch DSN keys / project metadata.
- 💡 **Supabase doesn't "host" integrations.** It's only the database. Code that calls external APIs runs on the laptop (scripts), Vercel (server actions, crons, page renders), or in the browser. Where the *call* happens decides where the secret needs to live.
- ⚠️ **Wizard demo routes** (`/sentry-example-page` + `/api/sentry-example-api`) returned 404 in Turbopack dev. They are templates the wizard installs and you delete after first verification — production wiring works.

### Files changed

- `next.config.ts` — Sentry org `workspace-qi` → `reymon`, project `javascript-nextjs` → `ckrea`
- `sentry.server.config.ts` — DSN env-first + new DSN fallback, sample-rate dev/prod split, `includeLocalVariables: true`
- `sentry.edge.config.ts` — DSN env-first + new DSN fallback, sample-rate dev/prod split
- `src/instrumentation-client.ts` — DSN env-first + new DSN fallback, sample-rate dev/prod split
- `src/components/posthog-provider.tsx` (new) — client provider + manual pageview tracker
- `src/app/layout.tsx` — wraps body in `PostHogProvider`
- `package.json` / `package-lock.json` — `posthog-js` added
- Deleted: `src/app/sentry-example-page/`, `src/app/api/sentry-example-api/`
- `.env.local`, `.env.sentry-build-plugin` — env updates (gitignored, not committed)

### Session-end pointers
- ADRs: none
- Lessons: erp_push_model.md (new), feedback_vercel_commit_author.md (needs update — wrong email)
- State: project_state.md unchanged; observability stack now wired to new accounts
- Linear: none
