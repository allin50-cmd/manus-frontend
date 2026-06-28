# Phase 3 — Merge Strategy

**Date:** 2026-06-28 (updated after canonical branch correction)  
**Canonical target:** main  
**Canonical source:** chore/drizzle-full-migration  
**Authority:** Phase 1 evidence superseded by user-verified build evidence (2026-06-28)

---

## Canonical Branch Correction

The original Phase 2 recommendation named `claude/jolly-hawking-xqufwo` as canonical.  
**This was wrong.** The user provided evidence that `chore/drizzle-full-migration` is the correct canonical branch:

| Check | Result on chore/drizzle-full-migration |
|---|---|
| `npm run type-check` | ✅ Passes |
| `npm run build` | ✅ Passes |
| `npm test` | ✅ 130/130 pass |
| Phase 4 Sprint 1 forms | ✅ Present (commit 57c005ad) |

**`claude/jolly-hawking-xqufwo` is now a source branch only** — it is not a merge target.  
Features from it are selectively extracted into `chore/drizzle-full-migration`, not merged wholesale.

---

## What to Promote

`chore/drizzle-full-migration` → `main`

The branch contains:
1. Full Drizzle migration work (db/schema.ts, db/migrations/)
2. Prisma still present as active ORM (lib/db.ts uses PrismaClient) — migration in progress
3. Phase 4 Sprint 1 create forms (7 pages + 1 API endpoint, commit 57c005ad)
4. SheetOps-origin unique routes (alert delivery, voice, partnerships, etc.)
5. All passing TypeScript checks, build, and 130 tests

---

## Promotion Procedure

### Pre-Promotion Verification (5 minutes)

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Check drizzle-full-migration state
git fetch origin chore/drizzle-full-migration
git log --oneline main..origin/chore/drizzle-full-migration

# 3. Confirm build passes on the branch
git checkout chore/drizzle-full-migration
npm ci
npm run type-check
npm run build
npm test
```

### Promote (2 minutes)

```bash
# Create backup tag first
git tag backup/pre-promotion-main main
git push origin backup/pre-promotion-main

# Merge with explicit merge commit (preserves history)
git checkout main
git merge --no-ff origin/chore/drizzle-full-migration \
  -m "merge: promote chore/drizzle-full-migration as canonical codebase"
```

### Post-Promotion Verification (10 minutes)

```bash
rm -rf .next
npm run type-check
npm run build
npm test
```

### Push

```bash
git push origin main
```

Vercel will auto-deploy from main.

---

## Role of claude/jolly-hawking-xqufwo After Promotion

`jolly-hawking` is a **source branch for selective extraction only**. It contains:
- Phase 1 & 2 comparison documents
- Consolidation audit documentation (Phases 3–7)
- Earlier versions of some form pages (already superseded by 57c005ad on drizzle-full-migration)

**Do NOT merge jolly-hawking wholesale into drizzle-full-migration or main.**  
Extract individual files or commits only, after verifying they are not already present.

---

## Conflict Resolution Plan

If conflicts occur during promotion:

### General Rule

Prefer `chore/drizzle-full-migration` content over `main` content for any code file.  
`main` may have additive-only changes (button links, etc.) that need to be manually reconciled.

### Package.json / package-lock.json

```bash
# Accept drizzle-full-migration's package.json (it's the canonical one)
git checkout --ours package.json
npm install
git add package.json package-lock.json
```

---

## After Promotion: Cleanup

1. Archive `claude/jolly-hawking-xqufwo` — work is now documented and superseded
2. Update `ai/project-memory.md` with new canonical state
3. Delete backup tag after 24 hours of stable production:
   ```bash
   git push origin --delete backup/pre-promotion-main
   ```

**Do NOT delete Vercel projects yet.**  
**Do NOT delete Prisma yet** (active ORM on chore/drizzle-full-migration).

---

## Success Criteria

Promotion is complete when:

- [ ] `git log --oneline -10 main` shows Phase 4 form commits and Drizzle migration work
- [ ] `npm run type-check` passes on merged main
- [ ] `npm run build` passes on merged main
- [ ] `npm test` passes 130/130
- [ ] Vercel auto-deploys successfully
- [ ] All 7 form pages accessible at /os/*/new routes
- [ ] `/api/os/message-threads` endpoint returns 200 on POST
