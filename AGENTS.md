<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# C-Krea PayControl — Project Reference

*Facts about this codebase. Read before changing anything.*
*Personal working preferences, org context and tracker rules are NOT here — see the note at the bottom.*

## What this is

Commercial rental payment control portal for ~85 units in Central Kreativa, Bogotá.
Replaces manual Excel tracking. Single source of truth for all tenant payments, invoices, gastos,
and Siesa ERP sync.

## Production safety — live money DB

This app runs on a **live Supabase DB with real client money**. Every DB write and deploy is high-stakes.
> ⚠️ **Shared DB:** this database is shared with reymon-db / Rutas / Satelites — a bad write hits them too. Extra care.
- Verify against real data before changing it. Use **idempotent migrations** (safe to re-run, no partial writes).
- **Smallest targeted fix** — never redefine shared logic (e.g. what "paid" means) for one record. Any change that hits all clients must be flagged and approved before it lands.
- **Explicit approval** before any prod write or deploy. Show the exact migration/diff first.
- Destructive/irreversible → stop, explain impact in plain words, wait.

**Never test on the live DB.** No tests, experiments, or fake/seed data against production — ever. Use the local Supabase test DB (Docker) — see below.

## Local test DB (set up 2026-07-10 — use it)
Docker-based local twin of Ckrea's data. **All dev/testing runs here, never prod.**
- **Run the app against local:** `npm run dev:test` (loads `.env.test`, guards the target, then `next dev`).
- **Refresh real data from prod (read-only):** `npm run db:sync` — clones **full `v2` schema + only Ckrea's 5 `siesa_raw` tables** (`cartera, documentos, ocupacion, recaudo, estado_resultados`). `siesa_raw` is SHARED and holds other apps' multi-GB tables (`ventas_detalle`, `movimientos_inv`, …) — we deliberately never copy those.
- **Stack:** ports in the **546xx** range (Palma=543xx, Paxco=544xx, Cartera=545xx). `npm run db:start` / `npm run db:stop`. Studio: http://127.0.0.1:54623 · DB: `postgresql://postgres:postgres@127.0.0.1:54622/postgres`.
- **Guard:** `scripts/assert-local-db.sh` refuses any run whose DB target isn't `:54622`. `.env.test`, `.test-data/`, `supabase/.temp/` are git-ignored.
- **Migrations:** develop + verify on local first; only then propose the diff for prod.
## Tech stack (locked)
- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** shadcn/ui + Tailwind CSS v4 + Tremor (charts) + TanStack Table v8
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **DB:** Supabase (PostgreSQL + Auth + RLS + Realtime)
- **ORM:** Drizzle ORM (ledger pattern — immutable transactions, audit trails)
- **Deployment:** Vercel — Hobby plan, Node 24 LTS, Fluid Compute. 1×/day cron cap. Use `vercel` CLI directly. Don't suggest AI Gateway / Queues / Sandbox / vercel.ts unless asked.
- **Errors:** Sentry
- **Analytics:** PostHog (Phase 2)
- **Tasks:** Linear

## Key docs (read before touching domain logic)
- `docs/context.md` — the business, the ERP relationship, the money rules in prose. States nothing countable on purpose; points at the source for anything that can be looked up.
- `docs/PRD_C-krea.md` — full product requirements
- `docs/financial-rules-engine-spec.md` — ALL financial math. If portal math ≠ this doc, something is wrong.
- `docs/schema/` — the **live `v2` DDL**: `01_tablas.sql`, `02_vistas.sql`, `03_rpcs.sql`.

  ⚠️ **`supabase/migrations/` holds exactly one file.** Ckrea's schema was applied directly to the
  live database, so unlike Palma (57 migrations), Paxco (82) and Cartera (18) **there is no
  replayable history and no file-level revert path.** These DDL files plus the live DB are the
  schema of record. Treat that as a known gap, not a convention to copy — Paxco hit the same
  problem and repaired it (see its `project_migration_drift_repair` memory).
- `docs/db-schema-reference.md` — column-level reference for `siesa_raw` + `v2`, join patterns, projection logic. Read before any DB query.
- `docs/reference/user-admin-edge-function.md` — spec for the shared login Edge Function. **Canonical, because that function's source does not live in this repo.** §11 (red-team resolutions) wins on conflict.

Build plans and specs are **not** kept. Once work ships the code is the truth; the *why* goes to `docs/JOURNAL.md`, the *what* to `CHANGELOG.md`, a lasting rule to `docs/reference/`. `docs/superpowers/` was retired 2026-08-20.

## Financial rules (critical — never guess)
Four rules govern ALL money calculations:
- **Rule A** — Early payment (pronto pago): discount if paid within 10 days of invoice (10/20/30% per contract)
- **Rule B** — Contract phase discounts: time-based % discounts (0/10/20/30/43%), expire by month
- **Rule C** — Late interest (mora): **DIAN / Superfinanciera monthly rate** (art. 635 E.T.). `interés = vr_vencido × (tasa_mes ÷ 366) × días vencidos`, counted from the due date (invoice + 30). Rate lives in `v2.tasa_interes_mora`, admin-entered each month (Jul 2026 = 26,79% E.A.). Shipped 2026-07-10 — **supersedes** the old fixed 0.05%/day. See `mora_dian_interest` memory.
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

## Siesa integration
ERP pushes raw exports directly to `siesa_raw.*` schema (5 tables, role `siesa_sync`). v2 derives reads via `sync_desde_raw()` UPSERT RPC. No local pull/sync scripts. Filter `IdZona = 'Z40'` (C-Krea) applied upstream by ERP. Details in `siesa_raw_layer` memory.

## Reusable Functions

<!-- Add entries as new helpers are created: path:line | signature | purpose -->

---

Personal workflow, org/IT context, Supabase access and tracker rules live in
`.claude/CLAUDE.local.md` (git-ignored) and in the maintainer's global `~/.claude/CLAUDE.md`.
Nothing in this file depends on them.
