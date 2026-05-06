@AGENTS.md

# C-Krea PayControl — Project CLAUDE.md

## Session start
Run `/session-start` skill at the start of every session before any code, planning, or analysis.

Always read `~/.claude/memory/german-profile.md` to adapt tone and depth for German.

## What this is
Commercial rental payment control portal for ~85 units in Central Kreativa, Bogotá.
Replaces manual Excel tracking. Single source of truth for all tenant payments, invoices, gastos, and Siesa ERP sync.

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
