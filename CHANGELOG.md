# Changelog — C-Krea PayControl

## [Unreleased]

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
