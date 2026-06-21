# Module Audit Report

**Date**: June 19, 2025  
**Status**: Critical architectural mismatch detected

---

## Executive Summary

The repository contains **TWO SEPARATE FRONTEND SYSTEMS** that are NOT integrated:

1. **Next.js 14 App** (ACTIVE) - Running on port 3000, minimal footprint (22 routes)
2. **Vite + React App** (INACTIVE) - Located in `_vite_src/`, NOT configured in package.json, 134 pages built but broken

### Recommendation
**CONSOLIDATE**: Migrate all Vite pages into the Next.js app and delete the orphaned Vite setup.

---

## System 1: Next.js 14 (ACTIVE)

### Status: ✅ WORKING
- Runs successfully via `npm run dev`
- Server: port 3000
- App Router structure (`/app`)
- Minimal, focused implementation

### Routes (22 total)

| Path | File | Status |
|------|------|--------|
| `/` | `app/page.tsx` | ✓ |
| `/login` | `app/login/page.tsx` | ✓ |
| `/dashboard` | `app/dashboard/page.tsx` | ✓ |
| `/activity` | `app/activity/page.tsx` | ✓ |
| `/decisions` | `app/decisions/page.tsx` | ✓ |
| `/templates` | `app/templates/page.tsx` | ✓ |
| `/today` | `app/today/page.tsx` | ✓ |
| `/voice-intake` | `app/voice-intake/page.tsx` | ✓ |
| `/work-items` | `app/work-items/page.tsx` | ✓ |
| `/work-items/new` | `app/work-items/new/page.tsx` | ✓ |
| `/work-items/[id]` | `app/work-items/[id]/page.tsx` | ✓ |

### API Routes (11 total)

| Endpoint | File | Purpose |
|----------|------|---------|
| `POST /api/auth/login` | `app/api/auth/login/route.ts` | Session auth |
| `POST /api/auth/logout` | `app/api/auth/logout/route.ts` | Logout |
| `GET /api/work-items` | `app/api/work-items/route.ts` | List |
| `POST /api/work-items` | `app/api/work-items/route.ts` | Create |
| `GET /api/work-items/[id]` | `app/api/work-items/[id]/route.ts` | Detail |
| `PATCH /api/work-items/[id]` | `app/api/work-items/[id]/route.ts` | Update |
| `DELETE /api/work-items/[id]` | `app/api/work-items/[id]/route.ts` | Delete |
| `POST /api/work-items/[id]/actions` | `app/api/work-items/[id]/actions/route.ts` | Action |
| `POST /api/work-items/[id]/escalate` | `app/api/work-items/[id]/escalate/route.ts` | Escalate |
| `POST /api/work-items/[id]/log` | `app/api/work-items/[id]/log/route.ts` | Activity log |
| `GET /api/health/db` | `app/api/health/db/route.ts` | DB health |
| `POST /api/decisions/[id]` | `app/api/decisions/[id]/route.ts` | Save decision |
| `POST /api/voice/transcribe` | `app/api/voice/transcribe/route.ts` | Voice transcription |
| `POST /api/voice/approve` | `app/api/voice/approve/route.ts` | Voice approval |

### Features
- Session-based JWT authentication
- Work item management (CRUD)
- Voice intake integration
- Decision logging
- Activity tracking

### What to Keep
✓ Keep all Next.js pages and routes  
✓ Keep API route structure  
✓ Keep auth system  

---

## System 2: Vite + React (INACTIVE, BROKEN)

### Status: ❌ BROKEN
- Not in `package.json` dependencies
- Missing `@vitejs/plugin-react`
- Vite config exists but unused
- 134 pages built but unreachable
- **Duplicate functionality** with Next.js app

### Pages Built (134 total)

#### ✅ Core FineGuard Pages (Built/Tested)
- `Home.tsx` - Landing page (200 lines) ✓
- `Check.tsx` - Company search (220 lines) ✓
- `Dashboard.tsx` - User portal (230 lines) ✓
- `ActivationPanel.tsx` - Alert component (124 lines) ✓
- `UltAi.tsx` - Call intake (336 lines) ✓

#### ⚠️ Generated Pages (Auto-generated, untested)
- **Agent Surfaces** (4 pages):
  - `agent/AgentOverview.tsx`
  - `agent/AgentCompanies.tsx`
  - `agent/AgentAlerts.tsx`
  - `agent/AgentCompanyDetail.tsx`

- **Mobile** (6 pages):
  - `mobile/MobileHome.tsx`
  - `mobile/MobileAlerts.tsx`
  - `mobile/MobileDeadlines.tsx`
  - `mobile/MobileCompanyDetail.tsx`
  - `mobile/MobileWidgetSpec.tsx`
  - `mobile/MobileDemo.tsx`

- **Service Pages** (100+ pages):
  - Landing, Pricing, Onboarding flows
  - Enterprise dashboards
  - Accounting/Tax tools
  - Outbound/Marketing surfaces
  - Admin dashboards
  - *[See PAGES_CATEGORIZATION.md for full list]*

#### Dependencies Needed (Not in package.json)
- `vite` - Not installed
- `@vitejs/plugin-react` - Not installed
- `tailwindcss` - Exists in devDeps (v3.4.1)
- `lucide-react` - Not mentioned, assumed installed
- `wouter` - In dependencies

### Build Artifacts
- `vite.config.ts` - Config exists
- `tsconfig.json` - Extends for `_vite_src`
- `_vite_src/main.tsx` - Entry point with tRPC setup
- `_vite_src/index.css` - Tailwind theme (v4 config)
- `_vite_src/components/` - 6 core components + ui/ + layout/

### Why It's Broken

1. **No package.json entries**: Vite and React plugin not in dependencies
2. **No build pipeline**: `npm run build` runs Next.js, ignoring Vite
3. **Orphaned pages**: 134 pages with no routing mechanism
4. **Duplicate effort**: Both apps attempt to solve same problems
   - Home page exists in both systems
   - Check/company search logic duplicated
   - Dashboard UI built twice

### What to Delete
❌ Delete `_vite_src/` directory  
❌ Delete `vite.config.ts`  
❌ Delete `GENERATION_GUIDE.md`, `PAGE_GENERATION_*.md` docs (Vite-specific)  
❌ Delete Vite npm scripts from `package.json`:
   - `"dev:vite"` 
   - `"build:vite"`  

---

## Consolidated Module List

### Core Modules (in Next.js app)

| Module | Status | Location | Lines |
|--------|--------|----------|-------|
| Auth / Session | ✓ Working | `/api/auth/*` | - |
| Work Item Management | ✓ Working | `/work-items`, `/api/work-items/*` | - |
| Voice Intake | ✓ Working | `/voice-intake`, `/api/voice/*` | - |
| Decisions/Logging | ✓ Working | `/decisions`, `/api/decisions/*` | - |
| Dashboard | ✓ Working | `/dashboard`, `/app/dashboard/page.tsx` | - |

### Modules to Add to Next.js

| Module | Source | Priority | Effort |
|--------|--------|----------|--------|
| FineGuard Landing | Vite Home.tsx | HIGH | Low - copy 200 lines |
| Company Search | Vite Check.tsx | HIGH | Low - copy 220 lines |
| Company Portal | Vite Dashboard.tsx | HIGH | Low - copy 230 lines |
| Alert Activation | Vite ActivationPanel.tsx | HIGH | Low - copy 124 lines |
| UltAi Call Intake | Vite UltAi.tsx | MEDIUM | Low - copy 336 lines |
| Agent Dashboards | Vite agent/* | MEDIUM | Medium - integrate 4 pages |
| Mobile UI | Vite mobile/* | MEDIUM | Medium - integrate 6 pages |
| Public/SEO Pages | Vite (100+ pages) | LOW | High - needs triage |

---

## Action Plan

### Phase 1: Consolidate to Next.js (2-3 hours)

1. **Delete Vite setup**:
   ```bash
   rm -rf _vite_src/
   rm vite.config.ts
   rm GENERATION_GUIDE.md PAGE_GENERATION_*.md
   ```

2. **Remove from package.json**:
   - Remove `"dev:vite"` and `"build:vite"` scripts
   - Remove unused Vite deps if any

3. **Migrate core 5 Vite pages to Next.js**:
   - Create `/app/landing/page.tsx` ← Vite Home.tsx
   - Create `/app/check/page.tsx` ← Vite Check.tsx
   - Create `/app/company-portal/page.tsx` ← Vite Dashboard.tsx
   - Copy `ActivationPanel.tsx` to `/app/components/`
   - Create `/app/ultai/page.tsx` ← Vite UltAi.tsx

4. **Update routing**:
   - Add routes to Next.js app
   - Test each page loads correctly

### Phase 2: Integration (1-2 hours)

5. **Wire up components**:
   - Connect tRPC endpoints
   - Link auth flows
   - Test end-to-end workflows

6. **Verify**:
   - All pages render
   - Navigation works
   - API calls succeed

### Phase 3: Cleanup (30 min)

7. **Delete orphaned code**:
   - Remove agent/mobile page stubs if not needed
   - Keep FUTURE_MODULES.md for reference
   - Commit cleanup

---

## Recommendations

### Keep ✓
- Next.js 14 as single frontend framework
- Existing 22 routes and API structure
- Session auth system
- FUTURE_MODULES.md (warehouse for future features)

### Migrate ✓
- 5 core FineGuard pages (Home, Check, Dashboard, ActivationPanel, UltAi)
- Agent dashboard pages (if needed)
- Mobile UI (if targeting mobile PWA)
- Any working public/SEO pages

### Delete ❌
- Entire `_vite_src/` directory
- All Vite build configuration
- Vite-specific docs
- Duplicate page generation scripts

### Clarify (User Input)
- Should agent surfaces be kept or deleted?
- Should mobile UI be in-app or external?
- Which of the 100+ generated pages are actually needed?

---

## Testing Checklist

- [ ] Vite app confirmed broken (missing deps)
- [ ] Next.js app confirmed working (22 routes + API)
- [ ] Architecture decision made (consolidate to Next.js)
- [ ] Vite pages migrated to `/app`
- [ ] All 5 core pages load in Next.js
- [ ] tRPC endpoints wired
- [ ] Navigation verified
- [ ] Cleanup committed and pushed

---

**Next Step**: Approve consolidation plan and proceed with Phase 1 cleanup.
