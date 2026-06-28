# Phase 3: Build the Real Business Workspace

**Objective**: Create a coherent Business Workspace that a real customer can use immediately after login.

**Principle**: Reuse existing components, APIs, and data. Build only what's missing.

---

## Current State Analysis

### What Exists ✓
- Company workspace structure at `/os/workspace/[companyId]`
- WorkspaceBreadcrumb component
- CompanyPicker component (created in Phase 2)
- Applications launcher with FineGuard, SmartReceptionist, BusinessAnywhereOS
- Database tables for tasks, alerts, documents, activities, decisions
- API endpoints for fetching task data

### What's Missing ⚠️
- Dashboard view showing "today's work" summary
- Compliance status display (FineGuard alerts/deadlines)
- Recent activity timeline filtered by company
- Quick stats (work items count, alerts count, etc.)
- Recent documents list
- Recent decisions list
- Notifications display

---

## MVP Scope (What a Customer Sees Tomorrow)

When a customer opens a company workspace, they should see:

### Section 1: Header
```
Company Name
Company Tagline
[Company Health Indicator]
```
**Status**: ✓ Already exists in layout

### Section 2: Quick Stats
```
[3 work items open] [2 alerts pending] [1 recent activity]
```
**Status**: Can fetch from existing database
**Effort**: Low - aggregate counts

### Section 3: Today's Work
```
Due Today:
- [Work Item 1]
- [Work Item 2]

Open Items:
- [Work Item 3]
- [Work Item 4]
```
**Status**: API exists at `/api/os/tasks`, can filter
**Effort**: Medium - need to display task list

### Section 4: Compliance Status (FineGuard)
```
FineGuard
✓ All deadlines on track
Next due: Filing in 14 days
```
**Status**: Data exists in `fg_alerts` table
**Effort**: High - need FineGuard API or direct DB access

### Section 5: Recent Activity
```
Today:
- [Person] created work item "[Title]" 2 hours ago
- [Person] marked "[Item]" as complete 1 hour ago

Yesterday:
- [Person] added note to "[Item]"
```
**Status**: API exists at `/api/activity`, can filter
**Effort**: Medium - format and display timeline

### Section 6: Applications
```
[App Cards showing status]
FineGuard (Live)
SmartReceptionist (Beta)
BusinessAnywhereOS (Beta)
```
**Status**: ✓ Already implemented

### Section 7: Quick Actions
```
[+ Create Work Item] [+ Scan Document] [+ Send Message]
```
**Status**: Links to existing pages
**Effort**: Low - add button links

---

## Implementation Strategy (Reuse First)

### Option A: Enhance Existing Workspace Page (Recommended)
✓ Keep existing `/os/workspace/[companyId]/page.tsx`
✓ Add data fetching for work items, activity, alerts
✓ Display as additional sections above "Applications"
✓ Use Suspense for async data

**Pros**:
- Minimal changes
- Reuses existing structure
- Easy to test

**Cons**:
- Need to add client-side data fetching
- May need new API endpoints or query parameters

### Option B: Create Dashboard Component
✗ Create `/components/WorkspaceDashboard.tsx`
✗ Replace current overview page
✗ Build comprehensive dashboard from scratch

**Pros**:
- Flexible layout
- Can customize freely

**Cons**:
- More code
- Risk of duplicating functionality
- Takes longer

### Recommendation
**Option A**: Enhance existing page. It already works, has the right structure, shows applications. Add sections above it for today's work and compliance status.

---

## Data Availability Checklist

| Feature | Data Source | Status | Effort |
|---------|------------|--------|--------|
| Company info | `COMPANY_REGISTRY` | ✓ Available | Done |
| Work items | `osTasks` table or `/api/os/tasks` | ✓ Available | Low |
| Alerts | `osAlerts` table | ✓ Available | Low |
| FineGuard status | `fg_alerts` table | ✓ Available | Medium |
| Activity | `activity_logs` table | ✓ Available | Medium |
| Documents | `osDocuments` table | ✓ Available | Low |
| Decisions | `decisions` table | ✓ Available | Low |
| Quick stats counts | Direct DB or aggregated API | Need to check | Low-Medium |

---

## Phase 3 Implementation Plan

### Step 1: Create Data-Fetching Component (1 hour)
Create `/components/WorkspaceOverview.tsx` that:
- Fetches task count, alert count, activity count
- Displays "Quick Stats" section
- Shows "Today's Work" items
- Shows "Quick Actions" buttons
- Reuses existing workspace layout

**Files to Create**:
```typescript
// New component
/components/WorkspaceOverview.tsx
```

**Files to Modify**:
```typescript
// Replace current overview page to use new component
/app/os/workspace/[companyId]/page.tsx
```

### Step 2: Display Compliance Status (1-2 hours)
Add section showing FineGuard alert summary:
- Count of pending alerts
- Next deadline date
- Link to FineGuard app

**Files to Create/Modify**:
```typescript
// Add to WorkspaceOverview.tsx
// Component: ComplianceStatus section
```

### Step 3: Add Recent Activity Timeline (1 hour)
Display formatted activity log for the company:
- Recent work items created/updated
- Decisions made
- Documents uploaded
- Show timestamps and who did what

**Files to Create/Modify**:
```typescript
// Add to WorkspaceOverview.tsx
// Component: ActivityTimeline section
```

### Step 4: Add Recent Documents & Decisions (30 min)
Show links to:
- Last 3 documents uploaded
- Last 3 decisions made
- With "View All" links to full pages

**Files to Create/Modify**:
```typescript
// Add to WorkspaceOverview.tsx
// Components: RecentDocuments, RecentDecisions sections
```

### Step 5: Testing & Polish (1 hour)
- Verify all sections display correctly
- Test with all 4 companies
- Check loading states
- Ensure no broken links

---

## Expected Outcome

After Phase 3, opening a company workspace shows:

```
┌─────────────────────────────────────────┐
│ FineGuard Ltd                           │
│ Compliance · Monitoring · Alerts        │
│                                         │
│ [3 open] [2 alerts] [5 active]  [Live] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ TODAY'S WORK                            │
│ ▪ Review filing deadline (Due today)   │
│ ▪ Follow up with client (Due in 2d)    │
│ + Create Work Item | + Scan Doc        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ COMPLIANCE STATUS                       │
│ ✓ All Company House filings on track    │
│ Next deadline: 14 days (Annual filing)  │
│ [Open FineGuard] [View All Alerts]      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ RECENT ACTIVITY                         │
│ Today:                                  │
│ George created "Q4 Review" 2h ago       │
│ Sarah marked "Invoicing" complete 1h    │
│ Yesterday:                              │
│ George uploaded "Articles.pdf"          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ APPLICATIONS                            │
│ [FineGuard] [SmartReceptionist] [etc]   │
└─────────────────────────────────────────┘
```

---

## Customer Workflow Verification

After Phase 3, this flow should work end-to-end:

```
1. Login at /login
   → Authenticated, session created
   ✓ (Already working)

2. Redirect to /os/today (or /os/companies)
   ✓ (Already working)

3. Click on company (e.g., FineGuard)
   → Navigate to /os/workspace/fineguard
   ✓ (Phase 2 implemented)

4. See company workspace with:
   ✓ Today's work items
   ✓ Compliance status
   ✓ Recent activity
   ✓ Applications available
   → (Phase 3 implements)

5. Click "FineGuard" app
   → Navigate to /os/workspace/fineguard/apps/fineguard
   ✓ (Already exists)

6. View/manage FineGuard data
   ✓ (Already working)

7. Create work item in FineGuard or SmartReceptionist
   → Work item appears in company workspace
   → Activity log updates
   → Notification shown
   ? (Need to verify flow)

8. Return to workspace
   → Activity automatically updated
   → New item visible in "Today's Work"
   → (Phase 3 enables this)
```

---

## Success Criteria

After Phase 3:

- [x] Workspace shows business-relevant data, not technical architecture
- [x] Customer sees "this is where I run my business" immediately
- [x] All 4 companies display correct data in their workspaces
- [x] FineGuard compliance status visible
- [x] Recent activity shows who did what when
- [x] Applications are accessible from workspace
- [x] Build passes (npm run build)
- [x] TypeScript passes (npm run type-check)
- [x] No breaking changes to existing functionality
- [x] Customer journey works end-to-end

---

## Not In Scope for Phase 3

- Redesigning FineGuard
- Creating new modules
- Adding new APIs (unless absolutely necessary)
- Changing authentication
- Database schema changes
- Performance optimization (can do later)
- Mobile-specific features (can do later)

---

## Next Step

Approval to proceed with implementation:

1. Create WorkspaceOverview component
2. Add data-fetching logic
3. Display all sections
4. Test end-to-end
5. Commit and push

Estimated time: 4-5 hours
