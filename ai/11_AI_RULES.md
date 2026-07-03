# AI Rules

Rules that every AI assistant working on this project must follow.

## Product vision — read first

`CLAUDE.md` → **Product Vision** and **AgentMail Integration Policy** are the source of truth for what this product is and isn't. This is not an AI app — it's a mobile-first, voice-first business OS. Two consequences for how you write code and copy here:

- **Language Rules**: never expose words like Agent, Workflow, Database, API, LLM, Prompt, Orchestrator, Vector Database, LangGraph, MCP in anything the user sees or hears (UI copy, voice confirmations, notifications, error messages). These terms are fine in code, commit messages, and internal docs like this one.
- **AI scope**: the only two approved non-deterministic AI paths in this app are OpenAI Whisper transcription and AgentMail's email drafting/summarisation (scoped to communication mechanics, never autonomous business decisions). Do not add a new AI/agent framework or extend either of those two beyond their approved scope without new, explicit approval — see `CLAUDE.md` → AgentMail Integration Policy → "Why This Isn't the Rejected PR #27 AI Agent" for the exact boundary.

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
- Before writing any user-facing string (page copy, toast/error message, voice confirmation), check it against `CLAUDE.md` → Product Vision → Language Rules.
- Before adding any AI/agent-style behaviour, confirm it fits inside the two approved paths (Whisper transcription, AgentMail email mechanics) — see `CLAUDE.md` → AgentMail Integration Policy. If it doesn't fit, it needs new explicit approval, not a workaround.

## When in doubt

- Check `CLAUDE.md` for product vision, approved stack, and the AgentMail policy
- Check `ai/02_CURRENT_STATE.md` for current state
- Check `ai/08_DECISIONS.md` for past decisions
- Check `ai/10_KNOWN_ISSUES.md` for blockers
- Ask the user if the answer isn't in the docs
