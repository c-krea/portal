# Product Requirements Document (PRD): C-Krea Payment Control Portal

**Version:** 1.2 (Final Consolidated)  
**Date:** April 15, 2026  
**Author:** Grok (on behalf of your request, after full review of all three project files)  
**Product Name:** C-Krea Portal (internal working title: “C-Krea PayControl”)  
**Platform:** Responsive web app (desktop-first + full mobile support)  
**Target Users:** C-Krea administrative / finance team (primary) + future tenant self-service (Phase 2)

## 1. Executive Summary

C-Krea manages ~80 commercial rental units in a mall-like environment. The new portal will be the **single source of truth** for all tenant payments, replacing manual Excel tracking.

It will:
- Pull contracts, tenants, invoices, payments, and **shared expenses (gastos)** from Siesa
- Automatically apply the complete Financial Rules Engine (early-payment discounts, contract-phase discounts, late-interest accrual, **and pro-rata shared gastos allocation**)
- Provide real-time visibility of every unit’s status (on-time / late / overdue with interest + gastos)
- Push validated records back to Siesa in the exact XML format required (including discounts, late interest, and gastos as separate line items where supported)

**Critical new scope (from Siesa meeting):** Full handling of common-area/shared expenses (gastos) that are distributed across all 80 units (electricity, cleaning, security, etc.). These are **not** optional — they must be centrally tracked, automatically allocated per unit, included in monthly invoices, and reconciled with Siesa.

**Success metrics**
- 100% daily reconciliation with Siesa (no data loss or format errors)
- ≥ 99% accuracy on all rules (discounts, interest, gastos allocation)
- Any tenant’s full history + accrued charges visible in < 10 seconds
- Zero manual re-keying of payments or gastos

## 2. Business Goals & Objectives
- Eliminate all manual spreadsheets for 80+ contracts and shared gastos
- Automatically calculate and apply **every** financial rule (discounts + late interest + gastos allocation)
- Reduce late-payment surprises with proactive alerts and daily interest accrual
- Guarantee perfect auditability and Siesa compatibility
- Prepare Phase 2 tenant self-service payments inside the same portal

## 3. User Personas

**Primary – Admin / Finance Team**  
Needs: Full visibility, bulk actions, manual overrides (discounts/penalties/gastos allocations) with mandatory reason + audit log, reporting, Siesa sync status.

**Secondary – Future Tenant (Phase 2)**  
Needs: View own contract/phase, upcoming due date + discount + late fees + allocated gastos, make payments directly.

**Stakeholder – C-Krea Management**  
Needs: Executive dashboard (total AR, % on-time, discount/penalty/gastos impact, trends).

## 4. Key Features & Functional Requirements

### 4.1 Dashboard & Overview
- Global metrics: Total units, % on-time, total AR (incl. interest + gastos), overdue amount, discount/penalty/gastos value this month
- Filterable tenant list with color-coded status (Green = on-time, Yellow = grace, Red = late/overdue with interest + gastos)
- Quick-search by unit number, tenant name, contract ID

### 4.2 Tenant / Contract Detail View
For every unit:
- Contract metadata (start/end dates, base rent, unit number, tenant info)
- Payment schedule + current phase timeline
- Full payment history table (date, amount, discount, **late interest**, **allocated gastos**, status, Siesa reference)
- Current status badge + days late/until due + total accrued interest + current gastos share
- Visual timeline of contract phases **and** accrued gastos/penalties

### 4.3 Financial Rules Engine (Core – Now Expanded)
Runs automatically on invoice generation, payment receipt, **and daily batch** (for interest + gastos).

**Rule A – Early Payment Discount**  
10-day window from due date → automatic % or fixed discount.

**Rule B – Contract-Phase Discounts** (time-based from contract start)  
Configurable phases (Phase 1, 2, 3 + any additional sections described in meeting).

**Rule C – Late Payment Interest Accrual**  
- Daily accrual on overdue balance  
- Configurable rate (global + per-contract) + optional grace period  
- Always stored/displayed as **separate line item**

**Rule D – Shared Expenses (Gastos) Allocation & Billing** *(New – Critical from Siesa meeting)*  
- Central tracking of common-area gastos (Public services, Cafeteria, Cleaning, Vigilance/Security, Publicity/Marketing, **Electricity** – the largest, allocated pro-rata)  
- Automatic distribution to individual units (fixed amount per unit **or** percentage-based, especially electricity)  
- Included in monthly invoice alongside base rent + discounts + interest  
- Manual overrides/adjustments with audit log  
- Displayed as separate line items for transparency and Siesa reconciliation

### 4.4 Payment Status & Alerts
- Real-time statuses: On-time | Early | Late | Overdue (with interest + gastos) | Partially paid
- Automated email/SMS alerts (including interest and gastos notifications)
- Bulk actions (reminders, grace periods, waive interest, adjust gastos allocation)

### 4.5 Siesa Integration (Must Be 100% Perfect)

**Backend details (from meeting):**
- SQL Server via SQL Server Management Studio (dev uses safe copy of live DB)
- Dedicated API keys already exist and have been used successfully (XML file uploads)
- **Pull**: Query SQL copy (or API) for contracts, tenants, invoices, payments, **gastos**
- **Push**: Generate and upload strictly formatted XML files (discounts, late interest, and gastos as separate lines where possible)
- Raymond overlap: Database contains both C-Krea and Raymond data → **mandatory filtering** from day one (by company ID, unit prefix, tenant identifier)

**Bidirectional flow:**
1. Pull (scheduled + on-demand)
2. Process in portal (apply all rules)
3. Push every new/updated record back to Siesa

**Data sources:** Five sheets already exported from the database (priority: share these immediately so we can build the exact data model + gastos mapping).

### 4.6 Reports & Analytics
- Monthly payment summary
- Discount/penalty/gastos impact report
- Aging receivables (incl. interest + gastos)
- Tenant performance ranking
- Exports (Excel/PDF + Siesa-compatible format)

### 4.7 Security & Compliance
- Role-based access + Row Level Security
- Full audit log of every change (overrides, gastos adjustments, syncs)
- Encryption + backups aligned with Siesa

### 4.8 Responsive Design & UX
- Desktop: full tables + dashboards
- Mobile: card views + simplified flows
- Dark/light mode, accessible

## 5. Non-Functional Requirements & Locked Tech Stack

**Performance:** Tenant list < 2s, detail view < 1s  
**Scalability:** 80 units today → easily 200+  
**Availability:** 99.5% uptime

**Development Methodology (Locked)**  
- 100% of all coding, implementation, and iteration executed exclusively by **Claude (Anthropic) AI**  
- You (developer) guide architecture, agents, workflow, and final reviews only

**Tech Stack (OFFICIALLY LOCKED – Version 1.0, April 15, 2026)**  
- **Frontend:** Next.js 15 (App Router) + TypeScript + shadcn/ui + Tailwind CSS + Tremor + TanStack Table v8 + React Hook Form + Zod  
- **Database & Backend:** Supabase (PostgreSQL + Auth + RLS + Realtime + Storage) + **Drizzle ORM** (chosen for accounting-heavy ledger pattern: immutable transactions, double-entry style, audit trails)  
- **Deployment:** Vercel  
- **Monitoring:** Sentry (errors) + PostHog (analytics)  
- **Task Management:** Linear  
- **Philosophy:** Clean, modular, strongly-typed, AI-friendly codebase with ledger pattern for perfect financial reconciliation

## 6. Phase 2 – Tenant Self-Service (Future)
- Tenant login  
- View contract, phase, due date, discount, late fees, allocated gastos  
- Make payments directly (instant reflection + push to Siesa)

## 7. Questions / Items Already Clarified + Immediate Next Steps
- Siesa integration method and gastos structure now documented.
- **Priority #1:** Share the five database sheets (or at minimum table names + column headers + sample rows) so we can:
  - Build the complete Supabase schema + ERD (including Gastos module)
  - Extend the Siesa adapter for gastos pull/push
  - Map allocation rules (percentages, fixed amounts, etc.)

**Immediate Action Plan (from meeting notes):**
1. Paste the 5 sheets
2. Incorporate Gastos into data model + Financial Rules Engine
3. Begin AI-driven development with Claude using the locked tech stack

---

This is the final consolidated PRD that merges the original requirements, late-interest addition, full Siesa meeting details (including gastos), and the locked tech stack. Everything is now in one living document.

We have a rock-solid scope that covers **rent + all shared gastos** with perfect Siesa compatibility and AI-first development.