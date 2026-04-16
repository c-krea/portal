# Changelog

All notable changes to C-Krea PayControl.

Format: [YYYY-MM-DD] — description

---

## [Unreleased]

## [1.7.0] — 2026-04-16
### Added
- Cartera: 118 rows imported from ckrea.xlsx Cartera sheet (was empty after payments import)
- Mora table: clickable rows → `/clientes/[id]`, unit badge, separate Vencido + Saldo columns
- Mora bucket cards: show saldo pendiente (replacing $0 interest KPI — interest runs via cron)
- Clientes `[id]` payments: Recibo (RK-XXXX) + Factura (FVS-XXXXX) columns, clasificación badge, totals footer row
- Payment query: adds `siesa_cruce` + `siesa_clasificacion`, limit raised 30 → 50
### Fixed
- NaN `valor_vencido` in cartera (blank cells from not-yet-due invoices) → set to 0
- Negative `dias_mora` rows excluded from mora view

## [1.6.0] — 2026-04-16
### Added
- Tenant NITs: all 65 tenants updated with real NIT/Documento values from Siesa Ocupacion + Recaudo sheets (replaced `IMPORT-XXX` placeholders)
- Payments history imported: 2,695 records (Jan 2024 → Apr 2026) from ckrea.xlsx Recaudo sheet — full Siesa fields stored (`siesa_docto`, `siesa_cruce`, `siesa_clasificacion`, `fecha_pronto_pago`, `fecha_vencimiento`, `fecha_factura`, `valor_aplicado`, `pronto_pago_aplicado`, `valor_final`)
- Linear CKR-13: tracking 1 missing payment (SOLORZANO) + NEOGRAFICK new tenant to add
- IT questions saved: API format, sync frequency, RK numbering, unit 505 Siesa structure

## [1.5.0] — 2026-04-16
### Fixed
- PP mutual exclusivity rule: `invoice-engine.ts` now sets `prontoPagoRef = 0` when a phase discount is active for that period. PP only applies after phase discount expires.
- `projections` table: zeroed out 199 rows where `pronto_pago_proyectado > 0` AND `descuento_proyectado > 0` simultaneously (~$48M COP corrected)
- Proyecciones detail table: `PP%` column now shows `—` for any contract with an active phase discount in 2026 (was incorrectly showing 10% for all)
- `financial-rules-engine-spec.md §2.4`: added Rule A point 4 — phase discount and PP are mutually exclusive
### Added
- Proyecciones detail table: click-to-sort on all columns (↑/↓ indicator, no extra icons). Extracted to `src/components/proyecciones/detalle-table.tsx`.
- Mora page: 3 aging-bucket KPI cards (0–30 / 31–60 / 61+ días) — white cards with colored left border accent, pill badge for day range, interest as main KPI, client count inline
- Mora table: simplified to 4 columns (Arrendatario | Días | Meses pendientes | Total), click-to-sort, headers always visible
- `getMoraRows()`: added `meses_pendientes` (COUNT of overdue cartera rows per tenant)
- Linear CKR-12: unit 505 annual lump sum billing — pending investigation
### Removed
- `AccrualForm` removed from mora page — daily interest accrual handled by Vercel Cron only

## [1.4.0] — 2026-04-16
### Changed
- `/proyecciones` — complete redesign: KPI breakdown cards, formula explainer, monthly Recharts bar chart (navy, rounded, full hover tooltip), per-contract detail table (78 rows with meses, dcto%, PP%, neto anual c/IVA)
- "Generar proyecciones" form moved to floating gear icon → modal overlay (hidden by default)
- Dashboard: stacked single bar chart (emerald fills navy as recaudo arrives), removed filter dropdowns, Desglose card equal-height flex items with fluid `clamp(vh)` typography
- Sidebar: "Dashboard" → "Resumen", Proyecciones moved to slot #2, Usuarios + Configuración hidden from nav
- Layout: `max-w-[1440px]` centered, natural scroll restored on all pages
### Removed
- `/reportes` page deleted — proyectado vs recaudado chart now lives on dashboard directly

## [1.3.0] — 2026-04-16
### Added
- `/configuracion` — financial rules editor: view/edit IVA rate, PP window, mora rate, grace period, IPC % via inline forms; automations panel showing cron schedule
- `src/lib/data/configuracion.ts` — `getFinancialRules` query + `RULE_LABELS` map
- `src/app/(app)/configuracion/actions.ts` — `updateFinancialRule` server action (Zod validated)
- `src/components/configuracion/rule-form.tsx` — inline edit form per rule with `useActionState`
- `src/app/api/cron/accrual/route.ts` — Vercel Cron handler: daily interest accrual, CRON_SECRET protected, runs `runInterestAccrual` per company
- `vercel.json` — cron schedule `0 6 * * *` (01:00 COT)
- `/proyecciones` — IPC projection generator: coverage table by year, pending contracts preview, generate form
- `src/lib/data/proyecciones.ts` — `getProyeccionSummaries`, `getContractsForProjection` (skips already-projected contracts, idempotent)
- `src/app/(app)/proyecciones/actions.ts` — `generarProyecciones` server action: applies IPC multiplier, inserts 12 months per contract with `onConflictDoNothing`
- `src/components/proyecciones/generate-form.tsx` — year + IPC % form with `useActionState`
- Sidebar: added Proyecciones (TrendingUp) + Configuración (Settings) nav items

## [1.2.1] — 2026-04-16
### Fixed
- Invoice engine: removed `gasto_acueducto` line item — water is included in canon, not a separate charge
- Invoice `subtotalGastos` = electricity only (0 if no meter reading for the period)
- Invoice detail page: "Gastos" label → "Energía eléctrica"

## [1.2.0] — 2026-04-16
### Added
- `src/lib/interest-engine.ts` — Rule C accrual: `runInterestAccrual(companyId, date)` — idempotent, skips existing accruals for date, 0.05%/day on overdue saldo, updates `invoice.subtotal_interes` + status → `vencida`
- `src/app/(app)/mora/actions.ts` — `calcularIntereses` server action with date picker
- `src/components/mora/accrual-form.tsx` — trigger form with per-invoice result breakdown
- `/mora` page: 4-KPI layout (cartera vencida, clientes, avg días, interés acumulado portal) + AccrualForm panel + last accrual date
- `getMoraSummary()` — queries total portal invoice interest + vencidas count + last accrual date
- Reconciliation: payment applied to `subtotal_interes` first, then principal (spec §9.10); `vencida` invoices now included in open set; `subtotalInteres` reduced on payment

## [1.1.0] — 2026-04-16
### Added
- `emitirFactura` server action — borrador → emitida status transition
- `/facturas/[id]` — invoice detail page: line items table, totals, PP reference, print/PDF view via `window.print()`
- `EmitButton`, `PrintButton` client components in `src/components/facturas/`
- PP at payment time: `reconcilePayment` now checks `fecha_pronto_pago` per invoice; deducts `subtotal_pronto_pago` from saldo if payment within window; inserts `payment_applications` record; marks invoice `pagada`/`parcial`
- `payment_applications` rows inserted on every payment reconciliation (portal invoices)
- `/facturas` list: "Ver" link → invoice detail; "Exportar a Siesa" CSV download button
- `GET /facturas/export` — CSV export in Siesa Documentos sheet format (columns: documento, periodo, id_canal, canal, id_co, co, doc, cliente, tipo_cliente, tipo, auxiliar, ventas, impuesto, retenciones) — matches ckrea.xlsx exactly
- DB migration 004: `meter_readings` table (unit_id, periodo, lectura_anterior, lectura_actual, kwh, tarifa_kwh, total_energia) with UNIQUE(unit_id, periodo) + RLS
- Drizzle schema: `meterReadings` table added to `core.ts`
- `/medidores` — electricity meter readings page: list units with `has_electricity_meter=true`, form to register readings (onConflictDoUpdate for re-entry)
- `src/lib/data/medidores.ts` — `getUnitsWithMeters`, `getMeterReadings`
- `src/app/(app)/medidores/actions.ts` — `registrarLectura` server action with Zod validation
- Invoice engine updated: LEFT JOIN `meter_readings` per period → adds `gasto_energia` line item when reading exists
- Medidores added to sidebar nav (Zap icon)

## [1.0.0] — 2026-04-16
### Added
- `src/lib/invoice-engine.ts` — invoice computation engine per financial-rules-engine-spec.md §6: canon (from projections), phase discount, IVA 19%, pronto pago reference, water gasto ($29,947 flat). Billing day from contract flags (UNO=1st, ONCE=11th, VEINTIUNO=21st). Due date = billing + 10 days.
- `/facturas` page — invoice list with period filter tabs, KPI panel, `GenerateForm` client component
- `src/app/(app)/facturas/actions.ts` — `generarFacturas` server action: generates for all active contracts in period, skips existing, reports created/skipped/errors
- `src/lib/data/facturas.ts` — `getFacturas`, `getFacturaSummary`, `getAvailablePeriodos` queries
- `src/components/facturas/generate-form.tsx` — month/year selectors, loading state, error + success feedback with per-contract error list
- Facturas added to sidebar navigation

## [0.9.0] — 2026-04-16
### Added
- `src/lib/reconciliation.ts` — FIFO payment allocation engine: applies payment amount against tenant's open cartera items oldest-first, updates `saldo` and `valor_vencido` in-place
- `registrarPago` action now calls `reconcilePayment` after insert — cartera updated atomically with payment
- Success message includes: number of facturas applied, how many cleared (saldo = 0), and any unapplied remainder
- `revalidatePath` on `/mora` and `/clientes` added so reconciled balances refresh immediately

## [0.8.0] — 2026-04-16
### Added
- Supabase Auth wired: login page (`/login`), `LoginForm` client component, `signIn`/`signOut` server actions
- Route groups: `(app)/` for protected pages (sidebar + session check), `(auth)/` for login (no sidebar)
- `src/proxy.ts` — Next.js 16 Proxy (replaces middleware): session cookie refresh + redirect unauthenticated → `/login`
- `(app)/layout.tsx` — server layout: validates session, loads profile display name, passes `signOut` to sidebar
- Sidebar: shows current user name, wired `signOut` action via `useTransition`
- Root layout simplified (html/body/font only — sidebar moved into `(app)` layout)
- DB migration `003_auto_create_profile_trigger`: `public.handle_new_user()` trigger on `auth.users` — auto-creates profile row on signup with role from `raw_user_meta_data`

## [0.7.0] — 2026-04-16
### Added
- `/reportes` — Analytics page: KPI strip (cartera total, vencido, interés, recaudado), Recaudo Mensual bar chart, Proyectado vs. Recaudado comparison chart, Antigüedad de Cartera aging table with % bars
- `/usuarios` — User management page: role-based list (admin/finanzas/consulta/inquilino), active status badges, empty state with auth note, invite button placeholder (Phase 2)
- `src/lib/data/reportes.ts` — 4 data functions: `getAgingBuckets`, `getMonthlyCollections`, `getProyectadoVsReal`, `getReporteSummary`
- `src/lib/data/usuarios.ts` — `getUsuarios` query (profiles + tenant join)
- `src/components/reportes/recaudo-chart.tsx` — Client chart wrappers for Tremor BarChart (RSC boundary fix)

## [0.6.0] — 2026-04-16
### Added
- `/clientes/[id]` — Tenant detail page: client info card, contract+unit card, cartera KPI strip, sortable CarteraTable (TanStack), contract phases timeline, payment history
- `/gastos` — Gastos page: KPI strip (total/asignado/pendiente) + sortable filterable GastosTable (TanStack) with category/method labels and allocation status badges
- `/pagos` — Payment recording page: RegistrarPagoForm (server action + `useActionState`, React 19), recent payments list with link to tenant detail
- Data layers: `src/lib/data/tenant-detail.ts`, `src/lib/data/gastos.ts`, `src/lib/data/pagos.ts`
- Server action: `src/app/pagos/actions.ts` — Zod validation, Drizzle insert, `revalidatePath`

## [0.5.0] — 2026-04-16
### Added
- Layout system: sidebar (dark slate-900, 220px fixed, Spanish nav), page-header component, root layout (Inter font)
- Dashboard (`/`): KPI cards (portfolio total, mora stats), Desglose de Cartera, Tremor BarChart with 2026 projections — real DB data
- Mora page (`/mora`): KPI strip + TanStack Table (sortable, filterable, severity badges)
- Clientes page (`/clientes`): tenant list with tab filters, status dots, sortable TanStack Table
- `src/lib/formatters.ts` — COP (es-CO), percent, date formatters
- `src/lib/constants.ts` — nav items, status colors
- `src/lib/data/` — Drizzle query layer (dashboard, mora, clientes)
### Fixed
- DATABASE_URL switched from broken transaction pooler (6543) to direct DB host (5432)

## [0.4.0] — 2026-04-16
### Added
- Full production seed data applied to Supabase:
  - 1 company (Central Kreativa), 59 tenants, 85 units, 78 contracts
  - 1020 monthly projections (2026, all units)
  - 250 cartera (receivables) records from Siesa snapshot
  - 5 financial rule parameters (IVA, mora, pronto pago, IPC)
  - 11 gasto types + 9 gastos (January 2026 sample)

## [0.3.0] — 2026-04-16
### Added
- Knowledge graph: `graphify-out/` (183 nodes, 213 edges, 38 communities, interactive HTML)
- Knowledge Graph + Obsidian Wiki + Reusable Functions sections in CLAUDE.md
- Three-record workflow formalized (Linear / CHANGELOG / JOURNAL) in CLAUDE.md

## [0.2.0] — 2026-04-16
### Added
- Full 21-table schema applied to Supabase (companies, profiles, tenants, units, contracts, contract_phases, financial_rules, invoices, invoice_line_items, payments, payment_applications, interest_accruals, cartera, gasto_types, gastos, gasto_allocations, projections, accounting_entries, siesa_sync_log, audit_log, notifications)
- RLS enabled on all tables with role-based policies (admin/finance/viewer/tenant)
- Helper functions: `public.user_company_id()`, `public.user_role()`, `public.user_tenant_id()`
- updated_at trigger applied to all tables
- Drizzle schema (TypeScript) + client configured
- Supabase browser + server clients configured
- Sentry error tracking wired up
- Linear workspace (ckrea-portal / CKR) connected
- Vercel deployment linked
- Record-keeping workflow defined (Linear / CHANGELOG / JOURNAL)

## [0.1.0] — 2026-04-16
### Added
- Project initialized: Next.js 16, TypeScript, Tailwind CSS v4, App Router
- shadcn/ui initialized
- Core dependencies: Drizzle ORM, Supabase client, TanStack Table, React Hook Form, Zod, Tremor, Lucide React
- Project docs: CLAUDE.md, CHANGELOG.md, docs/context.md, docs/JOURNAL.md
- .env.local configured for Supabase
