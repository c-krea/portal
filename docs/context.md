# C-Krea PayControl — Project Context

**Last updated:** 2026-04-28

## What is this
C-Krea manages ~85 commercial rental units in Central Kreativa, a mall-like property in Bogotá, Colombia. This portal replaces manual Excel-based billing and payment tracking.

## The problem being solved
- 85 units billed monthly with complex discount rules (phase-based + early payment)
- Manual Excel tracking = errors, delays, no real-time visibility
- Shared expenses (gastos: water, electricity) distributed manually
- Siesa ERP (external accounting system) requires exact XML format for every transaction
- Raymond (another company) shares the same Siesa DB — data must be filtered from day 1

## Business rules that drive everything
1. Each tenant has a contract with time-based phase discounts (e.g., 20% off first 5 months)
2. Paying within 10 days of invoice = 10% early payment discount (pronto pago)
3. Late payment = 0.05%/day interest accruing from day 11
4. Shared expenses: water flat $29,947/unit, electricity individually metered
5. IPC (inflation) applied individually per tenant on their contract anniversary date (5.1% for 2026)

## Siesa ERP integration
- SQL Server database with C-Krea data (and Raymond data mixed in)
- Pull contracts, tenants, invoices, payments, gastos from Siesa
- Push validated records back as XML files in exact format
- Must be 100% accurate — Siesa is the legal financial record

## Users
- **Admin/Finance team** (primary): Full access, bulk actions, Siesa sync, reports
- **Management** (secondary): Executive dashboard, read-only
- **Tenants** (Phase 2): Self-service payment view

## Current status (2026-04-28, Phase G COMPLETE)
- Phase G **shipped to production** end of Session 38. Merge commit `2532efb` on `main`. Vercel prod Ready.
- All 7 sub-phases done: G.0 mapping → G.1 infra → G.2 data migration → G.3 cron sync → G.4 36-file portal refactor (6 subgrupos) → G.5 build clean → G.6 preview verified → G.7 merge to main.
- Portal reads `v2.*` Spanish-named tables exclusively. `public.*` legacy tables still exist but **nothing in code reads them** — safe to archive in Phase F.
- Cron `/api/cron/sync-v2` runs daily 05:30 COT (Hobby cap = 1×/day).
- C-Krea UUID `00000000-0000-0000-0000-000000000001`, NIT `900123456`, looked up via `getEmpresaCkreaId()` helper.
- **Next entry points**:
  - **Phase F** — archive 25 old `public.*` tables (DROP or move to `legacy.*` schema). Now unblocked.
  - **Phase H** — copilot tool surface (separate concern, AI agent over data).

## Last major decisions
- **Phase G shipped** (Session 38, 2026-04-28): 36 portal files migrated to `v2.*`. invoice-engine + reconciliation are now no-op stubs (Siesa upstream).
- **Vercel Hobby cron cap** (Session 38): plan limits crons to 1×/day. `sync-v2` set daily 05:30 COT.
- **v2 schema design** (Session 34, 2026-04-26): collapse 25 tables to 12 + views + RPCs. `siesa_clasificacion` never used; PP only at payment time; PP+phase stack; NIT=identity.
- **Date scope Opción B** (Session 34): vista_pagos exposes full history; date cutoff lives in RPCs/consumers, not in vista. 2024 retained for PP signal.
- **NIT join keys fix** (Session 35): `cartera.documento` and `documentos.doc`, NEVER `cliente`. See feedback_nit_columns.md.

## Biggest current gotchas
- **`vista_facturas.doc_id` ≠ `vista_cartera_actual.documento`**: two different identifier formats (`001-FVS-69739` vs `60344275`). Cannot join. Portal hardcodes `saldo=0`, `status="emitida"` on factura list; cartera page handles its own data.
- **Vercel Hobby cron limit = 1×/day**. Adding more crons or higher frequency = upgrade plan or refactor into one consolidated cron.
- **`invoice-engine.ts` and `reconciliation.ts` are no-op stubs** — signatures preserved so callers compile, but bodies do nothing. If you find yourself "fixing" them, you probably want to fix the upstream Siesa integration instead. Mark for delete in cleanup pass.
- **Supabase free tier blocks direct port 5432.** All local DB tools must use pooler URL: `postgres.bosylehvmtwtqkrlievy:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres`.
- **`documentos` tipo='Descuentos' rows** (PP del 10% as separate accounting entry, RK-/CN- prefix) break naive `vista_facturas` queries. Filter `tipo='Facturas'` or expose `is_factura` flag.
- **Pandas float→str `.0` artifact** lurks in any numeric-looking column read from xlsx. Loader now declares `strip_dot_zero=[col,...]` per sheet — extend if new NIT/code cols appear contaminated.

## Key decisions made
- **Drizzle ORM over Prisma**: chosen for ledger pattern — immutable financial records, double-entry style
- **Supabase**: PostgreSQL + Auth + RLS + Realtime in one (no separate auth service)
- **Company-scoped RLS from day 1**: mandatory to separate C-Krea from Raymond in shared Siesa DB
- **Spanish UI**: all labels/routes in Spanish (business team is Spanish-speaking)
- **Ledger pattern**: financial records are append-only, never mutated after creation

## Open questions / next steps
- [ ] Get DB password from Supabase to complete DATABASE_URL
- [ ] Apply 001_initial_schema.sql to Supabase via MCP
- [ ] Create Drizzle schema files mirroring SQL schema
- [ ] Connect Vercel (re-login with new email)
- [ ] Run Sentry wizard after Vercel is set up
- [ ] Set up Linear project "C-Krea Portal"
- [ ] Seed initial data (company record for C-Krea)
