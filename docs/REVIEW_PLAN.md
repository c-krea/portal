# Review Plan — Uncommitted Work Cleanup

**Started:** 2026-04-24
**Goal:** Walk every uncommitted modification, decide keep / revert / finish, then ship clean commits.
**Owner:** German + Claude (caveman ultra mode)

---

## How to use this file

- Single source of truth for what's left to review.
- Each section = one logical concern. Review one at a time.
- Status legend: 🔲 not started · 🔍 reviewing · ✅ keep · ❌ revert · 🔧 finish first · 📦 committed
- After every decision: update the section's **Status** + **Decision** + **Date**.
- After session compact: read this file first to resume.

---

## Section 0 — Docs reorganization ✅ DONE (uncommitted)

**Status:** ✅ done, awaiting commit
**Date:** 2026-04-24

Moved 11 docs into `docs/audits/`, `docs/meetings/`, `docs/integrations/`. Moved 4 Excels → `data/` (gitignored). Deleted broken `import_data.py`, dupe logo, sentry log. Renamed `Untitled` → `docs/TODO.md`. Updated 3 code refs (`pagos.ts:230`, `validate_projections.py:39`, `FOUNDATION_GUIDE.md`). Added `data/` to `.gitignore`. Fixed `INSIGHTS_v1.md` path in `.gitignore`. `tsc --noEmit` passed.

**Files touched:**
- `.gitignore`, `docs/CHANGELOG.md` (untouched), `docs/JOURNAL.md` (untouched)
- `docs/FOUNDATION_GUIDE.md`, `docs/foundation/05_seed_validation/validate_projections.py`, `src/lib/data/pagos.ts`
- 11 file moves, 3 deletes, 1 rename

**Commit message (planned):**
```
chore(docs): reorganize files into topic folders

- data/ for raw Excels (gitignored)
- docs/audits, docs/meetings, docs/integrations for topic separation
- delete broken import_data.py + dupe logo + sentry log
- rename Untitled scratch → docs/TODO.md
- update 3 code refs to new paths
```

---

## Section 1 — Sidebar reorder 📦

**Status:** 📦 committed (ef1ad2c)
**File:** `src/lib/constants.ts`
**CHANGELOG entry:** v2.7.0 — superseded by new order below

**What it does:** Moves "Locales" nav item to sit right below "Pagos".

**Old order (committed):** Resumen · Proyecciones · Mora · Locales · Pagos · Gastos · Medidores · Usuarios
**Final order:** Resumen · Proyecciones · Mora · Pagos · **Locales** · Gastos · Medidores · Usuarios

**Decision:** Keep, with Locales moved to position 5 (after Pagos) instead of 7. German preference 2026-04-24.
**Date:** 2026-04-24

---

## Section 2 — PP histórico per tenant (expected revenue model) 📦

**Status:** 📦 committed (dc3e71a) — also closed CKR-20 (PP+phase stacking, 7 spots)
**Files:** `src/lib/data/dashboard.ts`, `src/lib/data/reportes.ts`, `src/lib/data/proyecciones.ts`, `src/app/(app)/proyecciones/page.tsx`, `src/components/proyecciones/detalle-table.tsx`, `src/components/proyecciones/proyecciones-chart.tsx` (~250 lines)
**CHANGELOG entry:** v2.7.0 (entire "PP histórico por cliente" section)

**What it does:** Adds per-tenant historical pronto-pago rate (`tenants.pp_historico_pct`). Projection math now subtracts an expected PP discount based on each tenant's payment behavior.
- Tenants with ≥10 payments → use their historical rate
- Tenants with <10 payments → fall back to global average (17.99%)
- Phase discount months → PP forced to 0 (mutual exclusivity enforced per row)

**Why it might still matter:**
- CHANGELOG says shipped. JOURNAL backs it up.
- If reverted, dashboard "Recaudo esperado" goes back to over-projecting (assumes 100% PP discount or none).

**Why it might be abandoned:**
- JOURNAL 2026-04-22 says **PP + phase discount can STACK** (MEDIOS IMPRESOS Jan invoice). The mutual-exclusivity rule we enforced is WRONG. Linear CKR-20 is the fix.
- That means: this code is built on a financial rule that was reversed AFTER it shipped.

**Risk if kept as-is:**
- Math under-projects in cases where both PP + phase discount apply. Modest impact today (small number of cases) but grows as more contracts hit phase-discount months.

**Open questions:**
- [ ] Is `tenants.pp_historico_pct` populated in production DB? (verify)
- [ ] Should we keep this AND apply the CKR-20 stacking fix together (one commit)? Or commit now and fix CKR-20 later?
- [ ] Any pages referencing the OLD KPI labels ("IVA", "Total neto c/IVA") besides the proyecciones page?

**Decision:**
**Date:**

---

## Section 3 — Pagos month filter + payment filter cleanup 📦

**Status:** 📦 committed (dc79ad6) — also closed 8th CKR-20 spot, fixed NC GRAPHICS contract
**Files:** `src/app/(app)/pagos/page.tsx`, `src/lib/data/pagos.ts`, NEW `src/components/pagos/month-filter.tsx` (~460 lines)
**CHANGELOG entries:** v2.7.0 (month filter) + v2.8.0 (filter cleanup)

**What it does:** Two bundled changes:
1. **Month filter** — dropdown on Pagos page (URL `?month=YYYY-MM`). KPI cards + table filter to chosen month.
2. **Payment filter cleanup** — three queries (`getPagosKPIs`, `getPagosBuckets`, `getPagos`) now:
   - Keep only `siesa_cruce LIKE 'FVS-%'` (real invoice payments — exclude NVS credit notes, RK reversals, cancellations)
   - Exclude `valor_final >= 1,000,000,000` (the $4.2B FUSION GRAFIK April 2024 data-entry error)
   - Drop unreliable `siesa_clasificacion` filter (proved wrong on duplicate rows)
   - `getPagos` list query: replace `LEFT JOIN contracts` with correlated subquery (was duplicating multi-unit tenant rows)

**Result documented:** Pagos KPI "Recaudado" March 2026 = $242,322,859 vs Power BI $236.8M (2.3% gap).

**Why it might still matter:**
- Without these filters, Pagos page numbers are wrong (off by millions per month).
- Bucket cards (temprano/tardio/mora) no longer sum to KPI total without the filters.

**Why it might be abandoned:**
- Possibly in mid-edit? Need to walk the page in browser to confirm UI works end-to-end.
- Power BI 2.3% gap is documented but never closed.

**Open questions:**
- [ ] Does the live `/pagos` page render without errors with current code?
- [ ] Does month filter URL param actually change KPIs and table when clicked?
- [ ] Is the 2.3% Power BI gap acceptable for now?

**Decision:**
**Date:**

---

## Section 4 — ERP Ocupación sync + docs 📦

**Status:** 📦 committed (f882482 + 3160052)
**Files:** `scripts/sync-csf.ts` (~302 lines), 4 new HTML docs (already moved to topic folders)
**CHANGELOG entry:** [Unreleased] 2026-04-24

**What it does:** Adds 3rd sync target alongside cartera + payments — syncs occupancy from ERP `ckrea-ocupacion` endpoint.
- Groups rows by LOC (Activo > Critico > first)
- Detects fantasma rows (NULL NIT)
- Compares canon / tenant / status against Portal DB
- Generates 5-type diff: `UNIDAD_NO_EN_DB`, `SIN_CONTRATO_EN_DB`, `INQUILINO_DIFERENTE`, `CANON_DIFERENTE`, `DEBE_TERMINAR`
- CLI flags: `APPLY` (default false = dry-run), `DEBUG`
- `DISPONIBLES_OVERRIDE` constant for manager-confirmed vacants (312, 313, 506A)

**State per JOURNAL:** Sync NOT applied yet — awaits manager verification of 15 flagged units. Manager doc sent: `docs/meetings/revision-ocupacion-erp.html`.

**Why it might still matter:**
- ERP = decided source of truth for occupancy. Portal needs to track it.
- Sync exists now but only as code — never run with `APPLY=true`.

**Why it might be abandoned:**
- Waiting on manager response. If reply is in, we can run it. If still pending, code stays dry-run.

**Open questions:**
- [ ] Did manager respond on the 15 flagged units?
- [ ] Should this commit include the docs (HTML files) or just the script?
- [ ] Any test runs of `npm run sync-csf` since the script was last edited?

**Decision:**
**Date:**

---

## Final commit plan (target)

After all sections decided:

| # | Commit | Sections |
|---|--------|----------|
| 1 | `chore(docs): reorganize files into topic folders` | Section 0 |
| 2 | `feat(proyecciones): sidebar reorder + PP histórico per tenant` | Section 1 + Section 2 |
| 3 | `feat(pagos): month filter + payment classification cleanup` | Section 3 |
| 4 | `feat(erp): occupation sync (dry-run, manager review pending)` | Section 4 |

Adjust as decisions come in (some sections may be reverted, merged, or split).

---

## Decision log

| Date | Section | Decision | Reason |
|------|---------|----------|--------|
| 2026-04-24 | 0 | Done | Reorg complete, awaiting commit |
| 2026-04-24 | 1 | Committed | ef1ad2c — Locales moved to position 5 |
| 2026-04-24 | 4 | Committed | f882482 (sync code) + 3160052 (8 docs) |
| 2026-04-24 | 2 | Committed | dc3e71a — PP histórico + CKR-20 stack fix (7 spots) |
| 2026-04-24 | 3 | Committed | dc79ad6 — pagos month filter + classification rewrite + 8th CKR-20 spot + NC GRAPHICS fix |
