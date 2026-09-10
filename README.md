# C-Krea PayControl

Payment control for ~85 commercial units at Central Kreativa, Bogotá.

Live: [ckrea.com.co](https://ckrea.com.co)

Single source of truth for tenant rent, invoices, shared expenses, electricity, and late interest. Money numbers come from the Siesa ERP. **This portal reads them. It does not write money back.**

## Safety

This app uses a **live database with real client money**, shared with other company apps. A bad write hits them too.

- Never test, seed, or experiment on production.
- Use the local Docker copy for all development.
- `npm run dev` (without `:test`) can point at production if `.env.local` does. Prefer `dev:test`.

## Run locally

```bash
npm install
npm run db:start      # local database on port 54622
npm run db:sync       # copy Ckrea data from prod (read-only)
npm run dev:test      # app at http://localhost:3000 — refuses anything that is not local
```

Studio: http://127.0.0.1:54623

`db:sync` does not copy logins. Create a local staff user (see `CLAUDE.md`). Production passwords will not work here.

## Docs that matter

| Need | File |
|---|---|
| Business, ERP, landmines | `docs/context.md` |
| Financial math | `docs/financial-rules-engine-spec.md` |
| Tables / views | `docs/schema/` and `docs/db-schema-reference.md` |
| Project facts (humans and AI) | `CLAUDE.md` |
| What shipped | `CHANGELOG.md` |
| Why a decision was made | `docs/JOURNAL.md` (history, not onboarding) |

## Stack

Next.js 16 · TypeScript · Supabase · Drizzle · Tailwind v4 · Vercel

## Deploy

Vercel auto-deploys `main`. Production git author must currently be `gburgos293@gmail.com` or the deploy is blocked — change that in Vercel when ownership moves.
