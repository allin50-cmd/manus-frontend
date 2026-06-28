# Consolidation Safe Cleanup Checklist

**Date:** 2026-06-28  
**Status:** Ready for implementation  
**Authority:** MANUS-CONSOLIDATION-AUDIT.md  
**Risk Level:** LOW (with verification gates)

---

## Overview

This checklist provides step-by-step verification and cleanup steps in safe, reversible phases. Each phase can be completed independently. Rollback is possible until Phase 4 completes.

---

## Phase 0: Pre-Cleanup Verification ✓ MUST COMPLETE

**All items must be checked before ANY cleanup actions.**

### Code Verification

- [ ] Pull latest main and jolly-hawking branches
  ```bash
  git fetch origin main claude/jolly-hawking-xqufwo
  ```

- [ ] Verify Phase 4 forms on MacBook with local database
  - Run E2E test script: `LOCAL_E2E_TESTING_GUIDE.md`
  - All 7 forms should create records without errors
  - All forms should redirect correctly
  - Document results in a test log

- [ ] Verify build on jolly-hawking
  ```bash
  git checkout claude/jolly-hawking-xqufwo
  npm install
  npm run type-check
  npm run build
  ```
  - Should complete without errors
  - If errors: STOP — do not proceed

- [ ] Verify build on main
  ```bash
  git checkout main
  npm run build
  ```
  - Should complete without errors

### Repository Verification

- [ ] Confirm no uncommitted changes
  ```bash
  git status
  ```
  - Should output: "nothing to commit, working tree clean"

- [ ] Confirm main and jolly-hawking are in sync with origin
  ```bash
  git fetch origin
  git status
  ```
  - Both branches should show "up to date"

- [ ] Check git log on jolly-hawking
  ```bash
  git log --oneline -n 10
  ```
  - Verify Phase 4 commit messages present

### Stakeholder Sign-off

- [ ] User has reviewed consolidation plan
- [ ] User has approved canonical branch choice (jolly-hawking)
- [ ] User has confirmed no other critical work in progress
- [ ] User has confirmed database backup exists (Supabase)

---

## Phase 1: ORM Migration (REVERSIBLE) ⚠ LOW RISK

**Can be rolled back by restoring Prisma files from git**

### Pre-Flight Checks

- [ ] Verify no Prisma imports in active code
  ```bash
  grep -r "@prisma/client" app/ lib/ --include="*.ts" --include="*.tsx"
  ```
  - Should return ZERO results (or only in comments)
  - If results found: investigate before proceeding

- [ ] Verify `lib/db.ts` uses only Drizzle
  ```bash
  grep -c "import.*drizzle\|from.*drizzle" lib/db.ts
  ```
  - Should return 1+ (has Drizzle import)

### Deletion Steps

- [ ] Switch to jolly-hawking branch
  ```bash
  git checkout claude/jolly-hawking-xqufwo
  ```

- [ ] Delete Prisma schema file
  ```bash
  rm prisma/schema.prisma
  ```
  - Verify deletion: `ls prisma/` should NOT contain schema.prisma

- [ ] Delete Prisma .env (if exists)
  ```bash
  rm -f prisma/.env
  ```

- [ ] Update package.json: Remove Prisma dependency
  - Edit `package.json`
  - Find `"@prisma/client": "..."` in dependencies
  - Delete that line entirely
  - Save file

- [ ] Update npm lock file
  ```bash
  npm install
  ```
  - This regenerates package-lock.json
  - Should remove Prisma references

### Verification Steps

- [ ] Type check passes
  ```bash
  npm run type-check
  ```
  - Should complete with zero errors

- [ ] Build passes
  ```bash
  npm run build
  ```
  - Should complete without Prisma errors
  - If errors: **ROLLBACK** (see below)

- [ ] Verify zero Prisma references
  ```bash
  grep -r "prisma" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v "^Binary" | wc -l
  ```
  - Should be 0 (or only in comments/docs)

### Commit Phase 1

```bash
git add -A
git commit -m "chore: remove prisma orm — drizzle is canonical"
```

- [ ] Commit created successfully
- [ ] Commit message is clear

---

## Phase 2: Branch Consolidation (REVERSIBLE IF MAIN UNCHANGED) ⚠ MEDIUM RISK

**Can be rolled back if main hasn't been modified since backup tag**

### Pre-Flight Checks

- [ ] Confirm main branch has no recent changes
  ```bash
  git log -n 1 --format="%h %ai %s" main
  ```
  - Commit should be more than 2 hours old
  - If very recent: contact user for confirmation

- [ ] Create backup tag FIRST
  ```bash
  git tag backup/main-before-phase4 main
  git push origin backup/main-before-phase4
  ```
  - Verify tag exists: `git tag -l | grep backup`

### Merge Steps

- [ ] Checkout main branch
  ```bash
  git checkout main
  git pull origin main
  ```
  - Confirm main is up to date

- [ ] Merge jolly-hawking with no-ff (creates merge commit)
  ```bash
  git merge --no-ff origin/claude/jolly-hawking-xqufwo
  ```
  - If conflicts: **STOP — resolve manually or rollback**
  - If no conflicts: Continue

- [ ] Verify merge commit created
  ```bash
  git log --oneline -n 1
  ```
  - Should show merge commit: "Merge branch 'claude/jolly-hawking-xqufwo' into main"

### Verification Steps

- [ ] Type check passes
  ```bash
  npm run type-check
  ```
  - Zero errors

- [ ] Build passes
  ```bash
  npm run build
  ```
  - Zero errors
  - If build fails: **ROLLBACK** (see below)

- [ ] Verify Phase 4 files present
  ```bash
  git ls-tree -r HEAD --name-only | grep "app/os/.*/new/page.tsx" | wc -l
  ```
  - Should be 7+ (7 form pages)

### Commit Phase 2

- [ ] Push merged main
  ```bash
  git push origin main
  ```
  - Verify push successful: no errors
  - [ ] Verify on GitHub: main should show new merge commit

---

## Phase 3: Archive SheetOps Variant (SAFE) ✓ ZERO RISK

**Preserves all code in git history. Fully reversible.**

### Documentation Step

- [ ] Create archive analysis document
  ```bash
  cp docs/SHEETOPS-INCOMPATIBILITY-ANALYSIS.md \
     docs/archive/sheetops-incompatibility-analysis.md
  ```

### Branch Rename (Optional but Recommended)

- [ ] Rename local branch
  ```bash
  git branch -m claude/ultracore-sheetops-mvp-wAwwp \
             archived/sheetops-incompatible-variant
  ```
  - Verify rename: `git branch -a | grep sheetops`

- [ ] Push renamed branch
  ```bash
  git push origin archived/sheetops-incompatible-variant
  ```

- [ ] Delete old branch name from origin
  ```bash
  git push origin --delete claude/ultracore-sheetops-mvp-wAwwp
  ```

### Branch Protection (Optional but Recommended)

- [ ] Update branch protection rules in GitHub
  - Go to Settings → Branches → Branch protection rules
  - Add rule: prevent merges from `archived/*` branches to `main`
  - Require status checks to pass before merge

### DECISION_LOG Entry

- [ ] Check `docs/DECISION_LOG.md`
  - Should contain new entry: "Archive SheetOps Variant"
  - Verify decision is documented

---

## Phase 4: Delete Stale Branches (LOWEST PRIORITY, CAN DEFER) ⚠ HIGH RISK

**This phase is OPTIONAL and can be deferred. Offers least value, highest risk of deleting something important.**

### Pre-Flight Checks

- [ ] Confirm no open PRs from stale branches
  ```bash
  # GitHub: Check PR list, filter by base=main
  ```

- [ ] Identify branches to delete (use git)
  ```bash
  git branch --sort=-committerdate -a | tail -50
  ```
  - Most recent branch at top
  - Branches with commits >3 months ago are candidates for deletion

### Batch 1: FineGuard Experimental Branches (8 branches)

- [ ] Delete in one command
  ```bash
  git push origin --delete \
    claude/fineguard-2026-reposition-n8oro2 \
    claude/fineguard-core-logic-U3zDV \
    claude/fineguard-dashboard-n0ZCK \
    claude/fineguard-frontend-build-rKW3U \
    claude/fineguard-homepage-clean \
    claude/fineguard-landing-page-K3Jvt \
    claude/fineguard-pilot-execution-DXFpY \
    claude/fineguard-pilot-execution-anMTm
  ```

- [ ] Verify deletions
  ```bash
  git branch -a | grep fineguard | wc -l
  ```
  - Should decrease by 8

- [ ] Wait 5 minutes before next batch

### Batch 2: Azure Experimental Branches (6 branches)

- [ ] Delete
  ```bash
  git push origin --delete \
    claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f \
    claude/azure-functions-setup-90AgJ \
    claude/azure-minimal-deployment-PI1i9 \
    claude/azure-static-web-apps-workflow-LerLk
  ```

- [ ] Wait 5 minutes

### Batch 3: PIE & Build Branches (9 branches)

- [ ] Delete pie-* branches
  ```bash
  git push origin --delete \
    claude/pie-lite-pass1-installer-hJSUt
  ```

- [ ] Delete build-* branches
  ```bash
  git push origin --delete \
    claude/build-superlawclerk-engine-FvlUa \
    claude/build-ultai-intake-app-fO8JN \
    claude/decode-scraper-pipeline-NzWy2 \
    claude/deploy-production-stack-NOGUc \
    claude/deploy-production-stack-mbwUb
  ```

- [ ] Wait 5 minutes

### Batch 4: Misc Experimental Branches (10+ branches)

- [ ] Delete remaining experimental branches
  ```bash
  git push origin --delete \
    claude/add-landing-signup-flow-jcPsm \
    claude/garage-acquisition-radar-WN7Ep \
    claude/graceful-failure-implementation-Rk3IK \
    claude/iteration-4-hardened-production-ZJxxR \
    claude/legal-document-templates-7XAsT \
    claude/mobile-pwa-scaffold-nqupg \
    claude/review-projects-sYfUu \
    claude/unified-intelligence-os-lwLdp
  ```

- [ ] Wait 5 minutes

### Batch 5: Auto-Generated Branches (5 branches)

- [ ] Delete worktree-agent-* branches
  ```bash
  git push origin --delete \
    worktree-agent-a124afe29c3e324cb \
    worktree-agent-a1b7d5699997404a1 \
    worktree-agent-a5adbbbf3c9689663 \
    worktree-agent-a6318a4d48327183b \
    worktree-agent-afebc44d87a627e9c
  ```

- [ ] Wait 5 minutes

### Batch 6: Copilot Branches (3 branches)

- [ ] Delete copilot/* branches
  ```bash
  git push origin --delete \
    copilot/fix-docker-build-and-deployment \
    copilot/fix-docker-build-and-pr-workflow \
    copilot/fix-docker-build-and-workflow
  ```

- [ ] Wait 5 minutes

### Batch 7: Feature & Fix Branches (4 branches)

- [ ] Delete
  ```bash
  git push origin --delete \
    feat/graceful-failure \
    feat/operator-supabase-auth \
    feat/pie-fineguard-link \
    feat/pie-ingestion \
    fix/remove-openbrain
  ```

- [ ] Wait 5 minutes

### Final Verification

- [ ] Count remaining branches
  ```bash
  git branch -a | grep -v "HEAD" | wc -l
  ```
  - Should be ~5 (main, fineguard/production, archived/*, gh-pages, future/*)

- [ ] List remaining branches
  ```bash
  git branch -a | grep -v "HEAD\|remotes/origin/main"
  ```
  - Only essential/archived branches remain

- [ ] Document cleanup in `docs/CONSOLIDATION_CLEANUP_LOG.md`
  ```
  Date: 2026-06-28
  Deleted: 55 branches
  Remaining: 5 branches (main, fineguard/production, archived/sheetops, gh-pages, future/*)
  ```

---

## Phase 5: Vercel Consolidation (REQUIRES USER DECISION) ⚠ HIGH RISK

**This phase requires stakeholder decisions and cannot proceed without clarification.**

### Prerequisites (User Must Provide)

- [ ] User confirms which Vercel project receives production traffic
- [ ] User confirms production branch (assumed: main)
- [ ] User confirms if fineguard/production should be kept separate
- [ ] User confirms staging requirements (permanent vs on-demand)
- [ ] User has access to Vercel dashboard or has provided API token

### If Prerequisites Not Met

**STOP and ask user to provide:**
1. Current Vercel project names and domains
2. Which project(s) receive traffic
3. Which should be consolidated vs kept separate

### Contingent Cleanup (Once User Clarifies)

- [ ] Create Vercel deployment inventory
  ```bash
  mkdir -p docs/vercel-audit
  touch docs/vercel-audit/current-deployments.md
  # User fills in actual project list
  ```

- [ ] Delete non-essential projects
  - Via Vercel dashboard: Settings → Projects → Delete
  - Not reversible — confirm with user before each deletion

- [ ] Create staging branch (if needed)
  ```bash
  git checkout -b develop
  git push origin develop
  ```
  - Connect in Vercel to new staging project

- [ ] Update CLAUDE.md with Vercel documentation

---

## Rollback Procedure

**If anything fails before Phase 4 completes:**

### Rollback Phase 1 (ORM deletion)

```bash
git reset --hard HEAD~1       # Undo ORM deletion commit
git restore prisma/           # Restore Prisma files from git
npm install                   # Reinstall Prisma client
npm run type-check            # Verify
npm run build
```

### Rollback Phase 2 (Branch merge)

```bash
git checkout main
git reset --hard backup/main-before-phase4
git push origin main --force-with-lease
```

**Important:** Only use `--force-with-lease` on main if no other pushes have happened since backup tag was created.

### Rollback Phase 3 (SheetOps archival)

```bash
git branch -m archived/sheetops-incompatible-variant \
           claude/ultracore-sheetops-mvp-wAwwp
git push origin claude/ultracore-sheetops-mvp-wAwwp
git push origin --delete archived/sheetops-incompatible-variant
```

---

## Completion Checklist

Once all phases are complete:

- [ ] All Phase 0 pre-flight checks passed
- [ ] Phase 1 (ORM) complete and verified
- [ ] Phase 2 (branch) complete and verified
- [ ] Phase 3 (SheetOps) archived
- [ ] Phase 4 (stale branches) deleted (optional but recommended)
- [ ] Phase 5 (Vercel) consolidated (pending user decisions)
- [ ] DECISION_LOG.md updated with all decisions
- [ ] CLAUDE.md updated with consolidation results
- [ ] All documentation files created and reviewed
- [ ] User has confirmed completion on production

---

## Success Criteria

Consolidation is COMPLETE when:

✓ Canonical branch = jolly-hawking (merged to main)  
✓ Phase 4 forms verified locally on MacBook  
✓ Prisma ORM deleted, Drizzle canonical  
✓ SheetOps variant archived  
✓ Stale branches deleted (optional)  
✓ Vercel consolidated to 2–3 projects  
✓ All documentation updated  
✓ Build passes on new main  
✓ No regressions in existing modules  

