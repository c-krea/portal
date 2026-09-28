# C-Krea PayControl — Project Context

**What it is:** a portal that runs billing and payment control for ~85 commercial rental units in
Central Kreativa, a mall-like property in Bogotá. It replaced manual Excel billing.

This is the **only live page** for the business, the ERP, and the money rules. Other files point
here. They do not get a second copy of the formulas.

Doc map: `docs/README.md`.

This file states **nothing countable** — no table counts, no rates that change yearly. A doc that
misstates a money rule is worse than no doc. If a number can go stale, it does not belong here.

| To find | Look at |
|---|---|
| Tables, columns, RPCs, RLS | `docs/schema/` then `docs/db-schema-reference.md` — or query the live DB. **Not** `supabase/migrations/` (one file; schema was applied directly). |
| Recaudo filters | `v2.vista_pagos` in `docs/schema/02_vistas.sql` |
| Routes | `src/app/` |
| Cron | `vercel.json` and `src/app/api/cron/` |
| What shipped | `CHANGELOG.md` |
| Why a decision was made | `docs/history/JOURNAL.md` (archive, not onboarding) |
| Old money spec (including the superseded mora formula) | `docs/history/financial-rules-engine-spec.md` |

---

## The business

C-Krea rents commercial units in Central Kreativa. Tenants are billed monthly for **canon** (rent,
which already includes water), plus individually metered electricity. The complications that shape
every part of the system:

- **Phase discounts** — a tenant may pay a reduced canon for their first months.
- **Pronto pago** — paying that invoice early earns a contract % off, applied at payment time only.
- **IPC (inflation)** is applied per tenant, on their own contract anniversary — not on a common date.
- **Electricity is billed separately from canon**, on its own period convention.
- **Reymon shares the same Siesa ERP database.** An unfiltered query returns another company's money.

## The ERP relationship — read this before anything else

**Siesa is the legal financial record. This portal is a reader, not a writer.**

The ERP **pushes** exports into the `siesa_raw` schema every few hours (zone `Z40`).
`v2.sync_desde_raw()` refreshes portal tables from that dump. `v2` holds the portal's **own**
metadata and display data, never a competing copy of the money.

`scripts/sync-csf.ts` is a leftover manual top-up. It is not the source of truth. Do not write a
new pull.

Two consequences that catch people:

1. **A frozen push looks exactly like a filter bug.** If a page shows $0 for a recent range, check
   `siesa_synced_at` *first*. A stale cartera combined with live-date interest bills tenants growing
   interest on money they have already paid.
2. **`siesa_raw` date columns are `timestamptz`.** Read into JS as ISO strings, they become
   `Invalid Date` → `NaN` → a silently wrong number. Cast `::date` in SQL.

## Money rules

If portal math disagrees with this section, something is wrong. Implementation:
`src/lib/data/mora.ts`, `src/lib/pronto-pago.ts`.

### Invoice chain (rent)

```
canon − phase discount → IVA 19% on that net → minus pronto pago (if paid in the window) → plus mora (if late)
```

Pronto pago does **not** reduce the IVA base. Electricity is a **separate** bill and is not in this
chain. Pronto pago does not cut electricity.

### A — Pronto pago

Valid within **10 calendar days** of **each invoice's own** `fecha_factura`: issue day is day 0,
last eligible day is day 10 (`diffDays >= 0 && diffDays <= 10`). There is **no** extra 11th-day
rule. Bogotá time. Helper: `src/lib/pronto-pago.ts` — that function is the rule, not a comment.

Applied **only at payment time** — never deducted on an invoice or a projection. The live % comes
from `siesa_raw.ocupacion.pronto_pago` when present, else the contract (`contratos.pronto_pago_pct`).
Often 10%, sometimes 0 / 20 / 30. Applied to `ventas` (canon net, pre-IVA). Do not trust the ERP's
`fecha_pronto_pago` column.

**Recorded twice** in the ERP: `recaudo.pronto_pago` as the charge, and a `documentos` row of
`tipo='Descuentos'` (`RK-` / `CN-` prefix) at closing. Any query over `vista_facturas` that does
not filter these double-counts.

The live code applies the contract PP % whenever the date window hits. It does **not** turn PP off
because a phase discount is also active. Do not copy the old spec's "mutually exclusive" line.

### B — Phase discount

Time-limited % off canon, from the contract, expires by month. The ERP pushes the current step.

### C — Mora (late interest)

DIAN / Superfinanciera, art. 635 E.T. **Not** a flat daily percentage:

```
interés = vr_vencido × (tasa_ea_mes ÷ 366) × días_vencidos
```

The rate lives in `v2.tasa_interes_mora` and is entered by an admin. If this calendar month has no
row, Mora and the tenant portal use the latest earlier month so interest is not billed as zero.
The box stays editable and warns when it is using last month.

Days count from the **effective due date** = `fecha_factura + 30`, always (`moraVencEfecExpr` in
`mora.ts`, used by Mora, the tenant portal and the Pagos estado). The ERP's `fecha_vencimiento` and
`dias_mora_al_pago` are never used — Siesa's due dates are misconfigured (the old bug set due at
factura+10). There is no grace period on top: a payment is late from day 31 after its invoice.
That is **not** the pronto-pago 10-day window. Two clocks.

The old rule — **0.05%/day from day 11** — is wrong twice (method and start day). Some UI strings
still say `0.05%/día`; the math does not.

### D — Gastos

Water is included in canon (not a separate invoice). Electricity is metered and billed on its own
period. Other shared gastos are absorbed by C-Krea.

### Recaudo filters

**`siesa_clasificacion` / `clasificacion` must never be used** for classifying payments.
The four filters live in `v2.vista_pagos` (`docs/schema/02_vistas.sql`): zone `Z40`,
`cruce LIKE 'FVS-%'`, `valor_final < 1_000_000_000`, and dedup by `row_id_mov`.
Do not dedup by invoice+date — that collapsed real partial payments.
Read payments through that view.

### Identity

The NIT lives in `cartera.documento` / `documentos.doc`. The `cliente` column is a razón social, not
an identifier. `tipo_persona` ('PJ'/'PN') drives retefuente; `juridica` means legal collections.
They are unrelated and must not be conflated.

## Users

| Role | Sees |
|---|---|
| Admin / finance | everything: billing, payments, ERP sync state, reports |
| Management | executive dashboard, read-only |
| Tenant | their own units, invoices and meter readings |

## Locked technical decisions

- **`siesa_raw` is never written** from this app. Portal meter readings and energy invoices **upsert**
  (latest row for that local/period wins). Do not describe those upserts as an append-only ledger.
- **Supabase** — Postgres + Auth + RLS + Realtime. Company-scoped RLS from day one.
- **Spanish UI**; code in English.
- **Next.js App Router.** In Next 16 the middleware file is `src/proxy.ts`.

## Platform limits

- **Vercel Hobby caps cron at 1×/day.** Consolidate rather than add. Schedules: `vercel.json`.
- **App queries run under an 8-second `statement_timeout`.** Over it, the user sees "Error al cargar".
  The Supabase MCP has no such timeout — a query can look healthy in testing and fail in production.
- **The free tier blocks direct port 5432** — local tools must use the pooler host.
- **Production deploys currently require git author `gburgos293@gmail.com`** or Vercel blocks them.
  Change that in Vercel when ownership moves.

## Shared infrastructure

This Supabase project is shared with Cartera, Rutas, Satélites and reymon-db, each in its own
schema. Isolation is a security boundary (`docs/isolation-checklist.md` — that file is a **template
for new apps**. Ckrea **is** `v2`; do not run “revoke v2” against this app).

**This app holds `SUPABASE_SERVICE_ROLE_KEY` server-side** and creates logins in
`src/app/(app)/usuarios/actions.ts`. The shared Edge Function spec
(`docs/reference/user-admin-edge-function.md`, §11 wins) is for apps that must *not* hold that key.
Ckrea is the exception until someone migrates it. The function’s source does **not** live in this repo.
