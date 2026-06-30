# Phase 4: Sprint 1 — Live Data Audit

**Status**: Current assessment of which screens have live database connections

---

## Dashboard & Core Pages

### ✅ /os/today (TODAY PAGE)
**Status**: COMPLETE - Live database
- Fetches overdue work items from `work_items` table
- Fetches overdue actions from `actions` table
- Shows due dates and status
- **What's missing**: Consolidation rate widget (needs `ut_daily_metrics` query)

### ✅ /os/companies (COMPANIES PAGE)
**Status**: COMPLETE - Live database
- Fetches company registry
- Shows FineGuard: monitored companies count + pending alerts
- Shows Builder Big Jobs: leads count
- Shows other companies: active apps count
- **What's missing**: Nothing for Sprint 1

### ✅ /os/workspace/[companyId] (WORKSPACE OVERVIEW)
**Status**: COMPLETE - Live database (Phase 3)
- Quick stats (open work, alerts, apps)
- Today's work items
- Alerts
- Recent documents
- Recent decisions
- Recent activity
- **What's missing**: Nothing for Sprint 1

---

## Work Management

### ✅ /os/work-items (WORK ITEMS LIST)
**Status**: COMPLETE - Live database
- Lists all work items with filters (status, type, owner, priority)
- Shows title, company, owner, status, priority, due date
- Mobile and desktop views
- **What's missing**: 
  - Link to create new work item (/os/work-items/new) - CHECK IF WORKS

### ✅ /os/work-items/[id] (WORK ITEM DETAIL)
**Status**: Likely COMPLETE (not checked in detail)
- **Needs verification**: Does detail page work? Show all fields?

### ⚠️ /os/work-items/new (CREATE WORK ITEM)
**Status**: UNKNOWN - Needs verification
- Form exists but needs to verify it saves to database

---

## Documents

### ✅ /os/documents (DOCUMENTS LIST)
**Status**: COMPLETE - Live database
- Fetches from `os_documents` table
- Shows filename, status, size, upload date, uploader
- Aggregates: total count, pending review, approved
- **What's missing**: 
  - Upload button functionality
  - Document preview/link

---

## Contacts

### ✅ /os/contacts (CONTACTS LIST)
**Status**: COMPLETE - Live database
- Fetches from `os_people` table
- Shows category breakdown (Client, Supplier, Partner, Team)
- Shows recent contacts
- **What's missing**:
  - Detail page
  - Add contact form
  - Link to related work items

### ⚠️ /os/contacts/[id] (CONTACT DETAIL)
**Status**: UNKNOWN - Needs verification

### ⚠️ /os/contacts/new (ADD CONTACT)
**Status**: UNKNOWN - Needs verification

---

## Calls

### ✅ /os/calls (CALLS LIST)
**Status**: COMPLETE - Live database
- Fetches from `os_calls` table
- Shows duration, date, contact name
- **What's missing**:
  - Link to contact
  - Link to work item
  - Call notes display

### ⚠️ /os/calls/[id] (CALL DETAIL)
**Status**: UNKNOWN - Needs verification

---

## Money

### ✅ /os/money (INVOICES & QUOTES)
**Status**: COMPLETE - Live database
- Fetches invoices from `os_invoices` table
- Fetches quotes from `os_quotes` table
- Shows status, amount, date
- **What's missing**:
  - Create invoice form
  - Create quote form
  - Financial summary/metrics

### ⚠️ /os/invoices, /os/quotes (SEPARATE VIEWS)
**Status**: UNKNOWN - Needs verification

---

## Messages

### ✅ /os/messages (MESSAGES LIST)
**Status**: COMPLETE - Live database
- Fetches from `os_messages` table
- Shows thread summary, unread count, last message
- **What's missing**:
  - Create message form
  - Thread detail/reply view

---

## Tasks

### ✅ /os/tasks (TASKS LIST)
**Status**: COMPLETE - Live database
- Fetches from `actions` table (tasks)
- Shows label, status, due date, assigned to
- **What's missing**:
  - Mark task complete functionality
  - Create task form

---

## Alerts

### ✅ /os/alerts (ALERTS LIST)
**Status**: COMPLETE - Live database
- Fetches from `os_alerts` table
- Shows severity, title, source
- **What's missing**:
  - Mark as read functionality
  - Filter by severity

---

## Decisions

### ✅ /os/decisions (DECISIONS LIST)
**Status**: COMPLETE - Live database
- Fetches from `decisions` table
- Shows title, status, date
- **What's missing**:
  - Create decision form
  - Decision detail page

---

## Not Yet Checked

### ⚠️ /os/activity (ACTIVITY PAGE)
**Status**: UNKNOWN - Needs to verify if full timeline exists

### ⚠️ Search functionality
**Status**: NOT IMPLEMENTED - Needs universal search API

### ⚠️ Create flows
**Status**: MIXED
- Work items: form exists (need to verify saves)
- Contacts: unknown
- Documents: upload button exists (need to verify works)
- Messages: unknown
- Calls: unknown
- Tasks: unknown
- Decisions: unknown
- Quotes: unknown
- Invoices: unknown

---

## Summary for Sprint 1

### What's Working ✅
- All list pages are pulling live data from database
- Workspace overview shows real metrics
- Dashboard shows real company KPIs
- Today page shows due items

### What Needs Work ⚠️
1. **Consolidation rate widget** on Today page
2. **Create/Edit forms** - verify they save to database:
   - Work Items
   - Contacts
   - Documents
   - Messages
   - Calls
   - Tasks
   - Decisions
   - Quotes
   - Invoices
3. **Detail pages** - verify they show complete data
4. **Action buttons** - verify they work:
   - Mark task complete
   - Mark alert as read
   - Document upload
   - Create any object
5. **Links between objects** - verify:
   - Call → Contact
   - Call → Work Item
   - Task → Work Item
   - Document → Work Item
   - Message → Company/Contact

### Priority for Phase 4 Sprint 1
1. **Highest**: Get all create forms working (without these, nothing gets created)
2. **High**: Consolidation rate widget on dashboard
3. **High**: Verify all detail pages work
4. **Medium**: Verify all action buttons work
5. **Medium**: Verify all cross-object links work

---

## Next Steps
1. Test each page in the running app
2. For any page showing data, test creating a new item
3. For any page with an action button, test it works
4. Document what breaks or doesn't work
5. Create specific tasks to fix each issue
