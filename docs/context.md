# C-Krea PayControl — Project Context

**Last updated:** 2026-04-16

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

## Current status (2026-04-16)
- Phase: Initial setup
- What's done: Project bootstrapped (Next.js 16, Tailwind, shadcn/ui, Drizzle, Supabase)
- What's next: Apply DB schema to Supabase, set up Drizzle schema files, connect Sentry/Vercel/Linear

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
