# Vercel Consolidation Plan

**Date:** 2026-06-28  
**Authority:** MANUS-CONSOLIDATION-AUDIT.md  
**Status:** Planning Phase — Requires User Decision

---

## Current Vercel Status

### Known Projects (based on repository analysis)

The manus-frontend repository likely has 8 Vercel deployments:

1. **manus-frontend (primary production)**
   - Domain: To be confirmed
   - Branch: main (assumed)
   - Status: Active
   - Risk: HIGH if deleted without confirmation

2. **manus-frontend-staging**
   - Domain: staging-*.vercel.app (assumed)
   - Branch: Unknown
   - Status: Unknown
   - Risk: Safe to consolidate

3. **manus-frontend-dev**
   - Domain: dev-*.vercel.app (assumed)
   - Branch: Unknown
   - Status: Likely orphaned
   - Risk: Safe to delete

4. **manus-frontend-preview**
   - Domain: Auto-generated from main project
   - Branch: PR previews
   - Status: Active
   - Risk: Should keep with main project

5. **fineguard-frontend (secondary product)**
   - Domain: To be confirmed
   - Branch: fineguard/production (assumed)
   - Status: Unknown
   - Risk: Requires stakeholder input

6–8. **Three additional projects (unknown)**
   - Likely abandoned experiments or branch previews
   - Low risk to delete

---

## Data-Gathering Steps (BEFORE ANY DELETIONS)

**What we need to determine:**

1. **Which Vercel project receives production traffic?**
   - Is it a custom domain (company.com) or vercel.app subdomain?
   - What DNS records point to it?
   - What is the current deployment URL?

2. **Which branch does the production project build from?**
   - Is it `main`?
   - Is it a different branch?
   - Are there any manual deployments?

3. **Are there any staging/QA deployments currently in use?**
   - Do teams rely on staging-*.vercel.app for testing?
   - Is there a specific branch that should auto-deploy to staging?

4. **Is fineguard/production project still active?**
   - Does it receive traffic?
   - Should it be consolidated to main or kept separate?
   - Does it have its own domain?

5. **What environment variables are set in each project?**
   - DATABASE_URL (could point to test vs production DB)
   - API keys, secrets
   - Feature flags

---

## Target Architecture

### Option A: Minimal (2 Projects)

```
manus-frontend (production)
├── Domain: company.com (or primary vercel.app subdomain)
├── Branch: main
├── Environment: production
└── Auto-deploy: enabled

manus-frontend-staging
├── Domain: staging-manus.vercel.app
├── Branch: develop (new branch)
├── Environment: staging
└── Auto-deploy: enabled
```

**Advantages:** Simple, low cost, clear separation  
**Disadvantages:** No fineguard separation

### Option B: Moderate (3 Projects)

```
manus-frontend (production)
├── Domain: company.com
├── Branch: main
└── Environment: production

manus-frontend-staging
├── Domain: staging-manus.vercel.app
├── Branch: develop
└── Environment: staging

fineguard (secondary product)
├── Domain: compliance-company.com (if applicable)
├── Branch: fineguard/production
└── Environment: production
```

**Advantages:** Keeps fineguard separate if still active  
**Disadvantages:** Requires maintaining fineguard/production branch

### Option C: Full Consolidation (1 Project)

```
manus-frontend (production)
├── Domain: company.com
├── Branches: main (auto-deploy), preview on PR
├── Environment: production
└── Staging: Branch preview deployments on demand
```

**Advantages:** Simplest, lowest cost  
**Disadvantages:** No permanent staging environment, all branches build

---

## Recommended Path Forward

### Step 1: Audit Current Setup (30 minutes)

**Action:** User provides or we discover:
1. Vercel team login
2. List of all projects currently active
3. Which project(s) receive traffic
4. Which branches auto-deploy

**Output:** `docs/vercel-deployment-audit.md` documenting current state

### Step 2: Choose Target Architecture (15 minutes)

**User decision:** Option A, B, or C above?

**Criteria:**
- Is fineguard still actively deployed?
- Does team need permanent staging environment?
- Should staging be always-live or on-demand?

### Step 3: Create Staging Branch (if needed)

**If choosing Option A or B:**

```bash
git checkout -b develop
git push origin develop

# Configure in Vercel:
# - Branch: develop
# - Project: manus-frontend-staging
# - Build: npm run build
# - Root: ./
# - Env vars: TEST DATABASE_URL, test API keys
```

### Step 4: Delete Non-Essential Projects

**Delete (in order, with 5-minute verification between each):**
1. Any projects named *-dev, *-dev-*, *development, *experimental
2. Any projects not receiving traffic
3. Duplicate branch preview projects (if main project handles this)

**Keep:**
1. Primary production project
2. Staging project (if chosen)
3. fineguard project (if still active)

### Step 5: Update Documentation

**Create:** `docs/vercel-deployment-inventory.md`

```markdown
# Vercel Deployment Inventory

## Active Deployments

### Production
- Project: manus-frontend
- Domain: [user fills in]
- Branch: main
- Database: [production]
- Last deploy: [timestamp]

### Staging (if active)
- Project: manus-frontend-staging
- Domain: staging-manus.vercel.app
- Branch: develop
- Database: [staging]

### Secondary (if active)
- Project: fineguard
- Domain: [user fills in]
- Branch: fineguard/production
- Database: [production]
```

### Step 6: Cleanup (with confirmation at each stage)

1. Confirm all non-essential projects deleted
2. Confirm auto-deploys working on essential projects
3. Test production deployment
4. Test staging deployment (if applicable)
5. Update CLAUDE.md with Vercel deployment documentation

---

## Cost Analysis

### Current State
- 8 Vercel projects (hobby plan ~$20/month each)
- Estimated cost: $160/month (if all active)

### Target State (Option A)
- 2 Vercel projects
- Estimated cost: $40/month
- **Savings: $120/month**

### Target State (Option B)
- 3 Vercel projects
- Estimated cost: $60/month
- **Savings: $100/month**

---

## Questions for User

1. What is the production domain for manus-frontend?
2. Is fineguard/production actively deployed and in use?
3. Does the team currently use staging environment? How often?
4. Should staging be permanent or on-demand?
5. Are there any custom domains or wildcard DNS records pointing to Vercel?
6. Who manages Vercel account access? Can they provide dashboard access?

---

## After Consolidation

Update these files:

- **CLAUDE.md:** Add "Vercel Deployments" section
- **DECISION_LOG.md:** Document consolidation decision
- **docs/ARCHITECTURE.md:** Document deployment targets
- **.github/workflows:** Update any deployment scripts

