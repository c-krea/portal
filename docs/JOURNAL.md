# C-Krea PayControl — Development Journal

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
