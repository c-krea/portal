# Mora Page — DIAN Interest Alignment

**Date:** 2026-07-10
**Status:** Approved design (pending spec review → implementation plan)
**Owner:** German / Esteban (C-Krea) · Admin does the actual ERP billing

---

## 1. Goal

Make the Mora page the admin's source of truth for late-interest (interés de mora) billing.
Today the page's interest math disagrees with the admin's DIAN Excel in three ways. Fix them
so that, for the same client, the page equals her Excel's method — and therefore equals it for
every other client too.

**Workflow it serves:** page calculates & shows overdue interest → admin reads the per-invoice
numbers → admin creates the receipts **manually in the Siesa ERP** → admin re-checks against the
page. The portal never writes to the ERP.

---

## 2. Current state & the three errors (verified 2026-07-10)

Interest is computed in `src/lib/data/mora.ts` (`getMoraSummary`, `getMoraRows`) from
`v2.vista_cartera_actual`. Rate lives in `v2.reglas_financieras`.

| # | Error | Effect |
|---|---|---|
| 1 | **Double grace.** Uses `dias_mora − 30`, but `dias_mora` is *already* days past the due date (the 30-day term is baked in). | Undercounts interest by ~30 days on every invoice. |
| 2 | **Wrong rate.** `interes_mora_diario = 0.000667/day` (fixed 2%/mo), never updated. Admin uses the monthly DIAN rate (26,79% E.A. for July 2026 ÷ 366 = 0,0732%/day). | Wrong amount + drifts every month. |
| 3 | **Hidden invoices.** Page filters `dias_mora > 30`, so any invoice 1–30 days overdue (all June invoices) is invisible. | Page misses most of the real overdue set. |

Plus cosmetic bugs: per-row interest hardcoded to `0`; the "0–30 días" aging box is always empty
(rows pre-filtered to `>30`).

**Reconciliation proof (IMAGENN & PUNTO, admin's test client):** her Excel = 3 FVS invoices,
$446.968 interés (cut 8-jul). Current page shows 1 invoice, $86.581. Same invoice FVS-73662:
page $86.581 vs her $361.054 — driven by 10 days charged instead of 38, plus lower rate.

---

## 3. Agreed method (the corrected calculation)

Per FVS invoice:

```
interés = vr_vencido × (tasa_ea_mes ÷ 366) × dias_vencidos
dias_vencidos = GREATEST(0, hoy − fecha_vencimiento_efectiva)

fecha_vencimiento_efectiva =
    fecha_vencimiento            when it looks sane (>= fecha_factura + 25 days)
    fecha_factura + 30 days      otherwise   -- corrects the known old-invoice ERP bug
```

- **Cutoff = always today** (live). Accepted trade-off: won't tie to the admin's *test* sheet to
  the peso (she cut at 8-jul), but the method is identical; going forward she reads and bills same-day.
- **Single monthly rate over the whole span.** The current month's DIAN rate applies to the entire
  `dias_vencidos`, matching her Excel (her 38-day invoice used only July's rate). No per-day rate blending.
- **Base = overdue balance** (`vr_vencido`, the past-due portion only — not `saldo`, which can include a
  not-yet-due `vr_corriente`), so partial payments reduce interest.
- **/366** denominator (DIAN convention), as in her Excel.

Only 1 current invoice hits the bug branch: IMPROEXPRESS FVS-72667 (April, ERP `fecha_vence` = factura+10).
It goes from 90 → 70 días (≈ $118.173 → $91.912). All May+ invoices use the ERP date and match her.

---

## 4. Data model — monthly DIAN rate

New per-month store (keeps history so past receipts stay reproducible):

```sql
CREATE TABLE v2.tasa_interes_mora (
  periodo     text PRIMARY KEY,          -- 'YYYY-MM', e.g. '2026-07'
  tasa_ea     numeric NOT NULL,          -- effective annual, e.g. 0.2679
  actualizado_por uuid,                  -- admin who set it
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

- Admin upserts the current month's rate from the Mora page.
- Calculation reads the rate for the **current month** (the cutoff month). If the current month's
  rate is not yet entered, the page shows a clear "falta la tasa DIAN de <mes>" prompt and holds
  interest at 0 rather than guessing.
- Schema conventions: `v2` schema only, RLS on, idempotent migration. `reglas_financieras.interes_mora_diario`
  is left in place but no longer used by the Mora engine (note it in the migration; do not repurpose silently).

---

## 5. Code changes

**`src/lib/data/mora.ts`**
- Rewrite the interest expression: drop `dias_mora − 30`; use `dias_vencidos` (§3) × `(tasa_ea/366)` × `saldo`.
- Read `tasa_ea` for the current periodo from `v2.tasa_interes_mora`.
- Restrict to `factura LIKE 'FVS-%'` and `vr_vencido > 0`.
- Remove the `dias_mora > 30` gate — include every invoice with `dias_vencidos > 0`.
- Compute interest for **all** overdue tenants (active + jurídica + ex-tenant); keep the two display
  sections. Populate real per-invoice interest (stop hardcoding `0`).
- **Top KPI cards = active tenants only.** The Cartera Jurídica section shows its own interest subtotal
  separately (not folded into the main KPIs).
- Add a per-invoice detail read (per tenant): factura, fecha_factura, fecha_vencimiento_efectiva,
  dias_vencidos, saldo, interés.
- Update cache tags: interest now depends on `v2.tasa_interes_mora` → the rate writer must bust the mora cache.

**New:** `getTasaMoraDian(periodo)` / `saveTasaMoraDian(periodo, tasaEa)` in a data module + a server action.
The save action busts the mora cache (see [[feedback_cache_invalidation_completeness]]).

**`src/app/(app)/mora/page.tsx` + `src/components/mora/mora-table.tsx`**
- Add the **"Tasa DIAN del mes"** input control (upsert current month).
- Fix KPI cards to show real totals (interest + cartera vencida across the billed set).
- Make each tenant row **expandable** to its per-invoice detail.
- Fix aging buckets (0–30 box populated; interest shown).

---

## 6. Scope / non-goals

- **No ERP writes.** Portal calculates & displays only; admin creates receipts in Siesa manually.
- **No auto-billing / no notifications** in this change.
- Notes (NSC/RK/CN) excluded — FVS only.
- Not touching the pagos-page bucket logic or the financial-rules engine spec beyond the mora interest path.

---

## 7. Testing & safety (live money DB)

- **All work on the local Supabase test DB (Docker), never prod.** If the local test DB is not set up
  for this project, STOP and set it up first (`local-test-db` skill) — do not test interest math on prod.
- Golden check: reproduce IMAGENN's 3 invoices and confirm the engine matches her DIAN formula at a
  fixed cutoff (8-jul → her exact $446.968), then confirm "today" behaves as expected.
- Verify the old-invoice bug branch on IMPROEXPRESS FVS-72667 (70 días, not 90).
- Confirm partial-payment invoices use remaining `saldo`.
- Migration is idempotent and re-runnable.
- Prod deploy only after German's explicit "go", with the exact migration + diff shown first.

---

## 8. Resolved at spec review (2026-07-10)

- **KPI "Interés Acum." scope:** active tenants only. Jurídica/ex-tenant interest is shown as a
  separate subtotal in the Cartera Jurídica section, not folded into the top KPIs.
- **Export/print of the per-invoice list:** deferred to a fast follow-up (not in this change).
  Admin works from the expandable per-invoice detail for now.
- **Testing:** local Supabase test DB (Docker) to be set up for this project before implementation.
