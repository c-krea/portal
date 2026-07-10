@AGENTS.md

# C-Krea PayControl — Project CLAUDE.md

## Session start
Always read `~/.claude/memory/german-profile.md` to adapt tone and depth for German.

## What this is
Commercial rental payment control portal for ~85 units in Central Kreativa, Bogotá.
Replaces manual Excel tracking. Single source of truth for all tenant payments, invoices, gastos, and Siesa ERP sync.

## Production safety — live money DB

This app runs on a **live Supabase DB with real client money**. Every DB write and deploy is high-stakes.
> ⚠️ **Shared DB:** this database is shared with reymon-db / Rutas / Satelites — a bad write hits them too. Extra care.
- Verify against real data before changing it. Use **idempotent migrations** (safe to re-run, no partial writes).
- **Smallest targeted fix** — never redefine shared logic (e.g. what "paid" means) for one record. Flag any change that hits all clients; German chooses.
- **Explicit "go"** before any prod write or deploy. Show the exact migration/diff first.
- Destructive/irreversible → stop, explain impact in plain words, wait.

**Never test on the live DB.** No tests, experiments, or fake/seed data against production — ever. Use the local Supabase test DB (Docker) — see below.

## Local test DB (set up 2026-07-10 — use it)
Docker-based local twin of Ckrea's data. **All dev/testing runs here, never prod.**
- **Run the app against local:** `npm run dev:test` (loads `.env.test`, guards the target, then `next dev`).
- **Refresh real data from prod (read-only):** `npm run db:sync` — clones **full `v2` schema + only Ckrea's 5 `siesa_raw` tables** (`cartera, documentos, ocupacion, recaudo, estado_resultados`). `siesa_raw` is SHARED and holds other apps' multi-GB tables (`ventas_detalle`, `movimientos_inv`, …) — we deliberately never copy those.
- **Stack:** ports in the **546xx** range (Palma=543xx, Paxco=544xx, Cartera=545xx). `npm run db:start` / `npm run db:stop`. Studio: http://127.0.0.1:54623 · DB: `postgresql://postgres:postgres@127.0.0.1:54622/postgres`.
- **Guard:** `scripts/assert-local-db.sh` refuses any run whose DB target isn't `:54622`. `.env.test`, `.test-data/`, `supabase/.temp/` are git-ignored.
- **Migrations:** develop + verify on local first; only then show German the diff for prod.

## Tech stack (locked)
- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** shadcn/ui + Tailwind CSS v4 + Tremor (charts) + TanStack Table v8
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **DB:** Supabase (PostgreSQL + Auth + RLS + Realtime)
- **ORM:** Drizzle ORM (ledger pattern — immutable transactions, audit trails)
- **Deployment:** Vercel — Hobby plan, Node 24 LTS, Fluid Compute. 1×/day cron cap. Commit author MUST = `gburgos293@gmail.com` or deploy blocks. Use `vercel` CLI directly. Don't suggest AI Gateway / Queues / Sandbox / vercel.ts unless asked.
- **Errors:** Sentry
- **Analytics:** PostHog (Phase 2)
- **Tasks:** Linear

## Key docs (read before touching domain logic)
- `docs/PRD_C-krea.md` — full product requirements
- `docs/foundation/02_financial_rules/financial-rules-engine-spec.md` — ALL financial math. If portal math ≠ this doc, something is wrong.
- `docs/foundation/03_ui_ux/Step4_UI_UX_Guide.md` — screen-by-screen design spec
- `docs/foundation/01_schema_erd/001_initial_schema.sql` — canonical DB schema

## Financial rules (critical — never guess)
Four rules govern ALL money calculations:
- **Rule A** — Early payment (pronto pago): discount if paid within 10 days of invoice (10/20/30% per contract)
- **Rule B** — Contract phase discounts: time-based % discounts (0/10/20/30/43%), expire by month
- **Rule C** — Late interest: 0.05%/day (1.5%/month) on overdue balance, starts day 11
- **Rule D** — Gastos: water ($29,947/unit flat), electricity (metered), all others absorbed by C-Krea

Invoice chain: `Canon → minus phase discount → IVA (19%) → minus pronto pago (if on time) → plus gastos → plus interest (if late)`

## Design conventions
- Sidebar: dark slate-900, 220px fixed
- Content: slate-50 bg, white cards, rounded-xl border shadow-sm
- Currency: `Intl.NumberFormat('es-CO')` — `$ 7.662.800.001` format
- Status colors: emerald-500 (on-time), amber-500 (grace), rose-500 (late), slate-400 (inactive)
- Language: Spanish (UI labels, field names, routes)

## DB conventions
- All tables have `company_id` for C-Krea vs Raymond filtering (mandatory from day 1)
- Ledger pattern: immutable records, never update financial rows — append only
- Every override/adjustment requires `reason` text (audit trail)
- RLS enabled on all tables

## Multi-app DB isolation rules (shared Supabase project)
This DB hosts multiple apps. These rules prevent cross-app conflicts:

- **Auth triggers MUST use schema suffix** — never `on_auth_user_created` alone.
  C-Krea's trigger = `on_auth_user_created_v2`. Every other app uses `on_auth_user_created_SCHEMANAME`.
  Duplicate trigger names on `auth.users` = hard conflict, breaks the new app entirely.
- **Trigger function lives in its own schema** — `v2.handle_new_user()`, never `public.handle_new_user()`
- **Never touch other schemas** — `rutas`, `satelites`, or any future schema is off-limits
- **siesa_raw = read only** — SELECT only, never INSERT/UPDATE/DELETE
- **No service_role key in other apps** — only this app (C-Krea) uses it, server-side only
- Full isolation standard: `docs/isolation-checklist.md`

## Environment variables
See `.env.local`. Never commit this file. Supabase keys + DB URL required for any DB work.
DATABASE_URL needs the DB password from Supabase → Settings → Database.

## Supabase access (MCP via PAT)
- **Only path**: Supabase MCP launcher at `.claude/supabase-mcp.sh` → `@supabase/mcp-server-supabase@latest --project-ref=$SUPABASE_PROJECT_REF`
- **Auth**: PAT in `.env.local` → `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` (project ref `bosylehvmtwtqkrlievy`)
- **No Supabase CLI** — not installed, not used. Use MCP tools (`execute_sql`, `list_tables`, `apply_migration`).
- Destructive ops gated by global CLAUDE.md safety rule: confirm before `DROP/DELETE/TRUNCATE/ALTER`.

## Siesa integration
ERP pushes raw exports directly to `siesa_raw.*` schema (5 tables, role `siesa_sync`). v2 derives reads via `sync_desde_raw()` UPSERT RPC. No local pull/sync scripts. Filter `IdZona = 'Z40'` (C-Krea) applied upstream by ERP. Details in `siesa_raw_layer` memory.

## Org context & IT (Reymon) — how to act

Esteban is gerente of C-Krea. **C-Krea is a subsidiary of Reymon** (parent company). IT lives in Reymon, not C-Krea. Esteban controls the portal fully but has **zero control over Siesa ERP** — any ERP/sync change must go through IT.

**Key behavioral rules when IT (Reymon) proposes a technical fix:**

1. **IT only knows the ERP side, not the portal.** Their proposals are biased toward ERP solutions and often ignore how the portal queries the data. Always evaluate from the portal side before agreeing.

2. **Esteban relies on me as the bridge.** When IT suggests something (e.g., schema changes, new columns, sync logic), my job is to:
   - Evaluate whether it actually solves the problem given how the portal works
   - Translate the trade-offs to Esteban in plain language with business analogies
   - Propose simpler alternatives if they exist
   - When Esteban asks, write the message back to IT in Spanish for him to forward

3. **Default stance on IT-proposed schema changes:** skeptical. Ask "does this require changes in 3 places (Supabase + ERP + portal)?" If yes, almost always a simpler fix exists (e.g., change sync mode from "full refresh + delete" to "upsert only").

4. **Esteban's TOP priority:** data reliability of the Siesa sync. 30-60 tenants actively use the portal; errors flow through admin staff to him. Loss of historical data or stale sync = critical.

5. **What Esteban can/can't decide:**
   - ✅ Portal code, queries, UI, Supabase schema (asks permission for destructive)
   - ❌ Siesa procedures, ERP exports, sync logic — must request via IT

Full context: `memory/ckrea_org_context.md`.

## Reusable Functions

<!-- Add entries as new helpers are created: path:line | signature | purpose -->

## Record-keeping workflow (mandatory)

Four records, four purposes — never cross-duplicate:

| Record | Purpose | When to update |
|--------|---------|----------------|
| **Linear** | Active work in progress — tasks, bugs, blockers | Create issue when starting anything real. Update status when done. |
| **`CHANGELOG.md`** | What shipped, grouped by release | After every meaningful change. Group under `[Unreleased]` until version cut. |
| **`docs/JOURNAL.md`** | Dated decisions, learnings, gotchas, workflow notes — the "why" | End of every session or after any non-obvious decision. |
| **`memory/project_state.md`** | Curated current-state snapshot (auto-recalled every turn) | After any state change: phase shipped, blocker resolved/added, decision made, audit done. Rewrite stale lines, don't append. |

Rules:
- JOURNAL = lab notebook. Write what was tried, what broke, what was decided and WHY. Future Claude reads this to avoid repeating mistakes.
- CHANGELOG = user-facing release history. What changed, not how or why.
- Linear = living task state. Kitchen-messy is fine. Close or update issues — don't abandon them.
- `project_state.md` = always-recalled snapshot. If it goes stale → memory misleads every future turn. Update WHENEVER state moves, not just session-end.
- At end of every session: update JOURNAL.md (events + decisions), CHANGELOG.md (what shipped), and `project_state.md` if state changed.
