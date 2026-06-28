# Known Issues

## Active issues

### K01 — Prisma binary download fails in CI/sandbox environments
**Severity:** Infrastructure
**Symptom:** `prisma generate` fails with ECONNRESET. Generated `.prisma/client/index.d.ts` = stub types only.
**Cause:** Network policy blocks outbound connections to Prisma CDN.
**Workaround:** `lib/types.ts` provides Prisma-independent enum types. Lazy Prisma init in `lib/db.ts` prevents module-load crash.
**Fix required:** Normal Vercel deployment environment has full network access — not a production issue.

### K02 — My Tasks reassign calls non-existent endpoint
**Severity:** Minor (graceful failure)
**Symptom:** Clicking "Reassign" in My Tasks sends PATCH to `/api/work-items/[id]/actions/[actionId]/reassign` which does not exist. Returns 404 and shows error toast.
**Cause:** Reassign endpoint requires `Action.reassignedFrom/At/By/handoffNote` fields not in canonical schema.
**Fix:** Migration 2b (see `ai/09_ROADMAP.md`)

### K03 — Partnerships nav link leads to 404
**Severity:** Minor (cosmetic)
**Symptom:** `/partnerships` nav link in More menu returns 404 (page not created yet).
**Cause:** Partnerships page requires `PipelineStage` enum and `WorkItem.pipelineStage` not in canonical schema.
**Fix:** Migration 2e + 2f (see roadmap)

### K04 — VoiceIntake quality signals not stored
**Severity:** Medium
**Symptom:** Voice transcription in canonical branch does not save `transcriptConfidence` or `qualityFlags`.
**Cause:** These fields don't exist in canonical `VoiceIntake` model.
**Fix:** Migration 2a (see roadmap)

### K05 — stale .next/types reference after message-threads route deletion
**Severity:** Infrastructure
**Symptom:** `.next/types/app/api/os/message-threads/route.ts` generated file may re-appear after `next build`, causing TS errors.
**Cause:** Next.js regenerates these files on build. Stale file appears when route was removed.
**Fix:** Stale file should be cleaned before type-check: `rm -rf .next/types/app/api/os/message-threads`

## Resolved

### R01 — Module-level PrismaClient crash
**Was:** `lib/db.ts` called `new PrismaClient()` at import time, crashing when binary not found.
**Fixed:** Lazy Proxy pattern in `lib/db.ts`

### R02 — TS2635 errors in activity/contacts/decisions pages
**Was:** Used `Awaited<ReturnType<typeof db.model.findMany<...>>>` causing TypeScript generic errors on `any`-typed db.
**Fixed:** Replaced with explicit inline type annotations.

### R03 — @prisma/client enum imports causing build failures
**Was:** 14 routes imported enums from `@prisma/client`, failing when Prisma codegen hadn't run.
**Fixed:** All moved to `@/lib/types`.

### R04 — drizzle-orm not installed
**Was:** `drizzle-orm` in `package.json` but not in `node_modules`.
**Fixed:** `npm install drizzle-orm`
