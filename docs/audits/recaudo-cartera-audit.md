# Recaudo & Cartera Data Pipeline Audit

**Status:** In progress  
**Purpose:** Step-by-step investigation of why payment numbers differ between the portal and Power BI, tracing from the original Excel-based setup through the live ERP sync.

---

## Context

The C-Krea portal was built in two phases:

1. **Phase 1 — Excel data:** Data imported from a manually prepared Excel file (`ckrea.xlsx`). Numbers displayed correctly and matched expectations.
2. **Phase 2 — Live ERP sync:** Data now pulled directly from the Siesa CSF ERP via API. Numbers no longer match Power BI, and some totals appear inflated or inconsistent.

The goal of this audit is to identify exactly what changed, why, and what the correct behavior should be.

---

## Data Sources in Scope

Only two sheets from the original Excel are relevant to this investigation:

| Sheet | Table | What it contains |
|-------|-------|-----------------|
| Recaudo | `payments` | Every payment (cash collection) made by every tenant |
| Cartera | `cartera` | Snapshot of outstanding invoice balances — what is currently owed / past-due |

**Out of scope:**
- `PROYECCION MENSUAL` → `projections` table — built from our own math, never touched by ERP sync, numbers are stable
- Tenant/unit/contract data → `tenants`, `units`, `contracts` — came from `ckrea-ocupacion` ERP endpoint, not a source of number discrepancies

The DB tables are a **direct 1-to-1 mirror** of the ERP fields. The Excel was a human-curated export of those same fields. All three sources (Excel, DB, ERP API) carry the same data structure — column names match across all three. The difference is only in which rows arrive.

---

## Phase 1 — Why the Excel Data Worked

### What the Excel file was

`ckrea.xlsx` → Recaudo sheet was a **manual export** prepared by Siesa's accounting team before it reached us. The accounting team had already applied their own filters before handing the file over — filtering to C-Krea tenants, removing noise, and applying classification logic.

Result: **2,695 clean rows.** One row = one real cash movement.

### What we imported

Those 2,695 rows loaded straight into the `payments` table, mapping columns 1-to-1:

- `fecha_recaudo` → payment date
- `valor_final` → amount collected
- `siesa_docto` → document number (e.g. `RK-2697`)
- `siesa_cruce` → invoice reference (e.g. `FVS-69799`)
- `siesa_clasificacion` → RECAUDADO / VENCIDO / NO PROYECTADO

### Why it worked

The queries were written assuming **clean input**: one row per payment. With Excel data, that assumption was always true. Every `SUM(valor_final)` returned the right number.

The queries did not need any filters. The Excel had done that work upstream — silently and invisibly.

### The hidden assumption

> "Each row in `payments` = one unique cash movement."

True with Excel data. Stopped being true the moment the live ERP sync ran.

---

## Phase 2 — What the ERP Sync Changed

### Test finding: 001-RK duplication exists in the Excel too

**Important correction from live testing:** A specific payment of $301,000 was found to appear **twice in both the Excel AND the ERP**. This means the 001-RK duplication pattern was already present in the original Excel — the accounting team did not remove it before handing us the file.

This rules out the 001-RK duplication as the *cause* of the discrepancy between Excel-era and ERP-era numbers, since both sources contain the same pattern.

### The 001-RK duplication — what it is

The Siesa ERP creates **two rows for every single payment**:

| Row | `siesa_docto` | Meaning |
|-----|--------------|---------|
| A | `RK-2697` | Cash received (the receipt) |
| B | `001-RK-2697` | Credit applied to invoice (the application) |

Same tenant. Same `siesa_cruce`. Same `valor_final`. Two rows — one cash movement.

Both the Excel and the raw ERP sync contain both rows. This is consistent and expected.

---

## The `siesa_cruce` Column — Key to Understanding the Data

The `siesa_cruce` field identifies what document type a payment is being applied to. This is the most reliable filter for understanding what kind of transaction each row represents.

### Cruce types and what they mean

| Cruce prefix | What it is | Direction |
|-------------|-----------|-----------|
| `FVS-` | Factura de Venta de Servicios — a real invoice | Positive (cash in) |
| `NVS-` | Nota de Crédito — a credit note issued to a tenant | Negative (money out or reversed) |
| `RK-` | Applied against a prior receipt — a payment reversal or offset | Mixed |
| `RKM-` | Manual cash receipt variant | Mixed |
| `CN-` | Cancellation entry | Negative |
| `NUL` | Nullified entry | Near-zero |

**FVS is the only cruce type that represents real rent collection.** All other types are corrections, reversals, or credit notes.

---

## Finding 1 — `siesa_clasificacion` Must Never Be Used as a Filter

### The three classifications

| Classification | What Siesa claims it means |
|---------------|---------------------------|
| `RECAUDADO` | Payment matched to a projected invoice |
| `VENCIDO` | Payment applied to a past-due invoice |
| `NO PROYECTADO` | Invoice not in Siesa's projection module |

### Proof 1 — Filtering to RECAUDADO + VENCIDO produces a negative total

Running `SUM(valor_final)` filtered to `RECAUDADO + VENCIDO` across all time gives **-$4,616,323,954** — a negative total. This is because the raw ERP data contains large negative entries (credit notes and reversals) classified as RECAUDADO or VENCIDO.

The single largest offender: credit note `NVS-3405` with `valor_final = -$4,215,750,000` (likely a data entry error in Siesa), appearing twice as RK-485 + 001-RK-485 = **-$8.4B from one bad entry**.

Even removing that one entry, RECAUDADO + VENCIDO is still not clean — it contains other credit notes (NVS cruce, -$58M) and reversals.

### Proof 2 — NO PROYECTADO totals are impossibly large

All-time FVS-only totals by classification:

| Classification | Amount | Row count |
|---------------|--------|-----------|
| RECAUDADO + VENCIDO | $3,545,463,957 | 2,250 |
| NO PROYECTADO | $12,611,579,655 | 2,818 |

NO PROYECTADO is **$12.6B across all time** — nearly double the expected total collection for the entire period (~$6.5B). It cannot represent real rent payments on its own.

Additionally, NO PROYECTADO grows dramatically over time:

| Period | NO PROYECTADO | RECAUDADO + VENCIDO |
|--------|--------------|---------------------|
| Jan 2024 | $45M | $71M |
| Dec 2025 | $243M | $216M |
| Mar 2026 | $252M | $217M |

### Proof 3 — The same payment gets different classifications on its two rows (live client test)

**Client tested: MATICES COMUNICACION VISUAL SAS (NIT 900547519)**

This client pays two invoices per receipt. Siesa creates 4 rows per payment. Example from two different months:

| Month | Row type | Cruce | Classification |
|-------|----------|-------|----------------|
| Jul 2025 | `RK-1508` | `FVS-62025` | **NO PROYECTADO** |
| Jul 2025 | `RK-1508` | `FVS-62029` | **NO PROYECTADO** |
| Jul 2025 | `001-RK-1508` | `FVS-62025` | **NO PROYECTADO** |
| Jul 2025 | `001-RK-1508` | `FVS-62029` | **NO PROYECTADO** |
| Aug 2025 | `RK-1619` | `FVS-63254` | **NO PROYECTADO** |
| Aug 2025 | `RK-1619` | `FVS-63256` | **NO PROYECTADO** |
| Aug 2025 | `001-RK-1619` | `FVS-63254` | **RECAUDADO** |
| Aug 2025 | `001-RK-1619` | `FVS-63256` | **RECAUDADO** |

**The same payment — same amount, same date, same invoice — gets RECAUDADO on the `001-RK` row and NO PROYECTADO on the `RK` row.**

Siesa's automation assigns the classification per row, and it assigns it inconsistently between the two rows of the same payment. After the 001-RK dedup removes the `001-RK` rows, what remains are the `RK` rows — which for this client are almost always NO PROYECTADO. A classification filter applied on top would erase most of his real payments.

If we had filtered to RECAUDADO + VENCIDO only, this client would show only 2 payments instead of his full history.

### Definitive conclusion

> **`siesa_clasificacion` must never be used as a filter — not to include, not to exclude.**
> The classification is assigned by ERP automation per row and is inconsistent between the two rows of the same payment. It carries no reliable meaning for our purposes.
> The only reliable filters are `siesa_cruce` (document type) and the 001-RK dedup (remove duplicate rows).

---

## Finding 2 — The Correct Filter Combination

### The official filter order

Three filters must be applied in this exact order. Each one narrows the data to a more grounded, accurate set:

| Order | Filter | Where applied | What it removes |
|-------|--------|--------------|-----------------|
| 1st | **Zona = C-KREA** | At sync time — NIT matching against C-Krea tenants only | Raymond and any other company's payments |
| 2nd | **`siesa_cruce LIKE 'FVS-%'`** | In queries | Credit notes (NVS), reversals (RK), cancellations (CN) |
| 3rd | **001-RK dedup** | In queries | Bookkeeping duplicate rows (one payment counted twice) |
| 4th | **`valor_final < 1,000,000,000`** | In queries | Siesa data entry errors with unrealistic amounts |

**Note on Filter 1:** There is no `zona` column in the `payments` table. The C-Krea filter is applied implicitly at sync time — the sync script only imports payments whose NIT matches a tenant in the C-Krea DB. Only one company exists in this DB (Central Kreativa / C-Krea), so every row in `payments` is already C-Krea only. In the raw ERP data, this corresponds to filtering by `Zona = C-KREA` before anything else.

**Note on Filter 4:** Threshold set at $1,000,000,000 (1 billion COP). No legitimate single payment row at C-Krea should ever reach this amount — real monthly rents range from ~$1M to ~$20M per tenant. Introduced to handle a confirmed Siesa data entry error: `RK-485` and `001-RK-485` (FUSION GRAFIK SAS, 2024-04-09, cruce `FVS-45643`) each carrying $4,215,750,000. Rather than deleting those rows, this filter excludes them without touching raw data. Also handles any future bad entries of the same type automatically.

### The approach

Filter by `siesa_cruce LIKE 'FVS-%'` (real invoice payments only) and then apply 001-RK deduplication. This captures genuine rent collection and removes the bookkeeping double-entry.

### March 2026 results vs Power BI benchmark ($236.8M)

| Filter applied | Amount | Gap vs Power BI |
|---------------|--------|-----------------|
| All rows, no filter | much higher | — |
| RECAUDADO + VENCIDO only | -$4.6B (broken) | — |
| FVS cruce, all classifications | $470,008,275 | +$233M |
| FVS cruce, RECAUDADO + VENCIDO only | $217,402,453 | -$19.4M |
| **FVS cruce + 001-RK dedup** | **$242,322,859** | **+$5.5M** |
| Power BI | $236,800,000 | — |

**FVS + dedup gets within $5.5M of Power BI for March 2026.** This is the closest any filter combination has come.

### The dedup SQL

```sql
WHERE siesa_cruce LIKE 'FVS-%'                  -- Filter 2: real invoice payments only
  AND p.valor_final < 1000000000                 -- Filter 4: exclude data entry errors
  AND NOT (                                      -- Filter 3: 001-RK dedup
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

### Notable pattern: dedup ratio changed after April 2025

Before April 2025, every row has a 001-RK pair — dedup cuts rows exactly in half. After April 2025, some rows no longer have a pair (standalone entries exist). This suggests something changed in Siesa's configuration around that time.

| Period | Raw rows (March) | Deduped rows | Ratio |
|--------|-----------------|--------------|-------|
| 2024 months | exactly ½ | exactly ½ | 2:1 perfect |
| Mar 2026 | 289 | 183 | not ½ |

---

## Final Results — All 4 Filters Applied

Monthly totals with all four filters active (Zona C-Krea + FVS cruce + 001-RK dedup + valor < $1B):

| Month | Unique payments | Total recaudado |
|-------|----------------|-----------------|
| 2024-01 | 31 | $58,062,355 |
| 2024-02 | 45 | $82,012,198 |
| 2024-03 | 31 | $74,568,106 |
| 2024-04 | 31 | $67,025,850 ✅ fixed (was $4.28B) |
| 2024-05 | 38 | $90,515,800 |
| 2024-06 | 41 | $90,449,859 |
| 2024-07 | 42 | $92,151,550 |
| 2024-08 | 37 | $82,575,014 |
| 2024-09 | 51 | $106,134,376 |
| 2024-10 | 55 | $116,374,889 |
| 2024-11 | 46 | $103,454,850 |
| 2024-12 | 49 | $107,770,400 |
| 2025-01 | 46 | $92,969,175 |
| 2025-02 | 46 | $104,695,075 |
| 2025-03 | 50 | $108,694,225 |
| 2025-04 | 65 | $143,386,374 |
| 2025-05 | 128 | $153,816,422 |
| 2025-06 | 124 | $138,279,008 |
| 2025-07 | 144 | $177,284,515 |
| 2025-08 | 128 | $151,878,235 |
| 2025-09 | 153 | $181,787,563 |
| 2025-10 | 160 | $201,712,122 |
| 2025-11 | 160 | $191,046,940 |
| 2025-12 | 179 | $229,961,398 |
| 2026-01 | 157 | $194,725,105 |
| 2026-02 | 168 | $227,007,148 |
| 2026-03 | 183 | $242,322,859 |
| 2026-04 | 84 | $166,895,420 (partial month) |

### March 2026 vs Power BI benchmark

| | Amount |
|--|--------|
| Portal (all 4 filters) | $242,322,859 |
| Power BI | $236,800,000 |
| Remaining gap | **$5,522,859 (2.3%)** |

The gap is small, unexplained, and under investigation. Possible causes: timing difference in how Power BI counts a payment near month-end, or one additional filter we haven't identified.

---

## Remaining Gap — Canon vs Gastos Split

After all 4 filters, portal shows $242.3M vs Power BI's $236.8M. Gap = $5.5M.

### Finding — standalone 001-RK entries are the gap

Investigated by comparing a specific client: **MEDIOS IMPRESOS SAS (Unit 101), March 2026.**

- Portal shows: $7,525,625
- Power BI shows: $7,295,325
- Difference: $230,300 = exactly $146,250 + $84,050 (two standalone `001-RK` entries with no matching `RK` pair)

Those two entries (FVS-71785 and FVS-71760) are almost certainly the electricity/gastos portion of this tenant's payment — applied internally by Siesa to separate invoices but not representing new cash.

### Two approaches tested for March 2026

| Approach | March 2026 total | vs Power BI |
|----------|-----------------|-------------|
| Dedup (keep standalone `001-RK`) | $242,322,859 | +$5.5M too high |
| Exclude ALL `001-RK` rows | $227,685,416 | -$9.1M too low |
| **Power BI** | **$236,800,000** | — |

Power BI lands exactly between the two — suggesting it includes **some** standalone `001-RK` entries (canon-related splits) and excludes **others** (gastos-related).

### Hypothesis — Power BI separates recaudo and gastos

Power BI has a dedicated Gastos page. The `001-RK` entries for electricity and other expenses likely feed that page. The Recaudo page only shows `RK` rows (pure cash receipts) plus canon-split `001-RK` entries.

**This is an open question to verify with the Power BI creator.**

### Decision pending

- If portal Recaudo = total cash collected (canon + gastos) → keep dedup approach ($242M)
- If portal Recaudo = canon only, matching Power BI → need to separate gastos from standalone `001-RK` entries

---

## Next Steps

- [x] Apply all 4 filters to portal codebase — done in `src/lib/data/pagos.ts` (`getPagosKPIs`, `getPagosBuckets`, `getPagos`)
- [ ] Investigate the remaining $5.5M gap for March 2026
- [ ] Confirm whether the cartera sync has analogous issues worth investigating
- [ ] Update `payment-classification-logic.md` to reflect these corrected findings (current content is outdated — contradicts this audit)
- [ ] Check with the team whether the row count jump in May 2025 (50 → 128 rows) was a known Siesa config change
