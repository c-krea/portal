<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# C-Krea PayControl

Commercial rental payment control for ~85 units in Central Kreativa, Bogotá.
Single source of truth for tenant payments, invoices, gastos, and Siesa ERP sync.

## Live money — read this first

This app sits on a **live Supabase database with real client money**. The same database is shared with other Reymon apps. A bad write hits them too.

- Never test on production. Use the local Docker twin (`npm run dev:test`).
- Never INSERT / UPDATE / DELETE `siesa_raw` (read-only ERP dump).
- Never touch other schemas (`cartera`, `rutas`, `satelites`, …).
- Never redefine shared money logic (what “paid” means, mora, pronto pago) to fix one record.
- Prod writes, migrations, and deploys need explicit approval. Show the exact diff first.
- Financial rows are append-only. Overrides need a `reason`.

## Local development

```bash
npm run db:start          # local Supabase on ports 546xx
npm run db:sync           # clone v2 + Ckrea's 5 siesa_raw tables (not other apps' multi-GB tables)
npm run dev:test          # app against local DB; refuses anything that is not :54622
```

Studio: http://127.0.0.1:54623
DB: `postgresql://postgres:postgres@127.0.0.1:54622/postgres`

Guard: `scripts/assert-local-db.sh`. `.env.test`, `.test-data/`, `supabase/.temp/` are git-ignored.

`db:sync` does **not** copy `auth`. Create a local staff user via the GoTrue admin API (`http://127.0.0.1:54621/auth/v1/admin/users`, service-role key from `.env.test`) plus a matching `v2.perfiles` row (`rol` anything but `inquilino`, `empresa_id` = Ckrea). Prod logins will never work here.

Migrations: develop on local first, then propose the diff for prod. `supabase/migrations/` holds one file — schema of record is `docs/schema/` plus the live DB.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · TanStack Table · **recharts** · React Hook Form + Zod · Drizzle ORM · Supabase · Vercel · Sentry

In Next 16 the middleware file is `src/proxy.ts`.

## Money rules (never guess)

Full math: `docs/financial-rules-engine-spec.md`. Business prose: `docs/context.md`.

- **A — Pronto pago:** discount if paid within 10 days of that invoice. Applied at payment time only, never on invoices or projections.
- **B — Phase discount:** time-based % on canon, expires by month.
- **C — Mora:** DIAN / Superfinanciera monthly rate (art. 635 E.T.). `interés = vr_vencido × (tasa_mes ÷ 366) × días vencidos`, from due date (invoice + 30). Rate in `v2.tasa_interes_mora`. If this month has no row, use the latest earlier month — do not bill $0.
- **D — Gastos:** water is a flat per-unit amount; electricity is metered; C-Krea absorbs the rest.

Invoice chain: `canon − phase → IVA 19% − pronto pago (if on time) → + gastos → + mora (if late)`

**Siesa is the legal record. This portal reads it; it does not write money back.** ERP pushes into `siesa_raw` (zone `Z40`). `v2` holds portal metadata. `v2.sync_desde_raw()` refreshes portal tables. `scripts/sync-csf.ts` is a leftover manual top-up, not the source of truth.

Read payments through `v2.vista_pagos`. The four recaudo filters live in `docs/schema/02_vistas.sql`. Never filter by `siesa_clasificacion` / `clasificacion`. Dedup is by `row_id_mov`, not invoice+date (that collapsed real partial payments).

## Key docs

**Map (read this first):** `docs/README.md`

| Need | File |
|---|---|
| Business, ERP, landmines | `docs/context.md` |
| Financial math | `docs/financial-rules-engine-spec.md` (banner first — Rule C body is stale) |
| Tables / views / RPCs | `docs/schema/` then `docs/db-schema-reference.md` |
| Shared-DB isolation | `docs/isolation-checklist.md` — Ckrea = `v2` |
| Login Edge Function (source is **not** in this repo; §11 wins on conflict) | `docs/reference/user-admin-edge-function.md` |
| Electricity invoices | `docs/electricity-invoice-process.md` |
| Env var names | `.env.example` |
| What shipped | `CHANGELOG.md` |
| Why a decision was made | `docs/JOURNAL.md` (history, not onboarding) |

## UI

- Language: Spanish (labels, fields, routes). Code in English.
- Currency: `Intl.NumberFormat('es-CO')`
- Status: emerald = on-time, amber = grace, rose = late, slate = inactive
- Sidebar: dark slate-900, 220px. Content: slate-50, white cards, rounded-xl

## DB

- Company-scoped from day one (C-Krea vs Reymon share the database)
- Auth trigger is `on_auth_user_created_v2` → `v2.handle_new_user()` — never an unsuffixed name
- RLS on all tables
- `service_role` is server-side only, this app only
- `siesa_raw` = SELECT only

## Env

`.env.local` (never commit) and `.env.test` (local Docker). Names: `.env.example`.
