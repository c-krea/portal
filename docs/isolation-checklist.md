# DB isolation checklist

This Supabase project hosts several apps. **Ckrea’s schema is `v2`.** Other schemas are off-limits.

Use the queries below (replace `SCHEMA_NAME` with `v2` for this app) in the SQL editor. A bad grant here leaks into Cartera, Rutas, Satélites, and the rest.

---

## 1. Schema Setup Verification

Run in SQL Editor — replace `SCHEMA_NAME` with the actual schema.

```sql
-- Confirm schema exists
SELECT schema_name FROM information_schema.schemata
WHERE schema_name = 'SCHEMA_NAME';

-- Confirm DB role exists
SELECT rolname, rolcanlogin FROM pg_roles
WHERE rolname = 'SCHEMA_NAME_dev';

-- Confirm role only has access to its schema + siesa_raw (not v2 or others)
SELECT n.nspname AS schema,
       has_schema_privilege('SCHEMA_NAME_dev', n.nspname, 'USAGE') AS can_use
FROM pg_namespace n
WHERE n.nspname IN ('v2', 'siesa_raw', 'SCHEMA_NAME', 'public')
ORDER BY n.nspname;

-- Expected result:
-- v2           → false  ✅
-- siesa_raw    → true   ✅
-- SCHEMA_NAME  → true   ✅
-- public       → true   ✅ (needed for Supabase internals)
```

---

## 2. RLS Verification

```sql
-- Confirm RLS is enabled on ALL tables in the schema
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'SCHEMA_NAME'
ORDER BY tablename;
-- Every row must show rowsecurity = true

-- List all RLS policies
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'SCHEMA_NAME'
ORDER BY tablename, cmd;

-- Every table must have policies for SELECT, INSERT, UPDATE, DELETE
-- INSERT policies must have a WITH CHECK clause (not null)
```

---

## 3. Public Functions Audit

```sql
-- Check no public functions are exposed to anon/authenticated
-- that access other schemas
SELECT r.routine_name, r.security_type,
       array_agg(p.grantee ORDER BY p.grantee) AS granted_to
FROM information_schema.routines r
LEFT JOIN information_schema.routine_privileges p
  ON p.routine_name = r.routine_name
  AND p.routine_schema = r.routine_schema
WHERE r.routine_schema = 'public'
  AND r.routine_type = 'FUNCTION'
GROUP BY r.routine_name, r.security_type
ORDER BY r.routine_name;

-- Red flag: any SECURITY DEFINER function with PUBLIC/anon/authenticated access
-- that touches v2, siesa_raw, or another app's schema
-- exec_sql and exec_dml must only show postgres + service_role
```

---

## 4. siesa_raw Access Check

```sql
-- Confirm new role can read siesa_raw
SELECT has_table_privilege('SCHEMA_NAME_dev', 'siesa_raw.cartera', 'SELECT') AS can_read_cartera,
       has_table_privilege('SCHEMA_NAME_dev', 'siesa_raw.ocupacion', 'SELECT') AS can_read_ocupacion,
       has_table_privilege('SCHEMA_NAME_dev', 'siesa_raw.recaudo', 'SELECT') AS can_read_recaudo;
-- All must be true ✅

-- Confirm new role CANNOT write to siesa_raw
SELECT has_table_privilege('SCHEMA_NAME_dev', 'siesa_raw.cartera', 'INSERT') AS can_insert,
       has_table_privilege('SCHEMA_NAME_dev', 'siesa_raw.cartera', 'UPDATE') AS can_update,
       has_table_privilege('SCHEMA_NAME_dev', 'siesa_raw.cartera', 'DELETE') AS can_delete;
-- All must be false ✅
```

---

## 5. Cross-Schema Isolation Test

```sql
-- Confirm new role CANNOT access v2
SELECT has_schema_privilege('SCHEMA_NAME_dev', 'v2', 'USAGE') AS v2_blocked;
-- Must be false ✅

-- Confirm new role CANNOT access other app schemas
SELECT has_schema_privilege('SCHEMA_NAME_dev', 'satelites', 'USAGE') AS satelites_blocked;
-- Must be false ✅
```

---

## 6. Trigger Naming Convention

Every app that creates an auth trigger MUST use its schema name as suffix.
Trigger names are unique per table — two apps using the same name = conflict.

```sql
-- Check existing triggers on auth.users before creating a new one
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Required naming pattern:
-- on_auth_user_created_v2        ← C-Krea
-- on_auth_user_created_rutas     ← Rutas Reymon
-- on_auth_user_created_SCHEMA    ← every new app
```

**Rule:** Never name a trigger `on_auth_user_created` without the schema suffix.
The function must also live in the app's own schema: `SCHEMA_NAME.handle_new_user()`

```sql
-- ✅ Correct
CREATE TRIGGER on_auth_user_created_SCHEMA_NAME
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE SCHEMA_NAME.handle_new_user();

-- ❌ Wrong — will conflict with other apps
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE SCHEMA_NAME.handle_new_user();
```

---

## 7. Profiles Table Check

```sql
-- Confirm perfiles table exists in the schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'SCHEMA_NAME'
  AND table_name = 'perfiles'
ORDER BY ordinal_position;

-- Must have at minimum:
-- id        uuid     NOT NULL  (references auth.users)
-- rol       text     NOT NULL
-- activo    boolean  NOT NULL
-- created_at timestamptz NOT NULL
```

---

## 8. Supabase Client Config Check

In the app codebase, verify `src/lib/supabase/client.ts` has schema locked:

```typescript
// ✅ Correct — schema locked
createBrowserClient(url, key, {
  db: { schema: 'SCHEMA_NAME' }
})

// ❌ Wrong — defaults to public, no schema lock
createBrowserClient(url, key)
```

Same check for `src/lib/supabase/server.ts`.

---

## 9. PostgREST Exposure Check

In Supabase Dashboard → Settings → API → Extra Search Path:
- `SCHEMA_NAME` must appear in the list ✅
- `v2` and `siesa_raw` should NOT be added by this app's team ✅

---

## 10. Credentials Checklist

Verify the app's `.env.local` contains exactly these — no more, no less:

```bash
NEXT_PUBLIC_SUPABASE_URL=           # ✅ same for all apps
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # ✅ same for all apps
DATABASE_URL=                       # ✅ limited role only — SCHEMA_NAME_dev
```

Must NOT contain:
```bash
SUPABASE_SERVICE_ROLE_KEY=          # ❌ never in other teams' projects
```

---

## 11. Full Setup SQL Template

Run once per new app. Replace `SCHEMA_NAME` and `SECURE_PASSWORD`.

```sql
-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS SCHEMA_NAME;

-- 2. Create limited DB role
CREATE ROLE SCHEMA_NAME_dev LOGIN PASSWORD 'SECURE_PASSWORD';
GRANT CONNECT ON DATABASE postgres TO SCHEMA_NAME_dev;

-- 3. Full access to own schema
GRANT USAGE, CREATE ON SCHEMA SCHEMA_NAME TO SCHEMA_NAME_dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA SCHEMA_NAME TO SCHEMA_NAME_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA SCHEMA_NAME TO SCHEMA_NAME_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA SCHEMA_NAME
  GRANT ALL ON TABLES TO SCHEMA_NAME_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA SCHEMA_NAME
  GRANT ALL ON SEQUENCES TO SCHEMA_NAME_dev;

-- 4. Read-only access to siesa_raw
GRANT USAGE ON SCHEMA siesa_raw TO SCHEMA_NAME_dev;
GRANT SELECT ON ALL TABLES IN SCHEMA siesa_raw TO SCHEMA_NAME_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA siesa_raw
  GRANT SELECT ON TABLES TO SCHEMA_NAME_dev;

-- 5. Enable DbGate visualization
ALTER ROLE SCHEMA_NAME_dev BYPASSRLS;

-- 6. Explicit block on protected schemas
REVOKE ALL ON SCHEMA v2 FROM SCHEMA_NAME_dev;

-- 7. Grant PostgREST access (anon + authenticated can query this schema)
GRANT USAGE ON SCHEMA SCHEMA_NAME TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA SCHEMA_NAME
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA SCHEMA_NAME
  GRANT SELECT ON TABLES TO anon;
```

---

## 12. Migration Checklist (existing app → this project)

When migrating an app that was in a separate Supabase project:

- [ ] Export schema DDL from old project (tables, functions, triggers)
- [ ] Export data as CSV or pg_dump
- [ ] Run schema creation SQL in this project under new schema name
- [ ] Import data — verify row counts match
- [ ] Update app `.env.local` with new credentials
- [ ] Update Supabase client to use `db: { schema: 'SCHEMA_NAME' }`
- [ ] Verify all RLS policies were migrated (not just tables)
- [ ] Verify functions and triggers reference correct schema name
- [ ] Run verification queries from sections 1–5 above
- [ ] Test login flow end to end
- [ ] Test siesa_raw read from within the app
- [ ] Confirm old project can be paused/deleted

---

## 13. Common Gotchas Learned in Production

These caused real outages during Rutas Reymon migration — verify each:

### 13.1 Table grants after creation
`ALTER DEFAULT PRIVILEGES` only covers FUTURE tables. Tables created by `SCHEMA_dev` are owned by that role and must be granted explicitly:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA SCHEMA_NAME TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA SCHEMA_NAME TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA SCHEMA_NAME TO authenticated, anon;
```

Run this after creating tables, OR run as `SCHEMA_dev` so the owner grants.

### 13.2 PostgREST schema exposure — verify via SQL not just dashboard
Dashboard UI can lag. Confirm directly:

```sql
SELECT rolconfig FROM pg_roles WHERE rolname = 'authenticator';
-- Look for pgrst.db_schemas — must include SCHEMA_NAME

-- To update from SQL:
ALTER ROLE authenticator SET pgrst.db_schemas = 'public,existing_schemas,NEW_SCHEMA';
NOTIFY pgrst, 'reload config';
```

### 13.3 RLS recursion — never query the same table inside its own policy
This breaks with infinite recursion:
```sql
-- ❌ Wrong
CREATE POLICY x ON SCHEMA.perfiles FOR SELECT
USING (EXISTS (SELECT 1 FROM SCHEMA.perfiles WHERE ...));
```

Fix: SECURITY DEFINER function that bypasses RLS:
```sql
CREATE FUNCTION SCHEMA.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = SCHEMA, public
AS $$ SELECT EXISTS (SELECT 1 FROM SCHEMA.perfiles WHERE id = auth.uid() AND rol = 'admin') $$;
```

### 13.4 JWT claims access
Use `request.jwt.claims` JSON, not `request.jwt.claim.sub`:
```sql
-- ✅ Correct
auth.uid()  -- helper that reads the JWT properly

-- ❌ Wrong (often returns null)
current_setting('request.jwt.claim.sub', true)
```

### 13.5 Cookie name collisions between apps
Each app's auth middleware must match its own project-specific cookie name. If migrating from another Supabase project, clear old cookies first.

---

## 14. Final Verdict Checklist

Before declaring isolation complete:

- [ ] Schema exists and role is created
- [ ] Role: v2 → blocked, siesa_raw → read only, own schema → full access
- [ ] RLS enabled on ALL tables
- [ ] All INSERT policies have WITH CHECK clause
- [ ] No SECURITY DEFINER public functions expose other schemas
- [ ] Supabase client locked to schema with `db: { schema: '...' }`
- [ ] Schema exposed in PostgREST settings (verified via SQL)
- [ ] Tables granted to authenticated/anon (not just ALTER DEFAULT PRIVILEGES)
- [ ] `.env.local` has no service_role key (unless app needs auth.admin.*)
- [ ] DbGate connects and shows only correct schemas
- [ ] Login and data access tested end to end
- [ ] Auth trigger named `on_auth_user_created_SCHEMA_NAME` (not generic name)
- [ ] No recursive RLS policies (use SECURITY DEFINER helpers)
- [ ] Old project cookies cleared if migrated from elsewhere

---

*Reymon — DB Isolation Standard v1.0 — Mayo 2026*
