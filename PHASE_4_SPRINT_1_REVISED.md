# Phase 4 — Sprint 1: Live Data (Revised)

**Objective**: Prove the system can create, store, retrieve, and update business data end-to-end.

**Success Criteria**: A user can create a company → add a contact → log a call → create a task → upload a document → generate a quote → convert to invoice, and see everything reflected in the workspace, list pages, and activity timeline.

---

## Verification Matrix

Use this to track what works end-to-end:

| Module | Create | List | Detail | Edit | Delete |
|--------|:------:|:----:|:------:|:----:|:------:|
| Companies | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Contacts | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Work Items | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Tasks | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Documents | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Calls | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Messages | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Quotes | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Invoices | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

Legend: ✅ Works | ⚠️ Partial | ❌ Broken | ⬜ Not tested

---

## Task Groups (In Priority Order)

### Group 1: Verify Create Flows ⭐ HIGHEST PRIORITY

These are the critical path. Without working create flows, nothing else matters.

#### Task 1.1: Create Company
**Files**: `app/os/companies/new/page.tsx` (create form), `/api/companies` (endpoint)  
**Test**: 
- [ ] Form exists and is accessible
- [ ] Can fill out all required fields
- [ ] Submission saves to `monitored_companies` table (for FineGuard) or creates entry in system
- [ ] New company appears in `/os/companies` list immediately
- [ ] New company appears as option in dropdowns
- [ ] Can navigate to company workspace

**Effort**: 2-3 hours (form likely partial, may need endpoint)

#### Task 1.2: Add Contact
**Files**: `app/os/contacts/new/page.tsx`, `/api/os/people` (POST endpoint)  
**Test**:
- [ ] Form exists
- [ ] Can fill: name, email, phone, category, company
- [ ] Saves to `os_people` table
- [ ] Appears in `/os/contacts` list immediately
- [ ] Can navigate to contact detail page
- [ ] Contact appears in company workspace contacts section

**Effort**: 2-3 hours

#### Task 1.3: Create Work Item
**Files**: `app/os/work-items/new/page.tsx` (form likely exists), `/api/work-items` (endpoint exists)  
**Test**:
- [ ] Form exists and loads
- [ ] Can fill: title, type, company, owner, priority, dueDate
- [ ] Submission saves to `work_items` table
- [ ] Appears in `/os/work-items` list immediately
- [ ] Can navigate to detail page
- [ ] Appears in company workspace today's work section

**Effort**: 1-2 hours (mostly verification)

#### Task 1.4: Log Call
**Files**: Call creation flow (identify where it lives)  
**Test**:
- [ ] Form exists or create it
- [ ] Can fill: contact, date, duration, notes
- [ ] Saves to `os_calls` table
- [ ] Linked to contact if selected
- [ ] Appears in `/os/calls` list
- [ ] Appears in company activity timeline
- [ ] Appears in contact detail page call history

**Effort**: 2-3 hours

#### Task 1.5: Create Task
**Files**: Task creation flow (identify where it lives)  
**Test**:
- [ ] Form exists or create it
- [ ] Can fill: label, status, assignedTo, dueDate, workItemId (optional)
- [ ] Saves to `actions` table
- [ ] Appears in `/os/tasks` list
- [ ] Linked to work item if selected
- [ ] Appears in work item detail page tasks section

**Effort**: 2-3 hours

#### Task 1.6: Upload Document
**Files**: `app/os/documents/page.tsx` (upload button), file storage endpoint  
**Test**:
- [ ] Upload button works (not just UI, actually uploads)
- [ ] File saved to storage (where? S3? local?)
- [ ] Metadata saved to `os_documents` table
- [ ] Appears in `/os/documents` list immediately
- [ ] Can view/download document
- [ ] Can link document to work item
- [ ] Appears in company workspace recent documents section

**Effort**: 3-4 hours (depends on file storage implementation)

#### Task 1.7: Create Quote
**Files**: Quote creation flow (identify where it lives)  
**Test**:
- [ ] Form exists or create it
- [ ] Can fill: contact, items (line items), amount, dueDate
- [ ] Saves to `os_quotes` table
- [ ] Appears in `/os/money` quotes section
- [ ] Can convert to invoice
- [ ] Can view quote detail page

**Effort**: 3-4 hours

#### Task 1.8: Create Invoice
**Files**: Invoice creation flow (identify where it lives)  
**Test**:
- [ ] Form exists or create it
- [ ] Can fill: contact, items, amount, dueDate, notes
- [ ] Can convert from quote OR create standalone
- [ ] Saves to `os_invoices` table
- [ ] Appears in `/os/money` invoices section
- [ ] Can mark as paid/pending
- [ ] Shows in company workspace recent invoices

**Effort**: 3-4 hours

#### Task 1.9: Send Message
**Files**: Message creation flow  
**Test**:
- [ ] Form exists or create it
- [ ] Can fill: company/contact, subject, message
- [ ] Saves to `os_messages` table
- [ ] Appears in `/os/messages` conversation list
- [ ] Can view thread
- [ ] Can reply to message
- [ ] Appears in company activity timeline

**Effort**: 2-3 hours

---

### Group 2: Verify Detail Pages

Once create flows work, verify each detail page shows complete data and allows editing.

#### Task 2.1: Company Detail
**Files**: `app/os/workspace/[companyId]/page.tsx` (exists from Phase 3)  
**Check**:
- [ ] Shows all company info
- [ ] Shows related contacts
- [ ] Shows related work items
- [ ] Shows related calls
- [ ] Shows related documents
- [ ] Shows related quotes/invoices
- [ ] Shows activity timeline
- [ ] Can edit company details

**Effort**: 2-3 hours (add missing sections)

#### Task 2.2: Contact Detail
**Files**: `app/os/contacts/[id]/page.tsx`  
**Check**:
- [ ] Shows all contact info (name, email, phone, category)
- [ ] Shows related work items
- [ ] Shows call history
- [ ] Shows message history
- [ ] Shows quotes/invoices for this contact
- [ ] Can edit contact info
- [ ] Can delete contact

**Effort**: 3-4 hours

#### Task 2.3: Work Item Detail
**Files**: `app/os/work-items/[id]/page.tsx`  
**Check**:
- [ ] Shows all fields (title, type, company, owner, status, priority, dueDate, notes)
- [ ] Shows linked tasks
- [ ] Shows linked documents
- [ ] Shows activity timeline
- [ ] Can edit any field
- [ ] Can change status
- [ ] Can delete work item

**Effort**: 2-3 hours (likely mostly exists)

#### Task 2.4: Task Detail
**Files**: Task detail page (may not exist)  
**Check**:
- [ ] Shows task info (label, status, assignedTo, dueDate)
- [ ] Shows linked work item
- [ ] Can mark complete
- [ ] Can edit
- [ ] Can delete

**Effort**: 1-2 hours

#### Task 2.5: Document Detail
**Files**: Document detail/view page  
**Check**:
- [ ] Shows document preview or download link
- [ ] Shows metadata (name, size, upload date, uploader)
- [ ] Shows status (pending review, approved, etc.)
- [ ] Can change status
- [ ] Can delete

**Effort**: 2-3 hours

#### Task 2.6: Call Detail
**Files**: Call detail page  
**Check**:
- [ ] Shows all call info (contact, date, duration, notes)
- [ ] Shows linked contact
- [ ] Shows linked work item (if any)
- [ ] Can edit notes
- [ ] Can delete

**Effort**: 1-2 hours

#### Task 2.7: Message Thread Detail
**Files**: Message thread page  
**Check**:
- [ ] Shows conversation thread
- [ ] Shows all messages chronologically
- [ ] Can reply to message
- [ ] Can mark thread as read/unread
- [ ] Can archive

**Effort**: 2-3 hours

#### Task 2.8: Quote Detail
**Files**: Quote detail page  
**Check**:
- [ ] Shows all quote info (contact, items, amount, dueDate, status)
- [ ] Shows PDF preview
- [ ] Can mark as sent
- [ ] Can convert to invoice
- [ ] Can edit

**Effort**: 2-3 hours

#### Task 2.9: Invoice Detail
**Files**: Invoice detail page  
**Check**:
- [ ] Shows all invoice info (contact, items, amount, dueDate, status)
- [ ] Shows payment status
- [ ] Can mark as paid
- [ ] Can view/download PDF
- [ ] Can edit (before paid)

**Effort**: 2-3 hours

---

### Group 3: Verify Action Buttons

These are the "things happen" checks — ensuring buttons actually change state.

#### Task 3.1: Mark Task Complete
- [ ] Button exists on task detail/list
- [ ] Clicking updates `actions` table status='Completed'
- [ ] Item disappears from open tasks list
- [ ] Appears in completed/closed tasks
- [ ] Activity log records the completion

**Effort**: 1 hour

#### Task 3.2: Mark Alert Read
- [ ] Button/click exists on alert
- [ ] Updates `os_alerts` table isRead=true
- [ ] Alert fades/disappears from unread list
- [ ] Alert count decreases

**Effort**: 30 minutes

#### Task 3.3: Document Status Change
- [ ] Can mark document Approved
- [ ] Can mark document Rejected
- [ ] Can archive document
- [ ] Updates `os_documents` status field

**Effort**: 1 hour

#### Task 3.4: Mark Quote as Sent
- [ ] Button on quote detail
- [ ] Updates `os_quotes` status
- [ ] Can convert to invoice

**Effort**: 1 hour

#### Task 3.5: Mark Invoice as Paid
- [ ] Button on invoice detail
- [ ] Updates `os_invoices` status
- [ ] Updates financial metrics

**Effort**: 1 hour

#### Task 3.6: Delete Operations
- [ ] Can delete contact (with confirmation)
- [ ] Can delete work item (with confirmation)
- [ ] Can delete task
- [ ] Can delete message/conversation
- [ ] Can delete document
- [ ] Item disappears from list immediately
- [ ] Activity log records deletion

**Effort**: 2 hours

---

### Group 4: Dashboard Metrics (Only After Data Verified)

Once all create/read/update/delete flows work, add these metrics:

- [ ] Consolidation Rate (from `ut_daily_metrics`)
- [ ] Open Tasks (count from `actions` where status='Open')
- [ ] Revenue Today (sum from `os_invoices` where created today)
- [ ] Active Companies (count from companies with activity today)
- [ ] Compliance Score (from FineGuard pending alerts)
- [ ] Outstanding Invoices (sum from `os_invoices` where status='Pending')

**Effort**: 2-3 hours (once data is reliable)

---

## Testing Checklist

### End-to-End User Flow
- [ ] Create a company "Acme Inc"
- [ ] Add a contact "John Smith" to Acme
- [ ] Log a call with John (30 min)
- [ ] Create a work item "Follow up proposal"
- [ ] Create a task "Prepare proposal draft" linked to work item
- [ ] Upload proposal document
- [ ] Create quote for Acme for $5,000
- [ ] Convert quote to invoice
- [ ] View company workspace — verify all items appear:
  - [ ] Contact in contacts section
  - [ ] Work item in today's work
  - [ ] Task visible
  - [ ] Document in recent documents
  - [ ] Quote/Invoice in money section
  - [ ] Call in activity timeline
  - [ ] All activity appears chronologically
- [ ] View activity page for Acme — verify full timeline

### Data Integrity Checks
- [ ] Deleting a document removes it from list and database
- [ ] Marking task complete updates work item
- [ ] Marking invoice paid updates financial totals
- [ ] Deleting contact removes all related items' links to it
- [ ] Creating work item with no company doesn't break system

---

## Effort Estimate

| Group | Tasks | Hours |
|-------|-------|-------|
| Group 1: Create Flows | 1.1-1.9 (9 tasks) | 20-25 |
| Group 2: Detail Pages | 2.1-2.9 (9 tasks) | 18-24 |
| Group 3: Actions | 3.1-3.6 (6 tasks) | 5-7 |
| Group 4: Metrics | Dashboard only | 2-3 |
| **Total Sprint 1** | **24 tasks** | **45-60 hours** |

**Realistic timeline**: 2-3 weeks (assuming 15-20 hrs/week available)

---

## Definition of Done

Sprint 1 is complete when:

1. ✅ All 9 create flows work end-to-end (create → save → list → detail)
2. ✅ All detail pages show complete data with no placeholders
3. ✅ All action buttons actually update the database
4. ✅ User can complete the test flow (company → contact → call → task → document → quote → invoice)
5. ✅ Everything appears in company workspace, lists, and activity timeline
6. ✅ No dead links, no 404s, no placeholder text visible to users
7. ✅ Database is the single source of truth (no hardcoded data)

---

## Success Looks Like

User opens UltraTechOS and can:

> "I can run my entire business from this app. Every action I take is saved, every record appears where it should, and nothing disappears or breaks when I reload the page."

That's when Sprint 1 is done. Everything after that builds on a proven, trustworthy foundation.
