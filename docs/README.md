# Docs map

Read in this order. Stop when you have what you need.

| # | File | What it is |
|---|---|---|
| 1 | [`../README.md`](../README.md) | What the app is, how to run it locally |
| 2 | [`../AGENTS.md`](../AGENTS.md) | Never-break rules (live money, shared DB, local-only testing). `CLAUDE.md` is a shortcut to the same file. |
| 3 | [`context.md`](context.md) | The business, the ERP, and the landmines. **Start here before touching money.** |
| 4 | [`financial-rules-engine-spec.md`](financial-rules-engine-spec.md) | The four money rules (A–D) and the invoice chain. See the banner at the top — some sections are snapshots or superseded. |
| 5 | [`schema/`](schema/) | Live `v2` tables, views, RPCs. Schema of record. |
| 6 | [`db-schema-reference.md`](db-schema-reference.md) | Column notes and join keys. If this file and `schema/` disagree, trust `schema/` and the live DB. |

Everything else is situational:

| Need | File |
|---|---|
| Shared-DB isolation (this DB hosts other apps) | [`isolation-checklist.md`](isolation-checklist.md) — Ckrea’s schema is `v2` |
| Login creation (function source is **not** in this repo) | [`reference/user-admin-edge-function.md`](reference/user-admin-edge-function.md) — §11 wins on conflict |
| Electricity PDF / meter billing | [`electricity-invoice-process.md`](electricity-invoice-process.md) |
| Cron schedules | [`../vercel.json`](../vercel.json) |
| Env var names | [`../.env.example`](../.env.example) |
| What shipped | [`../CHANGELOG.md`](../CHANGELOG.md) |
| Why a decision was made | [`JOURNAL.md`](JOURNAL.md) — history, not onboarding |

## Do not

- Invent a money rule. If the spec, `context.md`, and the code disagree, **the code plus `context.md` win**, and the mismatch is a bug in the doc.
- Treat unit counts, dollar constants, or “April 2026” tables as live. Query the DB.
- Filter payments by `siesa_clasificacion` / `clasificacion`. Use `v2.vista_pagos` (`schema/02_vistas.sql`).
- INSERT / UPDATE / DELETE `siesa_raw`, or touch other schemas (`cartera`, `rutas`, `satelites`, …).
- Use `scripts/sync-csf.ts` as the source of truth. The ERP **pushes**. That script is a leftover manual top-up.
- Test on production. Local Docker only (`npm run dev:test`).
