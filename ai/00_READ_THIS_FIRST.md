# UltraCore – AI Session Start Guide

## What this project is

UltraTechOS / UltraCore is a mobile-first Business Operating System built with Next.js 14 App Router. It is a single-operator system for UK-based construction, planning, and compliance businesses. It is NOT a SaaS product — it runs for one operator (George) and a small team.

## Canonical branch

```
chore/drizzle-full-migration
```

This is the ONLY branch you should develop on. Do not merge other branches wholesale.

## Before you write a single line of code

1. Read `ai/02_CURRENT_STATE.md` — understand where things stand today
2. Read `ai/03_ARCHITECTURE.md` — understand the stack
3. Read `ai/08_DECISIONS.md` — understand what decisions have already been made and why

## The consolidation rule

This project is in a consolidation phase. The following are banned:
- Creating new branches (use `chore/drizzle-full-migration`)
- Redesigning the architecture
- Reintroducing Prisma if it has been removed
- Running `prisma migrate` / `db push` without a documented plan
- Renaming folders unless absolutely required
- Replacing working code with experimental code

Every change must leave: `npm run type-check` passes, `npm run build` passes, `npm test` passes.

## The two source-of-truth files every AI must check

- `ai/02_CURRENT_STATE.md` — what's done, what's in progress, what's blocked
- `ai/10_KNOWN_ISSUES.md` — known bugs and schema blockers

## Important: Prisma vs Drizzle

The codebase is in a dual-ORM state:
- Prisma is the **active runtime** ORM for all existing routes
- Drizzle schema is defined in `db/schema.ts` but NOT yet the primary query layer
- `lib/db.ts` exports BOTH a lazy Prisma proxy (`db`) AND a Drizzle getter (`getDb()`)
- Do NOT remove Prisma until a full migration plan is executed and verified
- Do NOT mix Drizzle queries into Prisma routes

See `ai/07_DATABASE.md` for the full migration plan.
