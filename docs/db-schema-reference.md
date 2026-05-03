# C-Krea Portal — DB Schema Reference

**Last updated:** 2026-05-03 (updated after pagos/mora/dashboard fixes)  
**Rule:** siesa_raw = ERP source of truth. v2 = portal working layer derived from siesa_raw. When in doubt, trust siesa_raw.

---

## Data flow

```
ERP (Siesa) → push → siesa_raw.* → sync_desde_raw() RPC → v2.* → Portal pages
```

- ERP writes directly to `siesa_raw.*` (role `siesa_sync`).
- Nightly cron at 05:30 COT runs `v2.sync_desde_raw()` → refreshes v2 from siesa_raw.
- Portal pages read from `v2.*`, except proyecciones which reads siesa_raw.ocupacion directly.
- Zone filter `IdZona = 'Z40'` applied upstream by ERP — all siesa_raw data is C-Krea only.

---

## Schema: siesa_raw

All tables carry meta cols: `siesa_synced_at TIMESTAMPTZ`, `sync_batch_id UUID`, `row_hash TEXT`.  
No RLS — not exposed via PostgREST. Access via role `siesa_sync` only.

### siesa_raw.ocupacion
**What it is:** Live current occupancy. One row per occupied unit. Updates every ERP sync — tenant moves in = row added, tenant leaves = row removed.  
**Source of truth for:** all forward projections, canonical canon/discount/PP rates.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Surrogate PK (natural key had null documento for vacants) |
| `documento` | text | **NIT of tenant** — join key to v2.inquilinos.nit |
| `loc` | text | Unit number — join key to v2.locales.unidad |
| `razon_social` | text | Tenant name from ERP |
| `precio` | numeric | Monthly canon (current, no IPC adjustment) |
| `descuento` | numeric | Current active phase discount % (e.g. 50 = 50%). Updates as phase steps down in ERP. |
| `pronto_pago` | numeric | PP discount % available if paid within 10 days (usually 10) |
| `ocupacion_natural_key` | unique | (documento, loc) |

**Phase discount staircase (ERP pushes current step each month):**
- Month 1: 50%
- Months 2–3: 30%
- Months 4–5: 20%
- Month 6+: 0% (only PP option remains)

**Critical query note:** Always filter `WHERE razon_social IS NOT NULL AND COALESCE(precio, 0) > 0` — vacant units have null razon_social.

---

### siesa_raw.documentos
**What it is:** Historical invoice records. Rolling ~4-month window — ERP does not keep full history beyond that.  
**Filter applied by ERP:** `id_co = '044' AND id_canal = 'R08'` (C-Krea carve-out).

| Column | Type | Notes |
|---|---|---|
| `documento` | text | PK — invoice document number |
| `doc` | text | **NIT of tenant** — join key (NOT `cliente`) |
| `cliente` | text | Razón social — display only, NOT the NIT |
| `periodo` | integer | YYYYMM format (e.g. 202601 = January 2026) |
| `tipo` | text | `'Facturas'` = actual invoices · `'Descuentos'` = PP discounts applied · blank = adjustments |
| `ventas` | numeric | Base amount (negative for Descuentos rows) |
| `impuesto` | numeric | IVA |
| `retenciones` | numeric | Withholdings (retefuente) |

**Net formula:** `ventas + impuesto − retenciones`  
**To query a month's invoices:** `WHERE periodo = 202601 AND tipo = 'Facturas'`  
**January 2026 verified:** 79 Facturas ($236.6M neto) + 49 Descuentos rows (PP given = −$12.5M). Matched proyecciones within 1%.

**'Descuentos' rows explained:** When a tenant pays within 10 days and takes PP, ERP creates a RK-/CN- document in documentos. This is the PP double-count — counted in recaudo.pronto_pago AND here. vista_facturas already filters these out.

---

### siesa_raw.cartera
**What it is:** Open (unpaid) invoices only. Once a payment is applied, the invoice reduces or drops off. Does NOT keep history — use siesa_raw.documentos for history.

| Column | Type | Notes |
|---|---|---|
| `row_id` | bigint | PK from Siesa |
| `documento` | text | **NIT of tenant** — join key (NOT `cliente`) |
| `cliente` | text | Razón social — display only |
| `factura` | text | Invoice number. `FVS-` = real invoice. `RK-` = credit note / PP adjustment (negative saldo) |
| `fecha_factura` | timestamptz | Invoice issue date — use to filter by month |
| `fecha_pronto_pago` | timestamptz | Deadline for PP discount (usually day 10) |
| `fecha_vence` | timestamptz | Payment due date |
| `dias` | integer | Days term of the invoice |
| `financia` | integer | Days since invoice was issued (aging) |
| `vr_corriente` | numeric | Amount not yet due (positive for unpaid current invoices) |
| `vr_vencido` | numeric | Overdue amount (> 0 means past due date) |
| `saldo` | numeric | Total outstanding = `vr_corriente + vr_vencido`. Negative = credit note |
| `id_zona` | text | Always `Z40` for C-Krea |

**To query current month's open invoices:**
```sql
WHERE fecha_factura >= DATE '2026-05-01'
  AND fecha_factura  < DATE '2026-06-01'
  AND factura LIKE 'FVS-%'
  AND saldo > 0
```

**Note:** Portal uses `siesa_raw.documentos` (not cartera) as the source for "total invoiced this month" KPI because cartera drops paid invoices mid-month. Cartera is used for real-time open balance lookups only.

---

### siesa_raw.recaudo
**What it is:** Payment receipts — money actually received.

| Column | Notes |
|---|---|
| `id` | Surrogate PK |
| `docto` | Invoice document reference |
| `cruce` | Matching/crossing reference |
| `fecha_recaudo` | Payment date |
| `valor_aplicado` | Amount applied |
| `pronto_pago` | PP discount given on this payment |
| Natural key | (docto, cruce, fecha_recaudo, valor_aplicado) |

**4 correct filters for payment queries** (from audit in `recaudo_data_model.md`):
1. FVS cruce pattern
2. Dedup
3. Values < $1B
4. Zona filter

---

### siesa_raw.sync_batches
Audit log for every ERP push. Columns: `started_at`, `completed_at`, `source_system`, `sheet`, `status`, `rows_received`, `rows_inserted`, `rows_updated`.

---

## Schema: v2

Portal working layer. Derived from siesa_raw via `sync_desde_raw()`. Has RLS on all tables.  
All tables have `empresa_id` (C-Krea = `'00000000-0000-0000-0000-000000000001'`).

### v2.empresas
| Column | Notes |
|---|---|
| `id` | `'00000000-0000-0000-0000-000000000001'` = C-Krea |
| `nombre` | 'Central Kreativa (C-Krea)' |

---

### v2.inquilinos
Tenant master. NIT is the permanent identity key.

| Column | Notes |
|---|---|
| `id` | UUID PK |
| `nit` | Join key — matches `siesa_raw.ocupacion.documento` |
| `razon_social` | Full legal name |
| `nombre_corto` | Short display name (prefer over razon_social for UI) |
| `tipo_persona` | `'PJ'` (legal entity, retefuente 3.5%) or `'PN'` (natural person) |
| `pp_historico_pct` | Historical PP usage % — null for new tenants (< ~6 months history) |
| `pp_historico_pagos` | Count of months in PP history |
| `juridica` | Boolean — in legal collections (cartera jurídica). NOT the same as tipo_persona='PJ'. |

**IVA multiplier rule:**  
- PJ: `× 1.155` (IVA 19% − retefuente 3.5% = 15.5%)  
- PN: `× 1.19`

---

### v2.locales
Physical units.

| Column | Notes |
|---|---|
| `id` | UUID PK |
| `unidad` | Unit number string — matches `siesa_raw.ocupacion.loc` |
| `empresa_id` | C-Krea filter |

---

### v2.contratos
Active tenant-unit contracts. Auto-managed by `sync_desde_raw()`.

| Column | Notes |
|---|---|
| `id` | UUID PK |
| `inquilino_id` | FK → v2.inquilinos |
| `local_id` | FK → v2.locales |
| `estado` | `'activo'` / `'critico'` / `'terminado'` |
| `fecha_inicio` | Contract start date |
| `canon_base` | Base canon at contract creation |
| `descuento_pct` | General discount % |
| `descuento_phase_pct` | Phase discount % (from contract docs — may differ from current ERP rate) |
| `descuento_hasta_mes` | Months from fecha_inicio until phase discount fully ends |
| `pronto_pago_pct` | PP rate from contract |

**Phase expiry calculation:**  
`phase_end_date = fecha_inicio + descuento_hasta_mes months`  
- If `phase_end_date < projection_year_start` → discount = 0% for the whole year  
- If `phase_end_date > projection_year_end` → discount applies all year  
- Otherwise → discount applies month 1 through that end month, then 0%

**auto-critico rule:** `v2.recalcular_criticos()` promotes activo→critico when `dias_mora > 60`. Runs nightly after sync.

---

### v2.proyecciones ⚠️ STALE — DO NOT USE FOR CURRENT PROJECTIONS
**What it is:** Frozen Excel snapshot from start of 2026. Was generated once from the 2026 Excel projection sheet with IPC applied.  
**Status (verified 2026-05-03):**
- Missing 12 tenants who joined after generation date
- BECERRA 120 doubled ($6.1M vs correct $3.05M)
- ALARCON 312 ghost (shows through Sep 2026, already left ERP)
- Rates are IPC-adjusted (+~5%) vs current ERP rates

**Use ONLY for:** year-start baseline comparison, not current state.  
**For current projections:** query `siesa_raw.ocupacion` directly.

---

### v2.vista_facturas
View combining invoice data. This is what the Mensual tab reads.

| Column | Notes |
|---|---|
| `inquilino_id` | FK → v2.inquilinos |
| `periodo` | YYYYMM integer |
| `is_factura` | Boolean — filter `is_factura = true` for invoices only |
| `valor_total` | `ventas + impuesto − retenciones` |
| `base_neta` | Base before IVA |
| `iva` | IVA amount |
| `retenciones` | Retefuente withheld |
| `empresa_id` | Always filter by this |

**Always filter:** `WHERE is_factura = true` — otherwise includes Descuentos PP rows.

---

### v2.vista_cartera_actual
Cartera/debt tracking view.

| Column | Notes |
|---|---|
| `dias_mora` | Days overdue |
| `vr_vencido` | Overdue balance |
| `inquilino_id` | Tenant reference |

---

## Projection logic (proyecciones page)

The anual projection reads **live from siesa_raw.ocupacion**, not v2.proyecciones.

**What each number means:**
- **Canon bruto:** `SUM(o.precio × active_months)` — gross annual canon at current ERP rates
- **Dcto. fase:** phase discount applied only while `mes <= mes_dcto_end` (respects expiry)
- **Piso:** everyone takes PP — worst case
- **Esperado:** PP usage weighted by `pp_historico_pct` — most probable
- **Techo:** no one takes PP — best case

**Projection accuracy (Jan 2026 verified):**  
Projection esperado $238.9M vs actual invoices $236.6M = **<1% error**.

**Known limitation (WOR-78):** Mid-year phase step-downs not modeled. ERP pushes current step rate; portal applies it flat for remaining active months. Intermediate steps (50%→30%→20%) need phase timeline stored in v2.contratos to model properly.

---

## Pagos page — data sources and bucket logic

### KPI: total invoiced this month
Source: `siesa_raw.documentos`
```sql
SELECT ROUND(SUM(ventas + impuesto - retenciones))::numeric
FROM siesa_raw.documentos
WHERE periodo = 202605    -- YYYYMM
  AND tipo = 'Facturas'
```
Use documentos (NOT cartera) — cartera drops paid invoices mid-month so the total shrinks as people pay. Documentos always shows the full issued amount for the month.

### KPI: total collected this month
Source: `v2.vista_pagos` → `siesa_raw.recaudo`

### Payment buckets (primeros 10 días / 11 al 30 / Mora)
Classification logic per payment:
1. `dias_mora_al_pago > grace_period_days (30)` → **Mora**
2. `EXTRACT(DAY FROM fecha_recaudo) BETWEEN 1 AND 10` → **Primeros 10 días**
3. Everything else → **11 al 30**

`dias_mora_al_pago` = how many days overdue the invoice was when the payment was applied. Calculated by Siesa at payment time, stored in recaudo, surfaced via v2.vista_pagos.

**grace_period_days = 30** (from `v2.reglas_financieras WHERE clave = 'grace_period_days'`)

**Example — FUSION GRAFIK:**
- Paid Apr 1, `dias_mora_al_pago = 20` → 20 < 30 → day 1 → **Primeros 10 días**
- Paid Apr 23, `dias_mora_al_pago = 12` → 12 < 30 → day 23 → **11 al 30**
- Paid Feb 26, `dias_mora_al_pago = 45` → 45 > 30 → **Mora**
- Once overdue April invoice is fully paid → future May payments at 0 days mora → date-bucket applies

### Mora page — who shows where
- **Regular mora table** (`getMoraRows`): `juridica = false` AND has active/critico contract AND `vr_vencido > 0` AND `dias_mora > grace`
- **Cartera Jurídica** (`getJuridicaRows`): `juridica = true` OR no active/critico contract — both with `vr_vencido > 0`
- **Ex-tenants** (left without paying): show ONLY in Cartera Jurídica via the `NOT EXISTS(active contract)` branch. Never in regular mora.

---

## Ex-tenants with open cartera

Some tenants leave their unit without finishing payments. They disappear from `siesa_raw.ocupacion` but remain in `siesa_raw.cartera` with open balances.

**To find them:** query cartera, cross-reference with ocupacion — anyone in cartera but NOT in ocupacion is an ex-tenant with debt.

```sql
SELECT c.documento, c.cliente FROM siesa_raw.cartera c
WHERE NOT EXISTS (
  SELECT 1 FROM siesa_raw.ocupacion o WHERE o.documento = c.documento
)
```

**Portal:** the `/mora` page handles this in `getJuridicaRows()` — shows tenants where `v2.inquilinos.juridica = true` OR no active/critico contract + `vr_vencido > 0`. Listed under "Cartera Jurídica", **excluded from regular mora KPIs**.

**Important:** `juridica` (cartera jurídica / legal collections) ≠ `tipo_persona = 'PJ'` (legal entity for retefuente). Do not conflate.

---

## Key join patterns

```sql
-- Tenant + unit + contract from ERP occupancy
FROM siesa_raw.ocupacion o
JOIN v2.inquilinos i ON i.nit = o.documento AND i.empresa_id = '...'
LEFT JOIN v2.locales l ON l.unidad = o.loc AND l.empresa_id = '...'
LEFT JOIN LATERAL (
  SELECT * FROM v2.contratos cc
  WHERE cc.local_id = l.id AND cc.inquilino_id = i.id
    AND cc.estado IN ('activo','critico')
  ORDER BY cc.fecha_inicio DESC NULLS LAST LIMIT 1
) c ON TRUE
WHERE o.razon_social IS NOT NULL AND COALESCE(o.precio, 0) > 0

-- Monthly invoices (actual)
FROM v2.vista_facturas
WHERE empresa_id = '...' AND is_factura = true AND periodo = 202601

-- Historical invoices from raw
FROM siesa_raw.documentos
WHERE periodo = 202601 AND tipo = 'Facturas'
```
