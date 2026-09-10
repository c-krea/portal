# Docs map

Read in this order. Stop when you have what you need.

| # | File | What it is |
|---|---|---|
| 1 | [`../README.md`](../README.md) | What the app is, how to run it locally |
| 2 | [`../AGENTS.md`](../AGENTS.md) | Never-break rules. `CLAUDE.md` is a shortcut to the same file. |
| 3 | [`context.md`](context.md) | **The** business / ERP / money page. Start here before touching money. |
| 4 | [`schema/`](schema/) | Live `v2` tables, views, RPCs. Schema of record. |

Everything else is situational:

| Need | File |
|---|---|
| Column notes and join keys | [`db-schema-reference.md`](db-schema-reference.md) — if this disagrees with `schema/`, trust `schema/` and the live DB |
| Shared-DB isolation (this DB hosts other apps) | [`isolation-checklist.md`](isolation-checklist.md) — Ckrea’s schema is `v2` |
| Login creation (function source is **not** in this repo) | [`reference/user-admin-edge-function.md`](reference/user-admin-edge-function.md) — §11 wins on conflict |
| Electricity PDF / meter billing | [`electricity-invoice-process.md`](electricity-invoice-process.md) |
| Cron schedules | [`../vercel.json`](../vercel.json) |
| Env var names | [`../.env.example`](../.env.example) |
| What shipped | [`../CHANGELOG.md`](../CHANGELOG.md) |
| Why a decision was made | [`history/JOURNAL.md`](history/JOURNAL.md) — archive, not onboarding |
| Old money spec (superseded mora formula, April 2026 snapshots) | [`history/financial-rules-engine-spec.md`](history/financial-rules-engine-spec.md) |

Living docs must not contradict `docs/context.md`. If they disagree, **context + the code win** — fix the other file.

## Do not

- Invent a money rule. Live rules are `docs/context.md`. If that file and the code disagree, say so — do not invent a third version.
- Treat unit counts, dollar constants, or “April 2026” tables as live. Query the DB.
- Filter payments by `siesa_clasificacion` / `clasificacion`. Use `v2.vista_pagos`.
- INSERT / UPDATE / DELETE `siesa_raw`, or touch other schemas (`cartera`, `rutas`, `satelites`, …).
- Use `scripts/sync-csf.ts` as the source of truth. The ERP **pushes**.
- Test on production. Local Docker only (`npm run dev:test`).
- Open `docs/history/` to learn how money works today.
