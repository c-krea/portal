# C-Krea PayControl — Project Context

**What it is:** a portal that runs billing and payment control for ~85 commercial rental units in
Central Kreativa, a mall-like property in Bogotá. It replaced manual Excel billing.

---

## How to read this file

Doc map for the whole repo: `docs/README.md`.

This file holds only what the code **cannot** tell you: the business, the money rules, and the shape of
the ERP relationship. It deliberately states **nothing countable** — no table counts, no route
lists, no rates that change yearly.

A doc that misstates a money rule is worse than no doc. If a number can go stale, it does not belong here.

| To find | Look at |
|---|---|
| Tables, columns, RPCs, RLS | `docs/db-schema-reference.md` and `docs/schema/` — or query the live DB. **Not** `supabase/migrations/`: it holds one file, because this schema was applied directly to the database. |
| The money rules as implemented | `docs/financial-rules-engine-spec.md` and `src/lib/data/mora.ts` |
| Recaudo filters | `v2.vista_pagos` in `docs/schema/02_vistas.sql` |
| Routes | `src/app/` |
| Cron jobs and their schedules | `vercel.json` and `src/app/api/cron/` |
| What shipped, when | `CHANGELOG.md` |
| Why a decision was made, and what broke | `docs/JOURNAL.md` (history, not onboarding) |

---

## The business

C-Krea rents commercial units in Central Kreativa. Tenants are billed monthly for **canon** (rent),
plus shared expenses, plus individually metered electricity. The complications that shape every
part of the system:

- **Contracts carry phase discounts** — a tenant may pay a reduced rate for their first months.
- **Pronto pago:** paying early earns a 10% discount, which is applied at payment time and never in
  a projection or an invoice.
- **IPC (inflation) is applied per tenant, on their own contract anniversary** — not on a common
  date, so at any moment tenants sit at different rates.
- **Electricity is billed separately from canon**, on its own period convention.
- **Reymon shares the same Siesa ERP database.** C-Krea data must be filtered from Reymon's at
  every read. This is not a nicety — an unfiltered query returns another company's money.

## The ERP relationship — read this before anything else

**Siesa is the legal financial record. This portal is a reader, not a writer.**

The ERP **pushes** exports into the `siesa_raw` schema every few hours. Nothing here pulls, and the
old pull scripts are dead. Every figure the portal shows about money — invoices, payments, cartera,
occupancy — must trace back to `siesa_raw`. The `v2` schema holds the portal's **own** metadata and
display data, never a competing copy of the money.

Two consequences that catch people:

1. **A frozen push looks exactly like a filter bug.** If a page shows $0 for a recent range, check
   `siesa_synced_at` *first*. A stale cartera combined with live-date interest bills tenants growing
   interest on money they have already paid.
2. **`siesa_raw` date columns are `timestamptz`.** Read into JS as ISO strings, they become
   `Invalid Date` → `NaN` → a silently wrong number that TypeScript cannot catch. Cast `::date` in
   SQL.

## Money rules

**Late interest uses the DIAN / art. 635 E.T. method**, not a flat daily percentage:

```
interés = vr_vencido × (tasa_ea_mes ÷ 366) × días_vencidos
```

The rate comes from `v2.tasa_interes_mora` and is entered by an admin. If this calendar month has
no row, Mora and the tenant portal use the latest earlier month so interest is not billed as zero.
The box stays editable and warns when it is using last month. Interest counts from the **effective
due date**. Implementation: `src/lib/data/mora.ts`.

*(The old rule — 0.05%/day from day 11 — is wrong twice over: the method changed to DIAN, and the
grace period was corrected to start interest on day 31, not day 11. Siesa's `fecha_vence` is
misconfigured for pre-May invoices; use `financia - 30`.)*

**Pronto pago** is valid within 10 days of **each invoice's own** `fecha_factura`, counted from the
day after, in Bogotá time. It is per-invoice, computed on the canon base, and applied **only at
payment time** — never deducted in a projection or an invoice. Do not trust the ERP's
`fecha_pronto_pago` column. Shared helper: `src/lib/pronto-pago.ts`.

**The 10% pronto pago is recorded twice** in the ERP — once on `recaudo.pronto_pago` as the charge,
once as a `documentos` row of `tipo='Descuentos'` (`RK-`/`CN-` prefix) at closing. Any query over
`vista_facturas` that does not filter these double-counts.

**`siesa_clasificacion` / `clasificacion` must never be used** for classifying payments.
The four recaudo filters live in `v2.vista_pagos` (`docs/schema/02_vistas.sql`): zone `Z40`,
`cruce LIKE 'FVS-%'`, `valor_final < 1_000_000_000`, and dedup by `row_id_mov`.
Do not dedup by invoice+date — that collapsed real partial payments.
Read payments through that view.

**Identity is the NIT**, and it lives in `cartera.documento` / `documentos.doc`. The `cliente`
column is a razón social, not an identifier. `tipo_persona` ('PJ'/'PN') drives retefuente; `juridica`
means legal collections. They are unrelated and must not be conflated.

## Users

| Role | Sees |
|---|---|
| Admin / finance | everything: billing, payments, ERP sync state, reports |
| Management | executive dashboard, read-only |
| Tenant | their own units, invoices and meter readings |

## Locked technical decisions

- **Drizzle ORM** — chosen for the ledger pattern: financial records are append-only, never mutated.
- **Supabase** — Postgres + Auth + RLS + Realtime in one, no separate auth service.
- **Company-scoped RLS from day one** — mandatory, because Reymon's data is in the same database.
- **Spanish UI** throughout; code in English.
- **Next.js App Router.** Note: in Next 16 the middleware file is `src/proxy.ts`. Public routes and
  the matcher live there.

## Platform limits worth knowing before you design around them

- **Vercel Hobby caps cron at 1×/day.** More frequent schedules are rejected at deploy. Consolidate
  rather than add.
- **App queries run under an 8-second `statement_timeout`.** Over it, the query is cancelled and the
  user sees "Error al cargar", not a 404. The Supabase MCP has no such timeout, so a query can look
  healthy in testing and fail in production.
- **The free tier blocks direct port 5432** — local tools must use the pooler host.
- **Production deploys currently require git author `gburgos293@gmail.com`** or Vercel blocks them. Change that in Vercel when ownership moves.

## Shared-infrastructure reality

This Supabase project is shared with Cartera, Rutas, Satélites and reymon-db, each in its own
schema. Two things follow: schema isolation is a security boundary, not tidiness
(`docs/isolation-checklist.md`), and login creation for every Reymon app goes through one deployed
Edge Function so no app holds the `service_role` key — its spec is
`docs/reference/user-admin-edge-function.md`, and it is the canonical record because **that
function's source does not live in this repo**.
