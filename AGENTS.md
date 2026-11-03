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
- Show the exact diff before any prod write.
- Portal meter/energy rows upsert. Money rules: `docs/context.md` only.

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

Migrations: develop on local first, then propose the diff for prod. `supabase/migrations/` holds the changes made since the schema dump (`v2.tasa_interes_mora`, mora snapshots, portal visits, `v2.lecturas_medidor.updated_by`). Schema of record is `docs/schema/` plus those migrations plus the live DB.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · TanStack Table · **recharts** · React Hook Form + Zod · Drizzle ORM · Supabase · Vercel · Sentry

In Next 16 the middleware file is `src/proxy.ts`.

## Money

Live rules: **`docs/context.md` only.** Do not use `docs/history/financial-rules-engine-spec.md` for
current mora — its §4.1–4.4 is the old 0.05%/day / day-11 formula.

Siesa is the legal record. This portal reads; it does not write money back. Payments:
`v2.vista_pagos` (`docs/schema/02_vistas.sql`). Never filter by `clasificacion`.

## Key docs

**Map (read this first):** `docs/README.md`

| Need | File |
|---|---|
| Business, ERP, money | `docs/context.md` (the only live money page) |
| Tables / views / RPCs | `docs/schema/` then `docs/db-schema-reference.md` |
| Shared-DB isolation | `docs/isolation-checklist.md` — Ckrea = `v2` |
| Login Edge Function (source is **not** in this repo; §11 wins on conflict) | `docs/reference/user-admin-edge-function.md` |
| Electricity invoices | `docs/electricity-invoice-process.md` |
| Env var names | `.env.example` |
| What shipped | `CHANGELOG.md` |
| Why / old money spec | `docs/history/` |

## UI

- Language: Spanish (labels, fields, routes). Code in English.
- Currency: `Intl.NumberFormat('es-CO')`
- Status: emerald = on-time, amber = grace, rose = late, slate = inactive
- Sidebar: dark slate-900, 220px. Content: slate-50, white cards, rounded-xl

## DB

- Company-scoped from day one (C-Krea vs Reymon share the database)
- Auth trigger is `on_auth_user_created_v2` → `v2.handle_new_user()` — never an unsuffixed name
- RLS on operational money tables. `agente_chat` has none by design.
- `service_role` is server-side, **this app only** (login create uses it). Other apps must not copy that.

## Env

`.env.local` (never commit) and `.env.test` (local Docker). Names: `.env.example`.

## Reusable helpers

Reach for these before writing a second copy.

- `src/lib/data/mora.ts` | `moraVencEfecExpr` · `moraEnMoraBaseSql` · `moraEsJuridicaExpr` · `moraPastDueExpr` · `moraDiasVencidosExpr` · `moraInteresExpr` | the ONE mora rule: due date is `fecha_factura + 30`, jurídica is the flag only. Never re-inline — an audit once found 7 independent definitions. The ERP's `fecha_vencimiento`, `dias_mora_al_pago` and `grace_period_days` must never decide mora.
- `src/components/pagos/info-tip.tsx` | `InfoTip({ text })` | instant hover tooltip. Its card must not have `overflow-hidden` or the tooltip is clipped.
- `src/components/layout/page-header.tsx` | `PageHeader({ title, children })` | `title` takes a ReactNode, so a page can compose an icon or tooltip inline.
- `src/components/layout/periodo-dropdown.tsx` | `PeriodoDropdown({ periodos, periodo, basePath })` | shared period picker (Gastos, Medidores).
- `src/lib/data/portal.ts` | `getPortalProfileByTenantId(tenantId)` | tenant-shaped portal data without that tenant's session — used by the staff Ver-portal preview.
- `src/app/(portal)/portal/portal-dashboard.tsx` | `PortalDashboard({ profile, readOnly? })` | the tenant dashboard body, shared by the real route and the staff preview so both render identical money math.
