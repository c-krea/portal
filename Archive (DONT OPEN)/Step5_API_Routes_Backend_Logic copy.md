# C-Krea PayControl — Step 5: API Routes & Backend Logic Map

**Version:** 1.0  
**Date:** April 16, 2026  
**Status:** Draft  
**Author:** German Burgos  

> Every API endpoint, server action, and Edge Function the portal needs — grouped by domain, with inputs, outputs, financial rule triggers, and audit log entries fully specified. This document bridges the schema (Step 1), the Financial Rules Engine spec (Step 3), and the UI screens (Step 4).

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Auth Domain](#2-auth-domain)
3. [Tenants & Contracts Domain](#3-tenants--contracts-domain)
4. [Invoices Domain](#4-invoices-domain)
5. [Payments Domain](#5-payments-domain)
6. [Gastos (Shared Expenses) Domain](#6-gastos-shared-expenses-domain)
7. [Interest Accrual Domain](#7-interest-accrual-domain)
8. [Siesa Sync Domain](#8-siesa-sync-domain)
9. [Reports Domain](#9-reports-domain)
10. [Dashboard Domain](#10-dashboard-domain)
11. [Users & Notifications Domain](#11-users--notifications-domain)
12. [Financial Rules Engine Domain](#12-financial-rules-engine-domain)
13. [Cron / Scheduled Jobs](#13-cron--scheduled-jobs)
14. [Error Handling & Audit Conventions](#14-error-handling--audit-conventions)
15. [API Route Index (Quick Reference)](#15-api-route-index-quick-reference)

---

## 1. Architecture Decisions

### 1.1 Pattern: Next.js Server Actions + Supabase Edge Functions

The backend uses two complementary patterns:

**Next.js Server Actions (primary):** All CRUD operations and UI-driven workflows use Next.js App Router server actions via `"use server"` functions. These run on Vercel's edge/serverless, have direct access to the Supabase client (service role for admin ops, user JWT for RLS-scoped ops), and return typed responses.

**Supabase Edge Functions (secondary):** Used for three specific cases:
- Scheduled cron jobs (daily interest accrual, nightly Siesa sync)
- Webhook receivers (Siesa push notifications)
- Heavy computation that benefits from running closer to the database (batch invoice generation)

### 1.2 Client-Server Boundary

```
Browser (React)
  │
  ├── Server Actions  ← form submissions, mutations, data fetching
  │     │
  │     └── Supabase Client (service_role or user JWT)
  │           │
  │           └── PostgreSQL (RLS enforced)
  │
  └── Direct Supabase Client (anon key) ← Realtime subscriptions only
        │
        └── Realtime channels (cartera updates, sync status)
```

### 1.3 Authentication Flow

Supabase Auth with email/password (Phase 1). Every server action extracts the user from the session cookie and passes it to the Supabase client. RLS policies handle company-scoping automatically. The `profiles` table extends `auth.users` with `company_id` and `role`.

### 1.4 Response Envelope

All server actions return a consistent shape:

```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

### 1.5 Audit Trail Convention

Every mutation (INSERT, UPDATE, DELETE, OVERRIDE, WAIVE) writes to `audit_log` with:
- `user_id`: from session
- `action`: the enum action type
- `entity_type`: table name
- `entity_id`: row UUID
- `old_values` / `new_values`: JSONB diff
- `reason`: mandatory for OVERRIDE and WAIVE actions

This is enforced at the server action level, not via database triggers, so we capture the `reason` field from the UI.

---

## 2. Auth Domain

### 2.1 `POST /auth/login` — Sign In

**Implementation:** Supabase Auth `signInWithPassword`, wrapped in a server action.

| Field | Detail |
|---|---|
| **Server Action** | `actions/auth.ts → signIn()` |
| **Input** | `{ email: string, password: string }` |
| **Validation** | Zod: valid email, password min 8 chars |
| **Logic** | 1. Call `supabase.auth.signInWithPassword()` 2. Fetch profile from `profiles` table 3. Set session cookie 4. Return user profile with role |
| **Output** | `{ user: Profile, session: Session }` |
| **Audit** | None (auth events tracked by Supabase natively) |
| **Errors** | `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED` |

### 2.2 `POST /auth/logout` — Sign Out

| Field | Detail |
|---|---|
| **Server Action** | `actions/auth.ts → signOut()` |
| **Input** | None |
| **Logic** | Call `supabase.auth.signOut()`, clear session cookie |
| **Output** | `{ success: true }` |

### 2.3 `GET /auth/me` — Current User Profile

| Field | Detail |
|---|---|
| **Server Action** | `actions/auth.ts → getCurrentUser()` |
| **Input** | None (from session) |
| **Logic** | Read from `profiles` joined with `companies` |
| **Output** | `{ id, email, full_name, role, company: { id, name, nit } }` |

### 2.4 `POST /auth/change-password`

| Field | Detail |
|---|---|
| **Server Action** | `actions/auth.ts → changePassword()` |
| **Input** | `{ currentPassword: string, newPassword: string }` |
| **Validation** | Zod: new password min 8 chars, must differ from current |
| **Logic** | Call `supabase.auth.updateUser()` |
| **Output** | `{ success: true }` |

---

## 3. Tenants & Contracts Domain

### 3.1 `GET /clientes` — List Tenants

**Serves:** `/clientes` page (tenant table with tabs), `/mora` page, search comboboxes.

| Field | Detail |
|---|---|
| **Server Action** | `actions/tenants.ts → listTenants()` |
| **Input** | `{ page?: number, pageSize?: number, status?: 'activo'│'mora'│'critico'│'inactivo', search?: string, sortBy?: string, sortDir?: 'asc'│'desc' }` |
| **Validation** | Zod: page ≥ 1, pageSize 10-100, status in enum |
| **Logic** | 1. Query `tenants` JOIN `contracts` JOIN `units` JOIN latest `cartera` 2. RLS auto-filters by `company_id` 3. Status filter: `activo` = no overdue, `mora` = has overdue cartera, `critico` = dias_mora > 90, `inactivo` = contract terminated or vacant 4. Search: ILIKE on `razon_social`, `nit`, `units.unit_number` |
| **Output** | `{ items: TenantListRow[], total: number, page: number }` where `TenantListRow = { id, unit_number, unit_code, entrada, razon_social, nit, status, contract_status, fase_actual, canon_base, descuento_pct, saldo_pendiente, ultimo_pago_date }` |
| **Rules Triggered** | None (read-only) |
| **Audit** | None |

### 3.2 `GET /clientes/[id]` — Tenant Detail

**Serves:** `/clientes/[id]` page — contract info, current status, payment history, gastos, timeline.

| Field | Detail |
|---|---|
| **Server Action** | `actions/tenants.ts → getTenantDetail()` |
| **Input** | `{ tenantId: UUID }` |
| **Logic** | 1. Fetch tenant + active contract + unit 2. Fetch contract_phases for timeline 3. Calculate current status via Financial Rules Engine: a. Determine effective canon (check IPC date) b. Determine active phase discount c. Calculate PP eligibility (is today within 10 days of current invoice?) d. Sum outstanding cartera for `saldo_pendiente` e. Sum interest_accruals where `is_waived = false` 4. Fetch last 12 months of payments 5. Fetch current month gasto_allocations |
| **Output** | `TenantDetail = { tenant, contract, unit, phases: ContractPhase[], currentStatus: { status, proximo_vencimiento, dias_mora│dias_para_vencer, descuento_pp_disponible, interes_acumulado, gastos_asignados, total_a_pagar }, paymentHistory: Payment[], gastoAllocations: GastoAllocation[] }` |
| **Rules Triggered** | Rule A (PP eligibility check), Rule B (active phase lookup), Rule C (interest sum), Rule D (gastos sum) |
| **Audit** | None |

### 3.3 `POST /clientes` — Create Tenant

| Field | Detail |
|---|---|
| **Server Action** | `actions/tenants.ts → createTenant()` |
| **Input** | `{ nit, razon_social, nombre_corto?, email?, telefono?, contacto_nombre? }` |
| **Validation** | Zod: NIT required (Colombian format), razon_social required, email valid if provided |
| **Logic** | 1. Check NIT uniqueness within company 2. INSERT into `tenants` 3. Write audit log |
| **Output** | `{ tenant: Tenant }` |
| **Audit** | `INSERT` on `tenants` |
| **Roles** | admin, finance |

### 3.4 `PATCH /clientes/[id]` — Update Tenant

| Field | Detail |
|---|---|
| **Server Action** | `actions/tenants.ts → updateTenant()` |
| **Input** | `{ tenantId: UUID, updates: Partial<Tenant> }` |
| **Validation** | Zod: only allowed fields (razon_social, nombre_corto, email, telefono, contacto_nombre, is_active) |
| **Logic** | 1. Fetch current values 2. UPDATE 3. Write audit log with old/new diff |
| **Output** | `{ tenant: Tenant }` |
| **Audit** | `UPDATE` on `tenants`, old_values + new_values |
| **Roles** | admin, finance |

### 3.5 `POST /contratos` — Create Contract

| Field | Detail |
|---|---|
| **Server Action** | `actions/contracts.ts → createContract()` |
| **Input** | `{ tenant_id, unit_id, fecha_inicio, fecha_fin?, canon_base, descuento_pct?, pronto_pago_pct?, interes_mora_rate?, grace_period_days?, lista_precios?, incremento_ipc?, fecha_incremento_ipc?, descripcion_descuentos?, phases: { phase_number, name, start_date, end_date?, descuento_pct, pronto_pago_pct }[] }` |
| **Validation** | Zod: canon_base > 0, fecha_inicio valid date, each phase has valid dates and percentages 0-100, unit must not have another active contract |
| **Logic** | 1. Verify unit has no other active contract 2. INSERT into `contracts` 3. INSERT each phase into `contract_phases` 4. UPDATE `units.status` → 'arrendado' 5. Generate projections for remaining months of year (call `generateProjections()`) 6. Write audit log |
| **Output** | `{ contract: Contract, phases: ContractPhase[] }` |
| **Rules Triggered** | Projection generation uses Rules A+B to calculate monthly expected values |
| **Audit** | `INSERT` on `contracts`, `INSERT` on each `contract_phases` |
| **Roles** | admin |

### 3.6 `PATCH /contratos/[id]` — Update Contract

| Field | Detail |
|---|---|
| **Server Action** | `actions/contracts.ts → updateContract()` |
| **Input** | `{ contractId: UUID, updates: Partial<Contract>, reason: string }` |
| **Validation** | Zod: reason required (min 10 chars), allowed fields only |
| **Logic** | 1. Fetch current values 2. UPDATE 3. If canon_base or discount percentages changed → recalculate projections 4. Write audit log with reason |
| **Output** | `{ contract: Contract }` |
| **Rules Triggered** | If financial terms changed: recalculate projections (Rules A+B) |
| **Audit** | `UPDATE` on `contracts` with `reason` |
| **Roles** | admin |

### 3.7 `POST /contratos/[id]/terminate` — Terminate Contract

| Field | Detail |
|---|---|
| **Server Action** | `actions/contracts.ts → terminateContract()` |
| **Input** | `{ contractId: UUID, terminationDate: Date, reason: string }` |
| **Validation** | Zod: reason required, terminationDate ≤ today |
| **Logic** | 1. UPDATE contract `status` → 'terminado', `fecha_fin` → terminationDate 2. Deactivate all active contract_phases 3. UPDATE unit `status` → 'disponible' 4. Mark remaining projections as void 5. Calculate any outstanding balances 6. Write audit log |
| **Output** | `{ contract: Contract, outstandingBalance: number }` |
| **Audit** | `UPDATE` on `contracts`, `UPDATE` on `units` |
| **Roles** | admin |

### 3.8 `GET /clientes/search` — Quick Search (Combobox)

**Serves:** Payment recording combobox, global search bar.

| Field | Detail |
|---|---|
| **Server Action** | `actions/tenants.ts → searchTenants()` |
| **Input** | `{ query: string, limit?: number }` |
| **Logic** | Search `tenants` JOIN `units` JOIN `contracts` WHERE `razon_social ILIKE` OR `nit ILIKE` OR `unit_number ILIKE`. Return top 10. Include current balance from cartera. |
| **Output** | `{ results: { id, razon_social, nit, unit_number, saldo_pendiente }[] }` |

---

## 4. Invoices Domain

### 4.1 `POST /facturas/generate` — Generate Monthly Invoices (Batch)

**Serves:** Monthly billing cycle. Triggered by admin action or scheduled cron.

| Field | Detail |
|---|---|
| **Server Action / Edge Function** | `actions/invoices.ts → generateMonthlyInvoices()` or Edge Function `generate-invoices` |
| **Input** | `{ periodo: string (YYYYMM), billingFlag?: 'UNO'│'ONCE'│'VEINTIUNO'│'CRITICO' }` |
| **Validation** | Zod: periodo matches YYYYMM format, optional flag to generate only one billing group |
| **Logic** | For each active contract matching the billing flag for this period: 1. **Rule B check:** Look up `contract_phases` → find active phase for this month → get `descuento_pct` and `pronto_pago_pct` 2. **IPC check (Rule Engine §7):** If `current_date ≥ contract.fecha_incremento_ipc` → `canon_effective = canon_base * 1.051`, else `canon_effective = canon_base` 3. **Calculate line items:** a. Canon line: `canon_effective` (type `canon`) b. Phase discount line: `-(canon_effective * phase.descuento_pct)` (type `descuento`) c. PP discount line: `-((canon_effective - descuento) * phase.pronto_pago_pct)` (type `pronto_pago`) — stored but conditional on payment timing d. IVA line: `(canon_effective - descuento) * 0.19` (type `iva`) e. Gastos lines: one per allocated gasto for this unit/period (types `gasto_energia`, `gasto_acueducto`, etc.) 4. **Compute invoice totals:** `subtotal_canon`, `subtotal_descuentos`, `subtotal_pronto_pago`, `subtotal_gastos`, `iva`, `total`, `saldo` 5. **Set dates:** `fecha_emision` = billing day, `fecha_vencimiento` = fecha_emision + 10 days, `fecha_pronto_pago` = fecha_emision + pp_window_days 6. INSERT into `invoices` + `invoice_line_items` 7. Set `status` = 'emitida' 8. Write audit log for each invoice |
| **Output** | `{ generated: number, invoices: InvoiceSummary[], errors: { contractId, error }[] }` |
| **Rules Triggered** | Rule A (PP calculation), Rule B (phase discount), Rule D (gastos lines), IPC adjustment |
| **Audit** | `INSERT` on each `invoices` and `invoice_line_items` |
| **Roles** | admin, finance |

### 4.2 `GET /facturas` — List Invoices

| Field | Detail |
|---|---|
| **Server Action** | `actions/invoices.ts → listInvoices()` |
| **Input** | `{ periodo?: string, tenantId?: UUID, status?: invoice_status, page?, pageSize?, sortBy?, sortDir? }` |
| **Logic** | Query `invoices` JOIN `tenants` JOIN `units`. Filter by periodo, tenant, status. |
| **Output** | `{ items: InvoiceListRow[], total, page }` |

### 4.3 `GET /facturas/[id]` — Invoice Detail

| Field | Detail |
|---|---|
| **Server Action** | `actions/invoices.ts → getInvoiceDetail()` |
| **Input** | `{ invoiceId: UUID }` |
| **Logic** | Fetch invoice + all `invoice_line_items` + linked `payment_applications` + `interest_accruals` |
| **Output** | `{ invoice: Invoice, lineItems: LineItem[], payments: PaymentApplication[], interestAccruals: InterestAccrual[] }` |

### 4.4 `POST /facturas/[id]/void` — Void Invoice

| Field | Detail |
|---|---|
| **Server Action** | `actions/invoices.ts → voidInvoice()` |
| **Input** | `{ invoiceId: UUID, reason: string }` |
| **Validation** | Zod: reason required min 10 chars. Invoice must not have any payment_applications. |
| **Logic** | 1. Verify no payments applied 2. UPDATE `status` → 'anulada' 3. Reverse any gasto_allocation links (set `is_billed = false`) 4. Write audit log with reason |
| **Output** | `{ invoice: Invoice }` |
| **Audit** | `UPDATE` on `invoices` with reason |
| **Roles** | admin |

### 4.5 `POST /facturas/[id]/recalculate` — Recalculate Invoice

For when contract terms were corrected after invoice generation.

| Field | Detail |
|---|---|
| **Server Action** | `actions/invoices.ts → recalculateInvoice()` |
| **Input** | `{ invoiceId: UUID, reason: string }` |
| **Validation** | Invoice must be in 'emitida' status with no payments applied |
| **Logic** | 1. Re-run the full Master Invoice Calculation Chain (§6 of Rules Engine) against current contract terms 2. DELETE old `invoice_line_items` 3. INSERT new line items 4. UPDATE invoice totals 5. Write audit log with old/new values and reason |
| **Rules Triggered** | Full Rules A, B, D, IPC |
| **Audit** | `OVERRIDE` on `invoices` with reason, old/new totals |
| **Roles** | admin |

---

## 5. Payments Domain

### 5.1 `POST /pagos` — Record Payment

**Serves:** "Registrar Pago" sheet on `/pagos` page and `/clientes/[id]` actions.

| Field | Detail |
|---|---|
| **Server Action** | `actions/payments.ts → recordPayment()` |
| **Input** | `{ tenant_id: UUID, fecha_recaudo: Date, valor_aplicado: number, concepto: string, metodo_pago: 'transferencia'│'consignacion'│'cheque'│'efectivo', referencia_bancaria?: string, auto_apply: boolean, sync_siesa: boolean }` |
| **Validation** | Zod: valor_aplicado > 0, fecha_recaudo ≤ today, tenant_id required, referencia required for transferencia/consignacion |
| **Logic** | 1. INSERT into `payments` 2. If `auto_apply = true`: a. Fetch oldest unpaid invoices for this tenant (FIFO) b. **Rule A check:** For each invoice, check if `fecha_recaudo ≤ invoice.fecha_pronto_pago` — if yes, PP discount applies → reduce amount due c. **Rule C check:** If `fecha_recaudo > invoice.fecha_vencimiento` → calculate accrued interest, apply payment to interest first, then principal d. Create `payment_applications` linking payment → invoice(s) with exact amounts e. UPDATE each invoice's `saldo` f. If invoice fully paid → UPDATE `status` → 'pagada'; if partially paid → 'parcial' 3. UPDATE `cartera` records — reduce `saldo`, update `dias_mora` 4. If `sync_siesa = true`: queue Siesa push job 5. Write audit log |
| **Output** | `{ payment: Payment, applications: PaymentApplication[], ppApplied: number, interestApplied: number }` |
| **Rules Triggered** | Rule A (PP eligibility per invoice date), Rule C (interest calculation if overdue) |
| **Audit** | `INSERT` on `payments`, `INSERT` on each `payment_applications`, `UPDATE` on each affected `invoices` |
| **Roles** | admin, finance |

### 5.2 `GET /pagos` — List Payments

| Field | Detail |
|---|---|
| **Server Action** | `actions/payments.ts → listPayments()` |
| **Input** | `{ page?, pageSize?, tenantId?, status?: payment_status, dateFrom?, dateTo?, search?, sortBy?, sortDir? }` |
| **Logic** | Query `payments` JOIN `tenants` JOIN `units`. Filter by status, date range, tenant. Search on tenant name, NIT, siesa_docto. |
| **Output** | `{ items: PaymentListRow[], total, page }` where `PaymentListRow = { id, fecha_recaudo, tenant_name, unit_number, valor_aplicado, pronto_pago_aplicado, valor_final, status, concepto, siesa_synced }` |

### 5.3 `GET /pagos/[id]` — Payment Detail

| Field | Detail |
|---|---|
| **Server Action** | `actions/payments.ts → getPaymentDetail()` |
| **Input** | `{ paymentId: UUID }` |
| **Logic** | Fetch payment + all `payment_applications` JOIN `invoices` |
| **Output** | `{ payment: Payment, applications: { invoice: InvoiceSummary, amountApplied: number }[] }` |

### 5.4 `POST /pagos/[id]/void` — Void Payment

| Field | Detail |
|---|---|
| **Server Action** | `actions/payments.ts → voidPayment()` |
| **Input** | `{ paymentId: UUID, reason: string }` |
| **Validation** | Zod: reason required min 10 chars |
| **Logic** | 1. Fetch all `payment_applications` for this payment 2. For each application: reverse the invoice `saldo` (add back the amount), update invoice status accordingly 3. UPDATE payment `status` → 'anulado' 4. Recalculate interest accruals if needed (days overdue may have changed) 5. Queue Siesa reversal if originally synced 6. Write audit log |
| **Output** | `{ payment: Payment, reversedApplications: number }` |
| **Audit** | `UPDATE` on `payments` with reason, `UPDATE` on each affected `invoices` |
| **Roles** | admin |

### 5.5 `POST /pagos/[id]/apply` — Manual Payment Application

For manually applying an unapplied payment to specific invoices.

| Field | Detail |
|---|---|
| **Server Action** | `actions/payments.ts → applyPayment()` |
| **Input** | `{ paymentId: UUID, applications: { invoiceId: UUID, amount: number }[] }` |
| **Validation** | Sum of application amounts must equal payment's unallocated balance. Each amount > 0. Each invoice must belong to the same tenant. |
| **Logic** | 1. Validate totals 2. For each application: same PP/interest logic as `recordPayment` 3. INSERT `payment_applications` 4. UPDATE invoice saldos 5. Write audit log |
| **Rules Triggered** | Rule A (PP check per invoice), Rule C (interest application) |
| **Audit** | `INSERT` on `payment_applications` |
| **Roles** | admin, finance |

### 5.6 `POST /pagos/preview` — Payment Preview (No Commit)

**Serves:** Step 2 of the "Registrar Pago" sheet — real-time calculation display.

| Field | Detail |
|---|---|
| **Server Action** | `actions/payments.ts → previewPayment()` |
| **Input** | `{ tenant_id: UUID, fecha_recaudo: Date, valor_aplicado: number }` |
| **Logic** | Run the same FIFO allocation logic as `recordPayment` but without writing anything. Returns what would happen. |
| **Output** | `{ saldo_pendiente, descuento_pp_disponible, descuento_fase_aplicado, interes_acumulado, valor_neto_a_aplicar, invoicesAffected: { invoiceId, periodo, amountApplied, newSaldo }[] }` |
| **Rules Triggered** | Rule A, Rule B, Rule C (read-only simulation) |

---

## 6. Gastos (Shared Expenses) Domain

### 6.1 `GET /gastos` — List Gastos by Period

**Serves:** `/gastos` page — top table (Gastos del Mes) and KPI cards.

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → listGastos()` |
| **Input** | `{ periodo: string (YYYYMM) }` |
| **Logic** | Query `gastos` JOIN `gasto_types` WHERE `periodo` matches. Aggregate by category. |
| **Output** | `{ gastos: GastoRow[], totals: { total, servicios_publicos, aseo, vigilancia, nomina, otros }, categoryBreakdown: { category, amount, percentage }[] }` |

### 6.2 `POST /gastos` — Create Gasto

**Serves:** "+ Nuevo Gasto" dialog on `/gastos` page.

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → createGasto()` |
| **Input** | `{ gasto_type_id: UUID, periodo: string, total_amount: number, description?, observacion? }` |
| **Validation** | Zod: total_amount > 0, periodo YYYYMM format, gasto_type_id exists |
| **Logic** | 1. INSERT into `gastos` 2. Write audit log |
| **Output** | `{ gasto: Gasto }` |
| **Audit** | `INSERT` on `gastos` |
| **Roles** | admin, finance |

### 6.3 `POST /gastos/[id]/allocate` — Distribute Gasto to Tenants

**Serves:** "Calcular Distribución" button on the new gasto dialog.

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → allocateGasto()` |
| **Input** | `{ gastoId: UUID, method?: gasto_allocation_method, customAllocations?: { tenantId, unitId, amount }[] }` |
| **Validation** | If custom, sum of allocations must equal gasto total_amount |
| **Logic** | **Rule D — Shared Expenses Allocation:** 1. Fetch the gasto and its `gasto_type.allocation_method` 2. Fetch all active contracts with their units 3. Calculate per-unit allocation based on method: a. **`pro_rata`** (area-based): `unit_share = (unit.area_m2 / total_occupied_area) * total_amount` b. **`fixed`** (equal split): `unit_share = total_amount / count_occupied_units` — Water: $29,947/unit, Aseo: $44,315/unit c. **`metered`** (electricity): requires `customAllocations` with actual meter readings d. **`percentage`**: custom percentages per unit 4. INSERT `gasto_allocations` for each unit 5. UPDATE gasto `is_allocated = true`, `allocated_at = now()` 6. Write audit log |
| **Output** | `{ allocations: GastoAllocation[], totalAllocated: number, unitsAllocated: number }` |
| **Rules Triggered** | Rule D (allocation logic) |
| **Audit** | `INSERT` on each `gasto_allocations`, `UPDATE` on `gastos` |
| **Roles** | admin, finance |

### 6.4 `GET /gastos/allocations` — Allocation Table by Period

**Serves:** "Asignación por Local" table at bottom of `/gastos` page.

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → listAllocations()` |
| **Input** | `{ periodo: string, tenantId?: UUID }` |
| **Logic** | Pivot query: `gasto_allocations` JOIN `gastos` JOIN `gasto_types` JOIN `tenants` JOIN `units`. Group by unit, pivot by gasto category. |
| **Output** | `{ allocations: { unit_number, tenant_name, electricidad, agua, aseo, total, is_billed, is_paid }[] }` |

### 6.5 `POST /gastos/allocations/preview` — Preview Allocation (No Commit)

**Serves:** "Calcular Distribución" preview table in the new gasto dialog.

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → previewAllocation()` |
| **Input** | `{ gasto_type_id: UUID, total_amount: number, method: gasto_allocation_method }` |
| **Logic** | Same as `allocateGasto` but read-only — returns what the distribution would look like. |
| **Output** | `{ preview: { unit_number, tenant_name, amount }[] }` |

### 6.6 `PATCH /gastos/[id]` — Update Gasto

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → updateGasto()` |
| **Input** | `{ gastoId: UUID, total_amount?: number, description?, reason: string }` |
| **Validation** | If `is_allocated = true`, changing `total_amount` requires re-allocation |
| **Logic** | 1. UPDATE gasto 2. If amount changed and already allocated → DELETE existing allocations, re-run allocation 3. Write audit log |
| **Audit** | `UPDATE` on `gastos` with reason |
| **Roles** | admin, finance |

---

## 7. Interest Accrual Domain

### 7.1 `POST /intereses/accrue` — Daily Interest Accrual (Batch)

**Serves:** Scheduled cron job (runs daily). Can also be triggered manually by admin.

| Field | Detail |
|---|---|
| **Edge Function** | `accrue-interest` (cron: daily at 01:00 COT) |
| **Input** | `{ accrualDate?: Date }` (defaults to today) |
| **Logic** | **Rule C — Late-Interest Accrual:** 1. Fetch all invoices WHERE `status` IN ('emitida', 'vencida', 'parcial') AND `fecha_vencimiento < accrualDate` 2. For each overdue invoice: a. Calculate `days_overdue = accrualDate - fecha_vencimiento` b. Get `daily_rate`: use `contract.interes_mora_rate` if set, else global `financial_rules.interes_mora_diario` (0.0005) c. Check `grace_period_days` — skip if within grace period d. Get `overdue_balance = invoice.saldo` (remaining unpaid balance) e. `interest_amount = overdue_balance * daily_rate` f. `cumulative_interest` = sum of all prior accruals for this invoice + today's amount 3. INSERT into `interest_accruals` (one row per invoice per day) 4. UPDATE invoice `subtotal_interes` with cumulative total 5. If invoice status was 'emitida' and now overdue → UPDATE `status` → 'vencida' 6. Write to `siesa_sync_log` if interest crosses threshold for Siesa reporting |
| **Output** | `{ processed: number, totalInterestAccrued: number, invoicesAffected: number }` |
| **Rules Triggered** | Rule C (daily interest formula) |
| **Audit** | `INSERT` on each `interest_accruals` (bulk, no individual audit rows — the accrual records ARE the audit) |

### 7.2 `POST /intereses/waive` — Waive Interest

| Field | Detail |
|---|---|
| **Server Action** | `actions/interest.ts → waiveInterest()` |
| **Input** | `{ invoiceId: UUID, reason: string }` |
| **Validation** | Zod: reason required min 20 chars (strict for financial waivers) |
| **Logic** | 1. Fetch all `interest_accruals` for invoice where `is_waived = false` 2. UPDATE all to `is_waived = true`, `waived_by = user.id`, `waived_reason = reason` 3. UPDATE invoice `subtotal_interes = 0` 4. Recalculate invoice `saldo` 5. Write audit log |
| **Output** | `{ waivedAmount: number, accrualCount: number }` |
| **Audit** | `WAIVE` on `invoices` with reason, old/new interest values |
| **Roles** | admin only |

### 7.3 `GET /intereses/summary` — Interest Summary

**Serves:** Dashboard KPI ("Recargos"), Mora page interest column, Reports.

| Field | Detail |
|---|---|
| **Server Action** | `actions/interest.ts → getInterestSummary()` |
| **Input** | `{ periodo?: string, tenantId?: UUID }` |
| **Logic** | Aggregate `interest_accruals` by periodo and/or tenant. Sum `interest_amount` where `is_waived = false`. |
| **Output** | `{ totalAccrued, totalWaived, byTenant?: { tenantId, tenantName, amount }[] }` |

---

## 8. Siesa Sync Domain

### 8.1 `POST /siesa/pull` — Pull Data from Siesa

**Serves:** Scheduled nightly sync + manual "Sincronizar con Siesa" button.

| Field | Detail |
|---|---|
| **Edge Function** | `siesa-sync-pull` |
| **Input** | `{ entities: ('cartera'│'recaudo'│'documentos'│'ocupacion'│'estado_resultados')[], forceFullSync?: boolean }` |
| **Logic** | For each entity type: 1. Log sync start in `siesa_sync_log` (direction: 'pull', status: 'in_progress') 2. Connect to Siesa SQL Server via API key 3. Execute entity-specific query: a. **Cartera:** Pull all open receivables → UPSERT into `cartera` (match on `siesa_row_id`). Update `saldo`, `dias_mora`, `valor_vencido` b. **Recaudo:** Pull new payment records since last sync → match to `payments` by `siesa_docto`. INSERT new, UPDATE existing c. **Documentos:** Pull invoice documents → match to `invoices` by `siesa_documento`. Reconcile amounts d. **Ocupacion:** Pull tenant/unit/contract data → UPDATE `tenants`, `units`, `contracts` if changed e. **Estado de Resultados:** Pull P&L entries → UPSERT into `accounting_entries` 4. **Critical filter:** WHERE `co = '044'` (C-Krea only, exclude Raymond) 5. For each record: calculate diff, write to `siesa_sync_log` 6. On error: log error, continue with next record 7. Update `last_synced_at` on all affected records |
| **Output** | `{ entity, recordsProcessed, recordsInserted, recordsUpdated, recordsErrored, duration_ms }[]` |
| **Audit** | `SYNC` action on each modified entity in `audit_log` |
| **Roles** | admin (manual), system (cron) |

### 8.2 `POST /siesa/push` — Push Data to Siesa

| Field | Detail |
|---|---|
| **Edge Function** | `siesa-sync-push` |
| **Input** | `{ entityType: 'invoice'│'payment'│'credit_note', entityIds: UUID[] }` |
| **Logic** | 1. For each entity: a. Generate Siesa-compatible XML payload b. Map portal fields to Siesa fields (cuenta codes, tipo_cliente, etc.) c. POST to Siesa XML upload endpoint d. Log request/response in `siesa_sync_log` 2. On success: UPDATE sync status, mark entity as synced 3. On error: log error, set sync status to 'error', increment retry count |
| **Output** | `{ pushed: number, succeeded: number, failed: { entityId, error }[] }` |
| **Audit** | `SYNC` action |

### 8.3 `GET /siesa/status` — Sync Health

**Serves:** Sidebar sync indicator, Reconciliación report.

| Field | Detail |
|---|---|
| **Server Action** | `actions/siesa.ts → getSyncStatus()` |
| **Input** | None |
| **Logic** | Query `siesa_sync_log` for latest sync per entity type. Check for errors. |
| **Output** | `{ lastSync: Date, status: 'healthy'│'syncing'│'error', byEntity: { entity, lastSync, status, errorCount }[], pendingPushes: number }` |

### 8.4 `POST /siesa/retry` — Retry Failed Syncs

| Field | Detail |
|---|---|
| **Server Action** | `actions/siesa.ts → retryFailedSyncs()` |
| **Input** | `{ syncLogIds?: UUID[] }` (omit for all failed) |
| **Logic** | Re-process all `siesa_sync_log` entries with `status = 'error'` |
| **Output** | `{ retried: number, succeeded: number, stillFailed: number }` |
| **Roles** | admin |

### 8.5 `GET /siesa/reconciliation` — Reconciliation Report

| Field | Detail |
|---|---|
| **Server Action** | `actions/siesa.ts → getReconciliation()` |
| **Input** | `{ periodo: string }` |
| **Logic** | Compare portal invoices/payments against Siesa documents. Flag: matched (amounts agree), mismatched (amounts differ), portal-only (not in Siesa), siesa-only (not in portal). |
| **Output** | `{ matched: number, mismatched: { portalId, siesaRef, portalAmount, siesaAmount }[], portalOnly: InvoiceSummary[], siesaOnly: SiesaDoc[] }` |

---

## 9. Reports Domain

### 9.1 `GET /reportes/resumen-mensual` — Monthly Collection Summary

**Serves:** "Resumen Mensual de Recaudo" report card.

| Field | Detail |
|---|---|
| **Server Action** | `actions/reports.ts → getMonthlyCollectionSummary()` |
| **Input** | `{ periodo: string }` |
| **Logic** | Aggregate: total billed (sum invoices.total), total collected (sum payments.valor_final), outstanding (billed - collected), collection rate (%), by-concepto breakdown (canon vs gastos vs interest), comparison with projection (from `projections` table). |
| **Output** | `{ periodo, totalBilled, totalCollected, outstanding, collectionRate, byConcepto: { concepto, billed, collected }[], vsProjection: { projected, actual, variance, variancePct } }` |

### 9.2 `GET /reportes/aging` — Cartera Aging Report

**Serves:** "Aging de Cartera Vencida" report card.

| Field | Detail |
|---|---|
| **Server Action** | `actions/reports.ts → getAgingReport()` |
| **Input** | `{ asOfDate?: Date }` |
| **Logic** | Query `cartera` and bucket by `dias_mora`: Current (0), 1-30, 31-60, 61-90, 91-180, 180+. Sum `saldo` per bucket. List top 10 delinquent tenants. |
| **Output** | `{ asOfDate, buckets: { range, count, totalSaldo }[], totalOverdue, topDelinquent: { tenant_name, unit_number, dias_mora, saldo }[] }` |

### 9.3 `GET /reportes/descuentos-intereses` — Discounts & Interest Report

**Serves:** "Descuentos e Intereses del Período" report card.

| Field | Detail |
|---|---|
| **Server Action** | `actions/reports.ts → getDiscountsInterestReport()` |
| **Input** | `{ periodo: string }` |
| **Logic** | Aggregate: total phase discounts (sum invoice_line_items type 'descuento'), total PP applied (sum type 'pronto_pago'), total interest accrued (sum interest_accruals), total interest waived (where is_waived), net revenue impact. |
| **Output** | `{ periodo, phaseDiscounts, ppDiscounts, interestAccrued, interestWaived, netRevenueImpact, byTenant: { name, discounts, pp, interest }[] }` |

### 9.4 `GET /reportes/desempeno-inquilino` — Tenant Performance

**Serves:** "Desempeño por Inquilino" report card.

| Field | Detail |
|---|---|
| **Server Action** | `actions/reports.ts → getTenantPerformance()` |
| **Input** | `{ year?: number }` |
| **Logic** | For each active tenant: count on-time payments, late payments, average days to pay, total collected, PP utilization rate. Rank by composite score. |
| **Output** | `{ tenants: { name, unit, onTimeRate, avgDaysToPay, totalPaid, ppUtilization, ranking }[] }` |

### 9.5 `GET /reportes/gastos-compartidos` — Shared Expenses Report

**Serves:** "Gastos Compartidos del Mes" report card.

| Field | Detail |
|---|---|
| **Server Action** | `actions/reports.ts → getGastosReport()` |
| **Input** | `{ periodo: string }` |
| **Logic** | Aggregate gastos by category. Show allocation vs collection per category. Month-over-month comparison (current vs previous 3 months). |
| **Output** | `{ periodo, byCategory: { category, totalAmount, allocated, collected, collectionRate }[], monthOverMonth: { periodo, total }[], trend: 'up'│'down'│'stable' }` |

### 9.6 `POST /reportes/export` — Export Report to Excel/PDF

| Field | Detail |
|---|---|
| **Server Action** | `actions/reports.ts → exportReport()` |
| **Input** | `{ reportType: string, periodo: string, format: 'xlsx'│'pdf' }` |
| **Logic** | 1. Generate report data using the corresponding action above 2. For XLSX: use `exceljs` to build workbook with headers, formatting, formulas 3. For PDF: use server-side rendering (e.g., `@react-pdf/renderer`) 4. Return file as download |
| **Output** | Binary file (streamed) |
| **Roles** | admin, finance |

---

## 10. Dashboard Domain

### 10.1 `GET /dashboard` — Dashboard Data

**Serves:** `/` (Dashboard) page — all KPI cards, charts, and summary tables.

| Field | Detail |
|---|---|
| **Server Action** | `actions/dashboard.ts → getDashboardData()` |
| **Input** | `{ periodo?: string, projectFilter?: string, statusFilter?: string }` |
| **Logic** | Parallel queries (using `Promise.all`): 1. **Portafolio Total:** Sum `contracts.canon_base` WHERE `status = 'activo'`, count active tenants 2. **Total Recaudado:** Sum `payments.valor_final` WHERE `periodo` matches, calculate % of projection 3. **Pendiente:** Sum `cartera.saldo` WHERE unclassified 4. **Clientes en Mora:** Count tenants with `cartera.dias_mora > 0`, total tenants 5. **Desglose de Recaudo:** a. Cuotas Perdidas: sum invoices where `status = 'vencida'` b. Recargos: sum `interest_accruals.interest_amount` this period c. Prom. Días Mora: avg `cartera.dias_mora` d. Vencimiento Próx. Mes: sum of next month's projected invoices 6. **Rendimiento Chart:** Last 6 months: `{ month, recibido: sum(payments), proyectado: sum(projections) }` 7. **Precisión Proyección:** `sum(actual) / sum(projected) * 100` |
| **Output** | `DashboardData = { kpis: { portafolioTotal, totalRecaudado, recaudadoPct, pendiente, clientesMora, clientesTotal }, desglose: { cuotasPerdidas, cuotasPerdidasCount, recargos, promDiasMora, vencimientoProxMes }, rendimiento: { months: { month, recibido, proyectado, pctAchieved }[], promRecaudo, precision } }` |
| **Rules Triggered** | None (aggregation only) |

### 10.2 `GET /dashboard/mora-summary` — Mora KPIs

**Serves:** `/mora` page KPI cards.

| Field | Detail |
|---|---|
| **Server Action** | `actions/dashboard.ts → getMoraSummary()` |
| **Input** | None |
| **Logic** | 1. Total mora: sum `cartera.saldo` WHERE `dias_mora > 0` 2. Count tenants in mora 3. Average dias_mora 4. Breakdown by severity tier (Leve/Moderado/Crítico/Grave) |
| **Output** | `{ totalMora, clientesMora, promDias, byTier: { tier, count, amount }[] }` |

---

## 11. Users & Notifications Domain

### 11.1 `GET /usuarios` — List Users

| Field | Detail |
|---|---|
| **Server Action** | `actions/users.ts → listUsers()` |
| **Input** | `{ page?, pageSize? }` |
| **Logic** | Query `profiles` WHERE `company_id` matches. Return with last login from Supabase auth metadata. |
| **Output** | `{ users: { id, full_name, email, role, is_active, last_sign_in }[] }` |
| **Roles** | admin |

### 11.2 `POST /usuarios/invite` — Invite User

| Field | Detail |
|---|---|
| **Server Action** | `actions/users.ts → inviteUser()` |
| **Input** | `{ email: string, full_name: string, role: user_role }` |
| **Validation** | Zod: valid email, full_name required, role in enum |
| **Logic** | 1. Call `supabase.auth.admin.inviteUserByEmail()` 2. INSERT into `profiles` with the auth user ID 3. Send invite email (Supabase handles this) 4. Write audit log |
| **Output** | `{ user: Profile }` |
| **Audit** | `INSERT` on `profiles` |
| **Roles** | admin |

### 11.3 `PATCH /usuarios/[id]` — Update User Role/Status

| Field | Detail |
|---|---|
| **Server Action** | `actions/users.ts → updateUser()` |
| **Input** | `{ userId: UUID, role?: user_role, is_active?: boolean }` |
| **Validation** | Cannot deactivate yourself, cannot remove last admin |
| **Logic** | 1. Validate constraints 2. UPDATE `profiles` 3. If deactivated: revoke Supabase session 4. Write audit log |
| **Audit** | `UPDATE` on `profiles` |
| **Roles** | admin |

### 11.4 `GET /notificaciones` — List Notifications

| Field | Detail |
|---|---|
| **Server Action** | `actions/notifications.ts → listNotifications()` |
| **Input** | `{ unreadOnly?: boolean, limit?: number }` |
| **Logic** | Query `notifications` WHERE `user_id = current_user` or admin sees all for company. |
| **Output** | `{ notifications: Notification[], unreadCount: number }` |

### 11.5 `PATCH /notificaciones/[id]/read` — Mark Notification Read

| Field | Detail |
|---|---|
| **Server Action** | `actions/notifications.ts → markRead()` |
| **Input** | `{ notificationId: UUID }` |
| **Logic** | UPDATE `is_read = true` |

### 11.6 `POST /notificaciones/send-reminder` — Send Payment Reminder

| Field | Detail |
|---|---|
| **Server Action** | `actions/notifications.ts → sendPaymentReminder()` |
| **Input** | `{ tenantId: UUID, channel: 'email'│'sms'│'in_app', customMessage?: string }` |
| **Logic** | 1. Fetch tenant details + outstanding balance 2. Generate message from template (or use custom) 3. INSERT into `notifications` 4. Dispatch via channel (email: Supabase Edge Function, SMS: Twilio integration, in_app: direct insert) 5. UPDATE `notifications.sent_at` |
| **Output** | `{ notification: Notification, delivered: boolean }` |
| **Roles** | admin, finance |

---

## 11B. Reference Data Domain

These endpoints manage lookup/reference tables that don't fit neatly into a single domain.

### 11B.1 `GET /unidades` — List Units

| Field | Detail |
|---|---|
| **Server Action** | `actions/units.ts → listUnits()` |
| **Input** | `{ status?: unit_status, entrada?: string }` |
| **Logic** | Query `units` LEFT JOIN `contracts` LEFT JOIN `tenants`. Return all units with their current occupancy. |
| **Output** | `{ units: { id, unit_number, unit_code, entrada, clasificacion, status, area_m2, tenant_name?, contract_id? }[] }` |
| **Roles** | Any |

### 11B.2 `PATCH /unidades/[id]` — Update Unit

| Field | Detail |
|---|---|
| **Server Action** | `actions/units.ts → updateUnit()` |
| **Input** | `{ unitId: UUID, area_m2?, clasificacion?, has_electricity_meter?, notes? }` |
| **Logic** | UPDATE unit, write audit log |
| **Audit** | `UPDATE` on `units` |
| **Roles** | admin |

### 11B.3 `GET /gasto-types` — List Gasto Types

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → listGastoTypes()` |
| **Input** | None |
| **Logic** | Query `gasto_types` WHERE `company_id` matches |
| **Output** | `{ gastoTypes: GastoType[] }` |
| **Roles** | Any |

### 11B.4 `POST /gasto-types` — Create Gasto Type

| Field | Detail |
|---|---|
| **Server Action** | `actions/gastos.ts → createGastoType()` |
| **Input** | `{ category: gasto_category, name: string, description?, allocation_method: gasto_allocation_method, is_billable?: boolean, siesa_cuenta?: string }` |
| **Validation** | Zod: name unique within company, category in enum |
| **Logic** | INSERT into `gasto_types`, write audit log |
| **Audit** | `INSERT` on `gasto_types` |
| **Roles** | admin |

### 11B.5 `GET /proyecciones` — List Projections

| Field | Detail |
|---|---|
| **Server Action** | `actions/projections.ts → listProjections()` |
| **Input** | `{ year: number, month?: number, unitId?: UUID }` |
| **Logic** | Query `projections` JOIN `units` JOIN `contracts`. Filter by year, optional month and unit. |
| **Output** | `{ projections: { unit_number, tenant_name, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado }[] }` |
| **Roles** | Any |

### 11B.6 `POST /proyecciones/regenerate` — Regenerate Projections

| Field | Detail |
|---|---|
| **Server Action** | `actions/projections.ts → regenerateProjections()` |
| **Input** | `{ year: number, contractId?: UUID }` |
| **Validation** | Year must be current or future |
| **Logic** | For each active contract (or specific contract): re-run the Master Invoice Calculation Chain for each month of the year. UPSERT into `projections`. This accounts for IPC dates, phase transitions, and current financial rules. |
| **Rules Triggered** | Rules A, B, IPC |
| **Audit** | `UPDATE` on `projections` |
| **Roles** | admin, finance |

### 11B.7 `GET /contabilidad` — Accounting Entries (P&L)

| Field | Detail |
|---|---|
| **Server Action** | `actions/accounting.ts → listAccountingEntries()` |
| **Input** | `{ periodo: string, cuenta?: string, ccosto?: string }` |
| **Logic** | Query `accounting_entries` filtered by periodo. Optionally filter by cuenta (account code) or ccosto (cost center). |
| **Output** | `{ entries: AccountingEntry[], totalValor: number }` |
| **Roles** | admin, finance |

---

## 12. Financial Rules Engine Domain

### 12.1 `GET /reglas` — List Financial Rules

| Field | Detail |
|---|---|
| **Server Action** | `actions/rules.ts → listRules()` |
| **Input** | None |
| **Logic** | Query `financial_rules` WHERE `company_id` matches and `effective_until IS NULL` (currently active). |
| **Output** | `{ rules: FinancialRule[] }` |

### 12.2 `PATCH /reglas/[id]` — Update Financial Rule

| Field | Detail |
|---|---|
| **Server Action** | `actions/rules.ts → updateRule()` |
| **Input** | `{ ruleId: UUID, newValue: number, effectiveFrom: Date, reason: string }` |
| **Validation** | Zod: reason required min 10 chars, effectiveFrom ≥ today |
| **Logic** | 1. SET `effective_until = effectiveFrom - 1 day` on current rule 2. INSERT new rule row with `effective_from = effectiveFrom` 3. This preserves history — old values remain queryable for audit 4. Write audit log |
| **Output** | `{ rule: FinancialRule }` |
| **Audit** | `OVERRIDE` on `financial_rules` with reason |
| **Roles** | admin |

### 12.3 `POST /reglas/simulate` — Simulate Rule Change Impact

| Field | Detail |
|---|---|
| **Server Action** | `actions/rules.ts → simulateRuleChange()` |
| **Input** | `{ ruleKey: string, newValue: number, periodo: string }` |
| **Logic** | Re-run projections for all active contracts using the hypothetical rule value. Compare with current projections to show revenue impact. |
| **Output** | `{ currentProjection, newProjection, difference, affectedContracts: number, perTenantImpact: { name, currentAmount, newAmount, diff }[] }` |
| **Rules Triggered** | Rules A-D (simulation mode) |

---

## 13. Cron / Scheduled Jobs

### 13.1 Daily Interest Accrual

| Field | Detail |
|---|---|
| **Edge Function** | `accrue-interest` |
| **Schedule** | Daily at 01:00 COT (06:00 UTC) |
| **Logic** | See §7.1 above |
| **Notifications** | If any invoice crosses 30/60/90/180 day thresholds → insert notification for admin |

### 13.2 Nightly Siesa Sync

| Field | Detail |
|---|---|
| **Edge Function** | `siesa-sync-nightly` |
| **Schedule** | Daily at 02:00 COT (07:00 UTC) |
| **Logic** | 1. Pull: cartera, recaudo, documentos (in that order) 2. Reconcile pulled data against portal state 3. Push: any pending invoices/payments queued for Siesa 4. Report results via notification to admin |
| **Error Handling** | On failure: retry up to 3 times with exponential backoff. If still failing → send error notification, set sync status indicator to red. |

### 13.3 Monthly Invoice Generation Reminder

| Field | Detail |
|---|---|
| **Edge Function** | `invoice-generation-reminder` |
| **Schedule** | 1st, 11th, 21st of each month at 07:00 COT |
| **Logic** | Check if invoices for the current billing group (UNO/ONCE/VEINTIUNO) have been generated. If not → notify admin. |

### 13.4 Overdue Invoice Status Updater

| Field | Detail |
|---|---|
| **Edge Function** | `update-overdue-status` |
| **Schedule** | Daily at 00:30 COT |
| **Logic** | Query all invoices WHERE `status = 'emitida'` AND `fecha_vencimiento < today`. UPDATE `status` → 'vencida'. This keeps the status field current for dashboard queries. |

---

## 14. Error Handling & Audit Conventions

### 14.1 Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed Zod validation |
| `NOT_FOUND` | 404 | Entity not found (or RLS filtered it) |
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | User role cannot perform this action |
| `CONFLICT` | 409 | Business rule violation (e.g., duplicate NIT, payment exceeds balance) |
| `SIESA_SYNC_ERROR` | 502 | Siesa connection or data error |
| `CALCULATION_ERROR` | 500 | Financial calculation produced unexpected result |

### 14.2 Audit Trail Rules

1. **Every mutation** to financial data (invoices, payments, interest, gastos) writes an audit log entry.
2. **OVERRIDE and WAIVE actions** require a `reason` field — the server action rejects the call if reason is missing or under 10 characters.
3. **Siesa sync operations** log both the request payload (XML) and response in `siesa_sync_log` for full traceability.
4. **Audit log is immutable** — no UPDATE or DELETE policies exist on `audit_log`. Only INSERT is allowed.
5. **User identification** — every audit entry captures `user_id` from the session. Cron jobs use a system service account.

### 14.3 Optimistic Locking

For concurrent edits on critical records (invoices, payments), use `updated_at` as an optimistic lock:
- Client sends `{ ..., expectedUpdatedAt: timestamp }`
- Server checks `WHERE id = :id AND updated_at = :expectedUpdatedAt`
- If 0 rows updated → return `CONFLICT` with current server values

---

## 15. API Route Index (Quick Reference)

### Auth
| Method | Route | Action | Roles |
|---|---|---|---|
| POST | `/auth/login` | Sign in | Public |
| POST | `/auth/logout` | Sign out | Any |
| GET | `/auth/me` | Current user profile | Any |
| POST | `/auth/change-password` | Change password | Any |

### Tenants & Contracts
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/clientes` | List tenants | Any |
| GET | `/clientes/search` | Quick search | Any |
| GET | `/clientes/[id]` | Tenant detail | Any |
| POST | `/clientes` | Create tenant | admin, finance |
| PATCH | `/clientes/[id]` | Update tenant | admin, finance |
| POST | `/contratos` | Create contract | admin |
| PATCH | `/contratos/[id]` | Update contract | admin |
| POST | `/contratos/[id]/terminate` | Terminate contract | admin |

### Invoices
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/facturas` | List invoices | Any |
| GET | `/facturas/[id]` | Invoice detail | Any |
| POST | `/facturas/generate` | Generate monthly batch | admin, finance |
| POST | `/facturas/[id]/void` | Void invoice | admin |
| POST | `/facturas/[id]/recalculate` | Recalculate invoice | admin |

### Payments
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/pagos` | List payments | Any |
| GET | `/pagos/[id]` | Payment detail | Any |
| POST | `/pagos` | Record payment | admin, finance |
| POST | `/pagos/preview` | Preview payment | admin, finance |
| POST | `/pagos/[id]/void` | Void payment | admin |
| POST | `/pagos/[id]/apply` | Manual apply | admin, finance |

### Gastos
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/gastos` | List gastos | Any |
| GET | `/gastos/allocations` | Allocation table | Any |
| POST | `/gastos` | Create gasto | admin, finance |
| PATCH | `/gastos/[id]` | Update gasto | admin, finance |
| POST | `/gastos/[id]/allocate` | Distribute to tenants | admin, finance |
| POST | `/gastos/allocations/preview` | Preview allocation | admin, finance |

### Interest
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/intereses/summary` | Interest summary | Any |
| POST | `/intereses/accrue` | Daily accrual (batch) | admin, system |
| POST | `/intereses/waive` | Waive interest | admin |

### Siesa Sync
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/siesa/status` | Sync health | Any |
| GET | `/siesa/reconciliation` | Reconciliation report | admin, finance |
| POST | `/siesa/pull` | Pull from Siesa | admin, system |
| POST | `/siesa/push` | Push to Siesa | admin, system |
| POST | `/siesa/retry` | Retry failed syncs | admin |

### Reports
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/reportes/resumen-mensual` | Monthly collection | admin, finance |
| GET | `/reportes/aging` | Cartera aging | admin, finance |
| GET | `/reportes/descuentos-intereses` | Discounts & interest | admin, finance |
| GET | `/reportes/desempeno-inquilino` | Tenant performance | admin, finance |
| GET | `/reportes/gastos-compartidos` | Shared expenses | admin, finance |
| POST | `/reportes/export` | Export to file | admin, finance |

### Dashboard
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/dashboard` | Main dashboard data | Any |
| GET | `/dashboard/mora-summary` | Mora KPIs | Any |

### Users & Notifications
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/usuarios` | List users | admin |
| POST | `/usuarios/invite` | Invite user | admin |
| PATCH | `/usuarios/[id]` | Update user | admin |
| GET | `/notificaciones` | List notifications | Any |
| PATCH | `/notificaciones/[id]/read` | Mark read | Any |
| POST | `/notificaciones/send-reminder` | Send reminder | admin, finance |

### Reference Data
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/unidades` | List units | Any |
| PATCH | `/unidades/[id]` | Update unit | admin |
| GET | `/gasto-types` | List gasto types | Any |
| POST | `/gasto-types` | Create gasto type | admin |
| GET | `/proyecciones` | List projections | Any |
| POST | `/proyecciones/regenerate` | Regenerate projections | admin, finance |
| GET | `/contabilidad` | P&L entries | admin, finance |

### Financial Rules
| Method | Route | Action | Roles |
|---|---|---|---|
| GET | `/reglas` | List active rules | admin |
| PATCH | `/reglas/[id]` | Update rule | admin |
| POST | `/reglas/simulate` | Simulate change | admin |

### Edge Functions (Cron)
| Function | Schedule | Purpose |
|---|---|---|
| `accrue-interest` | Daily 01:00 COT | Rule C daily interest |
| `siesa-sync-nightly` | Daily 02:00 COT | Bidirectional Siesa sync |
| `invoice-generation-reminder` | 1st/11th/21st 07:00 COT | Alert admin if invoices not generated |
| `update-overdue-status` | Daily 00:30 COT | Flip emitida → vencida on past-due invoices |

---

*This document fully bridges the database schema (Step 1), Financial Rules Engine (Step 3), and UI screens (Step 4). Every screen action traces to an API endpoint, every financial calculation traces to a rule, and every mutation traces to an audit log entry.*
