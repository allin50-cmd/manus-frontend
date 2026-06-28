# AI Rules

Rules that every AI assistant working on this project must follow.

## Non-negotiable rules

1. **Always work on `chore/drizzle-full-migration`** — never push to another branch without explicit user instruction.

2. **Always verify before claiming success:** `npm run type-check` must pass (0 errors), `npm run build` must pass, `npm test` must return 130/130.

3. **Never import from `@prisma/client` directly** — use `@/lib/types` for enum types. Exception: the Prisma client itself in `lib/db.ts`.

4. **Never run `prisma db push --accept-data-loss`** — this can silently destroy production data.

5. **Never merge sheetops or jolly-hawking wholesale** — always cherry-pick with review.

6. **Never create new branches** — unless explicitly instructed by the user.

7. **Never delete Vercel projects** — until explicitly authorised after canonical branch is promoted.

## Coding rules

- Default to no comments. Only add comments when the WHY is non-obvious.
- No backwards-compatibility hacks (unused `_vars`, re-exporting removed types, etc.)
- No premature abstraction. Three similar lines is better than a bad helper.
- Server components pass serialised data to client components — always convert `Date` to ISO string before the boundary.
- Error pattern for API routes: `NextResponse.json({ error: '...' }, { status: ... })`
- Error pattern for pages: render an inline error `<div>` in the catch block.

## Process rules

- Before adding a feature that needs new Prisma models/fields, check `ai/10_KNOWN_ISSUES.md` and `ai/09_ROADMAP.md` — the schema migration may not be done yet.
- Before modifying any route that imports from `@prisma/client`, change the import to `@/lib/types` first.
- Before claiming a cherry-pick is safe, verify: (a) no `@prisma/client` direct enum imports, (b) no dependency on Prisma models absent in canonical schema, (c) no deletions of files that exist in canonical.

## When in doubt

- Check `ai/02_CURRENT_STATE.md` for current state
- Check `ai/08_DECISIONS.md` for past decisions
- Check `ai/10_KNOWN_ISSUES.md` for blockers
- Ask the user if the answer isn't in the docs
