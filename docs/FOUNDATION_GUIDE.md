# C-Krea PayControl — Foundation Assembly Guide

**Purpose:** This document tells any Claude session exactly what files exist, what order to read them in, and how they connect. Drop this file + the `/foundation` folder into any new chat and the AI has full project context.

---

## Project Folder Structure

```
C-krea Portal/
├── FOUNDATION_GUIDE.md          ← YOU ARE HERE (read this first, always)
├── foundation/
│   ├── 01_schema_erd/
│   │   ├── 001_initial_schema.sql    ← Supabase-ready PostgreSQL (21 tables, RLS, triggers)
│   │   └── erd_schema.html           ← Visual ERD diagram (open in browser)
│   ├── 02_financial_rules/
│   │   └── financial-rules-engine-spec.md  ← All 4 rules: discounts, phases, interest, gastos
│   ├── 03_ui_ux/
│   │   ├── Step4_UI_UX_Guide.md      ← Screen-by-screen design spec (8 screens)
│   │   └── Step4_Wireframes.html     ← Interactive wireframe prototype (open in browser)
│   ├── 04_api_backend/
│   │   └── Step5_API_Routes_Backend_Logic.md  ← Every endpoint, input/output, rule triggers
│   ├── 05_seed_validation/
│   │   ├── 002_seed_data.sql         ← Realistic seed data for all 85 units
│   │   └── validate_projections.py   ← Reconciliation script vs C-KREA GB.xlsx
│   └── 06_siesa_integration/
│       └── (PENDING — will contain XML format spec, field mapping, sync logic)
├── source_data/
│   ├── PRD_C-krea_vf.pdf            ← Original PRD (image-based, 7 pages)
│   ├── C-KREA GB.xlsx               ← Internal financial projections 2026
│   └── ckrea.xlsx                    ← Siesa ERP export (5 sheets)
└── (future: /src, /supabase, etc.)
```

---

## Reading Order for Any New Claude Session

When starting a new Claude chat for development, paste or reference these files in this exact order. Each step builds on the previous one.

### Step 1 — FOUNDATION_GUIDE.md (this file)
**What it does:** Orients the AI to the full project scope, folder structure, and file relationships.
**Instruction to give Claude:** "Read FOUNDATION_GUIDE.md first. This is the master context for the entire C-Krea PayControl project."

### Step 2 — 001_initial_schema.sql
**What it does:** Defines the complete database — 21 tables covering companies, tenants, units, contracts, contract phases, invoices, invoice line items, payments, payment applications, gastos categories, gastos allocations, interest accruals, and audit logs. Includes RLS policies and trigger functions.
**Why it's read second:** Every other document references table names and column names from this schema. The AI needs this mental model before anything else.
**Instruction to give Claude:** "This is the Supabase PostgreSQL schema. All tables, relationships, and RLS policies are defined here."

### Step 3 — financial-rules-engine-spec.md
**What it does:** Documents the exact calculation logic for:
- **Rule A:** Early-payment discount (10-day window, % or fixed)
- **Rule B:** Contract-phase discounts (time-based, configurable phases)
- **Rule C:** Late-interest daily accrual (configurable rate + grace period)
- **Rule D:** Shared gastos allocation (pro-rata electricity, fixed-amount others)
Includes worked examples with real COP numbers and edge cases.
**Why it's read third:** The Financial Rules Engine is the heart of the app. Every API route, every UI calculation, and every Siesa sync validation depends on these rules being implemented exactly as specified.
**Instruction to give Claude:** "This is the financial rules specification. Every calculation in the portal must match this document exactly."

### Step 4 — Step4_UI_UX_Guide.md + Step4_Wireframes.html
**What it does:** Screen-by-screen design spec for 8 main views (Dashboard, Mora/Overdue, Clientes, Pagos, Gastos, Reportes, Usuarios, Settings). Defines the color system, typography, component library references (shadcn/ui + Tremor + TanStack Table), KPI cards, data table layouts, chart types, and responsive behavior.
**Why it's read fourth:** The UI guide tells the AI what to build visually. It references schema table names (from Step 2) and rule calculations (from Step 3).
**Instruction to give Claude:** "This is the UI/UX specification. Build every screen exactly as described here, using shadcn/ui + Tremor + TanStack Table."

### Step 5 — Step5_API_Routes_Backend_Logic.md
**What it does:** Defines every API endpoint, Next.js server action, and Edge Function organized by domain (auth, tenants, invoices, payments, gastos, interest, Siesa sync, reports, dashboard). Each endpoint specifies inputs, validation with Zod, business logic, which financial rules are triggered, and what gets written to the audit log.
**Why it's read fifth:** This bridges the schema (Step 2) and the UI (Step 4). It tells the AI exactly what happens when a user clicks a button or when a cron job fires.
**Instruction to give Claude:** "This is the backend API specification. Every route, its inputs, outputs, and rule triggers are defined here."

### Step 6 — 002_seed_data.sql + validate_projections.py
**What it does:** Seed data populates the database with realistic data for all 85 units. The validation script checks that the portal's calculations match the C-KREA GB.xlsx projections.
**Why it's read last:** Used after the initial build to verify correctness.
**Instruction to give Claude:** "Use the seed data to populate the database, then run the validation script to confirm calculations match the source spreadsheet."

---

## What's Not Here Yet (And When To Add It)

### Siesa Integration Map (Step 6 in original plan — SKIPPED for now)
**Status:** Pending — requires Siesa XML format documentation, API endpoint details, and SQL Server access information.
**When to add:** Before building the bidirectional sync feature. The portal can run fully on its own seed data without Siesa. Design the sync layer with clean interfaces (the API spec already defines the endpoints) so when Siesa details arrive, it's a plug-in, not a refactor.
**What it will contain:** Column-by-column mapping from Siesa to portal schema, XML push format, sync schedule, and Raymond vs. C-Krea filtering rules.

---

## Source Data Reference (Do NOT modify these files)

These are the original source files used to build the foundation. They stay in `/source_data/` as read-only references.

- **PRD_C-krea_vf.pdf** — The product requirements document. Image-based PDF (needs OCR to read). Contains the full scope, financial rules, Siesa integration notes, and locked tech stack.
- **C-KREA GB.xlsx** — Internal financial projections workbook. 6 sheets: occupancy (85 units, 97.6% occupied), monthly projections per unit (canon, discounts, pronto pago for Jan-Dec 2026), critical receivables (~$112M COP overdue), monthly shared expenses breakdown (~$50-55M COP), and electricity allocation per tenant.
- **ckrea.xlsx** — Siesa ERP export. 5 sheets: Estado de resultados (1,199 journal entries), Documentos (415 invoices/discounts), Ocupacion (84 units with status), Cartera (277 receivable records), Recaudo (3,134 payment records).

---

## Tech Stack (Locked — April 15, 2026)

- **Frontend:** Next.js 15 (App Router) + TypeScript + shadcn/ui + Tailwind CSS + Tremor + TanStack Table v8 + React Hook Form + Zod
- **Database & Backend:** Supabase (PostgreSQL + Auth + RLS + Realtime + Storage) + Drizzle ORM
- **Deployment:** Vercel
- **Monitoring:** Sentry (errors) + PostHog (analytics)
- **Task Management:** Linear
- **Development:** 100% AI-driven coding (Claude), German guides architecture and reviews

---

## Key Business Rules to Never Forget

1. **Raymond filter:** The Siesa database contains both C-Krea and Raymond (sister company) data. Every query must filter by company/zone from day one.
2. **Colombian formatting:** Currency is COP (no decimals in display, use comma as thousands separator in UI). Siesa exports use comma as decimal separator — handle on import.
3. **IPC adjustments:** Each contract has an annual IPC (inflation) adjustment applied on its anniversary date, not January 1st.
4. **Discount phases change over time:** A single contract can go from 20% discount → 10% → 0% at specific month thresholds. The phases are per-contract, not global.
5. **Pronto pago is separate from phase discounts:** A tenant can get both a phase discount AND a pronto pago (early payment) discount simultaneously.
6. **Gastos are mandatory:** Shared expenses are not optional charges — they must be allocated, invoiced, and reconciled for every unit every month.
7. **Ledger pattern:** All financial transactions are immutable. Corrections are new entries, never updates to existing records. This is critical for audit trails and Siesa reconciliation.
