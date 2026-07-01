# Shared user-admin Edge Function — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared, secure Supabase Edge Function that lets each app's designated "Lead" create logins and manage their own Lead list, without any app holding the master key.

**Architecture:** A `user_admin` schema holds three locked tables (`apps`, `leads`, `audit_log`). A single Deno Edge Function `user-admin` is the only writer. It (1) validates the *caller's own* login token via `auth.getUser()`, (2) checks the `user_admin.leads` list, (3) creates logins with the Supabase Admin API, and (4) reads/writes the control tables over a **direct Postgres connection** (`SUPABASE_DB_URL`) so the tables never need to be exposed through the public API. The master key (`SUPABASE_SERVICE_ROLE_KEY`) lives only inside the function.

**Tech Stack:** Supabase (Postgres + Auth + Edge Functions), Deno, `npm:@supabase/supabase-js@2`, `npm:postgres@3`. All DDL via MCP `apply_migration`; function via MCP `deploy_edge_function`; tests via MCP `execute_sql` + `curl`.

## Global Constraints

- Source of truth: `docs/superpowers/specs/2026-07-01-shared-user-admin-edge-function-design.md` (incl. §11 red-team resolutions — those win on any conflict).
- Multi-app isolation: touch **only** `user_admin`; never `v2`/`rutas`/`satelites`/`ric_systems`/`siesa_raw`. Never add or rename triggers on `auth.users`.
- Only two triggers exist on `auth.users`: `on_auth_user_created_v2` (fires on meta `app='ckrea'`), `on_auth_user_created_rutas` (`app='rutas'`). RIC has none.
- `create_login` stamps `raw_user_meta_data.app = <validated app_key>`; strip any caller-supplied `app`.
- App keys for trigger apps MUST equal their trigger's tag: `ckrea`, `rutas`. RIC = `ric` (no trigger).
- Deploy the function with `verify_jwt = false`; identity is verified inside via `getUser()`.
- Safety defaults: password ≥ 8; rate cap 20 `create_login` / actor / minute; refuse to remove the last Lead (atomic).
- Every DB write in this plan is destructive and requires German's explicit "do it" before running. Never commit without German's say-so; commit author must be `gburgos293@gmail.com`.

---

## File / artifact map

- **Migration** `user_admin_schema` — schema, 3 tables, RLS, grants, seed `apps` (Task 1).
- **Migration** `user_admin_seed_ric_lead` — Sergio as first `ric` Lead (Task 2).
- **Edge Function** `user-admin` / `index.ts` — the one guarded door (Task 3).
- No repo source files change. Docs updated in Task 6.

---

## Task 1: `user_admin` schema, tables, RLS, seed apps

**Artifact:** MCP `apply_migration` name `user_admin_schema`.

**Interfaces produced:** tables `user_admin.apps(app_key, name, created_at)`, `user_admin.leads(id, app_key, user_id, created_by, created_at, unique(app_key,user_id))`, `user_admin.audit_log(id, action, app_key, actor_user_id, target_user_id, target_email, detail, created_at)`.

- [ ] **Step 1 — Pre-check (define the expected end state):** confirm `user_admin` does not exist.

Run (MCP `execute_sql`):
```sql
select count(*) as n from information_schema.schemata where schema_name='user_admin';
```
Expected: `n = 0`.

- [ ] **Step 2 — Apply the migration** (MCP `apply_migration`, name `user_admin_schema`):

```sql
create schema if not exists user_admin;

create table user_admin.apps (
  app_key    text primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

create table user_admin.leads (
  id         uuid primary key default gen_random_uuid(),
  app_key    text not null references user_admin.apps(app_key),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (app_key, user_id)
);

create table user_admin.audit_log (
  id             bigint generated always as identity primary key,
  action         text not null,
  app_key        text not null,
  actor_user_id  uuid,
  target_user_id uuid,
  target_email   text,
  detail         jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index audit_log_app_time_idx  on user_admin.audit_log (app_key, created_at desc);
create index audit_log_actor_act_idx on user_admin.audit_log (actor_user_id, action, created_at desc);

alter table user_admin.apps      enable row level security;
alter table user_admin.leads     enable row level security;
alter table user_admin.audit_log enable row level security;
-- No policies on purpose: anon/authenticated get nothing; the function connects as the
-- table-owner role over SUPABASE_DB_URL and is unaffected by RLS.

revoke all on schema user_admin from anon, authenticated;
revoke all on all tables in schema user_admin from anon, authenticated;

insert into user_admin.apps (app_key, name) values
  ('ckrea','C-Krea PayControl'),
  ('rutas','Rutas'),
  ('ric','RIC Systems')
on conflict (app_key) do nothing;
```

- [ ] **Step 3 — Verify tables, RLS, seeds:**

```sql
select c.relname, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname='user_admin' and p.tablename=c.relname) as policies
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='user_admin' and c.relkind='r' order by 1;
select app_key, name from user_admin.apps order by 1;
```
Expected: 3 tables all `rls=true`, `policies=0`; apps = `ckrea, rutas, ric`.

- [ ] **Step 4 — Advisors check** (MCP `get_advisors type=security`): expect **no new** "RLS disabled" / "exposed" finding for `user_admin`.

---

## Task 2: Bootstrap RIC's first Lead (Sergio)

**Interfaces consumed:** `user_admin.leads`, `user_admin.apps` (Task 1). Sergio = `auxpresupuestos@reymon.com.co`, id `2b959cd4-ee5d-4dce-8df0-aaf9ff17564c` (verify at run — do not hard-code if it differs).

- [ ] **Step 1 — Verify Sergio's login exists:**
```sql
select id, email from auth.users where email='auxpresupuestos@reymon.com.co';
```
Expected: one row.

- [ ] **Step 2 — Apply the migration** (MCP `apply_migration`, name `user_admin_seed_ric_lead`):
```sql
insert into user_admin.leads (app_key, user_id, created_by)
select 'ric', id, null
from auth.users
where email='auxpresupuestos@reymon.com.co'
on conflict (app_key, user_id) do nothing;
```

- [ ] **Step 3 — Verify:**
```sql
select l.app_key, u.email, l.created_by
from user_admin.leads l join auth.users u on u.id=l.user_id
where l.app_key='ric';
```
Expected: one row, `ric` / `auxpresupuestos@reymon.com.co` / null.

---

## Task 3: Deploy the `user-admin` Edge Function

**Interfaces produced:** HTTPS `POST {project_url}/functions/v1/user-admin` accepting `{ action, app_key, ... }`; actions `create_login`, `add_lead`, `remove_lead`, `list_leads`, `list_audit`.

**Consumes env (auto-injected by Supabase):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`.

- [ ] **Step 1 — Deploy** (MCP `deploy_edge_function`, name `user-admin`, `verify_jwt=false`, single file `index.ts`):

```ts
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DB_URL       = Deno.env.get("SUPABASE_DB_URL")!;

const RATE_LIMIT   = 20; // create_login per actor per minute
const MIN_PASSWORD = 8;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")    return json({ error: "method_not_allowed" }, 405);

  // 1. Resolve caller from their OWN login token
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!/^Bearer\s+.+/i.test(authHeader)) return json({ error: "missing_token" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: u, error: uErr } = await userClient.auth.getUser();
  if (uErr || !u?.user) return json({ error: "invalid_token" }, 401);
  const actor = u.user;

  // 2. Parse body
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const action: string = body?.action;
  const appKey: string = body?.app_key;
  if (!action || !appKey) return json({ error: "missing_action_or_app_key" }, 400);

  const sql = postgres(DB_URL, { max: 1, prepare: false });
  try {
    // 3. Gate: actor must be a Lead for appKey
    const lead = await sql`select 1 from user_admin.leads where app_key=${appKey} and user_id=${actor.id} limit 1`;
    if (lead.length === 0) return json({ error: "not_a_lead" }, 403);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    if (action === "create_login") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!email) return json({ error: "missing_email" }, 400);
      if (password.length < MIN_PASSWORD) return json({ error: "weak_password", detail: `min ${MIN_PASSWORD} chars` }, 400);

      const recent = await sql`
        select count(*)::int as n from user_admin.audit_log
        where actor_user_id=${actor.id} and action='create_login' and created_at > now() - interval '1 minute'`;
      if (recent[0].n >= RATE_LIMIT) return json({ error: "rate_limited" }, 429);

      const meta = { ...(body.user_metadata ?? {}) };
      delete meta.app;              // anti-spoof
      meta.app = appKey;            // force caller's own app

      const { data: created, error: cErr } =
        await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });

      if (cErr) {
        const existing = await sql`select id from auth.users where email=${email} limit 1`;
        if (existing.length > 0) {
          const uid = existing[0].id;
          await sql`insert into user_admin.audit_log(action,app_key,actor_user_id,target_user_id,target_email,detail)
                    values('create_login',${appKey},${actor.id},${uid},${email},${JSON.stringify({ existing: true })}::jsonb)`;
          return json({ exists: true, user_id: uid, email }, 200);
        }
        return json({ error: "create_failed", detail: cErr.message }, 400);
      }

      const uid = created.user.id;
      await sql`insert into user_admin.audit_log(action,app_key,actor_user_id,target_user_id,target_email,detail)
                values('create_login',${appKey},${actor.id},${uid},${email},'{}'::jsonb)`;
      return json({ user_id: uid, email }, 200);
    }

    if (action === "add_lead") {
      let uid: string | undefined = body.target_user_id;
      const email = body.target_email ? String(body.target_email).trim().toLowerCase() : undefined;
      if (!uid && email) {
        const r = await sql`select id from auth.users where email=${email} limit 1`;
        if (r.length === 0) return json({ error: "no_login_for_email" }, 404);
        uid = r[0].id;
      }
      if (!uid) return json({ error: "missing_target" }, 400);
      await sql`insert into user_admin.leads(app_key,user_id,created_by)
                values(${appKey},${uid},${actor.id}) on conflict (app_key,user_id) do nothing`;
      const em = await sql`select email from auth.users where id=${uid} limit 1`;
      await sql`insert into user_admin.audit_log(action,app_key,actor_user_id,target_user_id,target_email,detail)
                values('add_lead',${appKey},${actor.id},${uid},${em[0]?.email ?? null},'{}'::jsonb)`;
      return json({ ok: true, user_id: uid }, 200);
    }

    if (action === "remove_lead") {
      const uid: string | undefined = body.target_user_id;
      if (!uid) return json({ error: "missing_target_user_id" }, 400);
      const del = await sql`
        delete from user_admin.leads
        where app_key=${appKey} and user_id=${uid}
          and (select count(*) from user_admin.leads where app_key=${appKey}) > 1
        returning user_id`;
      if (del.length === 0) {
        const still = await sql`select 1 from user_admin.leads where app_key=${appKey} and user_id=${uid} limit 1`;
        return json({ error: still.length ? "cannot_remove_last_lead" : "not_a_lead_row" }, still.length ? 409 : 404);
      }
      await sql`insert into user_admin.audit_log(action,app_key,actor_user_id,target_user_id,detail)
                values('remove_lead',${appKey},${actor.id},${uid},'{}'::jsonb)`;
      return json({ ok: true }, 200);
    }

    if (action === "list_leads") {
      const rows = await sql`
        select l.user_id, u.email, l.created_by, l.created_at
        from user_admin.leads l left join auth.users u on u.id=l.user_id
        where l.app_key=${appKey} order by l.created_at`;
      return json({ leads: rows }, 200);
    }

    if (action === "list_audit") {
      const rows = await sql`
        select action, actor_user_id, target_user_id, target_email, detail, created_at
        from user_admin.audit_log where app_key=${appKey} order by created_at desc limit 200`;
      return json({ audit: rows }, 200);
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e: any) {
    return json({ error: "server_error", detail: String(e?.message ?? e) }, 500);
  } finally {
    await sql.end({ timeout: 5 });
  }
});
```

- [ ] **Step 2 — Confirm deploy** (MCP `list_edge_functions`): `user-admin` present, status ACTIVE, `verify_jwt=false`.

- [ ] **Step 3 — Grab the connection facts** for tests: MCP `get_project_url` → `URL`; MCP `get_publishable_keys` → anon/publishable key → `ANON`. (Function URL = `$URL/functions/v1/user-admin`.)

---

## Task 4: Door / CORS / badge tests (no user token needed)

- [ ] **Step 1 — CORS preflight** passes even without a token:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS "$URL/functions/v1/user-admin" \
  -H "Origin: https://example.com" -H "Access-Control-Request-Method: POST"
```
Expected: `200`.

- [ ] **Step 2 — No token → 401:**
```bash
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Content-Type: application/json" -d '{"action":"list_leads","app_key":"ric"}'
```
Expected body: `{"error":"missing_token"}`.

- [ ] **Step 3 — Anon key used AS the bearer → 401** (proves the public key is not a valid "badge"):
```bash
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
  -d '{"action":"list_leads","app_key":"ric"}'
```
Expected body: `{"error":"invalid_token"}`.

---

## Task 5: Full Lead-action end-to-end (throwaway `test` app, cleaned up)

Uses a disposable app `test` and a disposable Lead login so no real app/user is touched. **All the SQL here is a destructive write — confirm with German first.** Clean up in Step 8.

- [ ] **Step 1 — Seed a throwaway app + Lead login** (MCP `execute_sql`; `pgcrypto` lives in `extensions`):
```sql
insert into user_admin.apps(app_key,name) values('test','E2E throwaway') on conflict do nothing;

with nu as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
    'authenticated','authenticated','ua-test-lead@example.com',
    extensions.crypt('TestLead#2026', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
  ) returning id, email
), ident as (
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select id::text, id, jsonb_build_object('sub',id::text,'email',email,'email_verified',true),
         'email', now(), now(), now() from nu returning user_id
)
insert into user_admin.leads(app_key,user_id,created_by)
select 'test', user_id, null from ident returning user_id;
```
Expected: one `user_id` returned.

- [ ] **Step 2 — Get the test Lead's JWT** (real password grant):
```bash
TOKEN=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"ua-test-lead@example.com","password":"TestLead#2026"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
echo "${TOKEN:0:12}..."
```
Expected: a token prefix prints (non-empty).

- [ ] **Step 3 — `create_login` succeeds:**
```bash
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"create_login","app_key":"test","email":"ua-created-1@example.com","password":"Created#2026"}'
```
Expected: `{"user_id":"...","email":"ua-created-1@example.com"}`. Confirm the login carries the stamped app and fired no cross-app trigger:
```sql
select raw_user_meta_data->>'app' as app from auth.users where email='ua-created-1@example.com';   -- 'test'
select count(*) from v2.perfiles pf join auth.users x on x.id=pf.id where x.email='ua-created-1@example.com';  -- 0
```

- [ ] **Step 4 — Duplicate email → `exists` + id (not an error):**
```bash
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"create_login","app_key":"test","email":"ua-created-1@example.com","password":"Created#2026"}'
```
Expected: `{"exists":true,"user_id":"...","email":"ua-created-1@example.com"}`.

- [ ] **Step 5 — Wrong app → 403; weak password → 400:**
```bash
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"list_leads","app_key":"ric"}'                       # expect {"error":"not_a_lead"}
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"create_login","app_key":"test","email":"x@example.com","password":"short"}'  # {"error":"weak_password",...}
```

- [ ] **Step 6 — `add_lead` then last-Lead safeguard:** promote the created user to Lead, then try to remove the original test Lead (should be allowed since 2 leads now), then remove the remaining one (should be blocked):
```bash
# add the created user as a second lead
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"add_lead","app_key":"test","target_email":"ua-created-1@example.com"}'   # {"ok":true,...}
```
```sql
-- capture both ids for the removal checks
select user_id from user_admin.leads where app_key='test' order by created_at;
```
Then remove one (allowed → `{"ok":true}`), remove the last one (blocked → `{"error":"cannot_remove_last_lead"}`) using `remove_lead` with each `target_user_id`.

- [ ] **Step 7 — `list_leads` / `list_audit` scoped to `test` only:**
```bash
curl -s -X POST "$URL/functions/v1/user-admin" -H "apikey: $ANON" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"list_audit","app_key":"test"}'
```
Expected: only `app_key='test'` rows (create_login, add_lead, remove_lead), none from `ric`/other apps.

- [ ] **Step 8 — Clean up the throwaway data** (MCP `execute_sql`):
```sql
delete from auth.users where email in ('ua-test-lead@example.com','ua-created-1@example.com');  -- cascades leads
delete from user_admin.audit_log where app_key='test';
delete from user_admin.leads where app_key='test';   -- belt & suspenders
delete from user_admin.apps where app_key='test';
```
Verify nothing `test` remains:
```sql
select (select count(*) from user_admin.apps where app_key='test') as apps,
       (select count(*) from user_admin.leads where app_key='test') as leads,
       (select count(*) from user_admin.audit_log where app_key='test') as audit;
```
Expected: all `0`.

---

## Task 6: Records + handoff (no code)

- [ ] **Step 1 — Advisors** (MCP `get_advisors type=security`): confirm no new `user_admin` findings.
- [ ] **Step 2 — CHANGELOG.md:** add under `[Unreleased]` → "Added: shared `user-admin` Edge Function + `user_admin` schema for self-serve login creation per app."
- [ ] **Step 3 — JOURNAL.md:** dated entry — red-team deltas (app-stamp vs neutral, verify_jwt=false + getUser, atomic last-lead, exists-returns-id), why direct-DB over PostgREST, test method.
- [ ] **Step 4 — memory/project_state.md:** note the function is live + how a new app onboards (add `apps` row + seed first Lead).
- [ ] **Step 5 — Linear:** create/close the issue; comment what shipped.
- [ ] **Step 6 — Commit** (only on German's "do it"; author `gburgos293@gmail.com`): the two spec/plan/doc files. The schema + function already live in Supabase (not in git).

---

## Self-review

- **Spec coverage:** §4 tables → Task 1. §5 auth model → Task 3 (getUser + leads gate). §6.1 create_login (+§11.1 app-stamp, §11.2 exists) → Task 3/5.3/5.4. §6.2 add_lead → 5.6. §6.3 remove_lead + last-Lead (§11.4 atomic) → 5.6. §6.4 list_leads + §11.3 list_audit → 5.7. §7 password/rate/scope → constants + 5.5. §8 RLS/locked → Task 1. §9 bootstrap → Task 2. §11.5 verify_jwt/CORS → Task 3/4. All covered.
- **Placeholder scan:** none — all SQL/TS/curl is concrete.
- **Type consistency:** action names (`create_login/add_lead/remove_lead/list_leads/list_audit`), columns, and env var names match across function + tests.
- **Open risk noted:** creating a `rutas`/`ckrea` login via `create_login` will fire that app's trigger; if the caller omits required profile metadata the trigger may insert NULLs (rutas) — acceptable, the owning app supplies metadata. RIC (near-term) is unaffected.
