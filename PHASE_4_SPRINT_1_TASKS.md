# Phase 4 — Sprint 1: Live Data

**Objective**: Replace all placeholder metrics with real database queries. No hard-coded business data remains.

**Status**: 80% of UI is connected to database. Needs verification and completion of remaining pieces.

---

## Task Breakdown

### High Priority: Dashboard & Metrics

#### Task 1.1: Add Consolidation Rate Widget
**File**: `app/os/today/page.tsx`  
**What**: Add consolidation rate metric from `ut_daily_metrics` table  
**Current**: Page shows due items but no consolidation rate
**Implementation**:
- Query `ut_daily_metrics` for today's data
- Calculate: (active work items in OS / total work items) × 100
- Display on page with trend indicator
- **Effort**: 1-2 hours

#### Task 1.2: Verify Dashboard Metrics
**File**: `app/os` (landing/dashboard page)  
**What**: Ensure dashboard shows real business metrics
**Check**: Does dashboard exist? If yes, does it pull from database?
**Implementation**:
- Verify page exists at `/os` or redirect
- Query company count, work item count, document count
- Query revenue (sum of invoices) if applicable
- Display with visual indicators
- **Effort**: 2-3 hours

---

### High Priority: Create/Save Forms

#### Task 2.1: Create Work Item Form
**File**: `app/os/work-items/new/page.tsx`  
**Current**: Form likely exists but needs verification it saves
**Implementation**:
- Verify form exists and has all fields (title, type, company, owner, status, priority, dueDate, notes)
- Verify POST to `/api/work-items` saves to database
- Verify success redirects to work item detail page
- Verify new item appears in work items list immediately
- **Effort**: 1-2 hours

#### Task 2.2: Create Document Form (Upload)
**File**: `app/os/documents/page.tsx`  
**Current**: Upload button exists but need to verify it works
**Implementation**:
- Verify upload button functionality
- Verify file is saved to storage (where?)
- Verify metadata saved to `os_documents` table
- Verify new document appears in list immediately
- **Effort**: 2-3 hours (depends on file storage implementation)

#### Task 2.3: Create Contact Form
**File**: `app/os/contacts/new/page.tsx`  
**Current**: Likely doesn't exist yet
**Implementation**:
- Create form page with fields (name, email, phone, category, company)
- Create POST endpoint to save to `os_people` table
- Verify new contact appears in contacts list
- **Effort**: 2-3 hours

#### Task 2.4: Create Task Form
**File**: Task creation flow (check where tasks are created)  
**Current**: Unknown
**Implementation**:
- Identify where tasks should be created (inline on work item? separate form?)
- Create form with fields (label, status, assignedTo, dueDate)
- Verify POST saves to `actions` table
- **Effort**: 1-2 hours

#### Task 2.5: Create Message Form
**File**: Message creation (check where messages start)  
**Current**: Unknown
**Implementation**:
- Create form to start new message thread
- Save to `os_messages` table
- Verify thread appears in messages list
- **Effort**: 1-2 hours

#### Task 2.6: Create Call Log Form
**File**: Call logging (check where calls are logged)  
**Current**: Unknown
**Implementation**:
- Create form to log a call (contact, duration, notes, date)
- Save to `os_calls` table
- Link to contact if selected
- Verify in calls list immediately
- **Effort**: 1-2 hours

#### Task 2.7: Create Quote Form
**File**: `app/os/money/` or similar  
**Current**: Unknown
**Implementation**:
- Create form (contact, items, amount, date)
- Save to `os_quotes` table
- Verify in money page
- **Effort**: 2-3 hours

#### Task 2.8: Create Invoice Form
**File**: `app/os/money/` or similar  
**Current**: Unknown
**Implementation**:
- Create form (contact, items, amount, date, status)
- Save to `os_invoices` table
- Verify in money page
- **Effort**: 2-3 hours

---

### Medium Priority: Detail Pages & Actions

#### Task 3.1: Verify Work Item Detail Page
**File**: `app/os/work-items/[id]/page.tsx`  
**What**: Show all work item fields and allow editing
**Check**: Does page exist? Show all fields?
**Implementation**:
- Display all fields (title, type, company, owner, status, priority, dueDate, nextAction, notes)
- Show linked actions/tasks
- Show activity timeline
- Allow inline editing
- **Effort**: 2-3 hours

#### Task 3.2: Verify Contact Detail Page
**File**: `app/os/contacts/[id]/page.tsx`  
**What**: Show all contact details and link to work items
**Implementation**:
- Display contact info (name, email, phone, category, company)
- Show related work items
- Show call history
- Show recent messages
- **Effort**: 2-3 hours

#### Task 3.3: Verify Document Detail/View
**File**: Document viewing  
**What**: Allow viewing/downloading document
**Implementation**:
- Link to document file (or embed preview)
- Show metadata (upload date, uploader, status)
- Allow status changes (approve/reject)
- **Effort**: 2-3 hours

#### Task 3.4: Task Complete Action
**File**: Tasks list or detail page  
**What**: Mark task as complete
**Implementation**:
- Add button to mark task complete
- PATCH to `/api/actions/[id]` with status='Completed'
- Verify activity log updates
- Verify work item updates if task is critical
- **Effort**: 1 hour

#### Task 3.5: Alert Mark Read Action
**File**: `/os/alerts` page  
**What**: Mark alert as read
**Implementation**:
- Add button/click handler to mark read
- PATCH to `/api/os/alerts/[id]` with isRead=true
- Remove from unread count
- **Effort**: 1 hour

---

### Medium Priority: Cross-Object Links

#### Task 4.1: Work Item → Tasks/Actions
**What**: Show linked actions on work item detail
**Verification**: Does work item detail page show actions?
**Effort**: 1 hour (if detail page exists)

#### Task 4.2: Work Item → Documents
**What**: Show/upload documents linked to work item
**Effort**: 2 hours

#### Task 4.3: Contact → Work Items
**What**: Show work items for a contact
**Effort**: 1 hour

#### Task 4.4: Contact → Calls
**What**: Show calls with a contact
**Effort**: 1 hour

#### Task 4.5: Call → Contact Link
**What**: When logging call, link to contact
**Effort**: 1 hour

---

### Lower Priority: Polish

#### Task 5.1: Add "Create" Buttons to All List Pages
**What**: Ensure every list page has a "+  Create" button
**Pages to check**:
- [ ] Work Items (likely done)
- [ ] Documents (likely done)
- [ ] Contacts
- [ ] Calls
- [ ] Tasks
- [ ] Messages
- [ ] Decisions
- [ ] Quotes
- [ ] Invoices

#### Task 5.2: Add Empty State Messages
**What**: When list is empty, show helpful message with "Create" button
**Effort**: 1-2 hours

#### Task 5.3: Add Loading States
**What**: Show skeleton loaders while fetching data
**Effort**: 2-3 hours

#### Task 5.4: Add Error Handling
**What**: Handle API errors gracefully
**Effort**: 1-2 hours

---

## Estimated Effort

| Priority | Task | Hours |
|----------|------|-------|
| HIGH | 1.1 Consolidation Rate | 2 |
| HIGH | 1.2 Dashboard Metrics | 3 |
| HIGH | 2.1 Create Work Item | 2 |
| HIGH | 2.2 Upload Document | 3 |
| HIGH | 2.3 Add Contact | 3 |
| HIGH | 2.4 Create Task | 2 |
| HIGH | 2.5 Send Message | 2 |
| HIGH | 2.6 Log Call | 2 |
| HIGH | 2.7 Create Quote | 3 |
| HIGH | 2.8 Create Invoice | 3 |
| MED | 3.1 Work Item Detail | 3 |
| MED | 3.2 Contact Detail | 3 |
| MED | 3.3 Document View | 3 |
| MED | 3.4 Complete Task | 1 |
| MED | 3.5 Mark Alert Read | 1 |
| **Total Sprint 1** | **All HIGH items first** | **~25 hours** |

---

## Definition of Done (Sprint 1)

- [ ] Dashboard shows real consolidation rate metric
- [ ] All create forms work and save to database
- [ ] New items appear in lists immediately after creation
- [ ] All detail pages show complete information
- [ ] All action buttons work (mark complete, mark read, etc.)
- [ ] All pages pull from live database (no hardcoded data)
- [ ] No placeholder values remain visible to users
- [ ] All links between objects work (contact → work items, etc.)

---

## Next Steps

1. **Identify what already works** — Verify which create forms and detail pages already exist
2. **Prioritize quick wins** — Start with tasks that are 80% done (need minor fixes)
3. **Batch similar work** — Group form creation, action buttons, links
4. **Test each feature end-to-end** — Verify create → appears in list → can edit/complete

---

## Timeline

Estimate: 2-3 weeks of focused work to complete Sprint 1  
(assuming 4-5 hours/day of development)

Once Sprint 1 is done, customer has a fully functional business OS where:
- Every screen works with real data
- Every action creates a real record
- Every workflow can be completed
