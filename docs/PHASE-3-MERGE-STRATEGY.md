# Phase 3 — Merge Strategy

**Date:** 2026-06-28  
**Canonical target:** main  
**Source of new work:** claude/jolly-hawking-xqufwo  
**Authority:** Phase 1 evidence, Phase 2 recommendation

---

## Context

`claude/jolly-hawking-xqufwo` is 5 commits ahead of main (and main is ahead by commits from other merges). Both share the same common ancestor `f90dfd6`.

The 5 commits on jolly-hawking are:
1. Phase 4 Sprint 1 create forms (contacts, tasks, calls, messages, quotes, invoices, documents)
2. New API endpoint: POST /api/os/message-threads
3. List pages wired to new form routes
4. Consolidation audit documentation
5. Phase 1 & Phase 2 comparison documents

---

## What to Merge

### Merge Set 1: Phase 4 Forms (MERGE — adds value, no overlap)

| New File | Adds |
|---|---|
| `app/os/contacts/new/page.tsx` | Contact create form |
| `app/os/tasks/new/page.tsx` | Task create form |
| `app/os/calls/new/page.tsx` | Call create form |
| `app/os/messages/new/page.tsx` | Message create form |
| `app/os/money/quotes/new/page.tsx` | Quote create form |
| `app/os/money/invoices/new/page.tsx` | Invoice create form |
| `app/os/documents/upload/page.tsx` | Document upload form |
| `app/api/os/message-threads/route.ts` | Thread creation API |

**Conflicts possible:** No — all new files, none overlap with existing routes.

### Merge Set 2: List Page Updates (MERGE — wires buttons to forms)

| Modified File | Change |
|---|---|
| `app/os/contacts/page.tsx` | "Add Contact" button → Link to /os/contacts/new |
| `app/os/tasks/page.tsx` | "Add Task" button → Link to /os/tasks/new |
| `app/os/calls/page.tsx` | "Log Call" button → Link to /os/calls/new |
| `app/os/messages/page.tsx` | "Compose" button → Link to /os/messages/new |
| `app/os/documents/page.tsx` | "Upload" button → Link to /os/documents/upload |
| `app/os/money/page.tsx` | "New Invoice" → Link, added "New Quote" → Link |

**Conflicts possible:** Low — modified files, but changes are additive (button → Link). Main branch should have same files.

### Merge Set 3: Documentation (MERGE — informational only)

All docs in `docs/` directory. No conflicts possible.

---

## What NOT to Merge

### SheetOps Branch — DO NOT MERGE

**Why:** Incompatible architecture (Prisma-only, different API structure). See `PHASE-5-SHEETOPS-ASSESSMENT.md`.

### Drizzle-Full-Migration Branch — DO NOT MERGE

**Why:** Branch is broken. Cannot install, 212 TypeScript errors, build fails. It was an abandoned migration attempt.

---

## Merge Procedure

### Pre-Merge Verification (5 minutes)

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Check jolly-hawking is also up to date
git fetch origin claude/jolly-hawking-xqufwo

# 3. Preview what will merge (no commits)
git log --oneline main..origin/claude/jolly-hawking-xqufwo
```

Expected output: 5 commits (the Phase 4 work).

### Merge (2 minutes)

```bash
# Create backup tag first
git tag backup/pre-phase4-merge main
git push origin backup/pre-phase4-merge

# Merge with explicit merge commit (preserves history)
git merge --no-ff origin/claude/jolly-hawking-xqufwo \
  -m "merge: incorporate Phase 4 Sprint 1 create forms and consolidation audit"
```

### Post-Merge Verification (10 minutes)

```bash
# Clean build cache to avoid stale TypeScript issues
rm -rf .next

# Verify TypeScript
npm run type-check

# Verify build
npm run build
```

Both should pass (jolly-hawking passes both cleanly).

### Push (1 minute)

```bash
git push origin main
```

Vercel will auto-deploy from main.

---

## Conflict Resolution Plan

If conflicts occur during merge:

### Conflict in list page files (likely)

If main has changed `app/os/contacts/page.tsx` since jolly-hawking branched:

```bash
# Open conflict file, review both sides
# Keep main's structure, apply jolly's Link button change only
git add app/os/contacts/page.tsx
```

**Rule:** Preserve main's content, add only the Link import and button→Link conversion from jolly-hawking.

### Conflict in package.json or package-lock.json (possible)

```bash
# Accept main's package.json changes
git checkout --ours package.json
# Re-apply any jolly-hawking dependencies (if any — unlikely)
npm install
git add package.json package-lock.json
```

---

## After Merge: Cleanup

1. Delete jolly-hawking branch (work is in main)
   ```bash
   git push origin --delete claude/jolly-hawking-xqufwo
   ```

2. Update ai/project-memory.md with new canonical state

3. Delete backup tag after 24 hours of stable production
   ```bash
   git push origin --delete backup/pre-phase4-merge
   ```

---

## Success Criteria

Merge is complete when:

- [ ] `git log --oneline -10 main` shows Phase 4 form commits
- [ ] `npm run type-check` passes on merged main
- [ ] `npm run build` passes on merged main
- [ ] Vercel auto-deploys successfully (watch manus-frontend project)
- [ ] All 7 form pages accessible at /os/*/new routes
- [ ] `/api/os/message-threads` endpoint returns 200 on POST

