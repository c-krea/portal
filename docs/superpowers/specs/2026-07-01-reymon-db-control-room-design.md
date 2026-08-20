# Reymon Shared Database — "Control Room" Design

- **Date:** 2026-07-01
- **Owner:** German Burgos (de-facto database integration owner)
- **Status:** Approved design — pre-implementation
- **Scope:** How German safely manages and safeguards the shared Reymon Supabase database across ~7 independent apps.

---

## 1. The problem (plain)

Reymon runs **one** Supabase database (Pro plan) that **~7 separate apps** read and write. Each app has its own schema. German gave each dev **MCP access scoped to their own schema**, and everyone edits the **live** database directly.

Almost nothing is written down as code (no migration files), so the database's **logic** has:
- No version control
- No history
- No surgical undo
- No review

Backups exist (Supabase Pro **daily snapshots**) but have **never been test-restored**, and PITR (second-level restore) is not confirmed. So today's disaster recovery = restore the whole DB to yesterday = lose up to ~24h **and** everyone's data at once.

German is the only person with cross-schema / whole-DB visibility → he is the natural **database integration owner**.

## 2. What triggered this

A performance review found the DB "exhausting resources":
- ~**50%** of all DB work is a wasteful **Siesa ERP sync** that rewrites whole tables each run (IT's side — a fix message has already been sent to IT).
- ~**40%** is slow portal **reports** that recompute from a 3.7 GB table instead of using pre-built summary tables (German's side).

Fixing the read side is German's job — which raised the bigger question this doc answers: **how does German make and keep database changes across apps he doesn't fully own, without breaking anything?**

## 3. Goals & scope

- **In scope (A):** Database plumbing only — functions, indexes, summary tables, sync-related and cross-cutting DB logic.
- **Out of scope:** The apps' frontend / website code. German does **not** need their repos to do DB work.
- **Ambition (C):** Own the shared plumbing now; grow toward whole-DB version control over time. Do **not** force all 7 devs into a heavy process.

## 4. Decisions locked

1. Each app keeps its **own schema. Never merged.**
2. **Per-schema DB roles** stay = the hard fence (already built; each dev can only touch their own schema).
3. **No `shared` schema now** (YAGNI). Apps genuinely don't overlap; `siesa_raw` already serves as the one read-only common source. Revisit **only** if a real object ever needs 2+ apps to read it.
4. A **"shared DB playbook"** goes into each repo's `CLAUDE.md` — **in the open, not secretly.** Carries tips / conventions / how-to.
5. **Hooks** (Claude Code `settings.json`) enforce the 2–3 critical "never" rules as real walls.
6. **Mirror repo + Supabase backups** = the undo / safety net.

## 5. The three-layer enforcement model

| Layer | Mechanism | Strength | Used for |
|---|---|---|---|
| **Guidance** | `CLAUDE.md` playbook | Strong, but the model can still be overridden; useless if they use a non-Claude tool | Conventions, tips, how-to |
| **Wall (in Claude Code)** | Hooks | Blocks the action outright | The 2–3 critical "never" rules |
| **Wall (in the database)** | Roles / RLS / grants | Absolute, tool-independent | Schema isolation (already built) |

Rule: **match the layer to the stakes.** The playbook *tells*; hooks + permissions *enforce*.

## 6. What we're building — the `reymon-db` "brain"

A new repo German owns, opened in Claude Code with the MCP. It does **two jobs**:

**(a) Safety-net mirror (whole DB).** A scheduled job **photographs the database's structure** (schemas, tables, functions, views, policies) into timestamped files, committed to the repo. It captures every dev's live changes **automatically**, with **zero discipline required** from them. It gives a **surgical undo**: if someone breaks a function, open yesterday's file and restore just that one piece — no full-DB rollback, nobody else loses data.

**(b) Plumbing source-of-truth.** The cross-cutting objects German owns (summary tables, sync helpers) are **authored as SQL files here first, then applied via MCP.** Real version control from day one for the things he touches.

**Growth path (C):** promote one app's schema at a time from "just mirrored" → "authored & reviewed here," when ready.

## 7. Key mechanics (write down so they stick)

- **DB changes via MCP are instant and live** — no repo, no pull. Every app hits the updated shared database immediately, because they all read the *same* database. This is ~99% of German's actual work.
- **Files in a repo require a `git pull`** to reach a person's machine — GitHub never auto-delivers (it's a P.O. box, not a delivery truck). Only the playbook file needs this, and it's **install-once**.
- **Nothing can be changed on someone's machine secretly** — delivery (the pull) happens on their side, by them. Openness is **mechanically required**, not just the ethical choice.

## 8. Non-goals (YAGNI)

- No monorepo. No merging schemas. No shared schema yet.
- No collecting everyone's frontend repos.
- No forcing 7 devs onto migration discipline.

## 9. Risks & open items

- **Backups never test-restored** → action: do **one** test restore into a throwaway copy (a Supabase branch/clone, never over prod). Confirm daily-vs-PITR; decide if PITR is worth the cost given the ~3h sync cadence + live tenants.
- **Mirror job needs one-time setup** (a scheduled structure dump). Implementation detail for the build plan.
- **Clobber risk** when changing an object inside another dev's schema (they have live access too) → coordinate/ping the owner; or (future) move any truly-shared object into a `shared` schema.
- **Playbook must stay short & stable** to avoid constant re-distribution (each update needs each dev to pull again).

## 10. Next step

Turn Section 6 (the `reymon-db` brain: repo + mirror + playbook + hooks) into a concrete, step-by-step build plan.
