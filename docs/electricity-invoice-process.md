# Electricity Invoice PDF — Build Process Log

Tracks every decision and checkpoint in building the electricity PDF invoice feature.
Use this to answer future questions about why things are the way they are.

---

## Context

Tenants pay electricity as a reimbursement of costs — Manufacturas Reymon S.A. pays the utility bill, then bills each tenant for their share based on their meter reading. The PDF formalizes this as a "Cuenta de Cobro."

---

## Checkpoint 1 — PDF Template

**Date:** 2026-05-11

**Input:** Physical PDF template — `Borrador Cuenta de Cobro - Ingresos para terceros.pdf`

**Layout extracted:**
- Header: `CUENTA DE COBRO No. 001` (right-aligned, bold)
- Date, recipient block (client name + NIT)
- Intro paragraph (static — Manufacturas Reymon S.A. as intermediary)
- Provider data block (proveedor, NIT proveedor, contrato, periodo, consumo, tarifa, dirección, total)
- Green-bordered NOTE box (accounting reminder)
- Closing + signature block (Bilmar Yoban Burgos / Representante Legal / Manufacturas Reymon S.A.)
- Divider + attachment list + legal disclaimer

**Component created:** `src/lib/pdf/electricity-invoice.tsx`
**Library:** `@react-pdf/renderer` (installed, not `pdf-lib` which was already in the project)

**Initial props (wrong — corrected at Checkpoint 2):**
```ts
{ nombre, nit, total }  // only 3 dynamic fields — rest hardcoded
```

---

## Checkpoint 2 — All Provider Block Fields Are Dynamic

**Decision:** Every field in the provider data block changes per invoice:
- Different utility companies per address group
- Different billing periods, consumption, tarifa, totals each month

**Corrected props:**
```ts
{
  nombre: string       // tenant name
  nit: string          // tenant NIT
  proveedor: string    // utility company name
  proveedorNit: string // utility company NIT
  contrato: string     // contract/account number
  periodo: string      // "1 al 31 de marzo 2026"
  consumoKwh: number   // e.g. 537.3 → formats as "537,3 Kwh"
  tarifaKwh: number    // COP per kWh → formats as "$ 834,12"
  direccion: string    // unit address
  total: number        // COP → formats as "$ 448.173"
}
```

---

## Checkpoint 3 — Delivery Mechanism: Download Button

**Options considered:**
- API route (server-side `renderToBuffer`) — extra file, roundtrip, only needed for batch/email
- `<PDFViewer>` embed — iframe, poor mobile UX, no real benefit
- `PDFDownloadLink` — ships with `@react-pdf/renderer`, generates in browser, triggers native download, zero extra infrastructure

**Decision:** `PDFDownloadLink`. No R2 storage — DB has all data to regenerate the exact same PDF at any time.

---

## Checkpoint 4 — UX Flow Redesign

**New flow for "Pagar en Línea" button:**
1. Click button → step 0: choose payment type
   - `[🏠 Arriendo]` → existing flow (unchanged)
   - `[⚡ Energía eléctrica]` → show invoice data + NOTE box → "Ir a pagar"
2. Energía step uses same Wompi link as arriendo
3. Total for electricity = `MROUND(consumoKwh × tarifaKwh, 50)` — computed from portal meter submission

**New "Descargar Facturas" button on home screen:**
- Second button below "Pagar en Línea"
- Opens modal → month picker (periods where tenant submitted a reading)
- Downloads PDF via `PDFDownloadLink` with `ElectricityInvoicePDF`

---

## Checkpoint 5 — ELECTRICITY_GROUPS: Provider Verification

**Problem:** Provider names and NITs are not stored in Siesa. Siesa `notas` only contains address + contract number.

**Example Siesa record for FP-22028:**
```
documento: "001-FP -22028"
notas:     "SERVICIO DE ENERGIA CALLE 11 #27-39 CUENTA DE CONTRATO N°902329"
valor:     $7.163.360
periodo:   202605
```

**Conclusion:** Provider name and NIT must be hardcoded in `ELECTRICITY_GROUPS` constant from physical paper bills.

---

## Checkpoint 6 — ELECTRICITY_GROUPS Final Values

**Source:** Physical utility bills + DB query to verify contrato display format.

**DB finding — contrato format differs by provider:**
- ERCO: `N° {number}` (e.g. `N° 902329`)
- CODENSA: `0{number}-{checkdigit}` (e.g. `0359581-2`)

**Check digits confirmed from DB `notas` field** (not guessed):
- CRA2710071 → `0359581-2` (check digit = 2)
- CRA2710073 → `0359583-6` (check digit = 6)
- CRA2710079 → `0359585-0` (check digit = 0)

**Final ELECTRICITY_GROUPS:**

| Group | Address | Provider | NIT | Contrato display |
|---|---|---|---|---|
| CRA2710065 | CARRERA 27 #10-65 | ERCO ENERGÍA SA ESP | 900.570.286-9 | N° 359580 |
| CRA2710071 | KR 27 N°10-71 | CODENSA SA ESP | 860.063.875-8 | 0359581-2 |
| CRA2710073 | KR 27 N°10-73 | CODENSA SA ESP | 860.063.875-8 | 0359583-6 |
| CLL112733 | CALLE 11 #27-33 | ERCO ENERGÍA SA ESP | 900.570.286-9 | N° 354985 |
| CLL112739 | CALLE 11 #27-39 | ERCO ENERGÍA SA ESP | 900.570.286-9 | N° 902329 |
| CRA2710079 | KR 27 N°10-79 | CODENSA SA ESP | 860.063.875-8 | 0359585-0 |

**Note:** Additional meter groups exist in ERP but are not yet in the portal (CLL112723, CLL112747, KR24N°11-41). These map to ERCO and Qi Energy (NIT 900.677.732-3) respectively.

---

## Checkpoint 7 — Data Flow for Invoice

**How the total is calculated:**
1. Admin enters utility bill values at `/medidores/facturas` → stored in `v2.facturas_energia` → `tarifa_kwh = valor_factura / kwh_factura`
2. Tenant submits meter reading on day 9 via portal → `kwh = lectura_actual - lectura_anterior`
3. Portal computes `total_energia = Math.round(kwh × tarifa_kwh)` and saves to `v2.lecturas_medidor`

**Source of truth per field:**
| Field | Source |
|---|---|
| `consumoKwh` | `v2.lecturas_medidor.kwh` |
| `tarifaKwh` | `v2.facturas_energia.tarifa_kwh` (join on `grupo_energia`) |
| `total` | `v2.lecturas_medidor.total_energia` (pre-computed) |
| `proveedor` / `proveedorNit` / `contratoDisplay` | `ELECTRICITY_GROUPS` constant |
| `direccion` | `ELECTRICITY_GROUPS` constant |
| `periodo` | formatted from `v2.lecturas_medidor.periodo` |

---

## Open Items

- [ ] Task 2: `getPortalElectricityInvoiceData` + `getPortalElectricityPeriodos` in `portal.ts`
- [ ] Task 3: `portal/actions.ts` server action for download button
- [ ] Task 4: Refactor `WompiButton` — step-0 type selector + energía step
- [ ] Task 5: `facturas-download-button.tsx` — new component
- [ ] Task 6: Wire everything in `portal/page.tsx`
- [ ] Future: Add remaining ERP groups (CLL112723, CLL112747, KR24) to portal
