# Power BI Meeting Prep — Recaudo Data Findings

**Date:** 2026-04-22  
**Purpose:** Align portal numbers with Power BI. Understand exactly how Power BI calculates recaudo so we can match it or knowingly differ from it.  
**Audience:** Power BI creator + German

---

## Background

C-Krea built a payment control portal that pulls data directly from the same Siesa CSF ERP that feeds Power BI. Both systems read the same raw data, but they show different numbers for the same month. This document summarizes what we found and the questions we need answered.

---

## What We Investigated

We compared March 2026 as our benchmark throughout. Power BI shows **$236,800,000** collected in March. Our portal was showing different numbers depending on which filters we applied.

We traced the entire data pipeline from scratch: how the data comes out of Siesa, what each column means, and which rows should be counted.

---

## Key Finding 1 — Siesa Creates Two Rows Per Payment

Every single payment in Siesa generates **two rows** in the export:

| Row | Document | Meaning |
|-----|----------|---------|
| A | `RK-2719` | Cash received — the bank deposit |
| B | `001-RK-2719` | Accounting entry — which invoice that cash pays |

Same amount, same tenant, same invoice reference. Without knowing this, you count every peso twice.

**Question for Power BI:** Does Power BI use only `RK` rows, only `001-RK` rows, or both?

---

## Key Finding 2 — `siesa_clasificacion` Cannot Be Used as a Filter

The classification column (`RECAUDADO`, `VENCIDO`, `NO PROYECTADO`) is **assigned per row by Siesa's automation and is inconsistent between the two rows of the same payment.**

Real example — MATICES COMUNICACION VISUAL SAS, August 2025:

| Document | Classification | Amount |
|----------|---------------|--------|
| `RK-1619` | **NO PROYECTADO** | $1,661,625 |
| `001-RK-1619` | **RECAUDADO** | $1,661,625 |

Same payment. Same date. Same invoice. Different classification on each row.

If you filter to `RECAUDADO` only, you get the `001-RK` row and miss the `RK` row. If you filter to `NO PROYECTADO`, the opposite. Either way you're missing half the data.

Across all time, `NO PROYECTADO` rows alone total **$12.6 billion** — clearly not a real payment classification but an ERP automation artifact.

**Question for Power BI:** Does Power BI filter by `siesa_clasificacion`? If so, which values and why?

---

## Key Finding 3 — One Confirmed Siesa Data Entry Error

**FUSION GRAFIK SAS, April 2024:** A payment of **$4,215,750,000** (4.2 billion pesos) was entered for a single tenant in one month. This is almost certainly a typo — likely $4,215,750 entered without the decimal point. The same entry appears twice (RK + 001-RK pair).

We handled this with a filter: exclude any single payment row above $1,000,000,000. This removes the bad entry without deleting data from the system.

**Question for Power BI:** Does Power BI handle or exclude this entry? Does it appear in your April 2024 numbers?

---

## Key Finding 4 — The 4 Filters We Identified

After extensive testing, the correct filters to get clean recaudo numbers are:

| Order | Filter | What it does |
|-------|--------|-------------|
| 1st | Zona = C-KREA | Scoped to C-Krea only, not Raymond |
| 2nd | `siesa_cruce LIKE 'FVS-%'` | Only real invoice payments — excludes credit notes (NVS), reversals (RK cruce), cancellations |
| 3rd | Exclude `001-RK` rows (paired) | Removes bookkeeping duplicates |
| 4th | `valor_final < $1,000,000,000` | Removes data entry errors |

With these 4 filters, our portal shows **$242,322,859** for March 2026 — within **$5.5M (2.3%)** of Power BI's $236,800,000.

---

## Key Finding 5 — The Remaining $5.5M Gap (The Most Important Question)

After applying all correct filters, we investigated the remaining difference using a specific client as a test case.

**MEDIOS IMPRESOS SAS, Unit 101, March 2026:**

| Source | Amount |
|--------|--------|
| Our portal | $7,525,625 |
| Power BI | $7,295,325 |
| Difference | $230,300 |

We found that the $230,300 difference comes from two entries:
- `001-RK-2807` → FVS-71785 → $146,250
- `001-RK-2808` → FVS-71760 → $84,050

These are **standalone `001-RK` entries** — they have no matching `RK` counterpart. Based on the invoice amounts and the pattern, these likely represent **electricity or gastos payments** that Siesa applied to separate invoices internally, not new independent cash receipts.

**Our hypothesis:** Power BI puts these gastos entries on its separate Gastos/Expenses page, not on the Recaudo page. So Power BI's Recaudo only counts `RK` rows (pure canon/rent cash receipts), while our portal is also counting the standalone `001-RK` gastos entries.

**Testing this hypothesis:**

| Approach | March total | vs Power BI |
|----------|------------|-------------|
| Keep standalone `001-RK` (current portal) | $242,322,859 | +$5.5M |
| Exclude ALL `001-RK` | $227,685,416 | -$9.1M |
| Power BI | $236,800,000 | — |

Power BI falls between these two — suggesting it includes some standalone `001-RK` entries (canon splits) but excludes others (gastos).

**Questions for Power BI:**
1. Does your Recaudo page exclude `001-RK` rows entirely, or only specific ones?
2. Do the gastos (electricity, water, etc.) appear on a separate page in your report?
3. Which invoices (FVS numbers) do you include in Recaudo vs Gastos?

---

## Key Finding 6 — We Cannot Auto-Match Electricity via Amounts

We attempted to automatically identify which standalone `001-RK` entries are electricity payments by comparing their amounts to our `meter_readings` table (which stores kWh × tarifa per unit per month).

**Result: the amount-matching approach does not work reliably.**

Out of 65 standalone `001-RK` entries in March 2026:

| Result | Count | Why |
|--------|-------|-----|
| Clean match (< $500 diff) | 3 | Timing aligned by luck |
| Close match ($500–$5K diff) | 12 | Likely electricity, off by billing cycle |
| Too far to identify | 48 | Billing period mismatch or different charge type |
| Clearly not electricity | 1 | IMAGENN $2,270,650 — too large, likely a canon split |
| No meter data in our system | 2 | Ciclo Creativo — data not yet entered |

**Root cause of the mismatch:** Siesa collects electricity in March but bills for February's consumption. Our `meter_readings` table stores March's reading. Comparing the two directly produces systematic differences of $1K–$50K per entry — too noisy to use as a reliable filter.

**One clear outlier:** IMAGENN & PUNTO's standalone `001-RK-2824` totals **$2,270,650** — far above any electricity bill in the portfolio. This is NOT a gastos payment; it's a large canon payment that Siesa applied to a different invoice number. Auto-excluding it would incorrectly remove $2.27M of real rent from Recaudo.

**Conclusion:** We cannot safely auto-exclude standalone entries by matching amounts to electricity bills. The only clean path is to know how Siesa **categorizes FVS invoices** — whether electricity invoices have a specific number range, prefix, or type code that distinguishes them from canon invoices.

---

## Summary of Open Questions for the Meeting

| # | Question | Why it matters |
|---|----------|---------------|
| 1 | Does Power BI use `RK` rows, `001-RK` rows, or both? | Determines if we need to drop all `001-RK` entries |
| 2 | Does Power BI filter by `siesa_clasificacion`? Which values? | We proved this field is unreliable — want to know if Power BI knows that |
| 3 | How does Power BI handle the FUSION GRAFIK SAS $4.2B entry in April 2024? | Confirms whether our $1B threshold is correct |
| 4 | Are gastos (electricity) shown on a separate page in Power BI? | Would explain the remaining $5.5M gap |
| 5 | What is the exact source table/report Power BI reads from in Siesa? | There may be a cleaner pre-filtered view available |
| 6 | Do electricity FVS invoices have a specific number range, prefix, or type code in Siesa? | We need this to exclude gastos from Recaudo without touching canon splits |

---

## Key Finding 7 — Electricity Matching: Confirmed and Quantified

We built a filter that identifies electricity standalone entries automatically by comparing each tenant's total standalones in month M to their prior-month electricity total from `meter_readings`.

**Result across all March 2026 standalone entries (65 total):**

| Result | Count | Why |
|--------|-------|-----|
| EXACT match (to the peso) | 49 | Tenant standalone sum = Feb electricity total |
| Match within ±$50 | 2 | MROUND rounding — Siesa rounds to nearest $50 |
| Sum match across multiple doctos | 6 | One electricity bill split across 2–3 standalone doctos |
| No match — confirmed non-electricity | 5 | IMAGENN ($2.27M), THE PELICULA, AGENCIA GRAFISIGLO, MI MUG, CICLO CREATIVO |
| Edge case: mixed electricity + canon | 1 | FAJARDO — two standalones, one electricity, one canon, sum ≠ elec total |
| No meter data | 2 | CICLO CREATIVO (no readings entered) |

**MROUND explained:** Siesa rounds each unit's electricity charge to the nearest $50 (`MROUND(kWh × tarifa, 50)`). Our meter_readings stored the exact decimal, causing $50 differences for 2 tenants. The ≤ $50 tolerance in our filter captures these.

**New totals with electricity exclusion applied:**

| Approach | March 2026 total | vs Power BI |
|----------|-----------------|------------|
| Old (all standalones kept) | $242,322,859 | +$5.5M |
| With electricity exclusion (≤ $50) | $231,358,909 | -$5.44M |
| Power BI | $236,800,000 | — |

We now bracket Power BI cleanly. The $5.44M remaining gap is the unmatched standalones that Power BI likely classifies differently.

**The FAJARDO edge case — known limitation:**

FAJARDO NIVIA (units 114 + 302) has two standalone doctos in March:
- `001-RK-2803`: $322,000 → February electricity for 2 units ✅
- `001-RK-2828`: $211,900 → unknown (canon split? different period?)

Because our matching sums ALL standalones per tenant ($533,900 ≠ Feb electricity $322,000), neither gets excluded. Both stay in Recaudo. Power BI may handle this correctly if it has per-invoice-type information.

**Why this gets better going forward:**

The new `electricity_invoices` system (v2.9.0, live today) stores the real utility invoice data per address group. Tarifa = `valor_factura ÷ kwh_factura` from the actual bill. Each unit's charge is computed as `MROUND(kWh × tarifa, 50)` — the same formula Siesa uses. So from now on, `meter_readings.total_energia` will match Siesa's standalone amounts exactly, with no tolerance needed.

**Question for Power BI:**
How does Power BI handle tenants with both an electricity standalone AND a separate canon standalone (like FAJARDO)? Does it classify per invoice type, or per some other rule?

---

## Appendix — 3-Client Deep Dive: What Standalone 001-RK Entries Actually Are

We analyzed the specific standalone `001-RK` entries for three March 2026 clients to understand what they represent. This directly supports the gastos hypothesis in Key Finding 5.

### PUBLISERVIS SAS

| Document | Cruce | Date | Amount | Paired? |
|----------|-------|------|--------|---------|
| `RK-2747` | FVS-71555 | Mar 3 | $3,163,101 | ✅ Has 001-RK pair |
| `RK-2748` | FVS-71556 | Mar 3 | $2,497,185 | ✅ Has 001-RK pair |
| `001-RK-2777` | FVS-71682 | Mar 20 | $338,050 | ❌ **Standalone** |
| `001-RK-2777` | FVS-71683 | Mar 20 | $105,150 | ❌ **Standalone** |

The standalone entry splits **$443,200 across two invoices** on a different date from the canon payments. Two separate FVS invoice numbers (one per unit) = almost certainly electricity for two units billed through Siesa on a different cycle.

### IMAGENN & PUNTO DE IMPRESION

| Document | Cruce | Date | Amount | Paired? |
|----------|-------|------|--------|---------|
| `RK-2796` | FVS-71720 | Mar 11 | $2,460,700 | ✅ Has 001-RK pair |
| `RK-2809` | FVS-71765 | Mar 17 | $2,460,700 | ✅ Has 001-RK pair |
| `001-RK-2824` | FVS-71810 | Mar 24 | $2,270,650 | ❌ **Standalone** |

The standalone hits a different FVS invoice number than the canon payments. Different invoice number + different date = gastos billed separately or payment applied to a different billing period.

### CICLO CREATIVO SAS

| Document | Cruce | Date | Amount | Paired? |
|----------|-------|------|--------|---------|
| `RK-2826` | FVS-72116 | Mar 26 | $2,130,780 | ✅ Has 001-RK pair |
| `RK-2826` | FVS-72115 | Mar 26 | $2,371,920 | ✅ Has 001-RK pair |
| `001-RK-2826` | FVS-72181 | Mar 26 | $98,293 | ❌ **Standalone** |
| `001-RK-2806` | FVS-71805 | Mar 17 | $45,699.34 | ❌ **Standalone** |
| `001-RK-2806` | FVS-71806 | Mar 17 | $107,300.66 | ❌ **Standalone** |

Two standalone patterns here:
1. `001-RK-2826` on a third FVS number (same day as the canon pair) — Siesa applied the same receipt to an additional invoice (gastos).
2. `001-RK-2806` splits exactly **$153,000** to the cent ($45,699.34 + $107,300.66) across two invoices — the exact cents are a dead giveaway of automated gastos calculation, not a manual cash deposit.

---

### Pattern Summary

All three clients show the same pattern:

| Signal | Meaning |
|--------|---------|
| Different FVS number from paired canon entries | Separate gastos invoice |
| Splits across two FVS numbers on same date | Two-unit electricity bill |
| Exact-cent split amounts | Automated Siesa calculation, not manual payment |
| No matching RK row | No new cash deposit — internal Siesa application only |

**Conclusion:** Standalone `001-RK` entries are Siesa applying one cash deposit to multiple invoices (gastos + canon) or billing electricity to separate unit invoices. There is no new money coming in — the cash already arrived with the `RK` rows. This is why they likely belong on Power BI's Gastos page, not Recaudo.

---

## Our Current Portal Numbers (March 2026, All Filters Applied)

| Metric | Amount |
|--------|--------|
| Total recaudado | $242,322,859 |
| Pagos primeros 10 días (temprano) | $113,441,488 — 31 tenants |
| Pagos del 11 al 30 (tardio) | $99,555,556 — 29 tenants |
| Pagos desde mora | $29,325,815 — 2 tenants |
| Power BI reference | $236,800,000 |
| Remaining gap | $5,522,859 (2.3%) — likely gastos split |
