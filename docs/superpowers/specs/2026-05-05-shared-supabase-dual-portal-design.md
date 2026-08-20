# Design: Shared Supabase — Dual Portal Architecture

**Date:** 2026-05-05
**Author:** German Burgos
**Status:** Approved

---

## Problem

Two separate business portals exist:
- **Portal C-Krea** — rental payment control for ~85 units in Central Kreativa (secrea.com.co)
- **Portal Cartera** — accounts receivable dashboard for Manufacturas Reymon manufacturing clients

Both portals read from the same SIESA ERP data source. Currently they live in separate Supabase projects, which means the ERP push infrastructure is duplicated and raw data maintenance must be done twice.

---

## Decision

**Share one Supabase project. Keep two separate Next.js frontends.**

---

## Architecture

### Database — One Supabase Project (existing C-Krea project)

Three schemas, each with a clear owner:

| Schema | Owner | Purpose |
|---|---|---|
| `siesa_raw` | Shared | ERP pushes all zones here — single source of truth |
| `v2` | C-Krea only | C-Krea calculations and display layer (unchanged) |
| `cartera` | Reymon only | New schema for Cartera calculations and display layer |

### Zone filtering

The ERP team reports they already push all zones to `siesa_raw` with no filter. **First implementation step: verify this** by querying `siesa_raw` for zones other than Z40.

If confirmed:
- C-Krea queries already filter `WHERE id_zona = 'Z40'` — no change needed
- Cartera queries filter `WHERE id_zona != 'Z40'` — reads all non-C-Krea data

If NOT confirmed (ERP is still filtering to Z40 only):
- Request ERP team remove zone filter from their push config
- No code changes needed on either portal — just a config change on the ERP side

### Access control

Each portal gets its own Supabase service key with RLS policies scoped to its schema:
- Portal C-Krea key: read/write access to `siesa_raw` (read) + `v2` (read/write). No access to `cartera`.
- Portal Cartera key: read/write access to `siesa_raw` (read) + `cartera` (read/write). No access to `v2`.

All tables have RLS enabled (existing convention, enforced for new `cartera` schema too).

---

### Frontend — Two Independent Next.js Repos

| | Portal C-Krea | Portal Cartera |
|---|---|---|
| Repo | `/Portal Ckrea` (existing, unchanged) | `/Portal Cartera` (existing, rebuild) |
| Domain | `ckrea.com.co` | `cartera.vercel.app` (custom domain optional later) |
| Vercel project | Existing | Existing or new |
| Users | Tenant admins + tenants | AR leader (Reymon, single user) |
| Auth | Supabase Auth (existing) | Supabase Auth — same project, separate role |
| DB schema | `v2` | `cartera` |

No monorepo. No shared component packages. The two apps are independent products for different users — coupling them adds complexity with no benefit.

---

## What Changes

| System | Change |
|---|---|
| Supabase | Add `cartera` schema to existing C-Krea Supabase project |
| Supabase | Create restricted service key scoped to `cartera` + `siesa_raw` for Cartera portal |
| Supabase | Verify `siesa_raw` already has all zones (or request ERP config change) |
| Portal Cartera `.env.local` | Point to C-Krea Supabase URL + new restricted key |
| Portal C-Krea | Nothing — zero changes |

---

## What Does NOT Change

- Portal C-Krea codebase, domain, Vercel project, schemas — untouched
- ERP push mechanism (assuming all-zones already confirmed)
- `siesa_raw` schema structure — read-only, never modified by portals

---

## Out of Scope

- Shared login / portal switcher UI — users are completely separate, no overlap
- Monorepo / shared component library — overkill for two different products
- Custom domain for Cartera (can be added later independently)
- Commission calculations, CRM, bank imports (Cartera Phase 2+)
