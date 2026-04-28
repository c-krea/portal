# C-Krea PayControl — Project Context

**Last updated:** 2026-04-26

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

## Current status (2026-04-28, mid-Phase G)
- Phase: **G — Portal refactor mid-flight**. G.0 mapping doc + G.1 infrastructure DONE. G.2 (data migration) next.
- Phases A→E done. v2 schema applied to prod (12 tables + 4 vistas + 5 RPCs in `v2` schema). siesa_raw populated.
- Branch: `refactor/v2-migration` — uncommitted G.1 changes in working tree.
- G.1 just done: helpers v2.user_empresa_id/rol/inquilino_id, RLS+45 policies, PostgREST exposes v2, Drizzle v2 schema, `src/lib/db/v2.ts` + `src/lib/empresa.ts`. TS build clean.
- C-Krea UUID `00000000-0000-0000-0000-000000000001`, NIT `900123456` — preservar en G.2 para que public.profiles.company_id siga matcheando.
- **Next entry point**: G.2 data migration FK-ordered (empresas → inquilinos → locales → contratos → ...). See `~/.claude/projects/.../memory/g_migration_state.md`.
- Pending phases inside G: G.2 → G.3 sync → G.4 refactor 35 files → G.5 build → G.6 preview → G.7 merge. Then F (archive public) → H (copilot tools).

## Last major decisions
- **v2 schema design** (Session 34, 2026-04-26): collapse 25 tables to 12 + views + RPCs. `siesa_clasificacion` never used; PP only at payment time; PP+phase stack; NIT=identity.
- **Date scope Opción B** (Session 34): vista_pagos exposes full history; date cutoff lives in RPCs/consumers, not in vista. 2024 retained for PP signal.
- **NIT join keys fix** (Session 35): `cartera.documento` and `documentos.doc`, NEVER `cliente`. See feedback_nit_columns.md.

## Biggest current gotchas
- **Supabase free tier blocks direct port 5432.** All local DB tools must use pooler URL: `postgres.bosylehvmtwtqkrlievy:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres`. Vercel prod DATABASE_URL still needs the same update.
- **`documentos` tipo='Descuentos' rows** (PP del 10% as separate accounting entry, RK-/CN- prefix) break naive `vista_facturas` queries. Filter `tipo='Facturas'` or expose `is_factura` flag. Task #11.
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
