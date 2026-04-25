# Payment Classification Logic — C-Krea Portal

**Status:** Research complete, implementation pending  
**Applies to:** Pagos page bucket cards, any future recaudo analytics  
**Last updated:** 2026-04-21

---

## Background

The `payments` table is populated by syncing from the **Siesa ERP** (CSF module). Siesa exports every payment as one or more rows with a `siesa_clasificacion` field. This field was the original basis for classifying payments into buckets (early / on-time / overdue). Investigation showed the classification is **unreliable** as a filter — see findings below.

The correct approach is to ignore `siesa_clasificacion` for bucketing and compute the buckets ourselves using `fecha_recaudo` (the actual collection date) and `cartera` (outstanding invoice balances).

---

## Finding 1 — The 001-RK Duplication Problem

### What happens in Siesa

Every payment in Siesa creates **two rows** in the export:

| Row | `siesa_docto` | `siesa_cruce` | Meaning |
|-----|--------------|--------------|---------|
| A | `RK-2697` | `FVS-69799` | Receipt — cash received |
| B | `001-RK-2697` | `FVS-69799` | Application — credit applied to invoice |

Both rows have **the same `valor_final`**, the same `tenant_id`, and the same `siesa_cruce`. They represent **one cash movement**, not two.

### Real example — IMAGENN paying an old invoice in March 2026

```
FVS-69799  RK-2697      VENCIDO  $5,000,000  2026-03-07  ← receipt
FVS-69799  001-RK-2697  VENCIDO  $5,000,000  2026-03-07  ← application (duplicate)
FVS-69799  RK-2751      VENCIDO  $3,061,895  2026-03-10
FVS-69799  001-RK-2751  VENCIDO  $3,061,895  2026-03-10  ← duplicate
FVS-69799  RK-2742      VENCIDO  $3,000,000  2026-03-16
FVS-69799  001-RK-2742  VENCIDO  $3,000,000  2026-03-16  ← duplicate
FVS-69799  RK-2835      VENCIDO  $2,000,000  2026-03-30
FVS-69799  001-RK-2835  VENCIDO  $2,000,000  2026-03-30  ← duplicate
```

Without deduplication, this tenant shows $26M paid in March. Real amount: $13M.

### The deduplication rule

> Exclude any row where `siesa_docto LIKE '001-%'` **and** a matching row exists with `siesa_docto = REPLACE(siesa_docto, '001-', '')` for the same `tenant_id`, `siesa_cruce`, and `valor_final`.

**Important:** Not all `001-` rows are duplicates. Some `001-RK-XXXX` entries have **no paired `RK-XXXX`** row — those are standalone and must be kept. Only remove the `001-` row when the pair exists.

### SQL deduplication filter

```sql
AND NOT (
  p.siesa_docto LIKE '001-%'
  AND EXISTS (
    SELECT 1 FROM payments p2
    WHERE p2.tenant_id  = p.tenant_id
      AND p2.siesa_cruce = p.siesa_cruce
      AND p2.siesa_docto = REPLACE(p.siesa_docto, '001-', '')
      AND p2.valor_final = p.valor_final
  )
)
```

Apply this filter to **every query that sums `valor_final`** from `payments`.

---

## Finding 2 — `siesa_clasificacion` Is Not Reliable for Bucketing

### The three classifications in the data

| Classification | What Siesa means | Problem |
|---|---|---|
| `RECAUDADO` | Payment matched to a projected invoice | Reliable |
| `VENCIDO` | Payment applied to a past-due invoice | Reliable for identity, but timing needs recalculation |
| `NO PROYECTADO` | Invoice not in Siesa's projection module | **This module is unused at C-Krea.** All entries are mislabeled. |

`NO PROYECTADO` is the largest category by volume (252M in March 2026 before dedup). Because the projection module in Siesa is not used at C-Krea, this classification is noise. It does not mean the payment is irregular — it just means Siesa couldn't match it to a projection it doesn't have.

### Consequence

Any query filtering to `siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')` **excludes real money**. The KPI card "Recaudado" on the Pagos page currently uses this filter, which is why it shows 222M for March while the true collected amount is ~245M (after dedup, all classifications).

**Decision:** For bucket cards (the three summary cards), ignore `siesa_clasificacion` entirely. Deduplicate and count everything.

---

## Finding 3 — Multi-Unit Tenant Join Inflation

Some tenants have more than one active contract (12 tenants confirmed as of April 2026). Any query that does:

```sql
JOIN contracts c ON c.tenant_id = p.tenant_id
JOIN units u ON u.id = c.unit_id
```

will **multiply payment rows** for those tenants — one row per active contract. This inflates totals.

**Rule:** Never join `contracts` directly on `tenant_id` when summing payments. To get the unit number for display purposes, use a correlated subquery:

```sql
(SELECT u.unit_number
 FROM contracts c2
 JOIN units u ON u.id = c2.unit_id
 WHERE c2.tenant_id = t.id
   AND c2.status IN ('activo', 'critico', 'vencido', 'terminado')
 ORDER BY c2.created_at DESC
 LIMIT 1) AS unit_number
```

---

## The Three Bucket Definitions

### Bucket 1 — Primeros 10 días (Pronto Pago eligible)

- Payment received on day 1–10 of the selected month
- Tenant is **not** identified as mora (see below)
- These tenants are eligible for the pronto pago discount per their contract

### Bucket 2 — Del 11 al 30 (Within month, no discount)

- Payment received on day 11+ of the selected month
- Tenant is **not** identified as mora
- Canon was paid but pronto pago discount no longer applies

### Bucket 3 — Mora (Clearing past-due debt)

- Tenant has at least one outstanding invoice in `cartera` with `fecha_factura < first_day_of_selected_month` and `saldo > 0`
- Their payment this month is being applied to old debt, not the current period

**Important limitation:** `cartera` is a live snapshot — it only holds invoices that are *currently* outstanding. If a tenant cleared their March debt by the time you view April, they will no longer appear as mora for March. This means the mora bucket is **accurate for the current month** but **approximate for historical months**.

---

## Reference Numbers — March 2026

| Metric | Amount | Notes |
|---|---|---|
| KPI "Recaudado" (current) | $222M | RECAUDADO + VENCIDO only, includes 001-RK duplicates |
| True deduplicated total (all classifications) | $245M | After removing 001-RK pairs |
| Temprano (days 1–10, deduplicated) | ~$101M | |
| Tardio (days 11+, deduplicated) | ~$143M | |
| Power BI "Primeros 10 días" | $140M | Likely using a different dedup or additional filter |
| Power BI "Del 11 al 30" | $30M | Unclear methodology |
| Power BI "Mora" | $66M | Matches VENCIDO on days 11+ from KPI |

The gap between portal and Power BI is under investigation. The most likely cause is that Power BI applies an additional filter we haven't identified (possibly by invoice period or document type).

---

## The Waterfall Concept (Future)

The user's intent is a **waterfall allocation model**:

1. For each tenant, starting from `contracts.fecha_inicio`, generate one expected invoice per month
2. As payments arrive (chronologically), fill months in order from oldest to newest
3. For the selected month's display: determine which invoice period each payment is filling
   - Filling the **current month** → temprano or tardio by day
   - Filling a **prior month** → mora

This is the most accurate classification but requires:
- Populated `invoices` table (currently empty — not yet synced from Siesa)
- Populated `payment_applications` table (currently empty — links payments to invoices)

Once Siesa sync populates those tables, replace the cartera-based mora logic with:

```sql
-- Is the invoice being paid from the current month or a prior month?
JOIN payment_applications pa ON pa.payment_id = p.id
JOIN invoices i ON i.id = pa.invoice_id
WHERE DATE_TRUNC('month', i.fecha_emision) < DATE '${month}-01'  -- prior month invoice
```

Until then, `cartera.fecha_factura < month_start AND saldo > 0` is the best available proxy.

---

## Queries to Audit

The following queries need the deduplication filter applied. Check each one:

| File | Function | Issue |
|---|---|---|
| `src/lib/data/pagos.ts` | `getPagosKPIs` | KPI total includes 001-RK duplicates |
| `src/lib/data/pagos.ts` | `getPagosBuckets` | Being rewritten per this spec |
| `src/lib/data/reportes.ts` | `getProyectadoVsReal` | Uses payment sums — needs dedup check |
| Any future analytics query | — | Always apply dedup filter before summing `valor_final` |

---

## Open Questions

1. **Why does Power BI show $30M for "Del 11 al 30"?** Our deduplicated tardio is $143M. Either Power BI applies a filter we don't have, or it's measuring something different (e.g., only payments for the current period's invoice, not historical debt paid after day 10).

2. **Should the KPI "Recaudado" be updated** to use the deduplicated total (245M) instead of filtering to RECAUDADO + VENCIDO (222M)? Decision pending comparison with Power BI baseline.

3. **When will `invoices` and `payment_applications` be populated** from Siesa sync? This unlocks the full waterfall model and removes the cartera approximation for mora.
