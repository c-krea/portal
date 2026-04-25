# C-Krea PayControl — Development Journal

---

## 2026-04-24 — Session 32: WOR-69 — pp_historico_pct backfill bug fix

### What we did

Closed WOR-69. Original `pp_historico_pct` backfill (Session 30) had two compounding bugs:

1. **Double-counted paired rows.** Siesa emits two rows per cash movement (`RK` + `001-RK`). Old denominator counted both, halving the visible PP rate.
2. **Skipped NO PROYECTADO PP wins.** Real PP-applied invoices that landed in Siesa's `NO PROYECTADO` bucket were excluded from both numerator and denominator, so the actual PP behavior never made it into the rate.

Combined effect: most tenants stuck on or near the 17.99% global fallback even when they pay early consistently.

### Fix

New backfill (`scripts/backfill-pp-historico.sql`, idempotent):
- Deduplicate on `(tenant_id, siesa_cruce, fecha_recaudo)` — collapses RK pair to one cash movement.
- Filter to `siesa_cruce LIKE 'FVS-%'` + `valor_final < 1B` (matches `getPagos*` filters in `src/lib/data/pagos.ts`).
- Numerator = deduped rows where `pronto_pago_aplicado > 0`. No classification gate.
- Denominator = all deduped rows.
- ≥10 deduped pagos → real per-tenant rate. <10 → global rate (computed from same dataset).

### Impact

| metric | before | after |
|---|---|---|
| global PP rate | 17.99% | 38.07% |
| avg per-tenant PP rate | 22.93% | 41.94% |
| tenants with real (non-fallback) rate | 51 | 62 |
| 2026 `recaudo_esperado` | $3,039M | $2,987M (−$51.9M) |

The drop is correct: more PP discount expected → less net cash projected. Projections now match what these tenants actually do.

### Examples

- ACRIGROUP: 1.69% → 7.26% (was missing 7 of 9 PP wins from NO PROYECTADO + dedup)
- NIETO VILLALBA: 17.99% (fallback) → 67.50% (40 real payments emerged from RK dedup)
- NC GRAPHICS: 17.99% (fallback) → 50% (10 deduped pagos, 5 PP wins surfaced)

### Why save the SQL as a script

Original backfill was a one-off ad-hoc query — not in any migration or script. WOR-69 made me reverse-engineer it from the data. Now `scripts/backfill-pp-historico.sql` is the canonical formula. Re-runnable after every payments sync if/when we want a fresh recompute.

---

## 2026-04-24 — Session 31: Pagos month filter + classification rewrite + NC GRAPHICS fix

### What we did

Reviewed and shipped Section 3 of `docs/REVIEW_PLAN.md`. Three concerns bundled.

**Pagos month filter** — `/pagos?month=YYYY-MM` dropdown. KPIs, buckets, and table all scope to the chosen month. URL is the source of truth (shareable + back/forward survives).

**Payment classification rewrite** (resolves the long-running Power BI gap chase):
- Dropped `siesa_clasificacion IN ('RECAUDADO','VENCIDO')` filter — proven unreliable: the same payment shows different values on duplicate rows. See `docs/audits/payment-classification-logic.md`.
- New filter: `siesa_cruce LIKE 'FVS-%'` (real invoice payments — excludes NVS credit notes, RK reversals).
- Dedup paired RK + 001-RK rows (Siesa emits both for one cash movement).
- Exclude standalone 001-RK entries whose per-tenant total matches the prior month's electricity bill (those are electricity payments, not canon receipts).
- Hard cap `valor_final < 1,000,000,000` to drop the $4.2B FUSION GRAFIK April 2024 data-entry error.
- New buckets `temprano` (day 1–10) / `tardio` (day 11+) / `mora` (tenant has prior-month outstanding cartera) — driven by date and cartera saldo, not Siesa classification.

**NC GRAPHICS contract fix**: their `pronto_pago_pct` was 0 (only contract of 78 set to 0). Real Siesa data shows they DO get 10% PP every cycle. Updated to 10. Linear WOR-69 tracks the related undercount in `pp_historico_pagos` (NO PROYECTADO classification excluded from histórico calc).

### Why this matters

Pagos KPIs were silently wrong before today. Bucket sums didn't reconcile to the KPI total because the classification field disagreed with itself across rows. Anyone comparing portal → Power BI was chasing an unanswerable question. Now the rules are: invoice-side filter (FVS-) + dedup + electricity carve-out, all documented in audits/.

---

## 2026-04-24 — Session 30: PP histórico + CKR-20 (PP+phase stacking) closure

### What we did

Reviewed the uncommitted PP histórico per-tenant model (Section 2 of `docs/REVIEW_PLAN.md`). Verified `tenants.pp_historico_pct` populated in production (65/66 tenants, avg 22.93%, max 54.84%, 51 with ≥10 payments). Confirmed against real Siesa data that **PP + phase discount STACK**, contradicting the mutual-exclusivity rule originally shipped.

### CKR-20 closed: removed mutual exclusivity from all 8 spots

Stripped the `CASE WHEN p.descuento_proyectado > 0 THEN 0 ELSE … END` (or equivalent) wrapper from:
- `src/lib/invoice-engine.ts:209` — invoice generation engine
- `src/lib/data/dashboard.ts:18` — portfolio total
- `src/lib/data/reportes.ts:112` — proyectado vs real chart
- `src/lib/data/pagos.ts:116` — proyectado_mes KPI
- `src/lib/data/proyecciones.ts` — 4 spots (breakdown, detalle, mensual)

DB sanity check on 2026 projections:
- Conservative max (no PP): $3,113,676,785
- OLD mutex PP: $57,518,108
- NEW stack PP: $73,702,168 (**+$16.2M previously missed**)

### Why this matters

A tenant in their phase-discount window who pays before day 10 still earns PP. We were under-discounting expected revenue. New "Recaudo esperado" projects ~0.5% lower for 2026 — closer to actual Power BI behavior (the 0.68 collection-rate hypothesis stays open as a separate question).

### Sidebar reorder (UX)

Moved Locales from position 4 (between Mora and Pagos) to position 5 (right below Pagos). German preference — Locales is a static reference, sits closer to billing flow.

---

## 2026-04-24 — Session 29: ERP Ocupación sync + data discrepancies audit

### What we did

Extended `scripts/sync-csf.ts` to include the `ckrea-ocupacion` endpoint (3rd sync target, alongside cartera + payments). Ran dry-run, surfaced 15 real discrepancies, and produced a verification doc for the CKREA manager to reconcile against ERP.

### The ERP-as-source-of-truth decision

From now on, ERP (Siesa) is the single source of truth for occupancy. Portal syncs FROM ERP, never the reverse. This formalizes the workflow: when a tenant leaves, admin closes contract in ERP → Portal auto-updates on next sync. No more manual corrections in Portal DB.

### Tenant identity model (confirmed — no schema changes needed)

- **NIT = permanent tenant identity.** Same legal entity = same `tenants.id` forever.
- **Contracts are lifecycle units.** Come and go. `status = 'activo' | 'critico' | 'vencido' | 'terminado'`.
- **Cartera ties to `tenant_id`, not to contract.** Debt persists across contract lifecycle — a tenant can leave the local but keep an outstanding balance.

This model works with existing schema. The fix is process, not code.

### The ERP data problem — 4 patterns found

Cross-referenced ERP (`Ocupacion SIESA.xlsx`, 84 occupied rows) against Portal DB. ERP reports only `Activo` (56) + `Critico` (28) — never `Inactivo`. All 85th+ units = vacant by omission.

1. **Contracts not closed when tenant leaves** (4 units): 111, 312, 313, 506A. ERP still shows `Critico` months after tenant physically left. Manager's Excel confirmed them vacant.
2. **Records missing NIT/nombre** (4 units): 311, 503, 505, 804. ERP has canon + `Critico` status but `DOCUMENTO` and `RAZON_SOCIAL` are NULL. Portal has the real tenant (all have active payment history + cartera).
3. **Tenant mismatch ERP vs Portal** (3 units): 120 (Becerra vs Fabian), 121 (Neografick vs Sonia Sierra), 126 (Dinamo in Portal, absent in ERP).
4. **Multi-local consolidation mismatch**: IMAGENN & PUNTO has 4 locals (508/510/512/514) — ERP splits canon by local ($2.99M/$2.73M/$2.84M/$2.74M), Portal has all $11.309M consolidated in 508. Totals match.

### Sync script extensions

- Added `CKREA_COMPANY_ID` constant
- Added `DISPONIBLES_OVERRIDE = ['312','313','506A']` — manager-confirmed vacant despite ERP. Bypass until ERP admin closes them.
- **Fantasma detection**: `!nit || !erpNombre` → auto-terminate DB contract with reason `ERP_SIN_INQUILINO`. (Disabled until manager confirms — these 4 turned out to be real active tenants with missing NIT in ERP, not vacants)
- **Multi-row per LOC dedup**: prefer `Activo` > `Critico` > first. (Moot — all 84 LOCs are unique.)
- CLI flags: `APPLY` (default false = dry-run), `DEBUG`
- Diff types: `UNIDAD_NO_EN_DB`, `SIN_CONTRATO_EN_DB`, `INQUILINO_DIFERENTE`, `CANON_DIFERENTE`, `DEBE_TERMINAR`

### Sync NOT applied

Dry-run surfaced suspicious items where auto-termination would delete real tenants (the 4 fantasmas are active with debt). Decision: **do not apply sync until manager verifies the list**. Sent `docs/revision-ocupacion-erp.html` to manager for verification.

### Deliverable

- `docs/revision-ocupacion-erp.html` — professional Spanish doc for CKREA manager. Structure: context → 4 tables (one per category) → patterns → proposed workflow → next steps. Print-friendly CSS (`@media print`). Manager verifies against physical reality → admin fixes ERP → Portal syncs automatically.

### Key gotcha for future

**ERP never uses `Inactivo`.** Only `Activo` + `Critico`. A local disappears from the ocupacion endpoint when vacant (or gets a fantasma row with NULL NIT). Any sync logic that assumes `ESTADO = 'Inactivo'` exists is wrong — caught this on first dry-run when 50 false positives surfaced.

**Null NIT + canon present ≠ vacant.** It's a data entry gap — the contract exists in ERP with canon but no tenant link. Requires manual verification before treating as vacant.

---

## 2026-04-23 — Session 28: Supabase IT Connection Guide

### What we did

No code shipped. Full session focused on unblocking IT's sync script and documenting the integration clearly.

### Root cause found — siesa_sync connection failure

IT ran the corrected Python script (keyword args, no URL) and still got `Tenant or user not found`. Investigated via Supabase MCP — user exists, can login, has password. Real cause: **PgBouncer (port 6543) keeps its own user registry separate from PostgreSQL**. Users created via SQL are not auto-registered in PgBouncer. Pooler doesn't know the user → rejects connection.

Fix: switch to **port 5432** (direct connection, no pooler). Different host: `db.bosylehvmtwtqkrlievy.supabase.co`. No suffix needed on username. For a sync script, direct connection is perfectly fine.

### 24/7 sync discussion

User wants Supabase always up to date, not just 3x/day. Decision: **cron job every 5 minutes** is the right approach — not a persistent connection. Script is idempotent (upsert), safe to run 288x/day. 5-minute lag is practically real-time for a rental payment portal. IT configures via Task Scheduler (Windows) or cron (Linux).

### Docs created this session

- `docs/supabase-fix-conexion.html` — already existed, reviewed with user
- `docs/supabase-it-guide.html` — **new**. Full IT reference: context + architecture diagram, connection fix with working Python code, test script, 3 endpoint field mapping tables (payments/cartera/tenants), common errors table. Tone: collaborative reference, not a wall. Password placeholder — German sends separately.
- `docs/csf-integration-options.html` — reviewed for context (not modified)

### Key gotcha for future

`Tenant or user not found` from Supabase pooler does NOT always mean wrong username format. If keyword args + correct suffix still fails, the user was created via SQL and is not registered in PgBouncer. Fix = port 5432, not PgBouncer config.

### IT firewall theory — ruled out

IT suggested corporate firewall blocking Supabase IPs. Ruled out: firewall block → timeout/refused, not a FATAL response. Getting FATAL = reaching the pooler = network is fine.

---

## 2026-04-22 — Session 27: Electricity Billing Research + Medidor Portal UX

### What we did

Deep research session: analyzed Excel `Consumo Energia xlocales 2026.xlsx` (15 months, Jan 2025–Mar 2026), cross-referenced with DB, and designed the full electricity billing feature. No code shipped yet — research and design only.

Also shipped several medidor portal UX improvements (same session).

---

### Medidor portal UX shipped

**Digit input redesign** (`src/app/(portal)/portal/medidor/form.tsx`):
- Replaced single number input with 5 individual digit boxes + 1 red crossed-out box
- Red box = decimal digit on real meter — always changing, so crossed out, non-editable
- Auto-advance on type, backspace goes back, paste fills all 5
- Hidden input submits the 5 digits joined as whole number

**Live preview panel** (appears as digits are typed):
- Lectura anterior / Lectura este mes / Diferencia / Total estimado energía
- Total only shows once all 5 digits filled AND tarifa > 0
- `tarifaKwh` fetched from previous period's meter_readings row

**Submitted state redesign** (`src/app/(portal)/portal/medidor/page.tsx`):
- "Lectura anterior del mes" — now large, prominent (slate card)
- "Lectura enviada este mes" — same green card
- "Consumo del mes" — new blue card showing the difference in kWh

**Zero-padding display** — all meter readings in the portal now show as 5-digit zero-padded strings (`09057` not `9,057.8`). Helper `meterDisplay(value)` = `String(Math.floor(value)).padStart(5, "0")`.
- Applied ONLY to this medidor client view + electric bill context. Not in admin views.

**Bug fixes**:
- `prevRows` query now excludes current period (`AND periodo < '${periodo}'`) so lectura anterior doesn't accidentally return the current month's own reading
- `withinDeadline` temporarily hardcoded to `true` for testing — **must revert to `today <= 10` before go-live**

---

### Electricity billing — full research findings

#### How the current Excel works (source of truth)
File: `Consumo Energia xlocales 2026.xlsx` — 15 monthly sheets.

**The formula (Excel column F):**
```
Pago = MROUND( consumo_kWh × tarifa , 50 )
```

**Tarifa derivation:**
```
tarifa = Valor Factura (total COP) ÷ kWh Factura (utility's reported kWh)
```
This is computed ONCE per invoice per month. Same tarifa applied to all units on that invoice.

**Important:** Unit meter total ≠ utility invoice kWh (~43% discrepancy in Jan 2025). Different measurement periods (meters read 7th–7th, utility bills 19th–19th). This is expected and normal — the formula still works because tarifa is derived from the invoice, not from summing all unit meters.

#### The 6 invoices — confirmed unit mapping

| Address | Provider | Units |
|---------|----------|-------|
| Cra 27 10 65 (F2) | NUE | 101–126, 801–807 |
| Cra 27 10 71 (IMPARES) | ENEL | 201, 203, 205, 207, 209, 211, 213 |
| Cra 27 10 73 (PARES) | ENEL | 202, 204, 206, 208, 210, 212, 214 |
| Calle 11 27 33 (IMPARES) | NEU | 501, 503, 505, 507, 509, 511, 513, 515, 517, 519 |
| Calle 11 27 39 (PARES) | NEU REYMON | 502, 504, 506A, 506B, 508, 510, 512, 514, 516, 518, 520 |
| Cra 27 10 79 | ENEL | 301–416 |

506A and 506B confirmed as separate units in DB (`ENT5-506A`, `ENT5-506B`).
Units 808–821 (internal C-Krea departments) do NOT pay electricity — excluded from billing.

#### Monthly workflow (real process)
1. End of month: utility sends 6 invoices (one per address above)
2. Admin inputs for each invoice: `Valor Factura` (COP) + `kWh Factura`
3. Portal computes `tarifa = valor ÷ kwh`
4. Each unit's charge = `MROUND(consumo × tarifa, 50)` using its address group's tarifa
5. Client submits reading days 1–10 of following month

#### Historical data status
- All data in `meter_readings` up to March 2026 was imported from ERP/Excel — `submitted_by = null`
- `tarifa_kwh` column is unreliable for historical data (0 for most units, import errors for some like 108–109 showing 3664.43)
- `total_energia` column IS correct (imported pre-calculated from Excel)
- Treat all pre-portal data as legacy — don't try to recalculate from tarifa_kwh

---

### Proposed DB design (not yet built — pending approval)

**1. Tag units with their address group (one-time):**
```sql
ALTER TABLE units ADD COLUMN electricity_group text;
-- values: 'CRA2710065', 'CRA2710071', 'CRA2710073',
--         'CLL112733', 'CLL112739', 'CRA2710079'
```

**2. New table `electricity_invoices`:**
```sql
CREATE TABLE electricity_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  periodo text NOT NULL,           -- '2026-04'
  electricity_group text NOT NULL, -- which of the 6 addresses
  direccion text NOT NULL,         -- human label
  proveedor text NOT NULL,         -- NUE, ENEL, NEU, NEU REYMON
  fecha_factura date,
  valor_factura numeric NOT NULL,
  kwh_factura numeric NOT NULL,
  tarifa_kwh numeric GENERATED ALWAYS AS (valor_factura / kwh_factura) STORED,
  created_at timestamptz DEFAULT now()
);
```

**Charge calculation per unit per month:**
```
unit_total_energia = MROUND(unit_kwh × invoice.tarifa_kwh, 50)
```

### Open decisions before building
- Admin screen: one page with 6 invoice rows per month, or separate form per invoice?
- Does the charge get written back to `meter_readings.total_energia` once admin enters invoice, or computed on the fly?
- Decimal cleanup in DB: 1,142 rows with decimal lecturas need to be floored — awaiting green light

---

## 2026-04-21 — Session 26: Recaudo Data Pipeline Audit

### What we did

Deep audit of why payment numbers differ between the portal and Power BI. Traced every filter from the original Excel setup through the live ERP sync. Full findings in `docs/recaudo-cartera-audit.md`.

### Key findings

1. **Excel data was pre-cleaned by the accounting team** — it already had credit notes, reversals, and noise removed before we received it. Our queries worked because the data was already clean, not because the queries were robust.

2. **001-RK duplication exists in BOTH Excel and ERP** — this was confirmed by a live test (a $301,000 payment appears twice in both). So the duplication is consistent and expected, not a problem introduced by the ERP sync.

3. **`siesa_clasificacion` is completely unreliable** — proved three ways:
   - Filtering to RECAUDADO + VENCIDO gives a negative all-time total (-$4.6B)
   - NO PROYECTADO alone totals $12.6B all-time (impossible for real rent)
   - Live test (MATICES COMUNICACION VISUAL SAS, NIT 900547519): the same payment gets RECAUDADO on the `001-RK` row and NO PROYECTADO on the `RK` row. Same money, same date, different classification. Never use this field as a filter.

4. **`siesa_cruce` is the reliable filter** — FVS = real invoice payment. NVS = credit note. RK = reversal. Only FVS rows represent genuine rent collection.

5. **One Siesa data entry error confirmed** — FUSION GRAFIK SAS (NIT 900984500), RK-485 + 001-RK-485, cruce FVS-45643, $4,215,750,000 each. Handled by a value threshold filter, not deletion.

### The 4 correct filters (apply in this order)

| Order | Filter | What it removes |
|-------|--------|-----------------|
| 1st | Zona = C-KREA | Other companies (applied at sync time via NIT matching) |
| 2nd | `siesa_cruce LIKE 'FVS-%'` | Credit notes, reversals, cancellations |
| 3rd | 001-RK dedup | Bookkeeping duplicate rows |
| 4th | `valor_final < 1,000,000,000` | Siesa data entry errors |

### Results with correct filters — March 2026

| Portal (4 filters) | Power BI | Gap |
|--------------------|----------|-----|
| $242,322,859 | $236,800,000 | $5.5M (2.3%) |

Gap is small and unexplained. Previous gap before this audit was much larger (portal showed wrong numbers in both directions depending on which broken filter was applied).

### What changed in the codebase

Applied all 4 filters to `src/lib/data/pagos.ts` — all three functions updated:

**`getPagosKPIs`** — added `siesa_cruce LIKE 'FVS-%'` and `valor_final < 1000000000` to the `deduped` CTE. The 001-RK dedup was already there. Removed the old `siesa_clasificacion` filter.

**`getPagosBuckets`** — same two filters added to its `deduped` CTE.

**`getPagos`** — same three filters added. Also fixed a pre-existing bug: `LEFT JOIN contracts ON tenant_id` was duplicating rows for the 12 multi-unit tenants. Replaced with a correlated subquery for `unit_number` (same pattern used in `getPagosBuckets`).

**Verified in DB before and after**: March 2026 KPI = $242,322,859. Bucket totals (temprano $113.4M + tardio $99.6M + mora $29.3M) = $242.3M exactly. KPI and buckets are now consistent.

### Open questions

- Why does the row count jump from ~50 to 128+ per month starting May 2025? Possible Siesa config change.
- What explains the remaining $5.5M gap vs Power BI for March 2026?

---

## 2026-04-21 — Session 25: PP Histórico + Pagos Month Filter (v2.7.0)

### What shipped

- **Pagos month filter**: URL-based `?month=YYYY-MM` param. KPI cards + table both filter to selected month. Dropdown shows last 12 months. Defaults to current month. "Mes anterior" KPI compares to the month before the selected one.
- **Sidebar reorder**: Resumen → Proyecciones → Mora → Pagos → Gastos → Medidores → Locales → Usuarios
- **PP histórico feature** (biggest change):
  - DB: `pp_historico_pct NUMERIC(5,2)` + `pp_historico_pagos INTEGER` added to `tenants` table
  - Backfilled per-tenant historical PP usage rate from all payments (tenants with ≥10 payments get real rate; <10 get 17.99% global fallback)
  - All projection queries updated to apply expected PP per-tenant, per-row
  - Phase discount exclusion enforced: `CASE WHEN p.descuento_proyectado > 0 THEN 0 ELSE pp_pct × pp_historico_pct END`
  - Dashboard `getProyectadoVsReal` + `getPortfolioStats` updated to use expected projection
  - Proyecciones UI: new "Recaudo esperado" KPI card, formula explainer updated, chart uses `proyectadoEsperado`, detail table has "PP hist." column with green/amber/grey badges

### Key decisions

- **Expected vs conservative**: switched from conservative (PP=0) to expected (PP × historical rate). Conservative was making cumplimiento always look low. Expected is more realistic for day-to-day tracking.
- **Per-tenant, never global**: each tenant's historical rate is applied individually. Global average (17.99%) only used as temporary fallback for thin-history tenants (<10 payments).
- **Phase discount exclusivity bug fixed**: original implementation wrongly applied `c.pronto_pago_pct` to ALL 12 months including those with active phase discounts. Fix: per-row CASE WHEN check on `p.descuento_proyectado > 0`.
- **No stored data changed**: `projections` table unchanged. Expected PP computed on the fly in query layer. Means rates auto-refresh as payment history grows.
- **PP hist. badge**: grey = fallback (<10 payments), amber = low-moderate usage, green = ≥30% usage rate.

### Monthly impact (conservative → expected)

- Jan–May: −$2.1–2.8M/month (many phase discounts still active → PP blocked for those months)
- Jun–Dec: −$6.0–6.6M/month (phase discounts expire → more contracts PP-eligible)
- Annual total: ~$3,113M → ~$3,079M expected

### Data facts confirmed

- 66 tenants updated with PP rates
- Highest PP usage: IN DESIGN 55%, MI MUG 53%, TICETTE STILE 50%
- Lowest: BECERRA 0% (140 payments, never once), FUSION GRAFIK 1%, IMPROEXPRESS 2%
- IMAGENN (biggest tenant): 6% — minimal impact on projection

---

## 2026-04-20 — Session 23: Meter Validation Upgrade (v2.6.0)

### What shipped
- **Hybrid validation**: seasonal same-month avg (primary) → full-history avg (fallback) → auto-approve (no history)
- **Three tiers**: `aprobado` ±20%, `revision` ±40%, `critico` >40% or kwh=0
- **Admin badge**: `🚨 Crítico` added to ValidationBadge (was falling through to grey "Pendiente")
- **DB constraint**: updated `meter_readings_validation_status_check` to allow `critico`
- **Column rename**: "vs Prom.3m" → "vs Histórico" (reflects actual logic)
- **Step fix**: meter input `step="0.01"` — was `step="1"` which blocked decimal min values

### DB review findings (all 82 units)
- 57 units: valid April 2025 data → seasonal avg used
- 14 units: no valid April (vacant or started after Apr 2025) → full-history avg
- 2 units (506A/506B): zero history → auto-approve
- 8 units had April 2025 = 0 kWh (vacant that month) → fixed: now fall back to full-history avg instead of auto-approving everything
- Notable large seasonal vs full-hist gaps: 516 (april=109 vs hist=385), 508 (221 vs 342), 121 (54 vs 162) — seasonal is correct here, those tenants genuinely changed usage

### Key decisions
- Option B (seasonal) chosen over Option C (statistical) — 15 months of data not enough for reliable σ
- Fallback uses ALL available history, not just last 3 months — more robust for newer units with 2–10 months of data
- Zero April kWh treated as "no valid seasonal reference" — falls through to full-history (prevents auto-approving everything for formerly-vacant units)

### Manual tests run
- ✅ Aprobado: 100.2 kWh (+8% vs April ref 92.8) → aprobado
- ✅ Revision: 125.2 kWh (+35%) → revision
- ✅ Critico: 159.2 kWh (+71%) → critico (after fixing DB constraint)
- DB constraint fix: was missing `critico` → upsert failed silently with "Error al guardar"

### Pending
- CKR-19: revert `withinDeadline = true` → `today <= 10` after demo (2026-04-20)

---

## 2026-04-20 — Session 22: Google Drive Photo Upload + Meter Auto-Validation (v2.5.0)

### What shipped
- **Google Drive integration**: tenant photos upload to `Medidores C-Krea / Local {N} / YYYY-MM.pdf` via OAuth2 refresh token (not service account — personal Gmail has no SA storage quota)
- **PDF conversion**: all images (JPG/PNG) auto-converted to PDF via `pdf-lib` before upload. Fallback: upload raw if format unsupported (WebP, HEIC)
- **Drag-and-drop**: drop zone highlights blue on hover, accepts JPG/PNG/PDF. Base64 via FileReader → hidden input (DataTransfer→input.files unreliable in React server actions)
- **Auto-validation**: already existed — ±10% vs promedio_3m → `aprobado`/`revision`
- **DB**: added `foto_drive_id` column to `meter_readings`
- **Inline preview**: after submit → `router.refresh()` → locked state shows embedded Google Drive iframe (360px). Works for PDFs and images.
- **Admin table**: "Foto" column with "Ver" Drive link
- **Demo fix**: deadline bypassed (`withinDeadline = true`) — CKR-19 tracks revert

### Key decisions
- **OAuth2 refresh token > service account** for personal Gmail Drive. SA has no storage quota on personal folders. Shared Drives require workspace. OAuth2 with refresh token uploads as the real user.
- **Base64 hidden input** is the only reliable way to pass files through React server actions with drag-and-drop. `DataTransfer→input.files` works for click-to-select but not guaranteed for programmatic sets in server action forms.
- **iframe with `/preview` URL** renders Drive files inline — no CORS issues, works for PDF + images.
- **`router.refresh()` in useEffect** after `state.success` triggers server component re-render — picks up fresh DB data including `foto_drive_id` for the iframe.

### Gotchas
- `revalidatePath` causes server component remount → wipes React state (blob URLs, base64). Never rely on local state for post-submit display — use server state or action return values.
- `Readable.from(Buffer)` unreliable in Vercel serverless for googleapis media upload — use `new Readable(); stream.push(buf); stream.push(null)` instead.
- Google Drive OAuth consent screen must be "Published" (not Testing) to authorize with secondary Gmail accounts without adding test users.

### Pending next session
- **Meter validation equation upgrade**: current is ±10% vs promedio_3m (last 3 months). Decision pending on Option B (seasonal reference: same month prior years + 3m trend) vs Option C (statistical: mean ± 2σ). 15 months of data available (Jan 2025 → Mar 2026). German to provide context on which approach fits.

---

## 2026-04-19 — Session 21: Full Admin Mobile Pass (v2.4.0)

### What shipped
- **Route rename**: `/clientes` → `/locales` everywhere (nav, links, actions, revalidatePaths)
- **Proyecciones**: KPI text-sm mobile, formula hidden, chart overflow-x-auto minWidth:540, DetalleTable meta.className column hiding
- **Mora**: KPI cards smaller, MoraTable progressive hiding (Facturas sm, Saldo total md)
- **Pagos**: hide Fecha + Concepto on mobile
- **Gastos**: KPI smaller, GastosChart explicit height fix (same Recharts flex chain bug as dashboard), GastosTable meta.className via TanStack module augmentation
- **Locales**: tabs overflow-x-auto + shrink-0, table meta.className, text-xs throughout
- **Locales detail**: KpiCard truncate, Pagos 3-col, CarteraTable meta.className
- **Medidores**: grid-cols-2 KPIs, controls flex-wrap, table hide pattern
- **Usuarios**: stats grid-cols-2, tab bar flex-1, tables text-xs, edit-tenant modal stacks (grid-cols-1 lg:grid-cols-2) + max-h-[90vh] scroll, all inputs/buttons text-xs
- **Facturas**: table text-xs, 4-col mobile progressive hiding

### Key decisions / patterns established
- **Recharts always needs explicit px height** — `height="100%"` inside flex chain = 0. Use `style={{ height: Npx }}` on wrapper div. Now applied consistently: dashboard, proyecciones chart (overflow-x-auto wrapper), gastos pie.
- **TanStack column hiding via meta.className** — add `declare module "@tanstack/react-table" { interface ColumnMeta<TData, TValue> { className?: string } }` then apply `meta.className` in both th and td. Used in: GastosTable, ClientesTable, CarteraTable.
- **Custom table hiding** — add `hide?: string` field to COLS array, apply in th/td map. Used in: MoraTable, MedidoresAdminTable, DetalleTable.
- **Mobile text sizing pattern**: `text-sm sm:text-xl` for KPI values in 2-col grids, `text-xs` for tables/tabs, `truncate` on COP values to prevent overflow.

---

## 2026-04-19 — Session 20: Mobile, Portal P2, Tenant Accounts (v2.3.0)

### What shipped
- **WOR-56**: `createTenantAccount` server action + "Crear cuenta" button in Usuarios/Inquilinos tab. Flow: sales enters email → click button → auth account created (`email_confirm: true`, no password) → tenant uses forgot-password to set their own.
- **WOR-58**: Portal Total a Pagar now computes `canon × (1−descuento%) × 1.19 + electricidad`. "Ver detalle" modal with full line-item breakdown (canon, descuento, IVA, electricidad, PP footnote). Button moved to card top-right. Gray text simplified to "Arrendamiento + electricidad".
- **WOR-59**: Admin medidores year+month selector (2025/2026). All 1,180 readings accessible. Previously only Jan–Apr 2026 were reachable.
- **Mobile pass 1** (portal + admin layout): hamburger nav + slide-out drawer, sidebar hidden on mobile, `ml-0 lg:ml-[220px]`, responsive padding, all major grids fixed (`grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), gastos 70/30 stacks on mobile, mora aging buckets stack, portal pagos table hides columns on mobile, perfil grid stacks.
- **Mobile pass 2** (dashboard): RecaudoCard table hides PP/Recaudo cols on mobile, Desglose de Mora items get `py-4` on mobile, RendimientoChart switched to horizontal bars (`layout="vertical"`) — solves thin-bar problem on mobile, explicit `height: 380` for Recharts reliability.

### Key decisions
- **WOR-60 deferred**: "Ver detalle" modal already covers tenant charge breakdown. Invoices only useful once admin billing workflow is automated.
- **WOR-57 deferred**: Sales team handles tenant onboarding in person — no magic link flow needed. Tenants use forgot-password.
- **Recharts `height="100%"` unreliable in flex chains**: Always give ResponsiveContainer a numeric pixel parent (`style={{ height: 380 }}`). `absolute inset-0` trick also unreliable — Recharts uses ResizeObserver which needs a real DOM height at mount time.
- **Horizontal bars for mobile chart**: Switching `layout="vertical"` in Recharts solves thin-bar problem without hiding data or adding popup complexity. Tabla tab already provides full detail.

### Mobile review status (admin sidebar order)
- ✅ Dashboard — done (grids, desglose, chart)
- ⬜ Locales — next
- ⬜ Mora
- ⬜ Pagos (admin)
- ⬜ Gastos — layout fixed, table columns may still need review
- ⬜ Proyecciones
- ⬜ Facturas
- ⬜ Medidores
- ⬜ Usuarios

---

## 2026-04-19 — Session 19: Usuarios Admin + Mobile Portal (v2.2.0)

### What happened

**Mobile portal fixes:**
- Portal layout: `px-4 sm:px-6`, name hidden on mobile, `py-6 sm:py-8`
- Dashboard grid: `grid-cols-1 sm:grid-cols-3`, banner stacks vertically, Concepto col `hidden sm:table-cell`
- Medidor page + form: both `grid-cols-2` → `grid-cols-1 md:grid-cols-2`

**Usuarios page full rebuild:**
- Two-tab layout: Inquilinos del Portal + Administración
- Stats strip: total tenants / email configured / cuenta activa / activos últimos 30d
- `getPortalTenants()`: switched from `MIN()` per-unit to `JSON_AGG(JSON_BUILD_OBJECT(...) ORDER BY u.unit_number)` — gets all contracts for multi-unit tenants. Reads `auth.admin.listUsers()` for real portal emails + lastSignIn. Auto-backfills `portal_email` on each page load to heal drift (units 101/118 had auth accounts but null `portal_email` in DB).
- `EditTenantModal`: two-card layout matching perfil page. Left: contact info (NIT, razón social, nombre corto, email contacto, teléfono, email portal). Right: per-unit contract tabs (appears when `unitContracts.length > 1`) + contract fields. Amber confirmation dialog before save.
- `EditAdminModal`: name/email/role. Same amber confirmation pattern.
- `updateTenantUser` server action: updates tenants + auth sync + unit (single only) + per-contract fields.
- Auth sync pattern enforced everywhere: any email write → also `auth.admin.updateUserById()`.
- Representante field removed (Siesa ERP artifact).
- $ and % symbols removed from number inputs (NumInput is plain input, no affixes).
- Usuarios added to NAV_ITEMS in `src/lib/constants.ts` — was missing entirely.

### Key decisions
- `JSON_AGG` over `MIN()` for contracts — `MIN()` silently discards all but one contract's data for multi-unit tenants. Non-obvious bug, easy to miss.
- `Promise.resolve(supabaseBuilder)` for backfill array — `PostgrestFilterBuilder` is `PromiseLike` not `Promise`, so `Promise<unknown>[]` type fails unless wrapped.
- Two-step amber confirm modal on all destructive edits — consistent UX pattern now used in both admin and tenant modals.
- No inline email editor in table — removed EmailEditor from row, all editing goes through modal now.

### Errors caught before deploy
1. `const` declarations inside `return {}` block — JS syntax error, not valid object literal. Moved declarations above return.
2. `setRole(e.target.value)` — `string` not assignable to `"admin" | "finance" | "viewer" | "tenant"` union. Fixed with `as UsuarioRow["role"]` cast.
3. `PostgrestFilterBuilder` not assignable to `Promise<unknown>` — backfill push array type mismatch. Fixed with `Promise.resolve()` wrapper.

### Files changed
- `src/lib/constants.ts` — Usuarios nav item
- `src/lib/data/usuarios.ts` — UnitContract type, getPortalTenants() full rewrite, getUsuarios() lastSignIn
- `src/app/(app)/usuarios/actions.ts` — updatePortalEmail, updateTenantUser, updateAdminUser
- `src/app/(app)/usuarios/edit-admin-modal.tsx` (new)
- `src/app/(app)/usuarios/edit-tenant-modal.tsx` (new)
- `src/app/(app)/usuarios/tab-switcher.tsx` (new)
- `src/app/(app)/usuarios/page.tsx` — stats + TabSwitcher
- `src/app/(portal)/layout.tsx`, `portal/page.tsx`, `portal/medidor/page.tsx`, `portal/medidor/form.tsx` — mobile

---

## 2026-04-17 — Session 17: PP Reconciliation Model + Dashboard Tab Toggle (v2.1.0)

### What happened

**Pronto pago fix (projections):**
- Root cause found: `pronto_pago_proyectado` was pre-applied to all 899 projection rows, assuming 100% of clients would pay within 10 days. Wrong.
- PP is conditional — only granted when a client actually pays ≤ day 10 of the month.
- Fixed: zeroed all 899 rows in DB via Supabase MCP. Set `newPP = 0` in `actions.ts`. Removed PP from all SQL formulas in `proyecciones.ts`, `reportes.ts`, `dashboard.ts`.
- Impact: ~8M (Feb) and ~9M (Mar) gap between projected and recaudado is now correctly explained as PP actually granted to early payers — visible as dark emerald in the chart.

**PP reconciliation model (Option B chosen):**
- Projection stays immutable. PP tracked on payment records (`pronto_pago_aplicado` column).
- Reconciliation formula: Proyectado = Recaudo neto + PP otorgado + Pendiente.
- Dashboard chart now shows 3 stacked segments: emerald (cash received) / dark emerald (PP granted) / navy (truly unpaid).
- Saved as architectural decision in memory: `decision_pp_visualization.md`.

**Dashboard RecaudoCard:**
- Inline chart div replaced with `RecaudoCard` client component.
- Tab toggle (Gráfica / Tabla) in same h-[480px] fixed-height card — no scroll added.
- Table view: compact monthly breakdown (Mes | Proyectado | Recaudo neto | PP otorgado | Pendiente | %) with color badges (✓ emerald ≥100%, amber ≥80%, rose <80%, — future).
- Footer totals removed from card — already visible in KPI cards above.

**Gastos page redesign:**
- Month tabs (ENE/FEB/MAR/ABR) added, matching Medidores pattern. URL: `?periodo=2026-01`.
- Bar chart replaced with filled pie chart (8 categories). Legend + % below, COP on hover only.
- Layout: 70/30 split — table card left, pie card right. Sort icons removed. Date as MM/YY.

### Key decisions
- PP never deducted in projections or invoices. Only applied at actual payment time.
- RecaudoCard tab toggle preferred over scroll or separate page section — keeps dashboard compact.
- Reconciliation table removed from proyecciones page (wrong context — it's a dashboard view, not a projections view).
- Ficha cliente PP phase deferred — payment history table already shows PP per row. No new KPI card added yet.

### Files changed
- `src/lib/data/proyecciones.ts`, `reportes.ts`, `dashboard.ts`
- `src/app/(app)/proyecciones/actions.ts`, `proyecciones/page.tsx`
- `src/components/dashboard/rendimiento-chart.tsx`, `recaudo-card.tsx` (new)
- `src/app/(app)/page.tsx`
- `src/lib/data/gastos.ts`, `src/app/(app)/gastos/page.tsx`
- `src/components/gastos/gastos-chart.tsx`, `gastos-table.tsx`

---

## 2026-04-16 — Session 16: Mora + Locales UX Overhaul (v2.0.0)

### What happened

**Cartera Jurídica:**
- Added `tenants.juridica boolean` column. Tenants flagged `juridica=true` excluded from all mora KPIs and appear in separate "Cartera Jurídica" table below mora table.
- Magda Pedraza (unit 503) flagged. PUNTO ACRILICO created manually with $4.818.675 balance, NIT='PENDIENTE'. WOR-46 in Linear to fill missing data.
- Why: legal cases distort operational mora KPIs.

**Locales tab (renamed from Clientes):**
- One row per client (not per unit). Unit badges as chips. Canon = sum of active contracts.
- Inactivos tab: shows vacant units (no active contract) via `getVacantUnitRows()`. Non-clickable "Vacante" rows.
- Default sort: Al Día → canon desc, Mora/Críticos/Todos → saldo pendiente desc.
- Tab filter in URL (`?tab=en_mora`) — browser back preserves filter.

**BackButton:** `router.back()` replaces hardcoded `/clientes` href. Always returns to correct previous URL.

**Multi-unit contract fix:** `getTenantDetail(unitNumber?)` now filters by unit. Mora + Locales links pass `?unit=XXX`.

**Cartera per-business confirmed:** Siesa invoices the business not the unit. Detail page shows all cartera at tenant level — correct behavior.

### Key decisions
- `juridica` flag is tenant-level (not contract-level)
- Inactivos = vacant units (operational question: which spaces are free?), not inactive tenant history
- Cartera stays tenant-level — don't attempt per-unit split

### Files changed
- `src/lib/data/mora.ts`, `dashboard.ts`, `clientes.ts`, `tenant-detail.ts`
- `src/components/mora/mora-table.tsx`, `clientes/clientes-table.tsx`
- `src/components/shared/back-button.tsx` (new)
- `src/app/(app)/mora/page.tsx`, `clientes/[id]/page.tsx`

---

## 2026-04-16 — Session 15: Gastos import, dashboard polish, medidores OCR prototype

### What happened

**Dashboard:** Removed "Saldo Pendiente" KPI (4→3). Renamed "Desglose de Cartera" → "Desglose de Mora" with meaningful buckets: Mora Crítica (>60d), Mora Activa (31-60d), Intereses, Promedio Días. SQL computes both buckets in a single CASE query — no extra round trip.

**Mora table dup key:** React warning "Encountered two children with the same key" — root cause: tenants with multiple units each appeared once per unit, all sharing the same `tenantId` as React key. Fixed with composite `tenantId-unitNumber`.

**Gastos import from ERP:**
- Jan 2026 ($69.8M): from C-KREA GB.xlsx "4. GASTOS" sheet — 15 line items
- Feb/Mar/Apr 2026 ($142.2M): from ckrea.xlsx "Estado de resultados" sheet — Siesa journal entries grouped by account family → mapped to 11 gasto_types
- Total: 40 rows, $212M. Power BI shows $214.18M — $2.2M gap = April still in progress
- Reconciliation confirmed: Jan ERP total = Jan manual sheet total = $69.8M ✓
- Account code family mapping: 5205x→nómina, 52352501→acueducto, 52353001→energía, 52350506→vigilancia, 52501501→reparaciones, etc.

**Gastos page redesign:**
- KPIs: Total YTD / Promedio mensual / Último mes / Total registros (replaced asignado/pendiente — never used)
- Stacked Recharts bar chart: month on X, 8 category colors stacked. Custom tooltip shows all categories + total.
- Key learning: `is_allocated` flag was designed for cost allocation to units — but ALL gastos are building-level operating costs (only electricity allocated per unit via medidores). Flag is irrelevant; removed from UI.

**WOR-47 Medidores OCR — feature design + prototype:**

Business logic confirmed:
- All 84 units have electricity meters (updated in DB)
- Validation: compare new reading vs AVG of last 3 months ±10% → auto-approve or flag
- No photo by day 10 → charge promedio_3m × 1.5 (incentive to submit)
- Channel: same portal, tenant login (Supabase Auth role), ruta (tenant)/
- Storage: Google Drive API + Cloud Vision OCR (needs GCP service account from IT)

Admin prototype built (Phase 1):
- Period tabs (Ene/Feb/Mar/Abr)
- KPI strip: Total / Registradas / Sin lectura / Total kWh
- Table: 84 units with sort, filter, desviación% vs promedio 3m, status badges
- Blue banner showing WOR-47 params for awareness

### Decisions made
- Gastos are NOT allocated to individual units (only electricity is, via medidores)
- Medidores OCR feature: Linear WOR-47, spec at docs/features/WOR-47-medidores-ocr.md
- ±10% tolerance, 1.5× factor high, 10-day deadline — all confirmed

### Pending (next session)
- WOR-47 Phase 2: schema update + auto-validation logic
- WOR-47 Phase 3/4: OCR + tenant portal (needs GCP account from IT first)
- CKR-13: SOLORZANO payment + NEOGRAFICK tenant still open
- Interest rate confirm: 2%/month in DB vs 1.5%/month in spec

---

## 2026-04-16 — Vercel DB Fix (IPv6 root cause) + Demo Prep

### Problem
Site showed "application error: client-side exception" on every page after login. Spent several attempts debugging connection strings before finding the real root cause.

### Root cause (confirmed via exhaustive testing)
Supabase DB host `db.bosylehvmtwtqkrlievy.supabase.co` resolves to **IPv6 only** (`2600:1f18:2e13:9d5a:...`). Vercel Lambda is **IPv4 only** — physically no TCP path exists. All 4 pooler variants also failed (shared pooler `aws-0-us-east-1` returned "Tenant or user not found" even locally, meaning this project isn't registered in the shared pool).

Key diagnostic command that revealed it: `node -e "const dns=require('dns').promises; dns.lookup('db.bosylehvmtwtqkrlievy.supabase.co').then(r=>console.log(r.address))"` → showed IPv6 address.

### Fix
Created `exec_sql(q text) returns jsonb` Postgres function (service_role only, SECURITY DEFINER). Created `src/lib/db/executor.ts` that calls this via Supabase JS admin client over HTTPS (`bosylehvmtwtqkrlievy.supabase.co` = Cloudflare IPv4). Migrated all 29 files.

### Lessons
- Always check if the DB host resolves to IPv4 or IPv6 before assuming pooler issues
- `echo "..." | vercel env add` appends `\n` — always use `printf`. Bit us twice this session.
- Supabase free tier projects may not be registered in shared Supavisor pooler — don't assume pooler works
- The `exec_sql` RPC pattern is the correct long-term approach for this Supabase project on Vercel

### Also added this session
- `loading.tsx` + `error.tsx` at `(app)/` layout level — covers all 11 pages with spinner + graceful error boundary

## 2026-04-16 — Mora Polish, Cartera Import, Grace Period, Auth Fix

### What happened

**Cartera was empty after payments import:** `import_data.py` wipes cartera in its truncation order. Re-imported 118 rows from ckrea.xlsx Cartera sheet. 3 skipped: PUNTO ACRILICO (not in tenants), NEOGRAFICK (CKR-13). Fixed NaN `valor_vencido` on not-yet-due rows (Excel blank cells → Python `float('nan')` → Postgres NaN). Fixed negative `dias_mora` rows.

**Mora page polished:**
- Table: clickable rows → client detail, unit badge, separate Vencido + Saldo columns
- Bucket cards: switched to saldo pendiente (interest = $0 since cron hasn't run)
- Clientes `[id]` payment history: Recibo (RK-XXXX) + Factura (FVS-XXXXX) columns, clasificacion badge, totals footer, limit 50

**Root cause of $156M vs Power BI $60-75M:**
- Siesa Cartera export marks everything past due date as VrVencido immediately (0-day grace)
- April 2026 invoices (due Apr 11, 5 days overdue) = $84.8M, driving up the total
- With 30-day grace filter applied: $67.6M / 11 clients → matches Power BI exactly
- Key learning: always check what "grace period" the reference system uses before comparing totals

**Grace period implementation:**
- `grace_period_days = 30` set in `financial_rules` table
- `getGracePeriod()` shared utility in `configuracion.ts` — imported by dashboard, mora, reportes
- All mora KPIs now consistent and runtime-configurable from Configuración page
- No deploy needed to change threshold

**IMAGENN concentration flag (CKR-15):**
- After grace filter, IMAGENN = $29.8M of $67.6M total (44%). 3 invoices, max 63 days.
- Not a data bug — they genuinely have 4+1 units at ~$13M/invoice. Needs payment plan check.

**Vercel issues found and fixed:**
1. `CRON_SECRET` had trailing space → cron handler auth check failed → builds errored (5s builds)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Production was `"\n"` (blank newline) → all logins silently returned "credentials incorrect" for every user
3. Both fixed, redeployed. Pattern: env var corruption is hard to debug because the generic error message hides the real cause. Always `vercel env pull` to verify actual values when auth mysteriously breaks.

**New user created:**
- `operaciones@reymon.com.co`, role `finance`, email confirmed
- Trigger `handle_new_user` uses `user_role` enum — passing "finanzas" fails silently with 500. Correct value is "finance".

**Vercel-specific gotcha added to memory:**
- `NEXT_PUBLIC_*` vars bake into the build at compile time. If the value was wrong at build time, changing it in Vercel requires a redeploy (empty commit) to take effect.

---

## 2026-04-16 — Payments Import Session

### What happened

**Analyzed ckrea.xlsx (Siesa/CSI export) — 5 sheets:**
- `Recaudo` = payments history (3,134 rows, 2,696 ARRENDAMIENTOS = C-Krea rental payments, Jan 2024 → Apr 2026)
- `Cartera` = outstanding balances (already in DB)
- `Ocupacion` = tenant/contract data (already imported)
- `Documentos` = Siesa invoice list (used for Siesa CSV export format)
- `Estado de resultados` = P&L journal entries (not rental payments)

**Workflow decision recorded:**
- Siesa is source of truth: creates invoices (FVS-XXXXX) + receipts (RK-XXXXX)
- Portal = management/analytics layer reading from Siesa exports
- Long-term: direct API key to CSI for push-back
- IT questions saved to memory: `it_questions_siesa.md` (API format, sync frequency, RK numbering, etc.)

**Tenant NIT fix:**
- All tenants were imported with fake `IMPORT-XXX` NITs — real NITs not captured in original import
- 62 tenants updated with real NITs via name-matching from Ocupacion + Recaudo sheets
- 3 skipped pending confirmation (units 120, 121, 209) → CKR-13 created
- Units 209 (PROHERCOL=901148181), 120 (GUZMAN=1023891322), 121 (SONIA=1013660654) confirmed same session and updated
- 65 total tenants: 65 now have real NITs (100%)
- NEOGRAFICK (new unit 121 tenant) + BECERRA as unit 120 current occupant: NITs still needed for tenant records, not payments

**Payments import:**
- 2,695 / 2,696 ARRENDAMIENTOS payments imported into `payments` table
- Only SOLORZANO RAMIREZ KELLY ALEXANDRA (NIT 53154279, 1 payment 2026-03-02, $3,225,000) skipped — not in tenant DB
- Cross-validated: PP total exact match ($218,993,654), net total diff = exactly her 1 payment ($3,225,000)
- Siesa fields stored: `siesa_docto` (RK-XXXX), `siesa_cruce` (FVS/NVS reference), `siesa_clasificacion`
- CKR-13 updated with final status

**Design note — historical payments vs reconciliation:**
- Imported payments are read-only history from Siesa. NOT run through `reconcilePayment`.
- Cartera table already has correct saldos from Siesa snapshot — no re-reconciliation needed.
- New payments entered via portal form going forward use reconciliation engine normally.

### Decisions
- Import ARRENDAMIENTOS only — skip NACIONALES REYMON (other company), SERV.PUB, INTERESES MORA
- NVS (credit notes, negative valorFinal) imported as-is — needed for audit trail
- Historical payments: display-only, not reconciled against portal cartera

### Next session
- Polish mora page with real payment data
- Polish clientes/[id] page with payment history

---

## 2026-04-16 — Financial Rules Corrections + Mora Redesign Session

### What happened

**PP mutual exclusivity rule (Rule A correction)**
- New rule confirmed: PP (pronto pago 10%) only applies in months where NO phase discount is active. Clients with 10/20/30/43% phase discount get PP = 0 during those months; PP kicks in only after phase expires.
- `invoice-engine.ts`: one-line fix — `prontoPagoRef = descuentoFase > 0 ? 0 : roundCOP(netCanon * prontoPagoPct / 100)`
- `financial-rules-engine-spec.md §2.4`: added point 4 documenting the mutual exclusivity rule

**DB projection data fix**
- 199 rows in `projections` had `pronto_pago_proyectado > 0` AND `descuento_proyectado > 0` simultaneously — wrong per new rule
- Total bad PP zeroed: ~$48M COP
- SQL: `UPDATE projections SET pronto_pago_proyectado = 0 WHERE descuento_proyectado > 0 AND pronto_pago_proyectado > 0`
- Verified 0 remaining wrong rows after update

**Proyecciones table — PP% column fixed + sortable**
- `getProyeccionDetalle` query: `PP%` now computed as `CASE WHEN MAX(descuento_proyectado) > 0 THEN 0 ELSE pronto_pago_pct END` — clients with any phase discount in 2026 show `—`, not 10%
- Extracted table to `src/components/proyecciones/detalle-table.tsx` (client component) with click-to-sort on all columns. Active column shows ↑/↓ indicator. No extra icons added.

**Unit 505 (Tatiana Contreras) — annual lump sum**
- Confirmed: paid full year upfront as single payment, 43% discount on annual total
- DB NOT touched — monthly projections still show 20% (wrong) but left intentionally pending investigation
- `financial-rules-engine-spec.md §9.8`: updated with confirmed treatment + pending note
- Linear CKR-12 created: "Unit 505 (Tatiana Contreras) — annual lump sum billing not modeled"

**Discount distribution verified against DB**
- 30% contracts: 7 in DB but only 2 still active past April (211 ends May, 805 ends June). Projections already encode correct expiry months.
- 20% contracts: 25 in DB → 24 effectively (505 should be 43%, left as-is pending CKR-12)
- 10% contracts: 11 in DB, all end June. Matches user data.

**Mora page — full redesign**
- Removed `AccrualForm` ("Calcular Intereses de Mora" / "Ejecutar Acumulación") — cron handles daily accrual automatically
- Kept 4 top KPIs: Cartera Vencida | Clientes | Prom. Días | Interés Acum.
- Added 3 aging-bucket KPI cards (new row below):
  - 0–30 días (amber left border + pill badge)
  - 31–60 días (orange left border + pill badge)
  - 61+ días (rose left border + pill badge)
  - Each shows: interest accumulated as big KPI + `X clientes` inline label. No full colored background — white cards with left border accent only.
- Simplified table: replaced TanStack/multi-column table with clean 4-column view: Arrendatario | Días en mora (colored badge) | Meses pendientes | Total
- `getMoraRows()` query: added `COUNT(c.id) AS meses_pendientes`
- Table headers always visible even when empty (empty state inside tbody)
- Click-to-sort on all 4 columns

### Gotchas
- `projections.pronto_pago_proyectado` was seeded with PP values even for phase-discount months — always zero out this column when phase discount is active
- `c.pronto_pago_pct` (contract rate) ≠ effective PP for the year — must compute from projections data for correct display
- Unit 505: do NOT generate monthly invoices for her until CKR-12 is resolved

---

## 2026-04-16 — UI Polish + Dashboard Redesign Session

### What happened

**Proyecciones page — full redesign**
- Replaced year-coverage table with data-rich layout: 4 KPI breakdown cards (canon bruto, descuentos+PP, IVA, total neto c/IVA), formula explainer bar, monthly bar chart, per-contract detail table
- Monthly chart: Recharts direct (not Tremor) — dark navy bars, rounded tops, hover tooltip shows full monthly breakdown (canon bruto → descuentos → PP → base neta → IVA → total neto)
- Detail table: 78 rows, Local | Arrendatario | Desde (dd/mm/yy) | Meses transcurridos | Canon/mes | Dcto% | PP% | Neto anual c/IVA | Estado
- "Generar proyecciones" hidden as floating gear icon (fixed bottom-right) → modal overlay
- New data fns: `getProyeccionBreakdown`, `getProyeccionDetalle`, `getProyeccionMensual` (all with full breakdown columns)

**Dashboard redesign**
- Removed "Todos los Proyectos" and "Todos los Estados" filter dropdowns
- Replaced dual grouped bars with single stacked bar: emerald fills from bottom (recaudado), navy on top (remainder = proyectado − recaudado). Total bar height = proyectado always.
- Tooltip shows: Proyectado | Recaudado | Cumplimiento %
- Desglose de Cartera card: each item `flex-1` (equal 25% height), fluid font sizes via `clamp()` with vh units — scales with viewport, never breaks layout
- Layout: `max-w-[1440px]` centered, natural scroll restored (was briefly viewport-locked, reverted)

**Reportes deleted**
- `/reportes` page and `recaudo-chart.tsx` deleted — dashboard now shows the same proyectado vs recaudado chart
- `getProyectadoVsReal` from `reportes.ts` reused in dashboard (no duplication)

**Sidebar cleanup**
- "Dashboard" → "Resumen" (Spanish)
- Proyecciones moved to #2 slot (right below Resumen)
- Usuarios and Configuración hidden from nav (pages still exist at their URLs)

**Admin user**
- Password set for germanwarfare07@gmail.com: `Testadmin2025*` (via Supabase SQL crypt)

### Decisions made
- Recharts used directly (not Tremor) for all new charts — gives access to `radius`, `stackId`, `Cell`, custom tooltips without wrapper limitations
- Stacked bar chosen over grouped bars: saves horizontal space, visually intuitive (green "fills up" the navy projection)
- `clamp(min, Xvh, max)` for fluid typography inside fixed-height flex cards — pure CSS, no JS resize observers needed
- Reportes removed entirely rather than redirected — no value having a separate page with same data as dashboard

### Next session
- Review remaining routes live: /clientes, /clientes/[id], /mora, /gastos, /pagos, /facturas, /medidores
- Commit all session changes + push to Vercel
- Test CRON_SECRET endpoint
- Add Vercel domain to Supabase Auth redirect URLs
- Linear cleanup: WOR-43/44/45 (wrong workspace), CKR-1→4

---

## 2026-04-16 — Project Setup Session

### What happened
- Created project docs: PRD, Financial Rules Engine spec, UI/UX Guide, initial SQL schema, ERD
- Bootstrapped Next.js 16 + TypeScript + Tailwind v4 + App Router
- Initialized shadcn/ui
- Installed core deps: Drizzle ORM, Supabase client, TanStack Table v8, React Hook Form, Zod, Tremor, Lucide React
- Created project docs: CLAUDE.md, CHANGELOG.md, context.md, JOURNAL.md
- Configured .env.local with Supabase URL + keys

### Decisions made
- Project lives in `/Users/workspace/Ckrea-portal/` (uppercase folder, npm name `ckrea-portal`)
- Reference docs moved to `docs/` subfolder
- Using single dedicated email for all services (Supabase, Vercel, Sentry, PostHog, Linear)
- PostHog deferred to launch phase

---

## 2026-04-16 — Infrastructure Completion Session

### What happened
- Connected Supabase MCP to new C-Krea account (old MCP token pointed to wrong Supabase account with Paxco/Palma projects)
- Applied full 21-table schema to Supabase (`bosylehvmtwtqkrlievy`) via MCP migrations
- Applied RLS + helper functions (`public.user_company_id()`, `public.user_role()`, `public.user_tenant_id()`)
- Connected Linear to correct workspace (`ckrea-portal` / CKR prefix, not old WOR workspace)
- Sentry wired up via wizard
- `.npmrc` → `legacy-peer-deps=true` (needed for Tremor + Sentry with React 19)

### Gotchas / lessons learned
- **Supabase MCP auth schema blocked**: Can't create functions in `auth` schema via MCP migrations — "permission denied for schema auth". Workaround: helper functions go in `public` schema instead. Functionally identical.
- **Not all tables have `company_id`**: `contract_phases`, `invoice_line_items`, `payment_applications`, `interest_accruals`, `gasto_allocations` — these join to parent tables for company scoping. RLS policies for these use EXISTS subquery, not direct `company_id` check.
- **Drizzle config needs dotenv**: `drizzle.config.ts` must import `dotenv` and call `config({ path: '.env.local' })` — env vars not auto-loaded from .env.local by drizzle-kit.
- **Linear workspace confusion**: Linear CLI defaults to last authenticated workspace. Always use `--workspace ckrea-portal` flag or verify with `linear auth status` before creating issues.
- **Supabase MCP reconnect**: To switch accounts, go to supabase.com → account → Access Tokens → generate new token → update in Claude MCP settings. The MCP config lives in claude.ai OAuth, not in local settings.json.

### Decisions made
- RLS helper fns in `public` schema (not `auth`) — MCP restriction, not a design choice. Note in CLAUDE.md if this causes confusion later.
- Record-keeping workflow formalized: Linear (active work) / CHANGELOG (what shipped) / JOURNAL (why + learnings). Added to CLAUDE.md.

### Still pending
- Apply seed data (`docs/foundation/05_seed_validation/002_seed_data.sql`) — companies + initial data
- Clean up Linear: delete wrong WOR workspace issues (WOR-43, 44, 45), review CKR-1 through CKR-4 onboarding placeholders

---

## 2026-04-16 — Knowledge Graph & Workflow Setup

### What happened
- Added Knowledge Graph + Obsidian Wiki + Reusable Functions sections to CLAUDE.md
- Ran graphify on full project: 183 nodes, 213 edges, 38 communities
- Outputs: `graphify-out/graph.html` (interactive), `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`
- Established three-record workflow: Linear / CHANGELOG / JOURNAL — written into CLAUDE.md permanently

### Key graph findings
- God nodes: C-Krea PayControl Portal (25 edges), API Routes spec (15), Financial Rules spec (14)
- Financial Rules Engine is the most cross-cutting doc — bridges invoicing, payments, Siesa, and API communities simultaneously
- RLS policies connect all 3 user roles across separate doc files — good signal of consistency
- 65 weakly-connected nodes flagged (projection scripts, seed SQL snippets) — expected at this stage

### Decisions made
- Wiki path for this project: `~/ObsidianVault/ckrea-wiki/` (set in CLAUDE.md)
- Graphify to rebuild after any session touching >3 code files (per CLAUDE.md global rule)
- night-review deferred — not relevant until codebase has real components

### Gotchas
- graphify cache save fails if a node's source_file is a directory path ('public') instead of a file — minor bug in graphify, doesn't affect graph output
- RLS helper fns in `public` schema (not `auth`) — MCP restriction, not design choice

---

## 2026-04-16 — Seed Data Applied

### What happened
- Applied full seed data (`002_seed_data.sql`) to Supabase in chunks via MCP `execute_sql`
- Split into 9 sections due to 21K-line file size (no psql available, MCP has payload limits)
- Sections 1-4 (company, tenants, units, contracts) applied manually in main session
- Sections 5-9 (projections, cartera, financial rules, gasto types, gastos) applied via subagent

### Final counts
| Table | Count |
|-------|-------|
| companies | 1 (Central Kreativa) |
| tenants | 59 |
| units | 85 (84 occupied + 1 disponible) |
| contracts | 78 |
| projections | 1020 (85 units × 12 months) |
| cartera | 250 |
| financial_rules | 5 |
| gasto_types | 11 |
| gastos | 9 (Jan 2026 sample) |

### Gotchas
- **No psql on machine**: Had to split file into MCP chunks. For future large seeds, consider installing psql or using Supabase CLI `db push`.
- **Projections = 1020 not 1008**: Seed file covers 85 units (including unit 126 disponible with 0-value rows), not 84. Summary comment in SQL was wrong.
- **Seed is idempotent**: All INSERTs use ON CONFLICT DO NOTHING / DO UPDATE. Safe to re-run.

### Decisions made
- Applied seed as-is from generated file — no manual edits needed
- DB now has real production data (tenants, units, contracts, cartera snapshot from real xlsx)

---

## 2026-04-16 — UI Build Session (Part 1)

### What happened
- Built full layout: sidebar (dark slate-900, 220px, Spanish nav, active state via usePathname), page-header, root layout (Inter font, lang=es)
- Dashboard (`/`): 4 KPI cards + Desglose de Cartera + Tremor BarChart (2026 projections) — all real DB data
- Mora page (`/mora`): 3 KPI cards + TanStack Table (sortable by dias_mora, global search, severity badge)
- Clientes page (`/clientes`): full tenant list with tab filters (Todos/Activos/En Mora/Críticos/Inactivos), status dots, sortable columns
- Wired Drizzle to real DB; fixed DATABASE_URL pooler bug

### Gotchas / lessons learned
- **Supabase transaction pooler (port 6543) fails** with "Tenant or user not found" — not a password issue, Supavisor bug. Fix: use direct connection `db.[project].supabase.co:5432` with username `postgres` (not `postgres.[project_ref]`).
- **Session pooler (port 5432 on pooler host) also fails** — same bug. Direct host only.
- **Data rule established**: server components use `db` (Drizzle). Supabase client (`createClient`) reserved for auth + client-side realtime only.
- **Next.js 16 RSC payload**: `curl` on a server-component page won't find text strings in raw HTML — content is in JS script tags as RSC payload. Use Python regex on the payload JSON to verify.
- **Drizzle db client**: `max: 1` for Next.js server components (serverless — each request gets its own connection).

### Decisions made
- DATABASE_URL = `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` going forward
- Supabase admin client approach (service role key) scrapped — Drizzle handles all server queries
- Status derivation (al_dia/en_mora/critico/inactivo) done in data layer (`deriveStatus`), not in components

### Still pending
- `/clientes/[id]` — tenant detail page
- `/reportes`, `/usuarios`

---

## 2026-04-16 — UI Part 2 Session

### What happened
- Built `/clientes/[id]`: tenant detail page — info card, contract+unit card, cartera KPI strip, sortable cartera table (CarteraTable client component), contract phases timeline, payment history with "Registrar Pago" link
- Built `/gastos`: KPI strip + sortable/filterable GastosTable; category/method label maps inline
- Built `/pagos`: split layout (form left, history right); RegistrarPagoForm uses `useActionState` + server action; server action validates with Zod, inserts to `payments` table, revalidates path
- Data layers: `tenant-detail.ts` (4 queries), `gastos.ts` (2 queries), `pagos.ts` (2 queries)
- Server action: `src/app/pagos/actions.ts` — Zod v3 uses `.issues` not `.errors` for safeParse result
- Build clean, all 3 pages verified against real DB data

### Gotchas
- **Zod v3 API change**: `parsed.error.issues[0]` not `parsed.error.errors[0]` — v3 renamed the array
- **z.coerce.number() message param**: `invalid_type_error` not valid in this Zod version; use `.positive("msg")` only
- **DISTINCT ON for pagos tenant query**: prevents duplicate rows when tenant has multiple contracts (use `DISTINCT ON (t.id)` then sort in JS)
- **Next.js 16 params**: `params` is a Promise — must `await params` in server components

### Decisions made
- CarteraTable as client component (sortable), rest of tenant detail is pure server RSC
- RegistrarPagoForm resets via `formRef.current.reset()` on `state.success` — no router.refresh needed since server action calls `revalidatePath`
- Payment insert: `valorFinal = valorAplicado` (simplified — pronto pago calc not wired yet, Phase 2)

### Still pending
- `/reportes` — analytics/reporting
- `/usuarios` — user management
- Payment → cartera reconciliation (Phase 2)
- Invoice generation flow (Phase 2)

---

## 2026-04-16 — UI Part 3 Session

### What happened
- Built `/reportes`: 4 KPI cards + Recaudo Mensual bar chart + Proyectado vs. Recaudado comparison chart + Antigüedad de Cartera aging table with inline % progress bars
- Built `/usuarios`: profile list with role badges (admin/finance/viewer/tenant), active status, tenant link, empty state (profiles table empty until auth wired)
- Data layers: `src/lib/data/reportes.ts` (4 queries), `src/lib/data/usuarios.ts` (1 query)
- Build clean, all 11 routes in route table

### Gotchas
- **Tremor BarChart RSC boundary**: `valueFormatter` is a function — can't pass from server to client across RSC boundary. Fix: always wrap Tremor charts in a `"use client"` component that defines formatters internally. Same pattern as `rendimiento-chart.tsx`.
- `/usuarios` empty state is correct — no rows in profiles until Supabase Auth registers a user.

### Decisions made
- Aging buckets: `0` (al día, ≤0 dias_mora), `1_30`, `31_60`, `61_90`, `90+`
- Invite user button intentionally disabled — auth needed (Phase 2)
- `proyectado` from `projections.canon_proyectado` (per-unit monthly canon), not invoices table (empty at this stage)

### Still pending
- Linear cleanup: WOR-43, WOR-44, WOR-45; review CKR-1 through CKR-4
- Phase 2: payment → cartera reconciliation
- Phase 2: invoice generation + Siesa XML
- Phase 2: Supabase Auth + user management

## 2026-04-16 — Auth Session

### What happened
- Wired Supabase Auth end-to-end: login page, session proxy, protected layout, sidebar logout
- Restructured app into route groups: `(app)/` (protected, sidebar) and `(auth)/` (login, no sidebar)
- Applied DB migration 003: trigger `on_auth_user_created` on `auth.users` → auto-inserts into `public.profiles`
- Build clean, proxy registered (shown as `ƒ Proxy (Middleware)` in route table)

### Gotchas
- **Next.js 16 renamed middleware → proxy**: file must be `proxy.ts` (not `middleware.ts`), exported fn must be named `proxy` not `middleware`. The build warns and ignores `middleware.ts`. Docs at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- **Route group restructure breaks component imports**: `registrar-pago-form.tsx` imported from `@/app/pagos/actions` — updated to `@/app/(app)/pagos/actions`. Any new components referencing page-level actions must use the route group path.
- **Trigger trigger uses `SECURITY DEFINER`**: needed because auth.users INSERT happens in auth schema context; function runs as owner (postgres) to INSERT into public.profiles.

### Decisions made
- Profile `role` seeded from `raw_user_meta_data.role` — so admin can set role at invite time via Supabase dashboard or API
- Fallback role = `viewer` (safest default)
- `(app)/layout.tsx` loads profile for display name; falls back to `user.email` if profile not found yet

### Still pending
- Create first admin user via Supabase dashboard (auth + profile trigger fires automatically)
- Phase 2: payment → cartera reconciliation
- Phase 2: invoice generation + Siesa XML export

## 2026-04-16 — Payment Reconciliation Session

### What happened
- Built `src/lib/reconciliation.ts`: FIFO allocation engine
- Updated `registrarPago` action: insert payment → reconcile → revalidate /mora + /clientes
- Success message surfaces reconciliation result (N facturas applied, M cleared, remainder if any)
- Build clean

### How reconciliation works
1. Fetch tenant's open cartera items (saldo > 0), ordered by fecha_factura ASC (oldest first)
2. For each item: apply min(remaining_payment, item.saldo) → update saldo + valor_vencido in-place
3. Stop when payment fully consumed or no more open items
4. Returns: totalApplied, remainder, per-item allocations, itemsCleared count

### Decisions made
- Cartera updated in-place (not immutable) — Siesa sync will overwrite when it next runs. This is acceptable: cartera is a Siesa snapshot, not a ledger.
- valor_vencido reduced proportionally with saldo (simplified: newVencido = max(0, vencido - applied))
- interes_acumulado NOT touched — that's Siesa's domain
- No payment_applications records created — those require invoice_id which doesn't exist yet (Phase C)

### Still pending
- Phase C: invoice generation + Siesa XML export

## 2026-04-16 — Invoice Generation Session (Phase C)

### What happened
- Built invoice-engine.ts: full computation per spec §6
- Built /facturas page with GenerateForm, period filter, KPI panel
- Build clean, 13 routes

### How engine works
1. Query all active contracts + LEFT JOIN projections for period (year+month)
2. Skip contracts already invoiced for the period (idempotent)
3. Per contract: canonEffective = projection.canonProyectado ?? contract.canonBase
4. descuentoFase = projection.descuentoProyectado ?? (canonBase * descuentoPct/100)
5. netCanon = canonEffective - descuentoFase
6. IVA = netCanon * 0.19 (on net, NOT on PP — per spec §6.2)
7. prontoPagoRef = netCanon * prontoPagoPct/100 (reference only, applied at payment time)
8. gastos = $29,947 water flat (electricity skipped — no meter readings in DB yet)
9. total = netCanon + IVA + gastos (PP NOT deducted — tenant earns it)
10. Insert invoice + line items (canon, descuento if>0, iva, pronto_pago ref if>0, gasto_acueducto)

### Decisions made
- invoice total = WITHOUT PP deduction (spec confirms: PP is a reward applied at payment, not baked in)
- subtotalProntoPago stored as reference on invoice (so UI can show "pay by X to save Y")
- status = 'borrador' on creation (not auto-emitted)
- electricity gastos skipped: no meter_reading data in DB yet (Phase 3: add meter reading input)
- Generation is idempotent: existing invoices for period are skipped, not overwritten

### Gotchas
- Drizzle insert type inference narrows array element type to first element's literal. Fix: explicit `LineItemInsert[]` type annotation before .push()
- projections table has contractId nullable (LEFT JOIN), so some units may not match. Falls back to canonBase.

### Still pending
- Invoice emission (status borrador → emitida) + PDF/print view
- Electricity meter readings input + gasto_energia line item
- Siesa XML export (Phase 3)
- PP application at payment time (link payment → invoice → apply PP credit)

---

## 2026-04-16 — Phase 3 Session (Invoice Emission, PP, Medidores, Siesa Export)

### What happened

**Phase 3A — Invoice emission + PP at payment:**
- Added `emitirFactura` server action → status borrador → emitida
- Built `/facturas/[id]` detail page with line items, totals, PP reference row, print CSS
- Extended `reconcilePayment` signature: now takes `paymentId` + `fechaRecaudo`
- Reconciliation now hits portal `invoices` first (FIFO oldest-first), THEN `cartera` (Siesa snapshot)
- PP logic: if `fechaRecaudo <= invoice.fecha_pronto_pago` → deduct `subtotal_pronto_pago` from effective saldo before applying payment
- `payment_applications` rows inserted per invoice touched
- Invoice → `pagada` if saldo=0, `parcial` if partial

**Phase 3B — Electricity meter readings:**
- Migration 004: `meter_readings` table (unit_id, periodo, lectura_anterior, lectura_actual, kwh, tarifa_kwh, total_energia) — UNIQUE(unit_id, periodo), RLS
- Drizzle schema: `meterReadings` added
- `/medidores` page: shows units with `has_electricity_meter=true`, register readings, kWh + total KPIs
- `registrarLectura` action: onConflictDoUpdate (safe to re-enter same unit+period)
- Invoice engine: LEFT JOINs `meter_readings` per period → `gasto_energia` line item added when reading exists

**Phase 3C — Siesa export (basic):**
- Siesa XML spec blocked — no format doc, need meeting with Siesa team
- Decision: export CSV matching exact Documentos sheet column order from `ckrea.xlsx`
- `GET /facturas/export?periodo=YYYY-MM` → CSV download
- Hardcoded constants from real data: `id_canal=R08`, `id_co=044`, `auxiliar=42201006`, `tipo_cliente=1003`
- Button on facturas page with note "formato XML FVS pendiente reunión Siesa"

### Gotchas
- Supabase trigger function name is `public.update_updated_at()` NOT `public.set_updated_at()` — verify before writing any new migration
- `reconcilePayment` signature changed: now `(tenantId, paymentId, amount, fechaRecaudo)` — any future callers must update

### Decisions made
- PP: effective_saldo = saldo - ppRef (if within window). Payment must cover the discounted amount fully to earn PP. If payment < effectiveSaldo, no PP applied.
- Siesa export: CSV format now, XML FVS after Siesa meeting. Columns exact-match ckrea.xlsx Documentos sheet.
- meter_readings tarifa_kwh stored per-reading (admin inputs it) — no separate financial_rules entry needed

### Still pending
- Create first admin user: Supabase dashboard → Auth → Add user → raw_user_meta_data: `{"full_name":"...", "role":"admin"}`
- Linear cleanup: WOR-43, WOR-44, WOR-45 (wrong workspace); review CKR-1 through CKR-4
- Siesa XML FVS export (after meeting with Siesa team)
- Interest accrual cron (daily 0.05%/day on overdue invoices)

---

## 2026-04-16 — Business Rule Clarifications (German)

### Clarifications confirmed in session

**Aseo/Cafeteria billing:** NOT billed to tenants. Only water ($29,947 flat) and electricity (metered) are passed through. Invoice engine is correct as-is. Remove aseo from any "missing" notes.

**Electricity metering:** Intentionally manual. A person must physically read each unit's meter. The `/medidores` page handles this correctly — it is NOT automatic by design. The system records the reading, computes the amount, and includes it in the next invoice generation.

**PP + partial payment:** Confirmed — any partial payment loses PP eligibility entirely. If a tenant has interest accruals on an invoice, partial payment does NOT qualify for PP. Implementation in reconciliation is correct.

**Payment application order:** Confirmed as correct (interest first, then rent/principal). In current real data there is essentially no interest yet (Rule C is new), so all payments are applied to rent. Rule C accruals will make this more relevant going forward.

**Lower priority backlog (not building now — review later):**
- Settings page (financial rules management UI — IVA, PP rate, interest rate editable)
- Siesa XML FVS export (after meeting with Siesa team)
- Credit notes / NVS reversals (§9.7)
- IPC auto-compute for 2027+ (currently handled by seeded projections for 2026)
- Annual prepayment edge case (§9.8 — one tenant)
- Interest accrual cron (daily automation — Vercel cron or Supabase Edge Function)
- Mobile sidebar hamburger menu

---

## 2026-04-16 — Invoice Engine Correction (Water)

**Correction:** Water ($29,947) is included in the canon — NOT a separate line item on the invoice. Removed `gasto_acueducto` line item and `WATER_FLAT` from `subtotalGastos`.

Invoice gastos now = electricity only (metered via `/medidores`). If no meter reading for the period, `subtotalGastos = 0`.

**Invoice total formula (corrected):**
`total = netCanon + IVA + electricidad`
Where `electricidad = 0` if no meter reading exists for the period.

**Payment order confirmed:** Interest (mora) first → then rent principal. Correct as implemented.

---

## 2026-04-16 — Pre-Phase 4 Audit Notes

### DB state (confirmed clean)
- 0 invoices in DB — no stale water-billed invoices to clean up
- 22 critico contracts all have only flag_critico=true, no other billing flags → day 1 default is correct (only option)
- Projections: 85 contracts × 12 months = 1,020 rows covering all of 2026, 0 fallbacks

### 2027 limitation (backlog — non-blocking for 2026)
When projections run out (Jan 2027+), invoice engine falls back to:
- canon = contract.canon_base (no IPC adjustment applied)
- descuento = contract.descuento_pct (static rate, phase expiry NOT respected — discount won't auto-expire in correct month)

Fix when approaching 2027: seed new projections OR add IPC computation + phase calendar to invoice engine.

### Other confirmed behaviors
- Interest engine skips borrador invoices — correct, don't charge interest on unissued invoices
- invoice.saldo = pure principal only (interest tracked separately in subtotal_interes)
- revalidatePath('/clientes') missing from emitirFactura — minor, add when noticed

---

## 2026-04-16 — Session Wrap-Up + Phase 4 Plan

### 2027 Projection Plan (confirmed with German)
Build a **Projection Generator** UI inside the portal (Phase 4):
- Admin inputs: IPC rate (e.g. 5.1%) + optional per-contract overrides
- System generates `projections` rows for the new year: `new_canon = last_dec_canon * (1 + ipc_rate) + extra`
- Phase discount schedules reset/configured per contract for the new year
- No manual SQL or Excel needed — fully self-serve

### Phase 4 Backlog (priority order, ready for next session)
1. **Admin user creation** — Supabase dashboard → Auth → Add user → raw_user_meta_data: `{"full_name":"German Burgos","role":"admin"}` — needed to test the portal end-to-end
2. **Settings page** (`/configuracion`) — view/edit financial rules: IVA rate, PP rate, mora rate, water flat
3. **Interest accrual cron** — Vercel cron job daily at 01:00 COT calling `runInterestAccrual`
4. **Projection generator** (`/proyecciones`) — IPC + extras UI to seed next-year projections
5. **Linear cleanup** — close WOR-43/44/45, review CKR-1→4
6. **Siesa XML FVS** — after meeting with Siesa team
7. **Mobile nav** — sidebar hamburger for < 768px

### Final state entering Phase 4
- 16 routes, all building clean
- All 4 financial rules implemented (A PP, B phase discounts, C interest, D electricity)
- Auth + RLS working
- v1.2.1 in CHANGELOG
- DB clean: 0 invoices, 78 contracts, 85 units, 59 tenants, 2026 projections 100% covered

## 2026-04-16 — Phase 4 + Vercel Deployment Session

### What happened
- Built Phase 4 items: /configuracion, /proyecciones, /api/cron/accrual, vercel.json
- Connected GitHub repo: https://github.com/Gburg293/Ckrea-Portal.git
- Fought through Vercel deployment — 4 separate blockers resolved
- v1.3.0 now LIVE on Vercel

### Phase 4 delivered
- `/configuracion` — inline editor for 5 financial rules (IVA, PP window, mora rate, grace period, IPC%)
- `/proyecciones` — IPC projection generator: coverage table + pending contracts preview + generate form
- `/api/cron/accrual` — Vercel Cron route (daily 01:00 COT = 06:00 UTC), CRON_SECRET protected
- `vercel.json` — cron schedule `0 6 * * *`
- `src/lib/data/configuracion.ts`, `src/lib/data/proyecciones.ts` — data layers
- Sidebar: added Proyecciones (TrendingUp) + Configuración (Settings)

### Vercel deployment — bugs hit and fixed

**Bug 1: Export error on /proyecciones, /reportes, etc.**
- Cause: Next.js tries to statically render pages at build time on Vercel even when they have async DB calls
- Fix: `export const dynamic = "force-dynamic"` on ALL 12 (app) pages
- Pattern: every page with DB queries needs this

**Bug 2: Vercel Hobby commit author block**
- Cause: Hobby plan requires commit author email = Vercel account owner email
- Vercel account: germanwarfare07@gmail.com
- Fix: `git config user.email "germanwarfare07@gmail.com"` — must be set before every commit
- Saved to memory: feedback_vercel_commit_author.md

**Bug 3: Wrong env var name**
- Cause: NEXT_PUBLIC_SUPABASE_ANON_KEY was saved in Vercel as NEXT_PUBLIC_SUPABASE_ANON (missing _KEY)
- Effect: Supabase client init failed on every request → 500 on all pages
- Fix: removed wrong var, added correct NEXT_PUBLIC_SUPABASE_ANON_KEY via CLI
- Lesson: always verify env var names with `vercel env ls` after adding

**Bug 4: Env vars added after build**
- NEXT_PUBLIC_ vars baked at build time — adding after deploy doesn't help
- Fix: push new commit to trigger fresh build after adding/fixing env vars

### Vercel env vars (all 4 required)
- `NEXT_PUBLIC_SUPABASE_URL` — https://bosylehvmtwtqkrlievy.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon JWT (208 chars)
- `SUPABASE_SERVICE_ROLE_KEY` — service role JWT
- `DATABASE_URL` — direct DB host (NOT pooler)
- `CRON_SECRET` — any random string (needed for /api/cron/accrual)

### Decisions made
- Projection formula: `new_canon = round(last_canon * (1 + ipc/100))`, descuento carries forward as same %
- `onConflictDoNothing` on projection inserts — idempotent, safe to re-run
- force-dynamic on all (app) pages — no static pre-rendering attempted

### Next session
- Walk live site end-to-end (all 18 routes)
- Create admin user in Supabase Auth (germanwarfare07@gmail.com + raw_user_meta_data role:admin)
- Fix any bugs found in live testing
- Then: Linear cleanup, mobile nav, CRON_SECRET env var add

---

## 2026-04-22 — Power BI meeting prep + invoice analysis + financial rule discoveries

### What happened

**CSF sync:** `npm run sync-csf` — 2,797 payments + 171 cartera confirmed. No new data since last sync.

**Power BI projection gap ($162M vs $239M):**
- Our March projection: $239M (75 active contracts, canon − descuento + IVA 19%)
- Power BI March projection: $162M
- Gap: $77M (−32%). Tested all formula variants — none explain it.
- Strongest hypothesis: $239M × 68% ≈ $162M exactly. Power BI likely applies a historical collection rate, not total invoiced amount. Need to confirm at meeting.

**Power BI recaudo gap ($231M vs $236M) — continued from prior session:**
- Added projection gap section + question 8 to `docs/powerbi-meeting.html`.
- File is self-contained HTML presentation for today's alignment meeting.

**Excel "Facturas Ckrea Enero.xlsx" analysis:**
- 79 rows (January 2026 invoices). Excel SALDO total: $210.5M. DB January payments: $194.7M. Gap: $15.8M.
- Root cause: Excel = invoice basis (what was billed in Jan). DB = cash basis (what was received in Jan).
- ~12 clients paid Jan invoice in Feb → in Excel, not in Jan DB.
- 3 clients (VISUAL GRAPHIC, FAJARDO, FUSION GRAFIK) paid prior-period invoices in Jan → in DB Jan, not in Excel.
- Several clients barely paid in Jan (TATIANA $125K vs $2.7M billed, PROHERCOL $43K, PEDRAZA $100K).
- Excel date errors: MATICES 123/125 show "2026-11-10" (November) — typo, likely Jan/Feb.

**Retefuente discovery (3.5% withholding tax):**
- Column O of Excel. Applied to base_neta (pre-IVA) for PJ (juridical/company) clients.
- Formula: PJ total = (canon − descuento) × 1.155 [= 1.19 − 0.035]. PN unchanged (× 1.19).
- `tenants.juridica` field: only 2/66 marked true — ~30 company clients (SAS, SA, etc.) are wrong.
- Impact is tiny today (only 2 PJ in DB) but significant once data fixed. Linear: CKR-22 (data fix) → CKR-21 (formula).

**PP + phase discount STACK (rule reversal):**
- Prior rule: PP = 0 when phase discount active (mutual exclusivity). Enforced everywhere.
- New finding: MEDIOS IMPRESOS Jan invoice = 20% phase discount AND 10% PP both applied simultaneously.
- Both discounts apply: phase reduces base, then PP is 10% of that same base. They are NOT mutually exclusive.
- Linear: CKR-20 to fix code. Need to remove `CASE WHEN descuento_proyectado > 0 THEN 0` from ~6 spots.
- Also need to update `project_state.md` critical gotcha + financial-rules-engine-spec.md.

### Decisions made

- Invoice basis vs cash basis is an intentional design difference between Excel and portal. DB is authoritative for actual cash flow.
- Do NOT add retefuente to projections until juridica data is fixed first (CKR-22 blocks CKR-21).
- PP stacking fix (CKR-20) is highest priority code change — pure code, no data dependency.

### Files changed this session

- `docs/powerbi-meeting.html` — added projection gap section + open question 8
- `docs/powerbi-meeting-prep.md` — Key Finding 7 (electricity matching confirmed)
- No code changes to portal — analysis session only
