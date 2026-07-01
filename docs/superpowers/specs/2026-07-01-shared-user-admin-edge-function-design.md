# Shared User-Admin Edge Function — Design

**Date:** 2026-07-01
**Status:** Approved design, pending implementation plan
**Owner:** German (Reymon / C-Krea)
**Context:** One shared Supabase project (`bosylehvmtwtqkrlievy`) hosts many apps as separate schemas
(`v2`/C-Krea, `rutas`, `satelites`, `ric_systems`, `siesa_raw`, plus future apps). All apps share **one**
`auth.users` login list. This spec defines a single, secure, reusable way for apps to create their own logins
without ever holding the master key and without waiting on a human.

---

## 1. Goal

Let each app self-serve login creation, safely, in the shared database:

- An app's designated **Lead** can create new logins for their own app on demand.
- No app ever holds the Supabase **service_role** ("master") key.
- Every creation is tied to a named human and permanently logged.
- One function serves **all** apps and never changes when a new app joins.
- German seeds one Lead per app once, then steps back.

## 2. Non-goals (explicitly out of scope — YAGNI)

- **No app-permission handling.** The function creates the raw login only. Each app writes its own
  role/permission rows in its own schema (chosen "Option A" — login-only). Apps differ in their permission
  models (e.g. RIC keys permissions by email); the function stays ignorant of all of them.
- **No email/invitations.** Logins are created pre-confirmed; no activation email is sent.
- **No password resets for others.** A user changing *their own* password is the app's normal self-service and
  needs nothing from this function.
- **No UI.** Each app builds its own "Create user" button that calls the function.
- **No Minter tier.** Only one role exists: **Lead**. Anyone needing a login who is not a Lead asks a Lead.

## 3. Roles

Exactly one power tier, tracked per app:

| Role | Create logins | Manage the app's Lead list |
|------|---------------|-----------------------------|
| **Lead** | ✅ | ✅ (add / remove other Leads) |
| Everyone else | ❌ | ❌ |

- "3 admins can all create" = 3 Leads. "Only 1 can" = 1 Lead. Flexibility comes from the list contents.
- A Lead can add/remove Leads **only for their own app**.

## 4. Components

Everything lives in a dedicated schema **`user_admin`** (respects the multi-app isolation rule: never pollute
`public` or another app's schema).

### 4.1 `user_admin.apps` — known apps (typo guard)
| column | type | notes |
|--------|------|-------|
| `app_key` | text PK | short stable id, e.g. `ric`, `ckrea`, `herapp` |
| `name` | text | human label |
| `created_at` | timestamptz | default now() |

### 4.2 `user_admin.leads` — the control list
| column | type | notes |
|--------|------|-------|
| `id` | uuid PK | default gen_random_uuid() |
| `app_key` | text | FK → `user_admin.apps.app_key` |
| `user_id` | uuid | the Lead; references `auth.users.id` |
| `created_by` | uuid | who added them (null for the seed Lead) |
| `created_at` | timestamptz | default now() |
| | | **unique(`app_key`, `user_id`)** |

Presence of a row = full Lead power for that app. No boolean flags — on the list means create + manage.

### 4.3 `user_admin.audit_log` — write-once history
| column | type | notes |
|--------|------|-------|
| `id` | bigint identity PK | |
| `action` | text | `create_login` \| `add_lead` \| `remove_lead` |
| `app_key` | text | |
| `actor_user_id` | uuid | who performed it |
| `target_user_id` | uuid | login created / lead added/removed |
| `target_email` | text | |
| `detail` | jsonb | optional extra |
| `created_at` | timestamptz | default now() |

### 4.4 `user-admin` Edge Function — the one guarded door
Deno Edge Function. Holds the master key **internally only** (Supabase injects `SUPABASE_SERVICE_ROLE_KEY` as
an env var; it is never returned to any caller). Deployed with `verify_jwt = true` so anonymous calls are
rejected before our code even runs.

## 5. Authorization model (Model B — badge + list)

Every request carries the **caller's own login token** (JWT) in the `Authorization` header — a short-lived,
personal credential that is safe to send even from a plain webpage. It is NOT the master key.

The function, on every request:
1. Verify the JWT → resolve the **actor's** `user_id`. Invalid/expired → `401`.
2. Read `action` + `app_key` + payload from the body.
3. Check `user_admin.leads` for a row `(app_key, actor_user_id)`. Missing → `403` ("not a Lead for this app").
4. Perform the action, write `audit_log`, return a JSON result.

A caller can only ever act on the `app_key` they are a Lead for — passing another app's key fails the step-3
check. Scope is automatic; no app can reach into another.

## 6. Actions & flows

### 6.1 `create_login`
Input: `{ app_key, email, password, user_metadata? }`
- Gate: actor is a Lead for `app_key`.
- Create the login via the Admin API: `createUser({ email, password, email_confirm: true })` → pre-confirmed,
  no email sent.
- **Trigger-safety:** do NOT set `raw_user_meta_data.app` to `ckrea` or `rutas` (those values fire the existing
  `on_auth_user_created_v2` / `on_auth_user_created_rutas` triggers and would create a profile in those apps).
  Keep user metadata minimal / neutral so no cross-app profile is created.
- On duplicate email (global uniqueness): return `409` "That email is already in use." No partial writes.
- Log `create_login`. Return `{ user_id, email }`.
- The calling app then writes its own permission row for that email/user in its own schema.

### 6.2 `add_lead`
Input: `{ app_key, target_email | target_user_id }`
- Gate: actor is a Lead for `app_key`.
- Resolve target to an existing `auth.users.id` (must already have a login; if not, Lead runs `create_login`
  first). Insert into `user_admin.leads`. Log `add_lead`.

### 6.3 `remove_lead`
Input: `{ app_key, target_user_id }`
- Gate: actor is a Lead for `app_key`.
- Delete the row. Safeguard: refuse to remove the **last** Lead of an app (avoid orphaning it). Log `remove_lead`.

### 6.4 `list_leads` (read)
Input: `{ app_key }` — Gate: actor is a Lead for `app_key`. Returns that app's Leads. (Full `audit_log` stays
German-only, queried via MCP.)

## 7. Edge cases & safety

- **Email already taken:** clear `409`, nothing created.
- **Password policy:** enforce a minimum length (e.g. ≥ 8 chars) in the function.
- **Rate cap:** soft limit of N `create_login` per actor per minute (e.g. 20) via a recent-`audit_log` count;
  over → `429`. Invisible in normal use; a seatbelt against runaway loops.
- **Scope:** enforced by the leads-list check on every action (Section 5).
- **Master key:** exists only inside the function; never in any app, webpage, or response.

## 8. Security posture

- `user_admin.leads`, `audit_log`, `apps`: **RLS enabled, no anon/authenticated policies** → only the function
  (service_role) reads/writes them. (Avoids the RLS-disabled exposure seen in `ric_systems`.)
- `verify_jwt = true` on the function.
- Complies with C-Krea multi-app isolation rules: dedicated `user_admin` schema; no reads/writes to other apps'
  schemas; no reliance on other apps' triggers; service_role never leaves the server side.

## 9. Bootstrap — German's one manual step per app

Once per app, done by German via MCP/SQL (same method used to create Sergio for RIC):
1. Ensure a row in `user_admin.apps` for the app.
2. Create the first Lead's login by hand (pre-confirmed).
3. Insert `(app_key, that user_id)` into `user_admin.leads`.

From then on that Lead self-serves: creates users, promotes/removes other Leads, all via the function. German
only revisits to read history.

## 10. Open questions for the implementation plan

1. Final `app_key` naming + the initial `apps` rows.
2. Password minimum length + any complexity rule.
3. Rate-cap threshold.
4. Confirm "refuse to remove last Lead" safeguard is wanted.
5. Whether Leads may read `list_leads` only, or also a scoped slice of their app's `audit_log`.
6. Network detail: apps call the function URL with the user's JWT; confirm each app's front-end can attach it.

---

## 11. Red-team resolutions (2026-07-01) — supersede conflicting text above

Verified against the live DB. Only two triggers exist on `auth.users`: `on_auth_user_created_v2`
(fires on metadata `app='ckrea'`) and `on_auth_user_created_rutas` (`app='rutas'`). RIC has no trigger
(links by email). Email is globally unique (`users_email_partial_key`). `user_admin` schema does not exist yet.

1. **App-stamp instead of neutral metadata (supersedes §6.1 "keep metadata neutral").**
   `create_login` sets `raw_user_meta_data.app = <app_key>` — the caller's *validated* app. This lets each
   app's existing auto-profile trigger run (C-Krea, Rutas) and is a no-op for trigger-less apps (RIC). It is
   safe because the actor is already proven a Lead for that `app_key` (Section 5, step 3), so a caller can only
   ever stamp their own app. **Anti-spoof:** any `app` key inside caller-supplied `user_metadata` is stripped
   and overwritten with the validated `app_key`. `app_key` for trigger apps MUST equal the trigger's expected
   value (`ckrea`, `rutas`). Caveat: Rutas's trigger reads `nombre/apellido/zona/username` from metadata — the
   Rutas app must send those in `user_metadata` or its profile row lands with NULLs.

2. **Email already exists → return the existing id, don't hard-fail (supersedes §6.1 409 / §7).**
   On duplicate email the function returns `200 { exists: true, user_id, email }` and creates nothing, so a
   Lead can grant an already-existing (possibly cross-app) person access. Logged as `create_login` with a
   `detail.existing = true` marker. No partial writes.

3. **Leads may read their own app's history.** New read action `list_audit` (gated like everything else on
   the leads check) returns only `audit_log` rows for the caller's `app_key`. Full cross-app log stays
   German-only via MCP.

4. **Safety defaults confirmed:** password ≥ 8 chars; soft rate cap 20 `create_login` per actor per minute
   (recent-`audit_log` count, best-effort); refuse to remove the last Lead of an app — enforced **atomically**
   inside a single `DELETE ... WHERE (SELECT count(*) ...) > 1` so two concurrent removes can't orphan an app.

5. **JWT/CORS (supersedes §4.4 `verify_jwt = true`).** Deploy with `verify_jwt = false` and validate identity
   **inside** the function via `supabase.auth.getUser(jwt)` (rejects the anon key and expired tokens, returns
   the real actor). This lets the function answer the browser CORS pre-flight (`OPTIONS`) and return clean
   `401` JSON. The leads-list check remains the real gate. `service_role` stays internal only. Callers send
   `Authorization: Bearer <user access_token>` + `apikey: <anon key>`; the function returns
   `Access-Control-Allow-*` on every response and short-circuits `OPTIONS`.

6. **Idempotency:** `add_lead` uses `INSERT ... ON CONFLICT (app_key, user_id) DO NOTHING`; `create_login`
   logs only after the Admin API call succeeds.

7. **Initial `apps` rows:** `ckrea`, `rutas`, `ric` (trigger apps use the exact tag their trigger keys on).
   Others seeded when they onboard.

---

*Design approved in conversation on 2026-07-01; red-team resolutions added 2026-07-01. Next step: implementation
plan (writing-plans). No code or DB changes made yet.*
