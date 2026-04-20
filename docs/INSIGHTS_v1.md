# C-Krea Build Retrospective + New App Blueprint
*Generated 2026-04-17 — German Burgos*

---

## What we built (in ~24 hours)

18-route production web app.
Real DB. Real payments. Real ERP export. Live on Vercel.
All 4 financial rules implemented. Auth + RLS. Daily cron. Sentry. Linear.

---

## What went well

### 1. Financial rules spec first
Writing `financial-rules-engine-spec.md` before touching a single line of code was the single best decision of the project. Every invoice, every PP calculation, every interest accrual had a spec to check against. When a number was wrong we didn't guess — we re-read the spec.

**Do this again for manufacturing.** Write the payment rules doc before writing any code.

### 2. Ledger / immutable data mindset
Projections never mutated. PP tracked on payment records, not baked into projections. Interest accruals appended, never deleted. Siesa cartera treated as a snapshot, not editable truth.

This saved us from double-counting bugs and made reconciliation explainable at every step.

### 3. Seed data early, with real numbers
Having 78 real contracts + 2,696 real payments in the DB by session 3 meant every chart and KPI was immediately trustworthy. We caught the PP mutual-exclusivity bug because the numbers didn't match Power BI. If we'd used mock data we'd have shipped wrong math.

**For manufacturing:** get the Excel file into the DB in session 1 or 2, before building any UI.

### 4. Server components for all data fetching
No useEffect + fetch. No loading state spaghetti. Server components query DB → pass props to client components. Client components handle only interactions (tables, tabs, charts).

The RSC boundary (`"use client"` wrapper for Recharts/Tremor) was the one pattern worth drilling in every chart you build.

### 5. One data layer per domain
`src/lib/data/` — one file per domain (clientes, mora, pagos, gastos, etc.). Every SQL query lives there. Pages import and use. Nothing leaks across.

### 6. `execute()` over raw Drizzle for production
The Supabase IPv6 blocker would have been a deploy-day disaster if we'd discovered it late. The `executor.ts` pattern (Postgres fn over HTTPS) is now proven and reusable. Copy it to any Supabase+Vercel project.

### 7. Record-keeping discipline
JOURNAL.md + CHANGELOG.md + Linear — every session closed with updates. Saved enormous time: new sessions started with full context, never redoing decisions.

---

## What caused pain (do differently)

### 1. IPv6 surprise on deploy
Discovered on session 14 (not session 1). 29 files had to be migrated.

**Fix for next time:** On day 1, create `executor.ts` and verify it works on Vercel before building a single data layer. All queries go through it from the start. Zero migration cost later.

### 2. `force-dynamic` discovered at Vercel build time
Every `(app)` page needed it. Found out after first deploy. 18 pages to add it to.

**Fix:** `src/app/(app)/layout.tsx` or a template file — add it once at route group level, or just do it as part of creating every page (make it a habit from page 1).

### 3. Env vars corrupted by `echo`
Hit us twice. `echo "value"` appends `\n`. Vercel stores the newline. Two hours debugging silent auth failures.

**Fix:** Always `printf "value" | vercel env add`. Document this in project CLAUDE.md day 1.

### 4. Data model before UI (we got this right but could be faster)
Early sessions had some back-and-forth between UI needs and data shape. The cases where schema didn't quite fit (e.g., `is_allocated` on gastos — designed but never used) added noise.

**Fix for next time:** Run one dedicated "schema + seed" session before any UI. Treat the schema as a contract. Don't build UI until data is in DB.

### 5. Reconciliation model decided late
PP reconciliation model (Option B: projections immutable, PP on payment records) was finalized in session 17. We'd been carrying wrong PP values in projections for 10+ sessions.

**Fix:** Financial model decisions (especially "where does X live?") should be locked in the spec doc before any inserts. Create a "Data Model Decisions" section in the spec.

### 6. Siesa integration underspecified
We built CSV export without knowing Siesa's real API format. The XML FVS export is still pending a meeting.

**Fix for CSA ERP:** Before building any export, get the actual format doc from IT. Build a thin adapter layer; keep it separate from your business logic. Don't couple your data model to ERP format.

---

## For the new manufacturing app — specific advice

### Context you described
- Manufacturing company, B2B (sells to stores)
- Track payments IN (from stores/clients) + OUT (to suppliers, etc.)
- Integrate with CSA ERP (read their data, same as Siesa relationship)
- They gave you an Excel file with ERP download

### What's the same
- B2B payment tracking → same ledger pattern (immutable, append-only transactions)
- ERP as source of truth → same adapter layer approach
- Supabase + Next.js App Router + Vercel → exact same stack, proven
- Financial rules doc first → same discipline

### What's different

**Accounts Receivable (AR) — more complex**
Stores typically get credit terms (30/60/90 days net). You'll need:
- `invoice_date`, `due_date`, `payment_terms_days` per client
- Aging buckets by DUE date (not invoice date)
- Partial payments common — FIFO allocation engine (same as C-Krea reconciliation)
- Credit limits per client

**Accounts Payable (AP) — new territory**
C-Krea had no AP. Manufacturing does:
- Supplier invoices in
- Payment runs out (multiple invoices paid in one bank transfer)
- You need a `payables` table separate from `receivables`

**Multi-currency (check with client)**
If they import raw materials, some payables may be USD. Flag this early — retrofitting currency later is painful.

**Product catalog / SKUs**
Unlike rental (one "product" per unit), manufacturing invoices have line items (product, qty, price). Your invoice model needs line items from day 1.

**Returns / credit notes**
More common in manufacturing. Design for it early. A `credit_note` linked to original invoice, not just a negative payment.

### Stack recommendations for new app

| Decision | Recommendation | Why |
|----------|---------------|-----|
| Framework | Next.js 16 App Router | Proven in C-Krea, same patterns |
| DB | Supabase | Same MCP tooling, same IPv6 fix applies |
| ORM | Drizzle | Proven |
| Auth | Supabase Auth | Same trigger pattern |
| Charts | Recharts (direct, not Tremor) | Tremor has formatter limitations across RSC boundary. Recharts direct = full control |
| Tables | TanStack Table v8 | Same, proven |
| Forms | React Hook Form + Zod | Same |
| Deployment | Vercel | Same, known gotchas documented |
| Error tracking | Sentry | Same |

**One upgrade to consider: server actions everywhere**
In C-Krea some mutations went through `supabaseAdmin.from()` directly in server components. For the new app, route all mutations through Server Actions (`"use server"` functions) — better error handling, easier to add validation, revalidation is explicit.

### Day 1 checklist for new app

1. **Financial rules doc** — what are payment terms? discount for early pay? late fee? credit limits?
2. **Schema design** — at minimum: `companies`, `clients`, `products`, `invoices`, `invoice_line_items`, `payments`, `payment_applications`, `suppliers`, `payables`
3. **Import the Excel** — parse their ERP file into the DB before building UI. Know your real data before designing screens.
4. **Create `executor.ts`** from day 1 — Supabase HTTP pattern, not TCP
5. **Every `(app)` page gets `force-dynamic`** as first line — template it
6. **`printf` for all env vars** — no `echo`
7. **Linear issues** — create one per page/feature before building
8. **CSA ERP meeting** — get the API/export format doc from IT before building any integration

### Things to build better the second time

**Authentication roles from day 1**
In C-Krea, roles (admin/finance/viewer) were added but barely enforced in UI. In manufacturing, role-based access matters more (sales vs finance vs warehouse). Wire up `user_role` checks on server side from the first page you build.

**Proper error boundaries per page**
We added `error.tsx` and `loading.tsx` late (session 14). Add them when creating the `(app)/layout.tsx` — 20 lines, saves hours of blank-screen debugging.

**Mobile from day 1**
The hamburger sidebar is still in the backlog for C-Krea. Manufacturing ops people often use phones. If that's likely, build the sidebar responsive from session 2, not session 20.

**Currency formatting**
Colombian COP is `es-CO`. If manufacturing is also Colombia → same formatter. If multinational → build a `formatCurrency(amount, currency)` helper from day 1 that accepts a currency code.

**Audit trail table**
C-Krea relies on append-only records for audit. Consider adding an explicit `audit_log` table (who, what, when, before, after) for sensitive financial actions. One table, catches everything.

---

## Reusable pieces to copy from C-Krea

| File | What it does | Copy as-is? |
|------|-------------|-------------|
| `src/lib/db/executor.ts` | Supabase HTTP query over IPv4 | Yes — exact copy |
| `src/lib/formatters.ts` | `formatCOP`, `formatPercent`, date helpers | Yes (rename formatCOP → formatCurrency) |
| `src/lib/utils.ts` | `cn()` helper | Yes |
| `src/components/layout/` | Sidebar + page-header + mobile nav | Yes — adapt labels |
| `src/app/(app)/loading.tsx` | Spinner on every page | Yes |
| `src/app/(app)/error.tsx` | Error boundary on every page | Yes |
| `src/proxy.ts` | Next.js 16 session proxy pattern | Yes |
| `src/lib/supabase/` | Supabase browser + server clients | Yes |
| `src/components/shared/status-badge.tsx` | Colored pill badge | Yes |
| `src/components/shared/back-button.tsx` | `router.back()` wrapper | Yes |

---

## The meta lesson

**Speed came from decisions made early.**

The sessions where we moved slowest were the ones where we discovered something the model didn't know yet (IPv6, force-dynamic, PP mutual exclusivity).

The sessions where we moved fastest were the ones where the spec was clear, the schema was right, and we just built.

For the new app: spend the first session writing the rules doc, the second importing the Excel, the third designing the schema. Build UI starting session 4. You'll ship faster than C-Krea.

---

*Read this at the start of every new session on the manufacturing app.*
