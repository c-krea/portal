# Changelog — C-Krea PayControl

## [Unreleased]

### Session 61 — 2026-06-09/10: Electricity flow overhaul

#### Portal del inquilino (medidor)
- **Photo uploads no longer crash:** photos are shrunk in the browser (2400px JPEG) before upload — iPhone HEIC converted automatically, any phone photo now ~1 MB. Server limit raised 5→10 MB as safety net.
- **Friendly error screen:** portal failures now show a Spanish "Algo salió mal / Reintentar" card (reported to Sentry) instead of the generic "Application error".
- **Readings trusted as submitted:** no auto-classification or "se revisará con urgencia" messages; simple confirmation. Submit disabled until all 5 digits entered (prevents zero-reading lockout).
- **"Total estimado energía" → "Valor a pagar".**
- **Correct billing month:** the day-9 reading is stored under the month it measures (previous month), computed server-side. Pending energy charges no longer disappear from the dashboard on days 1–8.

#### Admin (medidores)
- **"Alerta" column:** only two visual tags — "Sin lectura" (gray) and "⚠ Revisar" (amber, >40% off 3-month average or 0 kWh). No more Crítico/Pendiente/Aprobado badges.
- **Photo viewer fixed:** "Ver" now opens meter photos (was silently failing).
- **Pages default to the measurement month** (previous month), matching where day-9 readings actually live.

#### Data (May 2026 reconciliation)
- May billing reconciled against admin Excel: 74 readings, 65 billed, $13,696,150 — verified peso-for-peso. Test/duplicate rows removed, 3 missing locals loaded, vacant locals zeroed (meter baselines kept).

### Session 60 — 2026-06-05: Clear "link expired" message on password-setup screen

#### Auth (`/auth/confirm`)
- **Expired/used links no longer fail silently:** when a password-setup or reset link is dead (already used, or superseded by a newer link), the screen now shows a clear message — *"El enlace expiró o ya fue usado. Por seguridad cada enlace funciona una sola vez. Solicita uno nuevo abajo."* — instead of silently bouncing to the login page (which looked like "password creation failed").
- **"Solicitar nuevo enlace" button:** all error cases now show a full-width button to request a fresh link, styled to match the login screen. Working links are unaffected.

#### Pagos / cartera vencida (`v2.vista_pagos`) — 2026-06-08
- **Partial & installment payments no longer dropped:** the payments view de-duplicated on `(tenant + invoice + day)`, which silently discarded a *second* real payment made against the same invoice on the same day. Re-keyed the de-dup to the ERP's unique movement id (`row_id_mov`). Restored **54 real payments = $ 66.137.912** across all history (verified: 0 true duplicates, 0 reversals, 0 new duplicate rows).
- **Flagged by admin** for Renato Fajardo ($ 295.500) + Galindo Polidoro ($ 2.800.000); 3 more were also being hidden (Arriero $ 2.000.000, Patarroyo $ 1.062.062, Rebelarte $ 178.800). Overdue-payment totals now match Siesa.

### Session 55 — 2026-05-14: Tenant email auto-creates auth account + security hardening

#### Tenant login setup (`/usuarios`)
- **Email saves = account created:** setting a tenant's email in the edit modal now automatically creates their Supabase Auth account and links it to their unit. No separate "Create Account" step needed for new tenants.
- **Both email paths unified:** `updatePortalEmail` and `updateTenantInquilino` now behave identically — both auto-create if no account exists, both sync `v2.perfiles.email` on update.
- **Sync order fixed:** on email change for existing accounts, `v2.perfiles` updates before `auth.users` — prevents split-brain if the second write fails.
- **Orphan cleanup:** if perfil insert fails after auth user creation, the orphaned auth account is deleted automatically so the tenant can be retried cleanly.

#### Security
- **Auth guard on all server actions in `/usuarios`:** all 5 actions now verify the caller's session and role before executing. An inquilino-role user can no longer escalate privileges via direct POST.
- **`assertUuid` on `empresaId`:** DB-sourced UUID now validated before interpolation in all affected actions.
- **`sqlStr()` on `rol` field:** was interpolated raw in `updateAdminUser`; now escaped consistently.

### Session 54 — 2026-05-12: Electricity billing overhaul

#### Facturas de Energía form (`/medidores/facturas`)
- **Tarifa input replaces kWh input:** admin now enters tarifa ($/kWh) directly; kWh edificio = valor ÷ tarifa computed automatically and shown read-only. Prevents the wrong-field entry that inflated charges 16×.
- **Cascade on save:** saving a tarifa triggers `UPDATE lecturas_medidor` for all units in that building group for the same period.

#### Electricity total calculation
- **MROUND(50) everywhere:** changed from `Math.round(×250)` to `Math.round(×50)` matching Excel formula `=MROUND(kwh×tarifa,50)`. Applied in admin registration, portal submission, and tarifa cascade SQL.
- **Decimal precision on lectura_actual:** `step="1"` → `step="0.1"` — integer-only input was silently dropping meter reading decimals, causing kWh errors up to 0.8 kWh/unit.

#### Data fixes (April 2026)
- **84 April readings bulk-loaded** from `history of energy usage.xlsx` with correct decimal anterior/actual values.
- **Jan/Feb/Mar decimal corrections:** all 84 units corrected from `energia historico.xlsx`; 81/81 units clean per period.
- **CRA2710065 tarifa corrected:** 805.95 → 805.49 (cross-verified vs billing Excel). Cascaded to 32 units.
- **Unit 126 grupo_energia:** NULL → CRA2710065.
- **Cross-verification:** 82/84 April units match billing Excel exactly. Open: unit 111 and 506B pending admin clarification.

### Session 53 — 2026-05-11: Admin meter reading — unblock + photo upload

#### Admin manual reading form (`/medidores`)
- **Fixed critical save failure:** `tarifa_kwh` and `total_energia` were sent as `null` when no electricity invoice exists yet — DB NOT NULL constraint rejected every insert. Now defaults to `0`; re-register after entering the invoice to populate cost.
- **Fixed wrong kWh calculation:** previous reading lookup was hardcoded to calendar-prior month (April — zero readings). Now falls back to the most recent available period (March 2026). Label shows the actual period used.
- **Fixed duplicate form field:** readonly `lecturaAnterior` input had `name` attribute alongside a hidden fallback input — ambiguous FormData. Cleaned to single hidden input.
- **Photo upload added:** admin can now attach a meter photo when registering a reading manually. Stored in R2 (`medidores/YYYY-MM/local-{unit}-{ts}.jpg`).
- **Direct camera capture:** "Tomar foto" button opens rear camera immediately on mobile; "Adjuntar foto" opens gallery/file picker. Both feed the same upload.
- **Audit trail:** `submitted_by` now set to the authenticated admin's user ID on every admin-entered reading.

### Session 52 — 2026-05-05: Medidores Excel export + ERP electricity auto-fill

#### Medidores — Excel Export
- New "Exportar Excel" button on `/medidores` page, inline with year/month filters
- Downloads single-period `.xlsx` with two sheets: Facturas Energía + Consumo por Local
- Facturas sheet: 6 rows (one per address group) with dirección, proveedor, fecha, valor, kWh, tarifa + totals row
- Consumo sheet: all metered units with tenant name, address, lec. anterior/actual, kWh, total COP + totals row

#### Medidores — ERP Auto-fill
- `valor_factura` for all 6 electricity groups now auto-populated from Siesa — no manual entry needed for the peso amount
- Matched by contract number pattern in ERP `notas` field (6 contracts, one per address group)
- `kwh_factura` computed from sum of tenant meter readings for that address group and period
- `fecha_factura` shown as YYYY/MM (billing period from ERP — no exact day stored)
- Blue "ERP" badge in Facturas de Energía form on auto-filled rows
- Address labels updated to match ERP text exactly (e.g. "CARRERA 27 #10-65")
- Admin-saved records always take priority over ERP fallback

### Session 51 — 2026-05-04: Portal Inquilino — PP, Medidor multi-local, Wompi, Usuarios

#### Portal Inquilino — Pronto Pago
- "Total a Pagar" muestra saldo con descuento PP incluido días 1–10, por factura del periodo actual
- Badge PP% + monto ahorrado (−$X) alineado a la derecha del grand total
- Cartera breakdown: lista de facturas siempre visible, sub-detalle (arrend/IVA/ret) colapsable por fila
- PP −$X visible inline en cada fila junto a "Al día/Vencida"

#### Portal Inquilino — Wompi
- Modal "Pagar en línea" rediseñado: selector de locales compacto (solo números), dos filas copiables (NIT/cédula + total)
- Referencia siempre es NIT (PJ) o cédula (PN) — nunca número de local
- Saldos en modal incluyen descuento PP cuando aplica
- Modal permanece abierto al hacer clic en "Ir a pagar"
- "Incluye PP X% · Válido hasta DD/MM" cuando PP activo

#### Portal Inquilino — Medidor multi-local
- Página de medidor activada (era "Próximamente")
- Tabs por local para inquilinos con múltiples unidades; ✅ en tab si ya enviaron ese mes
- Server action valida que `localId` pertenece al tenant (seguridad)
- Nueva función `getPortalMedidorRef` en portal.ts (lectura anterior + tarifa + submitted flag)

#### Admin — Usuarios
- Edit modal simplificado: solo email y teléfono editables; razón social, NIT y contratos bloqueados (vienen del ERP)
- Email único para email_contacto + portal_email + auth.users simultáneamente

#### Admin — Locales ficha cliente
- KPI "Saldo Total" muestra saldo con PP en días 1–10, por unidad con tasa propia del contrato

#### DB
- Cuenta inquilino.test@ckrea.co transferida a Rebelarte Comunicacion Visual SAS (3 locales)
- `v2.inquilinos.tipo_persona` expuesto en PortalProfile para diferenciar NIT/cédula en Wompi

### Session 50 — 2026-05-04: PWA + Push Notifications

#### PWA — installable app
- Web app manifest (`public/manifest.json`) with full field set: id, scope, display_override, dir, lang, categories, launch_handler, shortcuts, scope_extensions, prefer_related_applications
- Service worker (`public/sw.js`): cache-first for static assets, network-only for data, offline block page
- Offline detector component: full-screen overlay fires instantly on connection loss — prevents stale payment data from being read
- `proxy.ts` public-route allowlist updated to pass manifest.json, sw.js, icons/ without auth

#### Icons — cross-platform
- Root cause found: `ckrea-logo.png` has opaque white pixels — fixed by stripping near-white (R,G,B > 220) before compositing on dark background
- Generated: apple-touch-icon 180×180 (iOS), icon-192, icon-512, maskable-512, favicon-32, favicon-16
- All icons: dark slate-900 background, circular mask with transparent corners for browser tab
- Safe area insets added to MobileNav, sidebar, and portal header — fixes iPhone status bar overlap in PWA mode

#### Push notifications infrastructure
- VAPID keys generated; `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` added to Vercel env
- `v2.push_subscriptions` table with RLS
- `POST/DELETE /api/push` — save/remove subscriptions per authenticated user
- `lib/push.ts` — `sendPushToUser()` and `sendPushToAll()` server actions
- `NotificationToggle` component: fully wired subscribe/unsubscribe with loading state
- Profile dropdown in sidebar (replaces logout button): user icon → dropdown with notification toggle + red logout

#### Notification cron (`/api/cron/notifications`, 8am COT daily)
- `v2.push_notification_log` table — unique constraint on (user_id, type, reference_id) prevents duplicate sends
- 7 notification types for clients:
  - Payment due in 3 days (once per invoice via factura key)
  - Payment due today (once per invoice)
  - First overdue — fires on financia = 31, first day past grace period (once per invoice)
  - Mora escalation — Mondays only, once per week per user
  - Lease expiring — exactly 60 and 30 days before fecha_fin
  - Meter reading reminder — day 7 of month if no reading submitted for current period
  - Payment confirmed — yesterday's `vista_pagos` payments, once per docto+cruce

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
