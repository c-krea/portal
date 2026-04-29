# Changelog

All notable changes to C-Krea PayControl.

Format: [YYYY-MM-DD] — description

---

## [Unreleased] — 2026-04-28 (Phase K — Session 42)

### Removed — `public` schema collapsed to copilot-only
Final cleanup pass after Phase G's portal migration. `public` had carried 4 dead helper fns, an event trigger, 1 unused table, 11 zombie enums, and a 2-table footprint that duplicated `v2.profiles`/`v2.lecturas_medidor`. All dropped. `public` now contains only the WhatsApp copilot prototype (frozen for demo) + `exec_sql` RPC + `handle_new_user` auth trigger.

**K.1 — table drop:**
- `public.electricity_invoices` (0 rows, 0 code refs, dead since creation).

**K.4 — auth trigger rewrite:**
- `public.handle_new_user()` no longer dual-writes `public.profiles`. Writes only `v2.perfiles`. Role mapping (legacy `admin/finance/viewer/tenant` → `v2.rol_usuario` Spanish) preserved.

**K.5 — duplicate tables:**
- `DROP TABLE public.profiles CASCADE` (7 rows, all mirrored in `v2.perfiles`). Cascade also dropped: 2 RLS policies (`policy_select_profiles`, `policy_update_profiles`), `set_updated_at` trigger, FK from `public.meter_readings.submitted_by`.
- `DROP TABLE public.meter_readings CASCADE` (1180 rows; 1178 mirrored in `v2.lecturas_medidor`, 2 orphans tied to a Phase I-deleted local — intentional drop). Cascade also dropped: `meter_readings_company_isolation` RLS policy, `set_updated_at_meter_readings` trigger.

**K.6 — orphan helpers + zombies:**
- 4 `public.user_*()` SECURITY DEFINER fns (read `public.profiles` which no longer exists): `user_company_id`, `user_role`, `user_tenant_id`.
- `public.update_updated_at()` (broken — both triggers using it died in K.5).
- `public.get_collections_dedup(uuid,date,date)` (references `public.payments`, dropped in Phase F; preserved in archive).
- `public.rls_auto_enable()` event trigger fn + `ensure_rls` event trigger (auto-enable RLS on new `public.*` tables — irrelevant now that we don't create `public.*` tables).
- 11 zombie enums detached since Phase F: `audit_action`, `contract_status`, `gasto_allocation_method`, `gasto_category`, `invoice_status`, `line_item_type`, `payment_status`, `sync_direction`, `sync_status`, `unit_status`, `user_role`.

### Verified
- `npm run build` clean post-K.6.
- v2 vistas counts unchanged: `vista_pagos=2701`, `vista_facturas=419`, `vista_cartera_actual=39`, `vista_mora_buckets=1`.
- `v2.sync_desde_raw()` re-run = 0/0/0/0/0/0 (idempotent, no regression from Phase J).
- Final `public` surface: 2 tables (`agent_chat_history`, `agent_budget_state` — copilot, frozen) + 2 functions (`exec_sql`, `handle_new_user`).

### Backups
All in `backups/phase_K_pre/` (gitignored, local rollback only):
- `electricity_invoices_pre.sql` — DDL.
- `handle_new_user_pre.sql` — original dual-write fn.
- `profiles_pre.sql` — DDL + 7 user INSERTs (depends on `public.user_role` enum recreate).
- `meter_readings_pre.sql` — DDL + 2-orphan manifest.
- `public_helpers_pre.sql` — 4 user_* fns + update_updated_at + rls_auto_enable + ensure_rls + zombie enum list.

### Decision — schema rename rejected
German asked whether to swap `public ↔ v2` (rename `public → copilot`, then `v2 → public`) so the canonical schema is the default. Rejected:
- 36 portal files would need `.schema('v2')` removed (Phase G investment wasted).
- `auth.users → public.handle_new_user` and `supabase.rpc('exec_sql')` are bound to `public` by name; renaming requires either keeping `public` alive as a redirect or rewiring both. Rewiring risk > naming-aesthetic benefit.
- Conclusion: `v2.*` stays canonical via explicit `.schema('v2')`. `public` stays as the legacy/copilot namespace.

### Decision — copilot prototype frozen
WhatsApp copilot (separate Docker repo at `integracion_supabase/`) is shelved. Tables `agent_chat_history` + `agent_budget_state` stay live so the prototype can be demoed; no further development. Tasks #8 (Phase H), #57 (K.2), #58 (K.3), #62 (K.7) abandoned.

---

## [Unreleased] — 2026-04-28 (Phase G complete — Session 38)

### Added
- **`v2.sync_desde_raw()` cron route** at `/api/cron/sync-v2`, daily 05:30 COT. Idempotent re-runs (gate G.3 verified).
- **`getEmpresaCkreaId()` helper** (`src/lib/empresa.ts`) — lazy, cached-per-server-boot lookup by NIT 900123456. Replaces every `SELECT id FROM companies LIMIT 1` execute call.
- **v2 Drizzle schema** in `src/lib/db/schema/v2/` (12 tables + 6 enums, `pgSchema('v2')`). `src/lib/db/v2.ts` exposes `v2()` returning `supabaseAdmin.schema('v2')`.

### Changed (Phase G.4 — 36 portal files refactored, public.* → v2.*)
- All portal data layers (`src/lib/data/*.ts`) and server actions migrated to `v2.*` (Spanish-named tables) via `.schema("v2").from(...)`. Field renames applied throughout: `tenant_id→inquilino_id`, `unit_id→local_id`, `company_id→empresa_id`, `status→estado`, `name→razon_social`, `unit_number→unidad`, `unit_code→codigo`, `full_name→nombre_completo`, `total_amount→monto_total`, `validation_status→estado_validacion`, `tipo_gasto_id`, `electricity_group→grupo_energia`, `year→anio`, `month→mes`, `contract_id→contrato_id`, `rule_key→clave`, `rule_value→valor`, `description→descripcion`.
- 4 canonical recaudo filters now live inside `v2.vista_pagos` (FVS cruce + DISTINCT ON dedup + `valor_final < 1B` + `id_zona='Z40'`); portal-side dedup removed.
- `src/lib/invoice-engine.ts` and `src/lib/reconciliation.ts` reduced to **no-op stubs**. Siesa now emits invoices and runs reconciliation upstream.
- `src/app/(app)/facturas/actions.ts`: `emitirFactura` / `generarFacturas` return Spanish "Siesa lo hace" messages.
- `vercel.json`: `/api/cron/sync-v2` schedule `30 */6 * * *` → `30 5 * * *` (Hobby plan caps cron at 1×/day).

### Fixed
- **`vista_facturas` / `vista_cartera_actual` doc_id mismatch**: `doc_id` (`001-FVS-69739`) and `documento` (`60344275`) are not joinable. Portal stops trying — `saldo=0`, `status="emitida"` on factura list; cartera page handles its own data.
- **`v2.contratos` missing `grace_period_days`**: portal hardcodes `null` in `PortalProfile` (type already nullable).
- **`vista_pagos` missing `id`/`status`/`concepto`**: synthetic `ROW_NUMBER()::text AS id`, hardcoded `status="RECAUDADO"`, `concepto=null`.
- **`v2.proyecciones` missing `pronto_pago_proyectado`**: dropped from upsert + monthly breakdown SELECT (PP now lives only on payments side per [feedback_pp_projection]).

### Verified
- `npm run build` clean (14.2s compile / 12.6s types). Lint: 9 errors / 14 warnings, **all pre-existing** (refactor introduced 0 new lint errors — verified by stashing diff).
- Preview deploy ready, German manually confirmed admin tables render.
- Production deploy 1m, `/login` 200, `/portal` 307, no 500s in runtime logs.

### Migration history
Branch `refactor/v2-migration` merged to `main` via `--no-ff` (commit `2532efb`). 36 files changed, 1 cron schedule fix, ~3,100 insertions / 1,521 deletions.

---

## [Unreleased] — 2026-04-28

### Security
- **RLS enabled on all `siesa_raw` tables** (`cartera`, `recaudo`, `documentos`, `ocupacion`, `sync_batches`). Migration `siesa_raw_rls_phase1`. Single policy `siesa_sync_all` per table grants `FOR ALL TO siesa_sync USING (true) WITH CHECK (true)`. `postgres` owner bypasses; portal app keys (`anon`/`authenticated`/`service_role`) remain grant-blocked. Defense-in-depth on top of existing GRANTs.
- **`siesa_sync` role hardened.** Migration `siesa_sync_role_tighten`: `ALTER ROLE siesa_sync NOCREATEROLE NOCREATEDB NOBYPASSRLS`. Removes admin flags that were inherited at role creation and were silently bypassing RLS. Role is now minimal-privilege: login + DML (SELECT/INSERT/UPDATE) on 5 `siesa_raw` tables, nothing else.

### Schema
- **`siesa_raw.recaudo.row_id_mov` added** (BIGINT, nullable). Migration `siesa_raw_recaudo_add_row_id_mov`. Tracks Siesa's per-movement unique ID delivered as `RowIdMov` (column S) in updated `SIESA connexion.xlsx`. Existing 3,221 rows stay NULL until next sync. Loader (`scripts/load_siesa_raw.py`) updated with `"RowIdMov": "row_id_mov"` rename mapping. Future candidate for natural key once non-null backfill is verified.

---

## [Unreleased] — 2026-04-28 (Phase J — Session 41)

### Changed — `v2.sync_desde_raw()` now UPSERT (was INSERT-only)
The cron sync function (`/api/cron/sync-v2`, daily 05:30 COT) replaces every `ON CONFLICT DO NOTHING` with proper UPSERT. ERP changes to `razon_social`, unit code/entrada/estado, contract canon/discount/PP/flags/estado now refresh in `v2.*` instead of staying frozen at first-insert value. Closes the staleness gap that caused Phase I's manual cleanup.

**Per-table behavior:**
- `inquilinos`: refresh `razon_social` on `(empresa_id, nit)` conflict. Portal-only fields (`nombre_corto`, `juridica`, `pp_historico_*`, contacto, notas) untouched.
- `locales`: refresh `unidad`/`entrada`/`estado='arrendado'` on `(empresa_id, codigo)` conflict. **No freeze** on `oficina`/`mantenimiento` — ERP is source of truth (building reorg in progress; portal stops second-guessing).
- `contratos`: refresh ALL ERP fields (`fecha_inicio`, `lista_precios`, `canon_base`, `descuento_pct`, `pronto_pago_pct`, 4 flags, `estado`) on `(inquilino_id, local_id)` match. **No freeze** on `terminado`/`vencido` — sync can rescue a contract wrongly marked terminado in portal. Portal-only fields (`fecha_fin`, `incremento_ipc`, `descripcion_descuentos`) untouched.
- All UPDATEs filtered with `IS DISTINCT FROM` — no-op rows skipped, idempotency holds.
- **No DELETE** — ex-tenants stay until "Ya salieron" UI is built (deferred per German + IT decision).

### Fixed — non-deterministic `nit_razon` (caught during Phase J validation)
First idempotency run produced 2 stray inquilino updates per cycle. Root cause: `siesa_raw.cartera.cliente` and `siesa_raw.recaudo.cliente` carry both clean names (`MORA BARRERA BETURIA`) and dirty variants (`MORA BARRERA BETURIA - CREDITO A 60 DIAS PP 5% 30 DIAS`) on the same `fecha_factura`/`fecha_recaudo`. `DISTINCT ON (nit) ORDER BY nit, dt DESC` picked one non-deterministically each run → 16 NITs flickering. Fix: source priority (`ocupacion` → `recaudo` → `cartera`, since `ocupacion.razon_social` is IT-curated and clean) + final `razon_social ASC` tiebreaker. Six inquilinos settled to clean ocupacion names on first re-run; subsequent runs = 0 changes.

### Verified
- Pre-state: `inquilinos=90`, `locales=84`, `contratos=76`, ocupacion=84.
- First run: 0/45/0/2/0/63 (inserted/updated per inquilinos/locales/contratos).
- Run 2: 0/2/0/0/0/0 (idempotency bug surfaced) → fixed → run 4: 0/6/0/0/0/0 (one-time settle) → run 5+6: all zeros ✅.
- Audit gate (Phase I LEFT JOIN pattern): 0 orphans in inquilinos/locales/contratos. Counts unchanged 90/84/76.

### Backups
- `backups/sync_desde_raw_pre_J.sql` — rollback path (paste & run to revert).
- `backups/sync_desde_raw_phase_J.sql` — final shipped version (matches DB).

### Follow-ups (open)
- **Speed up cron after one cycle in prod** — Hobby plan caps at 1×/day, confirmed via Vercel docs (`Hobby accounts are limited to daily cron jobs. This cron expression would run more than once per day`). Options: upgrade Pro ($20/mo, every-minute precision) or external cron (cron-job.org / GitHub Actions) hitting `/api/cron/sync-v2` 3×/day. Stay Hobby for now, add manual "Sync now" admin button later.
- **Multi-row contratos guard** — current UPDATE matches any row with `(inquilino_id, local_id)`. If a future renewal creates a `terminado` C1 + `activo` C2 for the same pair, sync will clobber both. Not possible today (76 contracts, 0 terminado). Add `c.estado IN (activo,critico) OR c.fecha_fin IS NULL` filter when first historical terminado lands.

---

## [Unreleased] — 2026-04-28 (Phase I — Session 40)

### Fixed — v2 aligned to siesa_raw truth (Excel residue purged)
Migration `phase_i_align_v2_to_siesa_truth_v3`. Post-Phase G audit found `v2.locales = 91` vs `siesa_raw.ocupacion = 84`. Root cause: Phase G migration filled v2 from BOTH `public.*` (Excel-origin) and `siesa_raw.*`. `sync_desde_raw()` is INSERT-only with `ON CONFLICT DO NOTHING`, so Excel residue persisted even after Phase F dropped `public.*`.

**Cleanup:**
- **7 `v2.locales` dropped**: `E8L801–805,807` (zone-8 Excel codes, ERP uses `Z8L*`) + `E1L126` (no ERP equivalent).
- **15 `v2.contratos` dropped** — three patterns:
  - 6 zone-8 same-tenant dupes (E8L paired with Z8L).
  - 7 contratos for units ERP marks `Critico` (vacante) — ex-tenants with open cartera.
  - 2 tenant-change cases (E1L120 BECERRA→GUZMAN, E1L121 NEOGRAFICK→SIERRA — kept ERP-matching contrato, dropped portal addition).
- **84 `v2.proyecciones` repointed** from orphan contratos to ERP-matching contratos (also updated `local_id` — proyecciones has two FK columns). **83 dropped** for vacante/unknown units.
- **78 `v2.lecturas_medidor` repointed** E8L → Z8L counterparts (preserve historical readings for same-tenant zone-8 units). **2 dropped** for E1L126 (no Z replacement).
- **5 Z8L estados** flipped `disponible` → `arrendado` to reflect ERP. (INSERT-only sync had never refreshed them.)
- **All 90 inquilinos preserved.** Ex-tenants stay for cartera/historical pagos linkage even when their contrato was dropped.

**Final state (audit confirmed 0 orphans across 12 v2 tables):**
| Table | v2 | Source | Orphans |
|---|---|---|---|
| locales | **84** | siesa_raw.ocupacion | 0 |
| contratos | **76** | siesa_raw.ocupacion (NIT+codigo) | 0 |
| inquilinos | 90 | siesa_raw.* (any table by NIT) | 0 |
| proyecciones | 816 | derived | 0 |
| lecturas_medidor | 1178 | portal-side | 0 |

### Follow-ups (open)
- **WOR-75**: UI section "Ya salieron" on Locales page for ex-tenants with open cartera — 9 inquilinos now contract-less but with cartera > 0.
- **Phase J** (queued): upgrade `v2.sync_desde_raw()` from INSERT-only to UPSERT (refresh estado/canon) and optional delete-on-missing. Prevents the same staleness problem from recurring as ERP data evolves.

---

## [Unreleased] — 2026-04-26

### Added (designed, not yet applied)
- **v2 simplified schema** in `docs/foundation/01_schema_erd/v2/`:
  - `01_tablas.sql` — 12 tables, all Spanish (empresas, perfiles, inquilinos, locales, contratos, proyecciones, lecturas_medidor, facturas_energia, tipos_gasto, gastos, reglas_financieras, agente_chat) + 6 enums + indexes + `update_updated_at` trigger.
  - `02_vistas.sql` — 4 views (`vista_pagos`, `vista_cartera_actual`, `vista_facturas`, `vista_mora_buckets`). 4 canonical recaudo filters baked in (FVS cruce + DISTINCT ON dedup + `valor_final < 1B` + `id_zona='Z40'`). `siesa_clasificacion` never used.
  - `03_rpcs.sql` — 5 RPCs (`obtener_recaudo`, `obtener_cartera_actual`, `obtener_buckets_mora`, `obtener_recaudo_vs_proyectado`, `obtener_resumen_inquilino`). SECURITY INVOKER, GRANT authenticated + service_role.
- **DB backups** in `backups/`:
  - `schema_snapshot_20260426.sql` — manually-assembled DDL (39 KB, 827 lines).
  - `ckrea_pre_v2_20260426_213512.dump` — pg_dump custom-format full snapshot (535 KB, RLS + data + FKs).
- **`scripts/load_siesa_raw.py`** — pandas + psycopg2 ETL loader from `SIESA connexion.xlsx` → `siesa_raw.*`. Idempotent UPSERT via row_hash MD5. Single sync_batch per sheet.

### Changed
- **`siesa_raw.recaudo`**: PK migrated from `(docto, cruce, fecha_recaudo, valor_aplicado)` to surrogate `id uuid`. Natural key now `recaudo_natural_key UNIQUE NULLS NOT DISTINCT (...)`. Reason: real ERP row `001-RE-657` had null `cruce`, blocking the old NOT NULL composite PK.
- **`siesa_raw.ocupacion`**: PK migrated from `(documento, local)` to surrogate `id uuid`. Natural key `ocupacion_natural_key UNIQUE NULLS NOT DISTINCT (documento, local)`. Reason: vacant locale row `E1L111` had null `documento`.

### Imported
- `siesa_raw.cartera` 125 rows, `siesa_raw.recaudo` 3221 rows, `siesa_raw.ocupacion` 84 rows, `siesa_raw.documentos` 419 rows (3849 total) from `SIESA connexion.xlsx`.

### Fixed (Session 35, 2026-04-26)
- **Loader `.0` strip**: pandas float→str artifact stripped from `ocupacion.documento` (78/78 rows) and `documentos.tipo_cliente` (317/317 rows). Per-sheet `strip_dot_zero=[col,...]` config in `scripts/load_siesa_raw.py`.
- **Cleanup**: deleted 78 stale `.0`-suffix `siesa_raw.ocupacion` rows after re-running loader idempotently.
- **`vista_cartera_actual` JOIN bug**: was joining `inquilinos.nit = cartera.cliente` — `cliente` is razón social, not NIT. Fixed to `cartera.documento`. `cliente` now exposed as `razon_social_raw`.
- **`vista_facturas` JOIN bug**: same bug on `documentos.cliente`. Fixed to `documentos.doc`. `documento` aliased as `doc_id` (factura ID, not NIT). `prefijo_doc` now uses `SPLIT_PART(documento, '-', 2)` to correctly extract FVS/RK/NVS prefix.

---

## [Unreleased] — 2026-04-25

### Added
- **`siesa_raw` landing schema (Phase 1 of ERP→Supabase ingestion)**: new schema isolated from `public`, not exposed via PostgREST. Migration `siesa_raw_schema_phase1` applied to production Supabase.
  - 5 tables: `sync_batches` (audit), `cartera` (PK `row_id`), `recaudo` (composite PK `docto,cruce,fecha_recaudo,valor_aplicado`), `documentos` (PK `documento`), `ocupacion` (composite PK `documento,local`)
  - Every raw table carries `siesa_synced_at`, `sync_batch_id` (FK to `sync_batches`), `row_hash` (MD5 for change detection)
  - New role `siesa_sync` granted `SELECT/INSERT/UPDATE` on the schema; `anon`/`authenticated` revoked. No RLS — grant-only access.
  - Idempotent UPSERT pattern (`ON CONFLICT … DO UPDATE WHERE row_hash IS DISTINCT FROM`) — IT can safely re-run jobs.
- **`docs/integrations/SIESA-Raw-Import-Guide-IT.html`** — self-contained Spanish guide for IT: connection params, full DDL of 5 tables, Raymond filters (zone Z40 + canal R08), batch protocol, operational notes (~260 lines).

### Decided (no code change)
- **Option B chosen for ERP→Portal sync**: IT writes to isolated `siesa_raw` schema; portal ETL refactors `public.*` from raw in Phase 2 (vs Option A direct-write to portal tables). Reasons: isolation from PostgREST, idempotency via row_hash, batch auditability, and Phase 2 becomes a pure refactor with no external coupling.

---

## [Unreleased] — 2026-04-24

### Added
- **PP histórico per tenant** (`tenants.pp_historico_pct`): per-client historical pronto-pago rate computed from full ERP payment history. Tenants with <10 payments fall back to global average (17.99%). Drives "Recaudo esperado" KPI on `/proyecciones`, dashboard portfolio total, and `proyectado` chart on reportes.
- **Sidebar reorder**: Locales moved to position 5 (right below Pagos).
- **ERP Ocupación sync** (`scripts/sync-csf.ts`): 3rd sync target alongside cartera + payments. Fetches `ckrea-ocupacion` endpoint, groups by LOC (Activo > Critico > first), detects fantasma rows (NULL NIT), compares canon/tenant/status against Portal DB. Generates diff report with 5 types: `UNIDAD_NO_EN_DB`, `SIN_CONTRATO_EN_DB`, `INQUILINO_DIFERENTE`, `CANON_DIFERENTE`, `DEBE_TERMINAR`
- CLI flags on sync script: `APPLY` (default false = dry-run), `DEBUG`
- `DISPONIBLES_OVERRIDE` constant in sync script for manager-confirmed vacants (312, 313, 506A)

### Changed
- **PP + phase discount STACK** (CKR-20 — rule reversal). Real Siesa data (MEDIOS IMPRESOS Jan invoice) confirms 20% phase + 10% PP applied simultaneously. Removed mutual-exclusivity from 8 spots: invoice-engine.ts, dashboard.ts, reportes.ts, pagos.ts, proyecciones.ts (×4). 2026 expected PP discount rises ~$16M (from $57.5M → $73.7M).
- **Proyecciones KPI cards renamed**: `IVA (19%)` → `PP esperado`, `Total neto c/IVA` → `Recaudo esperado`. New row-level columns `pp_historico_pct` / `pp_historico_pagos`.
- **Pagos page month filter + payment classification rewrite**: dropdown selects month (`?month=YYYY-MM`); KPIs, buckets, and table all scope to selection. Replaced unreliable `siesa_clasificacion` filter with: `siesa_cruce LIKE 'FVS-%'` + RK/001-RK dedup + standalone-electricity exclusion + `valor_final < 1B` (excludes the $4.2B FUSION GRAFIK April 2024 data-entry error). New buckets `temprano`/`tardio`/`mora` driven by cartera saldo, not Siesa classification. KPI "Mes anterior" replaced by "Pendiente Recaudo" (vs proyectado).
- **NC GRAPHICS contract fix**: `pronto_pago_pct` 0 → 10 (was the only contract of 78 set to 0; ERP applies 10% in practice).

### Fixed
- `.gitignore`: `data/` → `/data/` (was matching `src/lib/data/` too, blocked staging modified files).
- **`pp_historico_pct` undercount** (WOR-69): old backfill double-counted RK + 001-RK paired rows AND skipped NO PROYECTADO rows that carried PP discount, leaving most tenants stuck near the 17.99% global fallback. New formula deduplicates paired rows on `(siesa_cruce, fecha_recaudo)` and includes all classifications. Global rate moves 17.99% → 38.07%; per-tenant averages move 22.93% → 41.94%; tenants with real (non-fallback) rate go 51 → 62. 2026 `recaudo_esperado` drops $51.9M ($3,039M → $2,987M) — projections now reflect actual PP behavior. Backfill saved as idempotent `scripts/backfill-pp-historico.sql`.

### Docs
- `docs/revision-ocupacion-erp.html` — manager verification doc: 4-category breakdown of ERP vs Portal discrepancies (15 units), print-friendly CSS, proposed ERP workflow
- `docs/supabase-it-guide.html` — IT integration guide: connection fix, Python test script, 3-endpoint field mapping, common errors table, cron job instructions for 24/7 sync

### Decided (no code change)
- **ERP is source of truth for occupancy**: Portal syncs FROM ERP, never the reverse
- **NIT = permanent tenant identity**: contracts come and go, cartera ties to tenant_id not contract
- Sync NOT yet applied — awaits manager verification of flagged units

---

## [2.9.0] — 2026-04-22

### Added
- **Electricity billing — full feature** (`/medidores/facturas`):
  - New DB table `electricity_invoices` — admin enters 6 invoices per month (one per address group), tarifa auto-computed as `valor_factura ÷ kwh_factura`
  - New `electricity_group` column on `units` — all 84 units tagged to one of 6 address groups (CRA2710065, CRA2710071, CRA2710073, CLL112733, CLL112739, CRA2710079)
  - Admin page at `/medidores/facturas` with month/year selector, 6-row invoice table, live tarifa display, and upsert save
  - Link from `/medidores` page to facturas sub-page
  - New `src/lib/data/electricity.ts` — `getElectricityInvoices`, `getElectricityTarifaForUnit`, `ELECTRICITY_GROUPS` constant
- **Client portal medidor — full redesign** (`/portal/medidor`):
  - Digit input: 5 individual boxes (one digit each) + 1 red crossed-out box (decimal indicator, non-editable). Auto-advance, backspace, paste support.
  - Live preview panel: lectura anterior / lectura este mes / diferencia / total estimado (shown once all 5 digits filled and tarifa > 0)
  - Submitted view: 4 cards — lectura anterior, lectura enviada, consumo del mes, total energía a pagar
  - Total energía card: green when tarifa available, grey "Tarifa pendiente de liquidación" when admin hasn't entered invoice yet
  - Photo placeholder stretches to match height of 4 cards
  - All meter readings display as 5-digit zero-padded strings (`09057` not `9,057.8`) — electric meter context only
  - Client portal tarifa now sourced from `electricity_invoices` (real invoice data) instead of historical `meter_readings.tarifa_kwh`

### Fixed
- `prevRows` query now excludes current period (`AND periodo < '${periodo}'`) — prevents current month's own reading from being used as lectura anterior

---

## [2.8.0] — 2026-04-21

### Changed
- **Pagos — correct payment filters applied across all three queries** (`getPagosKPIs`, `getPagosBuckets`, `getPagos`):
  - Added `siesa_cruce LIKE 'FVS-%'` — keeps only real invoice payments, excludes credit notes (NVS), reversals (RK), cancellations
  - Added `valor_final < 1,000,000,000` — excludes Siesa data entry errors (confirmed bad entry: FUSION GRAFIK SAS RK-485, $4.2B, April 2024)
  - Existing 001-RK dedup retained — removes bookkeeping duplicate rows
  - `siesa_clasificacion` filter removed entirely — proved unreliable in both directions (same payment gets different classifications on its two rows)
- **`getPagos` list query**: replaced `LEFT JOIN contracts` (caused row duplication for 12 multi-unit tenants) with correlated subquery for `unit_number`

### Result
- Pagos KPI "Recaudado" for March 2026: $242,322,859 (vs Power BI $236.8M — 2.3% gap, down from much larger errors before)
- Bucket cards (temprano / tardio / mora) now sum exactly to KPI total
- Full audit and filter rationale: `docs/recaudo-cartera-audit.md`

---

## [2.7.0] — 2026-04-21

### Added
- **PP histórico por cliente**: per-tenant historical early-payment rate stored on `tenants.pp_historico_pct`. Computed from full ERP payment history. Tenants with <10 payments use global average (17.99%) as fallback.
- **Expected projection model**: all projection queries now apply per-tenant PP rate. Phase discount exclusivity enforced per row — PP = 0 in any month where a phase discount is active.
- Proyecciones page: "Recaudo esperado" KPI card, "PP esperado" card, formula explainer updated, chart shows expected amounts, detail table has "PP hist." column.
- Dashboard `portfolioTotal` + `getProyectadoVsReal` both use expected projection.
- Pagos page: month filter dropdown (`?month=YYYY-MM`). KPI cards and table both filter to selected month.
- Sidebar reordered: Resumen → Proyecciones → Mora → Pagos → Gastos → Medidores → Locales → Usuarios.

### Fixed
- Projection queries were applying `c.pronto_pago_pct` to all 12 months including those with active phase discounts — now correctly 0 for those months.

---

## [2.6.0] — 2026-04-20

### Added
- Meter validation upgraded to hybrid seasonal + full-history model
- Primary reference: same calendar month across all prior years (e.g. April 2026 vs April 2025)
- Fallback: full available history average (not just 3 months) when no valid same-month data
- Three-tier validation: `aprobado` (±20%), `revision` (±40%), `critico` (>40% or 0 kWh)
- Admin medidores: `🚨 Crítico` badge (red) for critical readings
- Admin medidores: column renamed "vs Prom.3m" → "vs Histórico"
- Meter input step changed to 0.01 (accepts decimal meter readings)
- DB check constraint updated to allow `critico` status

### Fixed
- Units with 0 kWh in same-month prior year now correctly fall back to full-history avg
- ValidationBadge had no critico case — fell through to grey "Pendiente"

---

## [2.5.0] — 2026-04-20

### Added
- Google Drive photo upload for meter readings (OAuth2 refresh token — uploads as real Gmail user)
- PDF auto-conversion: all uploaded images converted to PDF via pdf-lib before Drive upload
- Drag-and-drop file upload on tenant portal medidor page (JPG, PNG, PDF accepted)
- Inline Drive file preview via iframe after submit (360px embedded viewer)
- `foto_drive_id` column on `meter_readings` table
- Admin medidores table: "Foto" column with direct Drive link
- CKR-19: revert deadline bypass after demo

### Fixed
- Meter photo upload: switched from service account JWT to OAuth2 refresh token (SA has no storage quota on personal Gmail Drive)
- Post-submit preview: page auto-refreshes via `router.refresh()` instead of relying on React state (which gets wiped on server component remount)
- Drag-and-drop: use FileReader base64 → hidden input instead of DataTransfer→input.files (unreliable in server actions)

---

## [2.3.0] — 2026-04-19

### Added
- Tenant account creation: "Crear cuenta" button in Usuarios/Inquilinos for tenants with email but no auth account
- Portal Total a Pagar: now computes canon × (1−descuento%) × 1.19 + electricidad
- "Ver detalle" modal on portal dashboard with full charge line-item breakdown
- Admin medidores year switcher (2025/2026) — all 1,180 imported readings now accessible
- Mobile hamburger nav with slide-out drawer for all admin pages
- Horizontal bar chart on dashboard (better mobile readability)

### Fixed
- Portal Total a Pagar was showing raw canon only (no IVA, no discounts, no electricity)
- Recharts chart invisible on mobile — switched to explicit pixel height container
- Desglose de Mora items crowded on mobile — added proper padding
- Admin sidebar crushing content on mobile — now hidden on mobile (lg:flex only)
- Dashboard KPI grid, gastos 70/30 layout, mora aging buckets — all stack on mobile
- Portal pagos table: hides Vencimiento/Concepto columns on small screens
- Portal perfil: cards stack on mobile, row label width responsive

## [2.4.0] — 2026-04-19

### Added
- Route `/clientes` renamed to `/locales` across all links, nav, and revalidatePaths

### Fixed (mobile — full admin pass)
- Proyecciones: KPI cards text-sm on mobile, formula explainer hidden, chart scrolls horizontally (minWidth 540), table hides 4 cols progressively
- Mora: KPI cards smaller on mobile, MoraTable hides Facturas + Saldo total
- Pagos: table hides Fecha + Concepto on mobile
- Gastos: KPI cards smaller, GastosChart explicit 200px height (Recharts fix), GastosTable meta.className column hiding
- Locales: tabs overflow-x-auto, table hides Locales + Canon on mobile, text-xs throughout
- Locales detail: KpiCard text-sm + truncate, Pagos table 3-col mobile, CarteraTable 3-col mobile
- Medidores: KPI grid 2-col on mobile, controls row wraps, table 3-col mobile
- Usuarios: stats grid 2-col, tab bar full-width, both tables 3-col mobile, edit modal stacks vertically + scrolls
- Facturas: table 4-col mobile, text-xs throughout

## [Unreleased]

## [2.2.0] — 2026-04-19
### Added
- `/usuarios` admin page fully rebuilt: two-tab layout (Inquilinos del Portal / Administración), stats strip (total / email configured / cuenta activa / activos 30d)
- `EditTenantModal`: two-card edit modal (Contact left, Contract right) matching `/portal/perfil` layout. Editable fields: NIT, razón social, nombre corto, email contacto, teléfono, email portal. Contract fields: inicio/fin, canon base, descuento fase, pronto pago %, notas descuento.
- `EditAdminModal`: name/email/role editor with amber confirmation dialog, auth sync on save
- Per-unit contract tabs in tenant modal for multi-unit tenants — eliminates dead-end "edit in Clientes" flow
- `updateTenantUser` server action: saves all contact + unit + contract fields, syncs portal email to `auth.users`
- `updateAdminUser` server action: updates profiles + auth.users
- `getPortalTenants()`: `JSON_AGG(JSON_BUILD_OBJECT(...))` for per-unit contract aggregation; reads `auth.admin.listUsers()` for real emails + lastSignIn; auto-backfills `portal_email` on load to heal historical drift
- `UnitContract` type + `PortalTenantRow` with `unitContracts: UnitContract[]`
- Usuarios sidebar nav item added (was missing from NAV_ITEMS in constants.ts)
- Auth sync: `updatePortalEmail` now updates both `tenants.portal_email` and `auth.users` — fixes units 101/118 showing "Sin email" despite having accounts
- All 3 admin accounts set to `role = 'admin'`
- Mobile responsiveness for tenant portal: `grid-cols-1 sm:grid-cols-3` on dashboard, stacked banner, Concepto column hidden on mobile, medidor form `grid-cols-1 md:grid-cols-2`, portal header compact on mobile

## [2.1.0] — 2026-04-17
### Changed
- Proyecciones: removed pronto pago (PP) from ALL projection formulas — PP was wrongly pre-applied to 100% of contracts. PP is conditional and applies only when a client actually pays within 10 days. Zeroed out 899 `pronto_pago_proyectado` rows in DB.
- Proyecciones: renamed "PP elegible" (was "PP %") in detalle table — informational label, not a deduction.
- Proyecciones: formula explainer updated to show Canon − Descuentos fase = Base neta × 1.19, with note that PP applies only at payment time.
- Proyecciones: removed reconciliation table from proyecciones page (wrong context — lives on dashboard now).
### Added
- Dashboard: stacked bar chart now shows 3 segments — Recaudo neto (emerald) / PP otorgado (dark emerald) / Pendiente (navy). PP segment shows real discount actually granted at payment.
- Dashboard: RecaudoCard with Gráfica/Tabla toggle. Same h-[480px] card, button switches between stacked bar chart and compact monthly reconciliation table (Proyectado | Recaudo neto | PP otorgado | Pendiente | %).
- Gastos: month tabs (ENE/FEB/MAR/ABR) matching Medidores pattern.
- Gastos: pie chart (filled, 8 categories) replaces bar chart — legend below with % per category, tooltip shows COP on hover.
- Gastos: two-card layout — table card (70%) left, pie card (30%) right.
- Gastos: date format MM/YY (was YYYY-MM). Sort icons removed (sorting still works on click).
### Fixed
- `getProyectadoVsReal`: proyectado formula now uses `canon - descuento` only (was including pp). Added `pp_otorgado` and `pendiente` fields to ProyectadoVsReal type.
- Dashboard portfolio stat: cleaned `canon - descuento - pronto_pago_proyectado` → `canon - descuento`.

## [2.0.0] — 2026-04-16
### Added
- Cartera Jurídica: second table below Mora table for tenants in legal proceedings (`tenants.juridica = true`). Excluded from all mora KPIs and dashboard totals. PUNTO ACRILICO + Magda Pedraza (503) flagged.
- `getJuridicaRows()`, `getVacantUnitRows()`, `getTenantContracts()` data functions
- `BackButton` shared component using `router.back()` — preserves tab/filter on navigation
- Locales tab: filter persisted in URL (`?tab=en_mora`) — survives client navigation
- Locales tab: default sort per tab (Al Día→canon desc, Mora/Críticos/Todos→saldo pendiente desc)
- Locales tab: Inactivos shows vacant units (no active contract) as non-clickable "Vacante" rows
- Detail page: all contracts listed per tenant (not just one), unit badge + dates per card
- Mora links: `?unit=XXX` param loads correct contract on multi-unit tenants
### Changed
- Locales tab: one row per client (not per unit); all unit numbers shown as badges
- Sidebar + page title: "Clientes" → "Locales"
- Cartera on detail page is per-business (correct — Siesa bills the business, not per unit)

## [2.0.0] — 2026-04-16
### Added
- Dashboard: "Desglose de Mora" — 4 buckets: Mora Crítica (>60d), Mora Activa (31-60d), Intereses, Promedio Días. SQL adds `mora_critica` + `mora_activa` CASE columns in single query.
- Dashboard: KPI strip reduced 4→3 (removed "Saldo Pendiente")
- Gastos: 40 rows imported for Jan–Apr 2026 ($212M) from C-KREA GB.xlsx "4. GASTOS" + ckrea.xlsx "Estado de resultados"
- Gastos: stacked Recharts bar chart by month × 8 categories (Vigilancia/Reparaciones/Nómina/ServPublicos/Aseo/Publicidad/Impuestos/Otros)
- Gastos: KPIs replaced (Total YTD / Promedio mensual / Último mes / Total registros)
- Medidores: WOR-47 admin prototype — period tabs, KPI strip, 84-unit table with status + promedio 3m + desviación%
- Medidores: `getMedidoresAdmin()` — all units + reading for period + 3-month average LATERAL subquery
- All 84 units set `has_electricity_meter = true` in DB
- WOR-47 Linear issue + `docs/features/WOR-47-medidores-ocr.md` spec (params: ±10% tolerance, 1.5× factor, 10-day deadline)
### Fixed
- Mora table: duplicate React key for multi-unit tenants (`key={tenantId}` → `key={tenantId-unitNumber}`)
- Gastos table: removed "Estado" (asignado/pendiente) column — gastos are building-level costs, not unit-allocated

## [1.9.0] — 2026-04-16
### Fixed
- DB connection on Vercel: Supabase DB host is IPv6-only, Vercel Lambda is IPv4-only — no TCP path exists
- Replaced postgres.js + Drizzle runtime with Supabase HTTP executor (`exec_sql` RPC + `supabase-js` admin client)
- All 29 data/action/engine files migrated — site now connects via HTTPS (IPv4/Cloudflare), works from Vercel
### Added
- `src/app/(app)/loading.tsx` — spinner shown on all pages while data loads (no more blank screen)
- `src/app/(app)/error.tsx` — graceful error boundary for all pages (no more white crash screen)

## [1.8.0] — 2026-04-16
### Added
- Mora grace period: `grace_period_days` set to 30 in financial_rules — all mora KPIs now exclude invoices < 30 days overdue
- Grace period is runtime-configurable in Configuración (no deploy needed)
- `getGracePeriod()` shared utility in `configuracion.ts` — used by dashboard, mora, and reportes
- User account: operaciones@reymon.com.co (role: finance)
### Fixed
- Dashboard + reportes: `totalVencido` KPIs now apply grace period (were showing $156M, now $67.6M matching Power BI)
- Vercel CRON_SECRET env var had trailing space — fixed, redeploy successful

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
