@AGENTS.md

# C-Krea PayControl — Project CLAUDE.md

## Session Start Protocol — MUST RUN FIRST (every single session)

Before ANY work or reading code:

1. Run `linear issue list --team WOR --project "C-Krea Portal" --all-states --sort priority` → note open issues.
   (Workspace: `workspacegb29`. Project name is exact, hyphenated `C-Krea Portal`. CLI errors without `--sort`.)
2. Read **last 5 entries** in `docs/JOURNAL.md`.
3. Read `~/.claude/memory/german-profile.md`.
4. Scan **Reusable Functions** list below (skip if not yet defined).
5. Quick health check:
   - `vercel ls` → latest deployment status.
   - `sentry-cli issues list -o german-burgos -p javascript-nextjs -s unresolved` → unresolved errors. Auth fail → report "Sentry: auth not configured" and move on.
   - Flag broken/suspicious before new work.
6. If relevant: check or rebuild `graphify-out/GRAPH_REPORT.md`.
7. One-line summary: *"in flight: WOR-X, WOR-Y. Last journal: Z (Session N). Health: deploy OK / X Sentry issues. Ready to continue?"*

Run checklist **before any code, planning, or analysis**. Confirm in first response.

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
- **Deployment:** Vercel
- **Errors:** Sentry
- **Analytics:** PostHog (Phase 2)
- **Tasks:** Linear

## Key docs (read before touching domain logic)
- `docs/PRD_C-krea.md` — full product requirements
- `docs/foundation/02_financial_rules/financial-rules-engine-spec.md` — ALL financial math. If portal math ≠ this doc, something is wrong.
- `docs/foundation/03_ui_ux/Step4_UI_UX_Guide.md` — screen-by-screen design spec
- `docs/foundation/01_schema_erd/001_initial_schema.sql` — canonical DB schema

## Architecture
```
src/
├── app/                    ← Next.js App Router pages
│   ├── layout.tsx          ← Root layout (sidebar + content)
│   ├── page.tsx            ← Dashboard /
│   ├── mora/page.tsx
│   ├── clientes/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── pagos/page.tsx
│   ├── gastos/page.tsx
│   ├── reportes/page.tsx
│   └── usuarios/page.tsx
├── components/
│   ├── ui/                 ← shadcn/ui (auto-generated, do not edit)
│   ├── layout/             ← sidebar, page-header, mobile-nav
│   ├── dashboard/
│   ├── clientes/
│   ├── pagos/
│   ├── gastos/
│   ├── mora/
│   └── shared/             ← status-badge, currency-display, data-table, etc.
├── lib/
│   ├── db/                 ← Drizzle schema + client
│   ├── supabase/           ← Supabase client (browser + server)
│   ├── utils.ts
│   ├── formatters.ts       ← COP currency (Intl.NumberFormat('es-CO')), dates, %
│   └── constants.ts        ← status colors, nav items, role permissions
└── types/                  ← shared TypeScript types
```

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
- Pull: query SQL Server copy → portal
- Push: generate XML files in exact Siesa format
- Raymond overlap: always filter by `company_id` — DB has both companies
- Sync tracked in `siesa_sync_log` table

## Key commands
```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # eslint check
npx drizzle-kit push # push schema to Supabase
npx drizzle-kit studio # open Drizzle Studio
```

## Knowledge Graph

- Before answering architecture/codebase questions, read `graphify-out/GRAPH_REPORT.md` (god nodes, community structure).
- If `graphify-out/wiki/index.md` exists, navigate it instead of raw files.
- After modifying code files in session, rebuild graph:
  `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`

## Obsidian Wiki

- Project wiki at `~/ObsidianVault/ckrea-wiki/` (generated by `night-review` skill).
- Session start, specific codebase area in scope → read matching wiki page before source files.
- Wiki is Obsidian-native (`[[wikilinks]]`). Navigate via `index.md` if exists.
- **No hand-edits to wiki** — rebuilt by `night-review`. Write findings to `docs/JOURNAL.md`.

## Reusable Functions

<!-- Add entries as new helpers are created: path:line | signature | purpose -->

## Record-keeping workflow (mandatory)

Three records, three purposes — never cross-duplicate:

| Record | Purpose | When to update |
|--------|---------|----------------|
| **Linear** | Active work in progress — tasks, bugs, blockers | Create issue when starting anything real. Update status when done. |
| **`CHANGELOG.md`** | What shipped, grouped by release | After every meaningful change. Group under `[Unreleased]` until version cut. |
| **`docs/JOURNAL.md`** | Dated decisions, learnings, gotchas, workflow notes — the "why" | End of every session or after any non-obvious decision. |

Rules:
- JOURNAL = lab notebook. Write what was tried, what broke, what was decided and WHY. Future Claude reads this to avoid repeating mistakes.
- CHANGELOG = user-facing release history. What changed, not how or why.
- Linear = living task state. Kitchen-messy is fine. Close or update issues — don't abandon them.
- At end of every session: update JOURNAL.md with what happened + decisions made. Update CHANGELOG.md with what shipped.
