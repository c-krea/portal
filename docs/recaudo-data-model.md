# Recaudo Data Model — Canonical Filter Spec

> **Why this exists:** Any AI tool, query, or report that sums `payments.valor_final` for "recaudo" (collections) MUST apply the 4 filters in this document. Skipping them under-counts, double-counts, or includes ERP plumbing rows that aren't real cash. There is no "approximate" version — wrong filters produce wrong numbers in the wrong direction.
>
> **Audience:** the AI copilot, the engineer wiring its tools, anyone reading numbers from this DB.
> **Last reconciled with Power BI:** 2026-04-25 (March 2026 month, 2.3% gap remaining).
> **Canonical home:** this file (C-Krea Portal repo). Copilot project copies, does not own.

---

## TL;DR

Use this filter for every aggregation that touches `payments.valor_final`:

```sql
WITH deduped AS (
  SELECT DISTINCT ON (tenant_id, siesa_cruce, fecha_recaudo)
    tenant_id, valor_final, pronto_pago_aplicado, fecha_recaudo
  FROM public.payments
  WHERE company_id  = :C_KREA_ID
    AND siesa_cruce LIKE 'FVS-%'
    AND valor_final < 1000000000
  ORDER BY tenant_id, siesa_cruce, fecha_recaudo, id
)
SELECT
  SUM(valor_final)          AS recaudado_cop,
  SUM(pronto_pago_aplicado) AS pp_otorgado_cop,
  COUNT(*)                  AS payment_count
FROM deduped;
```

Prefer calling a server-side RPC (`get_collections_dedup`) over re-implementing the filter in app code. If you must inline it, copy this block verbatim.

---

## The 4 Filters — In Order

| # | Filter | Removes |
|---|--------|---------|
| 1 | `company_id = C_KREA_ID` | Raymond rows mixed in the same `payments` table |
| 2 | `siesa_cruce LIKE 'FVS-%'` | Credit notes (NVS), reversals (RK), cancellations (CN), nullified entries |
| 3 | Dedup `(tenant_id, siesa_cruce, fecha_recaudo)` | RK + 001-RK paired rows — one cash event = two Siesa rows |
| 4 | `valor_final < 1_000_000_000` | FUSION GRAFIK $4.2B data-entry error (2024-04-09) |

### Alternative dedup pattern — NOT EXISTS pair check

Same result, slower. Useful when `DISTINCT ON` isn't available (e.g. PostgREST `.from()` calls):

```sql
WHERE siesa_cruce LIKE 'FVS-%'
  AND valor_final < 1000000000
  AND NOT (
    p.siesa_docto LIKE '001-%'
    AND EXISTS (
      SELECT 1 FROM payments p2
      WHERE p2.tenant_id   = p.tenant_id
        AND p2.siesa_cruce = p.siesa_cruce
        AND p2.siesa_docto = REPLACE(p.siesa_docto, '001-', '')
        AND p2.valor_final = p.valor_final
    )
  )
```

---

## ⚠ FORBIDDEN: `siesa_clasificacion`

The `siesa_clasificacion` column carries values `RECAUDADO`, `VENCIDO`, `NO PROYECTADO`. **Never filter by it.** Three live-DB proofs:

1. **`RECAUDADO + VENCIDO` sums to −$4.6B all-time.** Large negative credit notes carry these labels.
2. **`NO PROYECTADO` totals $12.6B all-time** and grows monotonically ($45M/mo Jan-2024 → $252M/mo Mar-2026). Pure ERP automation noise.
3. **Same payment, two rows, two classifications.** Live test: MATICES COMUNICACION VISUAL SAS (NIT 900547519) — `001-RK` row classified RECAUDADO, paired `RK` row classified NO PROYECTADO. Same cash, same date, same invoice. The label is non-deterministic.

> **Rule for the AI:** if asked "how much was recaudado / vencido / no proyectado", do NOT use the column. Compute from `siesa_cruce` + `fecha_vencimiento` + payment dates. The label is unreliable.

---

## `siesa_cruce` Decoder

| Prefix | Meaning | Include in recaudo? |
|--------|---------|---------------------|
| `FVS-` | Real invoice payment | ✅ Yes |
| `NVS-` | Credit note (money out) | ❌ No |
| `RK-` | Payment offset / receipt | ❌ No |
| `RKM-` | Manual cash receipt | ❌ No |
| `CN-` | Cancellation | ❌ No |
| `NUL` | Nullified entry | ❌ No |

Only `FVS-` rows represent real tenant cash. Everything else is bookkeeping plumbing that nets to zero across the system.

---

## The 001-RK Duplication

Every Siesa payment creates **two rows** in `payments`:

- `RK-XXXX` — receipt entry (cash hit the account)
- `001-RK-XXXX` — application entry (credit posted to invoice)

Same `valor_final`, same `tenant_id`, same `siesa_cruce`, same `fecha_recaudo`. Two rows = one cash event.

**The duplication is in Siesa itself.** Confirmed by spot-check: a single $301,000 payment appears twice in the source Excel export AND in the synced DB. Don't try to "fix" it at sync time — fix it at query time via dedup.

Filter 3 collapses each pair to one row. Standalone `001-RK` rows (no `RK` pair) are kept — they're legitimate.

---

## Power BI Reconciliation — March 2026

| Source | Recaudo |
|--------|---------|
| Portal (4 filters applied) | $242,322,859 |
| Power BI (operations team) | $236,800,000 |
| Gap | $5.5M (~2.3%) |

Gap is documented but not closed. Likely cause: BI uses different month-edge cutoff or includes/excludes specific row types we haven't traced. AI should treat the portal number as authoritative for now and surface the gap if asked.

---

## Known Source-Data Errors (handled by Filter 4)

- **FUSION GRAFIK SAS** (NIT 900984500)
  - `RK-485` + `001-RK-485`, cruce `FVS-45643`, date 2024-04-09
  - `valor_final = $4,215,750,000` — almost certainly missing decimal (should be ~$4,215,750)
  - Filter 4 (`valor_final < 1B`) excludes it. Row remains in DB for audit.

If new outliers appear, prefer raising the threshold over deleting rows. Ledger pattern = no destructive cleanup.

---

## Other Columns You'll See — Use With Care

| Column | Meaning | Notes |
|--------|---------|-------|
| `valor_aplicado` | Gross amount before PP discount | Don't sum this for recaudo — use `valor_final` |
| `valor_final` | Net cash received (after PP) | This is the recaudo number |
| `pronto_pago_aplicado` | PP discount granted | Sum for "PP otorgado" KPI |
| `fecha_recaudo` | Cash basis date | Use for monthly recaudo aggregations |
| `fecha_factura` | Invoice issue date | Use for invoice-basis aggregations only |
| `fecha_vencimiento` | Invoice due date | Use for mora / aging calculations |
| `fecha_pronto_pago` | PP eligibility deadline | If `fecha_recaudo <= fecha_pronto_pago`, PP granted |

**Cash basis vs invoice basis:** monthly "recaudo" is cash basis (`fecha_recaudo`). Tried invoice basis (`fecha_factura`) — distorts open/current months. Stick with cash basis.

---

## Pitfalls — Don't Repeat These

1. **Don't filter `siesa_clasificacion IN ('RECAUDADO','VENCIDO')`** — proven wrong, see ⚠ FORBIDDEN section.
2. **Don't `DISTINCT siesa_docto`** — strips legitimate paired rows that aren't true duplicates.
3. **Don't `WHERE fecha_recaudo IS NOT NULL`** — every FVS row has it; the filter does nothing useful and gives false confidence.
4. **Don't sum `valor_aplicado` instead of `valor_final`** — `valor_aplicado` is gross; `valor_final` is net of PP. Recaudo uses `valor_final`.
5. **Don't compare against Power BI without the 4 filters** — gaps will be 10×+ and chase ghosts.
6. **Don't include juridica tenants in mora/recaudo expectations** — `tenants.juridica = true` rows are in legal proceedings, treated as separate cohort.

---

## How the AI Copilot Should Use This

- **Schema awareness:** before answering anything about payments / recaudo / cobro, the AI must apply these filters. If the user asks for raw row counts ignoring filters, comply but flag the result as "ERP raw — includes plumbing rows".
- **Tool design:** the read-only tools that touch `payments` should call server-side RPCs (`get_collections_dedup`, etc.) so the filter is enforced regardless of how the AI constructs its query. Filter logic in code-the-AI-can-see is a footgun.
- **Citing source:** every numeric answer about recaudo should mention "applies canonical FVS + dedup + <1B filter". Builds user trust and makes the Power BI gap explainable.
- **Currency:** all amounts are COP, integer scale. Format with `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.

---

## Live DB Snapshot (verified 2026-04-25)

- `public.payments` — 5,551 rows total. Counts grow with each `npm run sync-csf` run.
- `siesa_raw.recaudo` — 0 rows (Phase 1 schema applied; IT batch not landed yet).

When `siesa_raw.recaudo` populates, the same 4 filters port over by column rename (no logic change). Filter 1 (`company_id`) is replaced by zone filter at landing time.

---

## Reference RPC (recommended)

Create this in Supabase. AI tools call it; AI never writes the filter SQL.

```sql
create or replace function public.get_collections_dedup(
  p_company_id uuid,
  p_start      date,
  p_end        date
) returns table (total numeric, pp_total numeric, cnt int)
language sql stable as $$
  with d as (
    select distinct on (tenant_id, siesa_cruce, fecha_recaudo)
      valor_final, pronto_pago_aplicado
    from public.payments
    where company_id   = p_company_id
      and fecha_recaudo >= p_start
      and fecha_recaudo <  p_end
      and siesa_cruce  like 'FVS-%'
      and valor_final  < 1000000000
    order by tenant_id, siesa_cruce, fecha_recaudo, id
  )
  select
    coalesce(sum(valor_final), 0)          as total,
    coalesce(sum(pronto_pago_aplicado), 0) as pp_total,
    count(*)::int                          as cnt
  from d;
$$;

revoke all on function public.get_collections_dedup(uuid, date, date) from public, anon;
grant execute on function public.get_collections_dedup(uuid, date, date) to authenticated, service_role;
```
