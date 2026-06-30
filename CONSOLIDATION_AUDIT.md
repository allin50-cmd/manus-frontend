# UltraTech Platform Consolidation Audit

**Date**: June 26, 2026  
**Status**: Ready for Phase 1 consolidation  
**Assessment**: The workspace foundation already exists. We are consolidating, not building.

---

## Executive Summary

**GOOD NEWS**: The platform has a working multi-tenant company workspace structure already in place.

```
/os/workspace/[companyId]
  ├── Overview (companies enabled apps)
  ├── Activity (company event timeline)
  ├── People (contacts)
  ├── Documents (document vault)
  ├── Notifications (alerts & reminders)
  ├── Settings (workspace config)
  └── Apps (app-specific pages)
       └── /apps/[appId]
```

**CHALLENGE**: App pages and global OS pages are fragmented. Users see both `/os/companies` (global list) AND `/os/workspace/[companyId]` (company detail). Navigation between them is unclear.

**SOLUTION**: Consolidate the global pages into workspace context. Make the company workspace the primary interface.

---

## 1. Existing Routes (Complete Inventory)

### Root Pages
| Path | Purpose | Status |
|------|---------|--------|
| `/` | Home / landing | ✓ Working |
| `/login` | Authentication | ✓ Working |
| `/landing` | Public landing | ✓ Working |
| `/privacy` | Privacy policy | ✓ Static |
| `/terms` | Terms of service | ✓ Static |
| `/dashboard` | Legacy dashboard | ⚠️ Duplicate |
| `/admin` | Admin panel | ✓ Working |
| `/hub` | Hub page | ✓ Working |
| `/intake` | Lead intake | ✓ Working |
| `/intake/accuracy` | Accuracy lead intake | ✓ Working |
| `/today` | Legacy today view | ⚠️ Duplicate |

### `/os` Global Pages (Should Move to Workspace)
| Path | Purpose | Status |
|------|---------|--------|
| `/os` | Main OS hub | ✓ Working |
| `/os/today` | Daily command center | ✓ Core |
| `/os/companies` | Companies list with tabs | ✓ Working |
| `/os/companies/fineguard` | FineGuard companies tab | ✓ Working |
| `/os/companies/accuracy` | Accuracy companies tab | ✓ Working |
| `/os/companies/ultratech` | Ultratech companies tab | ✓ Working |
| `/os/companies/builder-big-jobs` | Builder companies tab | ✓ Working |
| `/os/work-items` | Work items list (global) | ✓ Core |
| `/os/work-items/new` | Create work item | ✓ Core |
| `/os/work-items/[id]` | Work item detail | ✓ Core |
| `/os/decisions` | Decisions list | ✓ Working |
| `/os/alerts` | Alerts list | ✓ Working |
| `/os/contacts` | Contacts list | ✓ Working |
| `/os/activity` | Global activity | ✓ Working |
| `/os/calls` | Call logs | ✓ Working |
| `/os/messages` | Messages | ✓ Working |
| `/os/documents` | Document vault | ✓ Working |
| `/os/templates` | Templates | ✓ Working |
| `/os/money` | Invoices & accounting | ✓ Working |
| `/os/book` | Books / accounting | ✓ Working |
| `/os/quote` | Quote builder | ✓ Working |
| `/os/talk` | Voice intake (SmartReceptionist) | ✓ Working |
| `/os/go` | Leads (Builder) | ✓ Working |
| `/os/scan` | Document scanner | ✓ Working |
| `/os/inbox` | Inbox / messages | ✓ Working |
| `/os/leads/builder-big-jobs` | Builder leads | ✓ Working |

### Company Workspace Pages (The New Home)
| Path | Purpose | Status |
|------|---------|--------|
| `/os/workspace/[companyId]` | Company overview & app launcher | ✓ Core |
| `/os/workspace/[companyId]/activity` | Company activity timeline | ✓ Working |
| `/os/workspace/[companyId]/people` | Company contacts | ✓ Working |
| `/os/workspace/[companyId]/documents` | Company document vault | ✓ Working |
| `/os/workspace/[companyId]/notifications` | Company alerts & reminders | ✓ Working |
| `/os/workspace/[companyId]/settings` | Company workspace settings | ✓ Working |
| `/os/workspace/[companyId]/apps/fineguard` | FineGuard app (company context) | ✓ Working |

---

## 2. Existing FineGuard Implementation

### What's Working
- ✓ Database migration (`0006_fineguard_workflow.sql`)
- ✓ FineGuard workflow engine (`/api/fineguard/process`)
- ✓ Companies House integration
- ✓ Alert scheduling & reminder system
- ✓ Activity logging per company
- ✓ Workspace integration (`/os/workspace/[companyId]/apps/fineguard`)

### FineGuard Tables
```
monitored_companies    — Companies to monitor
fg_snapshots           — Company House data snapshots
fg_alerts              — Deadline alerts (pre-scheduled)
fg_reminders           — When reminders should fire
fg_message_logs        — Email/notification logs
fg_activity_log        — Event trail (run_id tracking)
```

### What's Missing
- ⚠️ Public company search page (`/check`) not wired to workspace
- ⚠️ Company detail pages not contextualized to workspace
- ⚠️ Documents feature only in workspace, not in global `/os/documents`

---

## 3. Existing OS Applications

### Application Registry (from `lib/app-registry.ts`)

| App | Status | Category | External Route | Enabled For |
|-----|--------|----------|-----------------|-------------|
| FineGuard | 🟢 Live | Compliance | None (workspace) | FineGuard, Ultratech |
| SmartReceptionist | 🟡 Beta | Communications | `/os/talk` | FineGuard, Builder, Ultratech, Accuracy |
| BusinessAnywhereOS | 🟡 Beta | Operations | `/os` | FineGuard, Builder, Ultratech, Accuracy |
| AutoLawClerk | 🔴 Coming Soon | Legal | None | Ultratech |
| MediaManager | 🔴 Coming Soon | Media | None | Ultratech |

### Company Registry (from `lib/company-registry.ts`)

| Company | Plan | Apps Enabled |
|---------|------|--------------|
| FineGuard | Platform | FineGuard, SmartReceptionist, BusinessAnywhereOS |
| Builder Big Jobs | Platform | SmartReceptionist, BusinessAnywhereOS |
| Ultratech | Platform | FineGuard, AutoLawClerk, SmartReceptionist, MediaManager, BusinessAnywhereOS |
| Accuracy Ltd | Platform | SmartReceptionist, BusinessAnywhereOS |

---

## 4. The Workspace Design (Already Exists)

The company workspace is the foundation. Pages already exist:

```
/os/workspace/[companyId]
│
├── Overview
│   └── Display enabled apps with status badges
│   └── Direct links to app pages or workspace sub-routes
│
├── Activity
│   └── Timeline of all events in this company
│   └── Work items created, completed
│   └── Decisions made
│   └── Messages sent
│   └── FineGuard alerts triggered
│
├── People
│   └── Contacts associated with this company
│   └── Roles, email, phone
│   └── Activity per contact
│
├── Documents
│   └── Company document vault
│   └── Upload, tag, retrieve
│   └── Links to FineGuard company files
│
├── Notifications
│   └── Company-specific alerts
│   └── FineGuard deadline reminders
│   └── Task assignments
│   └── @mentions and comments
│
├── Settings
│   └── Company configuration
│   └── Enabled apps
│   └── Notification preferences
│   └── Data retention
│
└── Apps
    ├── /apps/fineguard
    │   └── Company's FineGuard dashboard
    │   └── Deadlines, alerts, snapshots
    │
    ├── /apps/autolawclerk (coming soon)
    │   └── Cases, hearings, bundles
    │
    └── [other apps as enabled]
```

---

## 5. What's Fragmented

### Problem 1: Dual Navigation
Users can navigate to:
- Global `/os/today` (command center)
- Global `/os/companies` (list all companies)
- Company `/os/workspace/[companyId]` (single company workspace)

But there's no clear relationship between them.

### Problem 2: App Pages Are Scattered
- **SmartReceptionist**: Links to `/os/talk` (external route, not workspace)
- **BusinessAnywhereOS**: Links to `/os` (root OS page, not workspace)
- **FineGuard**: Only has `/os/workspace/[companyId]/apps/fineguard` (correct)

### Problem 3: Work Items Are Global
- `/os/work-items` shows ALL work items across all companies
- No company filtering at the UI level
- Activity timeline is global, not per-company

### Problem 4: Legacy Pages Duplicate Functionality
- `/dashboard` (legacy) vs. `/os/workspace/[companyId]` (new)
- `/today` (legacy) vs. `/os/today` (global) vs. workspace overview (contextual)

---

## 6. Customer Journey (Working Today)

A real customer flow **TODAY**:

```
Customer logs in at /login
        ↓
Redirected to /os/today (global command center)
        ↓
Sees "Today's summary" (top-level overview)
        ↓
Clicks on "FineGuard company" card
        ↓
Navigates to /os/workspace/fineguard (company workspace)
        ↓
Sees enabled apps: FineGuard ✓, SmartReceptionist ✓, BusinessAnywhereOS ✓
        ↓
Clicks "FineGuard" app
        ↓
Navigates to /os/workspace/fineguard/apps/fineguard (FineGuard dashboard)
        ↓
Views company deadlines, alerts, snapshots
        ↓
FineGuard workflow runs (daily cron)
        ↓
New alerts generated → fg_alerts table
        ↓
Activity logged → fg_activity_log table
        ↓
User sees updated timeline in /os/workspace/fineguard/activity
        ↓
Notification appears in /os/workspace/fineguard/notifications
```

**This flow works TODAY**. No major gaps.

---

## 7. What Actually Needs Consolidation

### Category A: Delete (Duplicate Pages)
| Path | Reason | Impact |
|------|--------|--------|
| `/dashboard` | Duplicate of workspace overview | Low - no users |
| `/today` (root) | Duplicate of `/os/today` | Low - can redirect |
| `_vite_src/` directory | Orphaned Vite app | High - confusing |
| `vite.config.ts` | Orphaned Vite config | Medium - build noise |
| Vite npm scripts | Unused build scripts | Low - package.json cleanup |

### Category B: Move to Workspace (Consolidate Navigation)
| Path | New Home | Reason | Effort |
|------|----------|--------|--------|
| `/os/companies` | `/os/today` (list) + `/os/workspace/[id]` (detail) | Global company picker | Low - already routing there |
| `/os/work-items` | Keep as global | Cross-company view useful | None |
| `/os/decisions` | Keep as global | Cross-company view useful | None |
| `/os/talk` (SmartReceptionist) | `/os/workspace/[id]/apps/smart-receptionist` | Contextualize to company | Medium - reroute |
| `/os` (BusinessAnywhereOS) | `/os/workspace/[id]/apps/business-anywhere` | Contextualize to company | Medium - reroute |

### Category C: Keep & Improve (Core Platform)
| Path | Status | Next Step |
|------|--------|-----------|
| `/os/today` | ✓ Keep | Improve as main entry point |
| `/os/workspace/[id]/*` | ✓ Keep | Make the primary workspace UI |
| `/os/work-items` | ✓ Keep | Add company filtering sidebar |
| `/os/activity` | ✓ Keep | Add company filtering sidebar |
| FineGuard workflow | ✓ Keep | No changes needed |

### Category D: Create (To Complete Workspace)
| Path | Purpose | Effort |
|------|---------|--------|
| `/os/workspace/[id]/apps/smart-receptionist` | SmartReceptionist workspace page | Low - new route |
| `/os/workspace/[id]/apps/business-anywhere` | BusinessAnywhereOS workspace page | Low - new route |
| `/os/company-picker` | Modal/dialog to switch companies | Low - UI component |
| Sidebar switcher | Quick company selector | Low - UI component |

---

## 8. Database State

### Tables Already Created
```sql
✓ work_items          — Core work/task management
✓ actions             — Action tracking per work item
✓ activity_logs       — Event timeline
✓ decisions           — Decision records
✓ templates           — Reusable templates
✓ monitored_companies — FineGuard watch list
✓ fg_snapshots        — Company House snapshots
✓ fg_alerts           — Deadline alerts (pre-scheduled)
✓ fg_reminders        — Reminder schedule
✓ fg_message_logs     — Email/notification log
✓ fg_activity_log     — FineGuard event trail
✓ os_tasks            — Task management (apps)
✓ os_quotes           — Quote builder
✓ os_invoices         — Invoices
✓ os_calls            — Call logs
✓ os_messages         — Messages
✓ os_message_threads  — Message conversations
✓ os_people           — Contacts
✓ os_alerts           — App alerts
✓ os_documents        — Document storage
✓ ut_activity_events  — Usage tracking
✓ ut_daily_metrics    — Daily metrics
✓ ut_weekly_reports   — Weekly reports
```

**Schema is comprehensive and ready.**

---

## 9. API Routes (What's Available)

### Auth
- `POST /api/auth/login` — Session creation
- `POST /api/auth/logout` — Session destruction

### Companies House / FineGuard
- `POST /api/monitored` — Register company to monitor
- `POST /api/fineguard/process` — Run FineGuard workflow
- `GET /api/companies/search` — Search Companies House
- `GET /api/companies/[number]` — Company details

### OS Applications
- `GET /api/os/work-items` — List work items
- `POST /api/os/work-items` — Create work item
- `GET /api/os/work-items/[id]` — Get work item detail
- `PATCH /api/os/work-items/[id]` — Update work item
- `DELETE /api/os/work-items/[id]` — Delete work item
- `GET /api/os/tasks` — Task management
- `GET /api/os/quotes` — Quotes
- `GET /api/os/invoices` — Invoices
- `POST /api/voice/transcribe` — Voice transcription
- `POST /api/voice/approve` — Voice approval

### Usage Tracking
- `POST /api/ut/event` — Track usage event
- `GET /api/ut/metrics` — Get metrics
- `POST /api/ut/aggregate/daily` — Daily aggregation
- `POST /api/ut/aggregate/weekly` — Weekly aggregation

### Stripe
- `POST /api/stripe/checkout` — Create checkout session
- `POST /api/stripe/webhook` — Webhook handler

**All core APIs exist. No gaps.**

---

## 10. Consolidation Plan (Action Items)

### Phase 1: Cleanup (2 hours)
**Goal**: Remove orphaned code and duplicate pages.

```bash
# Delete orphaned Vite app
rm -rf _vite_src/
rm vite.config.ts
rm -f GENERATION_GUIDE.md PAGE_GENERATION_*.md

# Remove from package.json:
# - "dev:vite" script
# - "build:vite" script
# - Any unused Vite deps (check with `npm ls | grep unused`)

# Remove duplicate pages
rm /app/dashboard/page.tsx  # Keep /os/workspace/[id]
rm /app/today/page.tsx       # Keep /os/today

# Delete legacy redirect routes if they exist
# (verify in git log what was there)

npm install  # Clean install
```

**Commits**:
1. `rm: delete orphaned _vite_src/ and vite.config.ts`
2. `rm: remove vite npm scripts from package.json`
3. `rm: remove duplicate /dashboard and /today pages`

### Phase 2: Navigation Consolidation (3 hours)
**Goal**: Make company workspace the primary interface.

**Changes**:
1. Update `/os/today` to be the main entry point (status: already is)
2. Add a company picker widget to the sidebar (new component)
3. Update breadcrumbs to show: `OS > [Company Name] > [Page]`
4. Update navigation to prefer workspace routes

**Files to change**:
- `app/os/layout.tsx` — Add company picker sidebar
- `components/Navigation.tsx` — Add workspace breadcrumb
- `app/os/today/page.tsx` — Link to workspace, not global pages
- `lib/app-registry.ts` — Update external routes (see below)

**App Registry Updates**:
```typescript
// OLD:
{
  id: 'smart-receptionist',
  externalRoute: '/os/talk',  // Global page
}

// NEW:
{
  id: 'smart-receptionist',
  externalRoute: undefined,   // Use workspace sub-route
  // Links to: /os/workspace/[companyId]/apps/smart-receptionist
}

// OLD:
{
  id: 'business-anywhere',
  externalRoute: '/os',       // Global page
}

// NEW:
{
  id: 'business-anywhere',
  externalRoute: undefined,   // Use workspace sub-route
  // Links to: /os/workspace/[companyId]/apps/business-anywhere
}
```

**Commits**:
1. `feat: add company picker to OS sidebar`
2. `feat: update app registry to use workspace routes`
3. `refactor: update navigation breadcrumbs for workspace context`

### Phase 3: App Integration (2 hours)
**Goal**: Wire SmartReceptionist and BusinessAnywhereOS into workspace.

**Create**:
```typescript
// New pages
app/os/workspace/[companyId]/apps/smart-receptionist/page.tsx
app/os/workspace/[companyId]/apps/business-anywhere/page.tsx

// Each file:
// - Imports existing page component from /os/talk or /os
// - Passes companyId as context
// - Renders with workspace layout
```

**Example**:
```typescript
// /app/os/workspace/[companyId]/apps/smart-receptionist/page.tsx
import SmartReceptionistPage from '@/app/os/talk/page'
import { getCompany } from '@/lib/company-registry'

export default function WorkspaceSmartReceptionistPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()
  
  return <SmartReceptionistPage companyContext={company.id} />
}
```

**Commits**:
1. `feat: create SmartReceptionist workspace page`
2. `feat: create BusinessAnywhereOS workspace page`
3. `refactor: wire apps into workspace with context`

### Phase 4: Testing & Verification (1 hour)
**Goal**: Ensure no regressions.

**Test Cases**:
- [ ] Login → Redirects to `/os/today`
- [ ] Click on company → Navigates to `/os/workspace/[id]`
- [ ] See enabled apps in workspace
- [ ] Click FineGuard → Opens workspace FineGuard page
- [ ] FineGuard workflow still runs correctly
- [ ] Work items appear in company context
- [ ] Activity timeline shows company events
- [ ] Documents saved in company context
- [ ] Contacts linked to company
- [ ] Notifications per company work
- [ ] No 404 errors on old routes

**Commits**:
1. `test: verify workspace consolidation`
2. `docs: update CONSOLIDATION_AUDIT.md with completion notes`

---

## 11. Post-Consolidation Architecture

After Phase 1–4:

```
Customer Experience:
  Login → /login
      ↓
  Daily View → /os/today (company picker + daily stats)
      ↓
  Company Workspace → /os/workspace/[companyId]
      ├── Overview (app launcher)
      ├── Activity (company timeline)
      ├── People (contacts)
      ├── Documents (vault)
      ├── Notifications (alerts)
      ├── Settings (config)
      └── Apps
          ├── FineGuard → /apps/fineguard
          ├── SmartReceptionist → /apps/smart-receptionist
          ├── BusinessAnywhereOS → /apps/business-anywhere
          ├── AutoLawClerk → /apps/autolawclerk (coming soon)
          └── MediaManager → /apps/media-manager (coming soon)

Global Views (still available, but not primary):
  /os/work-items       — All work items (with company filter)
  /os/decisions        — All decisions (with company filter)
  /os/contacts         — All contacts (with company filter)
  /os/activity         — All activity (with company filter)
  /os/alerts           — All alerts (with company filter)

Public Pages:
  /                    — Landing
  /login               — Authentication
  /privacy             — Privacy policy
  /terms               — Terms of service
  /intake/[company]    — Lead intake forms (per company)
```

---

## 12. Success Criteria

After consolidation, a customer should experience:

✓ **Single Interface**: They log in and immediately see their company workspace.  
✓ **Clear Navigation**: Company picker is always visible. Breadcrumbs show context.  
✓ **App Integration**: All enabled apps are accessible from the workspace.  
✓ **Unified Activity**: Everything that happens (work items, FineGuard alerts, messages) shows up in the company timeline.  
✓ **No Confusion**: No duplicate pages, no unclear navigation.  
✓ **Fast Context Switch**: Switching between companies is one click away.  

---

## 13. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking FineGuard workflow | Low | High | Run E2E tests on workflow before merging |
| Users disoriented by navigation changes | Medium | Medium | Add clear breadcrumbs + sidebar company picker |
| External links break | Low | Medium | Update `externalRoute` in app registry |
| Database integrity | Low | Critical | Use Drizzle migrations, test on staging |

---

## Recommendation

**Ship the consolidation in 4 phases over 8 hours of work:**

1. **2h**: Phase 1 (cleanup) — Remove dead code
2. **3h**: Phase 2 (navigation) — Make workspace primary
3. **2h**: Phase 3 (integration) — Wire apps into workspace
4. **1h**: Phase 4 (testing) — Verify no regressions

**Total**: ~8 hours to shipping a unified Business Workspace.

**Outcome**: A customer sees a coherent product, not a collection of features.

---

**Next Step**: Approval to proceed with Phase 1.
