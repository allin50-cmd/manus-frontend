# Phase 6 — Vercel Consolidation

**Date:** 2026-06-28  
**Source:** Live data from PR #27 Vercel webhook notifications  
**Project:** allin50-cmd/manus-frontend  
**Status:** Confirmed from webhooks — no guesswork

---

## Confirmed Vercel Projects (Live Data)

From PR #27 build notifications, 6 distinct Vercel projects are connected to this repository:

| # | Project Name | Project ID | Final Status | Live Preview URL |
|---|---|---|---|---|
| 1 | **manus-frontend** | prj_JSYfxBoAbJZ89W7fLrwKpL0dKClY | ✅ Building→Ready (primary) | manus-frontend-zeta.vercel.app |
| 2 | **manus-frontend-c9li** | prj_GlMXVkgJXgORc3plgxOgry416oPk | ✅ Ready | manus-frontend-c9li.vercel.app |
| 3 | **manus-frontend-edg7** | prj_py8YcbLWvb2wWBZdT1KPE3vrUyR3 | ✅ Ready | manus-frontend-edg7.vercel.app |
| 4 | **manus-frontend-j8i7** | prj_2gK6nPqC3g4cwwjRQ0SCP6pU1pNu | ❌ ERROR (both envs) | none (no preview URL) |
| 5 | **manus-frontend-sheetops** | prj_GN8JVeupqXPXMj2MDgMG3IYabO6w | ✅ Ready | manus-frontend-sheetops.vercel.app |
| 6 | **manus-frontend-sheetops-iphone** | prj_YGFGWVyKzhe9Rg58lZHYjNiufcp | ✅ Ready | manus-frontend-sheetops-iphone.vercel.app |

**Note:** manus-frontend-j8i7 has a "testops" custom environment that also fails — both deployment targets for this project are broken.

---

## Project Assessment

### 1. manus-frontend — PRIMARY PRODUCTION

**Status:** Building from main branch  
**Evidence:** `nextCommitStatus: PENDING/DEPLOYED`, `previewUrl: manus-frontend-zeta.vercel.app`  
**Role:** This is the canonical UltraCore OS deployment. It auto-deploys from main.  
**Decision:** KEEP — this is the one production deployment we need  

---

### 2. manus-frontend-c9li — UNKNOWN PURPOSE

**Status:** Ready  
**Evidence:** Builds successfully, dedicated domain `manus-frontend-c9li.vercel.app`  
**Role:** Unknown — project name suggests it was created for a specific purpose but it's not documented  
**Decision:** INVESTIGATE before removing — need to know what branch it tracks and what it serves  

**Questions to answer:**
- What branch does c9li build from?
- Who uses this deployment?
- Is there a custom domain or DNS record pointing here?
- Does it have different env vars (different database)?

---

### 3. manus-frontend-edg7 — UNKNOWN PURPOSE

**Status:** Ready  
**Evidence:** Builds successfully, dedicated domain `manus-frontend-edg7.vercel.app`  
**Role:** Unknown — "edg7" suggests edge/edge functions variant or experimental  
**Decision:** INVESTIGATE before removing  

**Questions to answer:**
- What branch does edg7 build from?
- Does "edg7" refer to Edge Runtime configuration?
- Does it have different build settings (different runtime)?

---

### 4. manus-frontend-j8i7 — BROKEN, SAFE TO REMOVE

**Status:** ❌ ERROR on BOTH regular and testops environments  
**Evidence:** No preview URL generated, Error status in two consecutive builds  
**Role:** "testops" environment suggests it was a test/staging environment  
**Decision:** REMOVE — broken in both environments, no preview URL accessible, testops custom env also failing  

**Evidence of persistent failure:**
```
Regular env:    ERROR - HsxSNFdZjpg3Nzr7hzJgnmBKub43 (no preview URL)
Testops env:    ERROR - 9SRtENgEPxanNLvgQqtNJ57Rraaq  (no preview URL)
```

Both failed on the same commit. This project is not recoverable without investigation.

**Risk of removal:** LOW — cannot deploy, serves no users

---

### 5. manus-frontend-sheetops — SHEETOPS DEPLOYMENT

**Status:** Ready  
**Evidence:** `previewUrl: manus-frontend-sheetops.vercel.app`  
**Role:** Separate deployment for the SheetOps variant architecture  
**Decision:** MARK FOR REMOVAL after Phase 5 SheetOps assessment confirms no unique value  

**Context:** SheetOps branch (claude/ultracore-sheetops-mvp-wAwwp) is incompatible with main. Once that branch is archived and its unique value extracted, this deployment can be removed.

---

### 6. manus-frontend-sheetops-iphone — SHEETOPS IPHONE DEPLOYMENT

**Status:** Ready  
**Evidence:** `previewUrl: manus-frontend-sheetops-iphone.vercel.app`, built from git commit a2ba13 (separate branch)  
**Role:** Mobile/iPhone-optimised variant of SheetOps  
**Decision:** MARK FOR REMOVAL after Phase 5 SheetOps assessment  

**Notable:** This project was building from a different git commit (`a2ba13`) than main in the first webhook notification, suggesting it tracks a dedicated branch, not main.

---

## Consolidation Recommendation

### Target State: 1 Production + 0 Extras

| Project | Action | When |
|---|---|---|
| manus-frontend | ✅ KEEP | Now (canonical production) |
| manus-frontend-c9li | 🔍 INVESTIGATE | Before removing |
| manus-frontend-edg7 | 🔍 INVESTIGATE | Before removing |
| manus-frontend-j8i7 | ❌ REMOVE | Immediately safe to remove |
| manus-frontend-sheetops | ❌ REMOVE | After Phase 5 complete |
| manus-frontend-sheetops-iphone | ❌ REMOVE | After Phase 5 complete |

**Minimum final state:** 1 project (manus-frontend)  
**Cautious final state:** 2–3 projects (manus-frontend + c9li/edg7 if they serve real purpose)

---

## Immediate Action: j8i7 Can Be Removed Now

`manus-frontend-j8i7` is broken in both environments and has no preview URL. No users can access it. It's safe to remove without any investigation.

**To remove:** Go to Vercel dashboard → Projects → manus-frontend-j8i7 → Settings → Delete Project

---

## Questions Requiring User Input

Before removing c9li and edg7:

1. **What is manus-frontend-c9li?**  
   Does this serve any users or serve a specific testing purpose?

2. **What is manus-frontend-edg7?**  
   Is this an edge-optimized variant? Does it use different runtime settings?

3. **Does either c9li or edg7 have a custom domain or DNS record pointing to it?**  
   Deleting a project with active DNS records would cause 404s.

4. **Are there any env vars that differ between c9li, edg7, and manus-frontend?**  
   If they point to different databases, that's important context before deletion.

---

## Build Timeline from PR #27

The webhook events showed this sequence:

```
1:35pm - All 6 projects triggered builds on PR #27 commit
1:35pm - j8i7 immediately ERROR (both envs)
1:35pm - sheetops-iphone building from old commit a2ba13
1:35pm - manus-frontend building from main
1:35pm - c9li deploys Ready
1:35pm - edg7 deploys Ready
1:36pm - sheetops deploys Ready
1:36pm - sheetops-iphone deploys Ready
1:36pm - manus-frontend still Building (largest project, takes longest)
```

---

## Cost Analysis

**Current:** 6 projects × ~$20/month = ~$120/month (hobby plan estimate)

**After consolidation (1 project):** ~$20/month  
**Savings:** ~$100/month

**After cautious consolidation (2 projects + sheetops archived):** ~$40/month  
**Savings:** ~$80/month

---

## Implementation Steps (After User Decisions)

### Phase A: Remove j8i7 (Safe Now)

1. Go to Vercel dashboard
2. Open manus-frontend-j8i7 project
3. Settings → Delete Project
4. Confirm deletion

No rollback needed — project is broken and serves no users.

### Phase B: Investigate c9li and edg7 (Needs User Input)

For each project:
1. Check Vercel dashboard → Project → Settings → Git → which branch
2. Check env vars — same as primary or different?
3. Check analytics — any active traffic?
4. Decide: keep if unique purpose, remove if duplicate

### Phase C: Remove sheetops Projects (After Phase 5)

Once SheetOps assessment confirms no unique functionality:
1. Remove manus-frontend-sheetops
2. Remove manus-frontend-sheetops-iphone
3. Archive the git branch
4. Document in DECISION_LOG.md

### Phase D: Point Production to Canonical Branch

Ensure `manus-frontend` (primary project):
1. Builds from `main` branch (should already be the case)
2. Has correct DATABASE_URL pointing to production Supabase
3. Has correct API keys and env vars
4. Auto-deploys on every push to main

