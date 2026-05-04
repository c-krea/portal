# Changelog — C-Krea PayControl

## [Unreleased]

### Session 49 — 2026-05-03: Locales + Portal deep review

#### Locales list (`/locales`)
- KPI cards replaced: Cartera total/En mora/Recaudado → Vacantes/Canon Mensual Neto/Contratos por vencer
- Entrada filter: URL-driven `?entrada=X` updates KPI cards server-side
- Filter UI consolidated: single "Filtros" button with expandable Estado + Entrada panel, active chip row
- Unit chips show `E1·101` entrada prefix

#### Per-client detail (`/locales/[id]`)
- Card renamed "Datos del Cliente" → "Datos del Inquilino"; nombre corto removed (razonSocial from ERP is source of truth)
- Email + Teléfono always visible with `—` fallback
- Contracts card: entrada inline, DD/MM/YYYY start date, canon labels c/IVA vs s/IVA, PP/Dto removed
- Cartera table: Local column (unit from sucursal), Mora column uses correct interest-days (financia-30)
- KPI: "Interés Acumulado" → "Interés Est.", warning threshold >$1,000, "Días en Mora" uses accurate interest-days
- "Al Día" green banner when client has no open invoices
- Payment history: paginated 10/page with ellipsis nav, timing column, invoice month label, total histórico footer

#### Interest formula corrected
- Rule C: interest starts day 31 (not day 11). Formula: `GREATEST(0, financia - 30) × 0.05%/day`
- `financia` (days since invoice date) used throughout — bypasses Siesa `fecha_vence` misconfiguration in pre-May invoices
- Portal interest estimate now DB-driven via `v2.reglas_financieras`

#### Data sources fixed
- `v2.proyecciones` fully removed — canon now from `siesa_raw.ocupacion` in all queries
- Portal mora detection: `lastPago + 35d` → `cartera.vencido > 0` (live from Siesa)
- Portal next payment: `lastPago + 30d` → earliest `fecha_vence` from open invoices
- `getPortalContratos` canon/discount: v2 → siesa_raw.ocupacion with ORDER BY + razon_social guard
- NIT validation guard in `getPortalCartera`
- Unit extraction: REVERSE/SPLIT_PART (safe) instead of REGEXP_MATCHES (drops rows on no match)

#### Linear
- WOR-80 created: future improvement — interest on historical daily balance for partial payers
