# C-Krea PayControl -- Financial Rules Engine Specification

**Version:** 1.0  
**Date:** April 15, 2026  
**Status:** Draft  
**Author:** German Burgos  

> This is the "truth document" for every financial calculation in the C-Krea PayControl portal. If the portal's math doesn't match this document, something is wrong.

---

## Table of Contents

1. [Overview & Constants](#1-overview--constants)
2. [Rule A -- Early-Payment Discount (Pronto Pago)](#2-rule-a----early-payment-discount-pronto-pago)
3. [Rule B -- Contract-Phase Discounts (Descuentos por Fase)](#3-rule-b----contract-phase-discounts-descuentos-por-fase)
4. [Rule C -- Late-Interest Accrual (Intereses de Mora)](#4-rule-c----late-interest-accrual-intereses-de-mora)
5. [Rule D -- Shared Expenses Allocation (Gastos)](#5-rule-d----shared-expenses-allocation-gastos)
6. [Master Invoice Calculation Chain](#6-master-invoice-calculation-chain)
7. [IPC (Inflation) Adjustments](#7-ipc-inflation-adjustments)
8. [Worked Examples](#8-worked-examples)
9. [Edge Cases & Business Rules](#9-edge-cases--business-rules)
10. [Data Source Cross-Reference](#10-data-source-cross-reference)
11. [Appendix A -- Discount Schedule by Tenant Type](#appendix-a----discount-schedule-by-tenant-type)
12. [Appendix B -- Gastos Category Breakdown](#appendix-b----gastos-category-breakdown)

---

## 1. Overview & Constants

C-Krea PayControl manages billing for ~85 commercial rental units in Central Kreativa. Four financial rules govern all monetary calculations.

### 1.1 Global Constants

| Constant | Value | Notes |
|----------|-------|-------|
| IPC increment rate | 5.1% | Applied once per year on each tenant's IPC date |
| IVA (VAT) rate | 19% | Colombian standard rate |
| Pronto Pago (PP) rate | 10% (standard) | Applied on net amount (canon - descuento_fase) |
| Late interest rate | ⚠ DIAN art. 635 monthly (see §4) | Superseded 2026-07-10 — was 1.5%/mo; now the Superfinanciera monthly rate |
| Daily interest rate | ⚠ tasa_ea ÷ 366 (see §4) | Superseded — was 0.05%/day; rate from `v2.tasa_interes_mora` |
| PP payment window | 10 calendar days | From invoice date |
| Water allocation per unit | $29,947 COP/month | Flat rate |
| Electricity allocation | Per-meter (variable) | Individually metered per tenant |
| Total units | 85 | 83 leased + 1 available + 1 admin office |
| Currency | COP | Colombian Peso, no decimals in final amounts |
| Tax withholding (Retenciones) | ~$4,066,679 COP/month | Aggregate constant for projections |

### 1.2 Billing Cycle

Invoices are generated on one of four dates per month, determined by the tenant's billing flag:

| Flag | Billing Day | Count |
|------|-------------|-------|
| UNO | 1st of month | 51 units |
| ONCE | 11th of month | 3 units |
| VEINTIUNO | 21st of month | 2 units |
| CRITICO | Variable (at-risk) | 22 units |

The due date (fecha de vencimiento) is 10 calendar days after the invoice date. This same 10-day window is the pronto pago eligibility period.

### 1.3 Tenant Classifications

| Classification | Count | Meaning |
|---------------|-------|---------|
| 1A | 50 | Top tier, stable tenants |
| A | 8 | Good standing |
| B | 7 | Moderate risk |
| C | 18 | Higher risk |
| DISPONIBLE | 1 | Vacant unit |
| ADMINISTRACION | 1 | Admin office |

### 1.4 Tenant Status

| Status | Count | Meaning |
|--------|-------|---------|
| Activo | 56 | Current, good standing |
| Critico | 28 | At-risk, late payers, or vacant |

---

## 2. Rule A -- Early-Payment Discount (Pronto Pago)

### 2.1 Definition

A discount applied when a tenant pays the **full** invoiced amount within 10 calendar days of the invoice date.

### 2.2 Formula

```
PP_DISCOUNT = (CANON_EFFECTIVE - DESCUENTO_FASE) * PP_RATE
```

Where:
- `CANON_EFFECTIVE` = base canon, adjusted for IPC if applicable (see Section 7)
- `DESCUENTO_FASE` = contract-phase discount amount (see Section 3), or 0 if no phase discount is active
- `PP_RATE` = 10% for most tenants (see exceptions below)

**The PP discount is always calculated on the NET amount after contract-phase discounts.**

### 2.3 PP Rate Distribution (from Siesa)

| PP Rate | Unit Count | Notes |
|---------|-----------|-------|
| 10% | 65 units | Standard |
| 20% | 6 units | Enhanced PP terms |
| 30% | 1 unit | Special contract |
| 0% | 12 units | No PP benefit |

### 2.4 Eligibility Conditions

1. **Full payment required.** Partial payments do NOT qualify for the PP discount. The tenant must pay 100% of the net invoiced amount (canon - descuento_fase + IVA - PP) within the window.
2. **10 calendar day window.** Counted from the invoice date (fecha factura), not from the 1st of the month. If invoice date = March 1, the PP deadline = March 11.
3. **Payment must clear.** The payment date is the date the funds are received and reconciled, not the transfer initiation date.
4. **Phase discount and PP are mutually exclusive.** If a tenant has an active phase discount (10%, 20%, 30%, or 43%) for a given month, PP = 0 for that month regardless of their `pp_rate`. PP only activates in months where no phase discount is in effect. This motivates timely payment once the phase discount expires.

### 2.5 Accounting Treatment

When PP is applied, a credit note (documento tipo `RK` or `CN`) is generated against revenue account `42201090` (discount contra-revenue). The original invoice remains on account `42201006` (rental income). The PP credit note has a negative `ventas` value.

### 2.6 PP Validation Formula

```
AMOUNT_DUE_WITH_PP = CANON_EFFECTIVE - DESCUENTO_FASE - PP_DISCOUNT + IVA
AMOUNT_DUE_WITHOUT_PP = CANON_EFFECTIVE - DESCUENTO_FASE + IVA
```

Where `IVA = (CANON_EFFECTIVE - DESCUENTO_FASE) * 19%`

---

## 3. Rule B -- Contract-Phase Discounts (Descuentos por Fase)

### 3.1 Definition

Time-limited discounts negotiated per lease contract. They apply for a fixed number of months from the start of the year (or contract), then expire. Once expired, only the PP discount remains available.

### 3.2 Formula

```
IF month is within discount phase:
    DESCUENTO_FASE = CANON_EFFECTIVE * PHASE_RATE
ELSE:
    DESCUENTO_FASE = 0
```

### 3.3 Phase Rate Distribution

| Phase Rate | Unit Count | Notes |
|-----------|-----------|-------|
| 0% (no phase discount) | 41 units | Only PP available |
| 10% | 11 units | Lightest discount |
| 20% | 25 units | Most common phase discount |
| 30% | 8 units | Deepest discount |
| 43% | 1 unit | Special case (Muiscas Publicidad, unit 122) |

### 3.4 Discount Schedule Patterns

Each tenant's discount schedule is encoded as a description string. The patterns found in the data are:

| Pattern | Count | Phase Rate | Phase End Month | Then |
|---------|-------|-----------|----------------|------|
| "Enero 10 pp" | 39 | 0% | N/A | PP only all year |
| "Enero 20% +10 pp hasta mayo y luego 10 pp" | 18 | 20% | May (inclusive) | PP only from June |
| "Enero 20% +10 pp hasta junio y luego 10 pp" | 14 | 20% | June (inclusive) | PP only from July |
| "Enero 30% + 10% pp hasta abril" | 4 | 30% | April (inclusive) | PP only from May |
| "Enero 30% +10 pp hasta mayo" | 2 | 30% | May (inclusive) | PP only from June |
| "Enero 20% + 10 pp hasta marzo" | 2 | 20% | March (inclusive) | PP only from April |
| "Enero 20% +10 pp hasta abril" | 1 | 20% | April (inclusive) | PP only from May |
| "Enero 20% hasta Julio" | 1 | 20% | July (inclusive) | No PP specified |
| "Enero 30% + 10pp hasta marzo" | 1 | 30% | March (inclusive) | PP only from April |
| "Enero 30% + 10 pp" | 1 | 30% | December (all year) | 30% + PP all year |
| "1 ano anticipado septiembre el 10 pp" | 1 | Prepaid annual | N/A | PP on annual payment |

### 3.5 Key Implementation Rules

1. **Phase discounts are inclusive of the end month.** "Hasta mayo" means the discount applies in January, February, March, April, AND May.
2. **Phase discounts always start from January** (or from the lease start month for mid-year leases).
3. **Phase discount is applied before PP.** The calculation chain is: Canon -> minus phase discount -> then PP on the remainder.
4. **IPC adjustment applies to the base canon BEFORE the phase discount.** If IPC kicks in during a discount phase (rare but possible), the new canon is used to calculate the phase discount.

### 3.6 Data Model Requirements

Each tenant-contract record needs:
- `phase_discount_rate`: decimal (0, 0.10, 0.20, 0.30, 0.43)
- `phase_start_month`: integer 1-12 (typically 1 = January)
- `phase_end_month`: integer 1-12 (inclusive end)
- `pp_rate`: decimal (0, 0.10, 0.20, 0.30)

---

## 4. Rule C -- Late-Interest Accrual (Intereses de Mora)

> ⚠ **SUPERSEDED (2026-07-10) — mora billing now uses the DIAN / Superfinanciera rate (art. 635 E.T.).**
> The shipped Mora page (`src/lib/data/mora.ts`) and the tenant portal (`src/lib/data/portal.ts`) compute:
> `interés = vr_vencido × (tasa_ea_mes ÷ 366) × días vencidos`, counted from the **due date** (invoice + 30).
> The monthly effective-annual rate is admin-entered in `v2.tasa_interes_mora` (Jul 2026 = 26,79% E.A. ≈ 0,073%/day).
> If the current month has no row, the latest `periodo <=` this month is used so a missed entry does not bill $0
> (WOR-280). **Not** the fixed 0.05%/day described below. The 1.5%/mo content in this section is retained for historical
> rationale only. Canonical: memory `mora_dian_interest`. Reconciled peso-for-peso vs the admin's DIAN Excel.

### 4.1 Definition

When a tenant fails to pay by the due date (10 calendar days after invoice), daily interest accrues on the outstanding balance.

### 4.2 Rate

Monthly rate: **1.5%** (standard Colombian commercial rate).

Simple daily rate:

```
DAILY_RATE = 0.015 / 30 = 0.0005 (0.05% per day)
```

### 4.3 Accrual Formula

Interest is calculated as simple daily interest on the outstanding principal balance:

```
TOTAL_INTEREST = OUTSTANDING_BALANCE * DAILY_RATE * DAYS_OVERDUE
```

Which simplifies to:

```
TOTAL_INTEREST = OUTSTANDING_BALANCE * 0.0005 * DAYS_OVERDUE
```

For full-month periods, this is equivalent to:

```
INTEREST_FOR_M_MONTHS = OUTSTANDING_BALANCE * 0.015 * M
```

### 4.4 Accrual Start Date

Interest begins accruing on **day 11** after the invoice date (the first day after the 10-day payment window closes). If the invoice date is March 1 and the due date is March 11, interest starts accruing on March 12.

### 4.5 What Constitutes the Outstanding Balance

```
OUTSTANDING_BALANCE = CANON_EFFECTIVE - DESCUENTO_FASE + IVA
```

**Important:** When a tenant is late, they lose the PP discount entirely. The outstanding balance is the full invoiced amount WITHOUT the PP deduction. PP is a reward for timely payment; late payers do not get it.

This is confirmed by the data: VENCIDO records in Recaudo show a PP application rate of only 1.7%, versus 44.8% for on-time payments.

### 4.6 Interest on Partial Payments

If a tenant makes a partial payment after the due date:

```
ACCRUED_INTEREST = PREVIOUS_OUTSTANDING * 0.0005 * DAYS_SINCE_LAST_EVENT
NEW_OUTSTANDING = PREVIOUS_OUTSTANDING - PARTIAL_PAYMENT + ACCRUED_INTEREST
```

Interest stops accruing on the paid portion from the date payment is received. The remaining balance continues accruing interest daily.

**Payment application order:** Payments are applied first to accrued interest, then to the oldest outstanding principal (FIFO).

### 4.7 Aging Categories

Based on current Cartera data, the system tracks three aging tiers:

| Category | Days Overdue | Current Total | Action |
|----------|-------------|---------------|--------|
| Cartera Morosa (Delinquent) | 1-30 days | $49,193,267 COP | Collection calls |
| Cartera Critica (Critical) | >30 days | $58,143,544 COP | Formal demand letters |
| Pre Juridico (Pre-legal) | >90 days | $4,818,675 COP | Legal proceedings |
| **Total Cartera Vencida** | | **$112,155,486 COP** | |

### 4.8 Accounting Treatment

Late interest is recorded under `TipoCliente = INTERESES MORA` in Recaudo. Currently extremely rare in the data (only 2 instances found), suggesting this is a new enforcement policy that the portal should systematize.

---

## 5. Rule D -- Shared Expenses Allocation (Gastos)

### 5.1 Overview

Common operating expenses are shared across tenants. There are two allocation methods depending on the expense type: flat per-unit and metered consumption.

### 5.2 Total Monthly Gastos: $69,821,028 COP/month

### 5.3 Allocation Method 1: Flat Per-Unit

| Expense Category | Monthly Total | Per-Unit Amount | Allocation |
|-----------------|--------------|-----------------|------------|
| Acueducto (Water) | $2,515,521 | $29,947 | Equal split across 84 occupied units |
| Aseo/Cafeteria (Cleaning) | $3,722,463 | $44,315 | Equal split across occupied units |

Formula:
```
FLAT_ALLOCATION_PER_UNIT = TOTAL_EXPENSE / COUNT_OCCUPIED_UNITS
```

### 5.4 Allocation Method 2: Metered Consumption (Electricity)

Electricity is individually metered per tenant. Each unit has its own meter reading.

| Component | Monthly Amount | Notes |
|-----------|---------------|-------|
| Total electricity (complex) | $20,622,581 | Entire property |
| Billed to tenants (metered) | $12,667,400 | Sum of individual readings |
| Common areas (remainder) | $7,938,781 | = Total - Tenant-billed |

**Per-tenant electricity:**
```
ELECTRICITY_CHARGE_UNIT_X = METER_READING_X * RATE_PER_KWH
```

The range observed in the data is $1,000 to $1,822,600 COP per unit per month, confirming highly variable consumption.

**Common area electricity** is absorbed as an operating expense and NOT billed back to tenants.

### 5.5 Allocation Method 3: Not Allocated (Operating Overhead)

These expenses are borne by C-Krea centrally and not passed through to tenants:

| Expense | Monthly Total |
|---------|---------------|
| Vigilancia (Security) | $17,400,754 |
| Reparaciones Locativas (Repairs) | $13,817,392 |
| Nomina (Payroll) | $7,443,459 |
| Publicidad (Advertising) | $1,452,579 |
| Impuestos ICA | $1,832,476 |
| Common area electricity | $7,938,781 |
| Other (scaffolding, music license, tech, HSE) | $13,651,687 |

### 5.6 Gastos Billing

Gastos charges (water, electricity) are billed as separate line items alongside the rental invoice. In the Siesa system, they appear as `SERVICIOS P` entries in Cartera with their own `FVS` invoice numbers.

```
TOTAL_MONTHLY_BILL = RENTAL_INVOICE + WATER_ALLOCATION + ELECTRICITY_CHARGE
```

### 5.7 Gastos and PP Interaction

**Gastos charges are NOT eligible for pronto pago or contract-phase discounts.** Discounts apply only to the canon (rental amount). Utility pass-through charges are billed at cost.

---

## 6. Master Invoice Calculation Chain

This is the complete formula chain for computing a single tenant's monthly invoice.

### 6.1 Step-by-Step

```
Step 1: Determine effective canon
    IF current_date >= tenant.ipc_date:
        CANON = tenant.canon_base * 1.051
    ELSE:
        CANON = tenant.canon_base

Step 2: Apply contract-phase discount
    IF current_month is within [phase_start_month, phase_end_month]:
        DESCUENTO = CANON * tenant.phase_discount_rate
    ELSE:
        DESCUENTO = 0

Step 3: Calculate pronto pago discount (conditional)
    PP = (CANON - DESCUENTO) * tenant.pp_rate

Step 4: Calculate IVA
    IVA = (CANON - DESCUENTO) * 0.19

Step 5: Determine amount due
    IF tenant pays within 10 days:
        AMOUNT_DUE = CANON - DESCUENTO - PP + IVA
    ELSE:
        AMOUNT_DUE = CANON - DESCUENTO + IVA

Step 6: Add gastos (if applicable)
    TOTAL_DUE = AMOUNT_DUE + WATER_ALLOCATION + ELECTRICITY_CHARGE

Step 7: Late interest (if overdue)
    IF days_overdue > 0:
        INTEREST = (CANON - DESCUENTO + IVA) * 0.0005 * days_overdue
        TOTAL_DUE = TOTAL_DUE + INTEREST
```

### 6.2 IVA Calculation Note

IVA is calculated on `(CANON - DESCUENTO_FASE)`, NOT on `(CANON - DESCUENTO_FASE - PP)`. The pronto pago discount does not reduce the IVA base. This matches the Siesa data where `impuesto` on facturas = `ventas * 19%` and descuento credit notes have no `impuesto`.

---

## 7. IPC (Inflation) Adjustments

### 7.1 Rate

IPC rate for 2026: **5.1%**

### 7.2 Application

Each tenant has an individual IPC date (`fecha_incremento_ipc`) when the annual adjustment takes effect. The IPC is NOT applied uniformly on January 1 -- it varies by contract anniversary.

```
CANON_POST_IPC = CANON_BASE * 1.051
IPC_INCREMENT_AMOUNT = CANON_BASE * 0.051
```

### 7.3 IPC Date Distribution (from C-KREA GB data)

IPC dates range from February through November 2026. The system must check each tenant's IPC date individually when generating monthly invoices.

### 7.4 Pro-Rata IPC for Annual Projections

For annual projection purposes, the IPC increment is pro-rated by the number of months it's in effect:

```
ANNUAL_IPC_IMPACT = IPC_INCREMENT_AMOUNT * MONTHS_REMAINING_IN_YEAR
```

Example: If IPC kicks in on October 1, the annual impact is `IPC_INCREMENT * 3` (Oct, Nov, Dec).

### 7.5 IPC and Phase Discount Interaction

If a tenant's IPC date falls within their contract-phase discount period, the phase discount is applied to the NEW (post-IPC) canon:

```
Month before IPC:  DESCUENTO = CANON_BASE * 20% 
Month after IPC:   DESCUENTO = (CANON_BASE * 1.051) * 20%
```

---

## 8. Worked Examples

### 8.1 Example 1: Local 101 -- Standard Tenant with Phase Discount

**Tenant data:**
- Canon base: $5,450,000 COP
- Contract-phase discount: 20% until May (inclusive)
- PP rate: 10%
- IPC date: October 1, 2026
- Classification: 1A

#### January (phase active, pre-IPC):

| Line Item | Formula | Amount (COP) |
|-----------|---------|-------------|
| Canon | base | 5,450,000 |
| Descuento fase (20%) | 5,450,000 * 0.20 | -1,090,000 |
| Subtotal | | 4,360,000 |
| IVA (19%) | 4,360,000 * 0.19 | 828,400 |
| **Invoice total** | | **5,188,400** |
| PP discount (10%) | 4,360,000 * 0.10 | -436,000 |
| **Net if PP paid** | | **4,752,400** |

#### July (phase expired, pre-IPC):

| Line Item | Formula | Amount (COP) |
|-----------|---------|-------------|
| Canon | base | 5,450,000 |
| Descuento fase | expired | 0 |
| Subtotal | | 5,450,000 |
| IVA (19%) | 5,450,000 * 0.19 | 1,035,500 |
| **Invoice total** | | **6,485,500** |
| PP discount (10%) | 5,450,000 * 0.10 | -545,000 |
| **Net if PP paid** | | **5,940,500** |

#### November (phase expired, post-IPC):

| Line Item | Formula | Amount (COP) |
|-----------|---------|-------------|
| Canon | 5,450,000 * 1.051 | 5,727,950 |
| Descuento fase | expired | 0 |
| Subtotal | | 5,727,950 |
| IVA (19%) | 5,727,950 * 0.19 | 1,088,311 |
| **Invoice total** | | **6,816,261** |
| PP discount (10%) | 5,727,950 * 0.10 | -572,795 |
| **Net if PP paid** | | **6,243,466** |

---

### 8.2 Example 2: Local 118 -- Deep Discount Tenant

**Tenant data:**
- Canon base: $3,650,000 COP
- Contract-phase discount: 30% until April (inclusive)
- PP rate: 10%
- IPC date: September 1, 2026

#### February (phase active, pre-IPC):

| Line Item | Formula | Amount (COP) |
|-----------|---------|-------------|
| Canon | base | 3,650,000 |
| Descuento fase (30%) | 3,650,000 * 0.30 | -1,095,000 |
| Subtotal | | 2,555,000 |
| IVA (19%) | 2,555,000 * 0.19 | 485,450 |
| **Invoice total** | | **3,040,450** |
| PP discount (10%) | 2,555,000 * 0.10 | -255,500 |
| **Net if PP paid** | | **2,784,950** |

#### June (phase expired, pre-IPC):

| Line Item | Formula | Amount (COP) |
|-----------|---------|-------------|
| Canon | base | 3,650,000 |
| Descuento fase | expired | 0 |
| Subtotal | | 3,650,000 |
| IVA (19%) | 3,650,000 * 0.19 | 693,500 |
| **Invoice total** | | **4,343,500** |
| PP discount (10%) | 3,650,000 * 0.10 | -365,000 |
| **Net if PP paid** | | **3,978,500** |

#### October (phase expired, post-IPC):

| Line Item | Formula | Amount (COP) |
|-----------|---------|-------------|
| Canon | 3,650,000 * 1.051 | 3,836,150 |
| Descuento fase | expired | 0 |
| Subtotal | | 3,836,150 |
| IVA (19%) | 3,836,150 * 0.19 | 728,869 |
| **Invoice total** | | **4,565,019** |
| PP discount (10%) | 3,836,150 * 0.10 | -383,615 |
| **Net if PP paid** | | **4,181,404** |

---

### 8.3 Example 3: Late Payment with Interest Accrual

**Scenario:** Local 101 (July invoice, no phase discount, pre-IPC). Tenant pays 45 days late.

| Line Item | Calculation | Amount (COP) |
|-----------|-------------|-------------|
| Invoice total (no PP) | 5,450,000 + 1,035,500 | 6,485,500 |
| Days overdue | 45 | |
| Interest | 6,485,500 * 0.0005 * 45 | 145,924 |
| **Total due** | | **6,631,424** |

Breakdown: $6,485,500 * 0.05% daily * 45 days = **$145,924 COP** in simple interest.

---

### 8.4 Example 4: Gastos Bill for a Tenant

**Scenario:** Local 101, January. Electricity meter reading = $450,000 COP.

| Line Item | Amount (COP) |
|-----------|-------------|
| Rental invoice (with PP) | 4,752,400 |
| Water allocation | 29,947 |
| Electricity (metered) | 450,000 |
| **Total monthly bill** | **5,232,347** |

Note: Water and electricity charges are billed as separate `SERVICIOS P` invoices in Siesa and do NOT receive PP or phase discounts.

---

### 8.5 Example 5: Monthly Portfolio Projection (January 2026)

Aggregated from C-KREA GB data:

| Component | Formula | Amount (COP) |
|-----------|---------|-------------|
| Total canons (all units) | SUM(canons) | 220,752,520 |
| Total phase discounts + PP | SUM(descuentos) | -44,566,530 |
| IVA on net | (220,752,520 - descuento_fase_total) * 19% | 37,164,190 |
| Cartera recovery (CXC) | fixed monthly | +10,772,200 |
| CXC discount (10%) | CXC * 10% | -1,077,220 |
| Retenciones | fixed monthly | -4,066,679 |
| **Projected monthly recaudo** | | **218,978,481** |

---

## 9. Edge Cases & Business Rules

### 9.1 Partial Payment -- NO PP Discount

**Rule:** If a tenant pays less than 100% of the net amount due within the 10-day window, the pronto pago discount does NOT apply. The full invoice amount (without PP) becomes due.

**Example:** Local 101, January. Invoice total = $5,188,400. Net with PP = $4,752,400. If tenant pays $4,000,000 within 10 days, this is treated as a partial payment. The remaining balance is $5,188,400 - $4,000,000 = $1,188,400 (calculated against the full amount, not the PP-discounted amount). Interest begins accruing on day 11 on the remaining $1,188,400.

### 9.2 Payment on Day 10 vs Day 11

**Rule:** Day 10 is the last eligible day for PP. Payment on day 11 means no PP.

- Invoice date: March 1 -> PP deadline: March 10 (end of day) -> Interest starts: March 11
- Invoice date: March 11 -> PP deadline: March 20 (end of day) -> Interest starts: March 21

### 9.3 Phase Discount Expiry Mid-Transition

**Rule:** Phase discounts apply through the entire end month. "Hasta mayo" means the full May invoice gets the discount. The June invoice does not.

### 9.4 IPC Applied Mid-Phase-Discount

**Rule:** If a tenant's IPC date falls within their discount phase (e.g., IPC on March 1, discount until May), the phase discount applies to the NEW post-IPC canon starting from the IPC month.

**Example:** Canon base = $2,000,000, 20% phase until May, IPC on March 1.
- February: DESCUENTO = $2,000,000 * 20% = $400,000
- March: DESCUENTO = ($2,000,000 * 1.051) * 20% = $2,102,000 * 20% = $420,400

### 9.5 Multi-Unit Tenants

**Rule:** Each unit is billed separately, even if the same tenant holds multiple units. Discounts, PP, and interest are calculated per unit, not aggregated. Example: MEDIOS IMPRESOS holds units 101 and 118. Each unit has its own canon, phase discount schedule, and PP calculation.

### 9.6 Tenant with 0% PP Rate

12 units have PP_RATE = 0%. These tenants never receive early-payment discounts regardless of when they pay. Their only discount mechanism is the contract-phase discount (if applicable). The due date and interest rules still apply normally.

### 9.7 Credit Notes and Reversals

When a tenant vacates or an invoice needs correction, a credit note (NVS document) is issued with a negative amount. Three such cases exist in the current data (DINAMO MARKETING, PEDRAZA RIVEROS, BECERRA MATEUS). Credit notes reverse the original factura and should zero out any associated PP credit notes.

### 9.8 Annual Prepayment — Unit 505 (TATIANA CONTRERAS) ⚠️ NEEDS PORTAL IMPLEMENTATION

**Confirmed:** Annual lump sum. Tenant paid the full year in advance as a single payment. C-Krea applied a 43% discount to the annual total as an incentive for prepayment.

**Accounting treatment:**
- 1 annual invoice (not 12 monthly invoices) covering the full lease year
- Discount = 43% off the annual canon total
- Monthly projections in DB are for planning only; do NOT auto-generate monthly invoices for this contract
- Portal does not yet support annual billing cycles — currently shows 20% in projections (wrong)

**Pending:** Build annual billing support or manually record this contract outside the standard monthly flow. See Linear issue for tracking.

### 9.9 Deposits and Advance Payments

Cartera data shows 156 negative-balance records totaling -$210,930,946 COP. These represent security deposits (DEPOSITO), separation fees (SEPARACION), and advance payments (ABONO). These balances should NOT be automatically applied to future invoices without explicit instruction.

### 9.10 Payment Application Order (Partial Payments on Overdue Accounts)

When a tenant with multiple overdue invoices makes a payment:
1. Apply to accrued interest (oldest first)
2. Apply to oldest outstanding principal (FIFO)
3. Remaining goes to the next oldest invoice

### 9.11 Rounding

All COP amounts are rounded to the nearest whole peso (no decimals). Rounding is applied at the line-item level, not at the invoice total.

---

## 10. Data Source Cross-Reference

### 10.1 Siesa ERP Account Codes

| Account | Description | Usage |
|---------|-------------|-------|
| 42201006 | Ingresos por arrendamiento | Revenue: rental invoices (facturas) |
| 42201090 | Descuento pronto pago | Contra-revenue: PP credit notes |

### 10.2 Document Type Mapping

| Prefix | Type | Meaning |
|--------|------|---------|
| FVS | Factura de venta servicios | Service sales invoice (rental) |
| RK | Recibo de caja | Cash receipt / PP credit note |
| CN | Credit note | Alternative PP credit note format |
| NVS | Nota de venta servicios | Invoice reversal / credit note |

### 10.3 Payment Status Flow

```
Invoice Created (FVS)
    |
    +--> Paid within 10 days --> RECAUDADO + PP credit note (RK/CN)
    |
    +--> Paid after 10 days --> RECAUDADO (no PP) + interest charge
    |
    +--> Not paid by due date --> VENCIDO
    |       |
    |       +--> 1-30 days: Cartera Morosa
    |       +--> >30 days: Cartera Critica
    |       +--> >90 days: Pre Juridico (legal)
    |
    +--> Partial payment --> Applied FIFO, interest on remainder
```

### 10.4 Collection Performance KPI

```
IF collection_percentage >= 98%: "Excelente"
ELIF collection_percentage >= 89%: "Normal"
ELSE: "Critica"
```

---

## Appendix A -- Discount Schedule by Tenant Type

### Contract-Phase Discount Combinations

| Phase % | Phase End | PP % | Count | Net Discount (Phase Months) | Net Discount (Post-Phase) |
|---------|-----------|------|-------|---------------------------|--------------------------|
| 0% | N/A | 10% | 39 | 10% PP only | 10% PP only |
| 20% | May | 10% | 18 | 28% effective | 10% PP only |
| 20% | June | 10% | 14 | 28% effective | 10% PP only |
| 30% | April | 10% | 4 | 37% effective | 10% PP only |
| 30% | May | 10% | 2 | 37% effective | 10% PP only |
| 20% | March | 10% | 2 | 28% effective | 10% PP only |
| 20% | April | 10% | 1 | 28% effective | 10% PP only |
| 20% | July | 0% | 1 | 20% only | 0% |
| 30% | March | 10% | 1 | 37% effective | 10% PP only |
| 30% | December | 10% | 1 | 37% effective | 37% all year |

**Effective discount** during phase = `1 - (1 - phase_rate) * (1 - pp_rate)`
- 20% phase + 10% PP = 1 - (0.80 * 0.90) = 28%
- 30% phase + 10% PP = 1 - (0.70 * 0.90) = 37%

---

## Appendix B -- Gastos Category Breakdown

### Monthly Operating Expenses (from Sheet 4. GASTOS)

| Category | Subcategory | Monthly Amount (COP) | Allocation Method |
|----------|-------------|---------------------|-------------------|
| **Servicios Publicos** | | **10,500,218** | |
| | Acueducto (Water) | 2,515,521 | Flat per-unit ($29,947) |
| | Plan celular | 45,916 | Not allocated |
| | Energia - tenant metered | 12,683,800 | Per-meter to each tenant |
| | Energia - common areas | 7,938,781 | Not allocated (absorbed) |
| **Aseo/Cafeteria** | | **3,722,463** | |
| | T-protec (cleaning service) | 3,265,663 | Flat per-unit |
| | Productos de aseo | 456,800 | Flat per-unit |
| **Varios** | | **41,946,660** | |
| | Vigilancia (Security) | 17,400,754 | Not allocated |
| | Reparaciones locativas | 13,817,392 | Not allocated |
| | Nomina (Payroll) | 7,443,459 | Not allocated |
| | Publicidad | 1,452,579 | Not allocated |
| | Impuestos ICA | 1,832,476 | Not allocated |
| **Otros** | | **13,651,687** | |
| | Andamios (scaffolding) | 2,462,000 | Not allocated |
| | Sayco y Acinpro | 228,583 | Not allocated |
| | Articulos tecnologicos | 4,063,652 | Not allocated |
| | HSE services | 2,219,930 | Not allocated |
| | Datacredito | 180,259 | Not allocated |
| **TOTAL** | | **69,821,028** | |

### Expenses Billed to Tenants

Only two categories are passed through to tenants:
1. **Water:** $29,947/unit/month (flat)
2. **Electricity:** Variable per meter reading (range: $1,000 - $1,822,600/month)

All other expenses are absorbed as property operating costs.

---

*End of Financial Rules Engine Specification*
