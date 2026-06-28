# Phase 4: Connect the Business Operating System

**Objective**: Make every existing screen functional before expanding the platform.

> From the prototype and Phases 1–3, the UI foundation is largely in place. The biggest value now comes from connecting the existing interface to the real data model and business workflows rather than creating additional screens.

---

## Sprint 1: Live Data (Highest Priority)

**Goal**: Replace all placeholder metrics with real database queries. No hard-coded business data remains.

### Tasks

#### Dashboard & Today Page
- [ ] Today page: populate "due today" items from `work_items` and `actions` tables
- [ ] Today page: show actual "consolidation rate" from `ut_daily_metrics`
- [ ] Today page: display real alerts from `os_alerts` table
- [ ] Dashboard cards: wire to real counts (companies, work items, documents, contacts)

#### Companies Page
- [ ] Replace hardcoded company metrics with real KPI counts
- [ ] FineGuard: show actual monitored companies and pending alerts
- [ ] Builder Big Jobs: show actual leads count
- [ ] Other companies: show actual active apps

#### Workspace Overview
- [ ] Quick Stats: verify pulling from real database (already done in Phase 3)
- [ ] Today's Work: verify populated from live tasks
- [ ] Alerts: verify showing real alerts
- [ ] Recent Documents: verify pulling from database
- [ ] Recent Decisions: verify pulling from database
- [ ] Recent Activity: verify pulling from activity logs

#### Work Items Page
- [ ] List page: populate from `work_items` table with real filters
- [ ] Detail page: show all fields, notes, linked actions
- [ ] Status/priority indicators: show real values

#### Documents Page
- [ ] List documents from `os_documents` table
- [ ] Show upload metadata (date, uploader, file size)
- [ ] Implement document preview/link

#### Contacts Page
- [ ] List contacts from `os_contacts` table
- [ ] Show contact metadata (email, phone, company)
- [ ] Link to related work items

#### Money Page
- [ ] Invoices: list from `os_invoices` table
- [ ] Quotes: list from `os_quotes` table
- [ ] Show financial metrics (total invoiced, outstanding, etc.)

#### Calls Page
- [ ] List calls from `os_calls` table
- [ ] Show duration, date, linked contact/work item
- [ ] Call notes/recordings metadata

#### Messages Page
- [ ] List conversations from `os_messages` table
- [ ] Show unread count, last message timestamp
- [ ] Thread view with full history

---

## Sprint 2: Operational Workflows

**Goal**: Complete the core business journeys. A user can run a business from start to finish.

### Core Journeys

- [ ] **Create Company** → adds to workspace, shows in companies list
- [ ] **Add Contact** → adds to contacts, linkable to work items
- [ ] **Create Work Item** → appears in today view, workspace, search
- [ ] **Upload Document** → appears in documents, linked to work item
- [ ] **Create Quote** → appears in money, can be converted to invoice
- [ ] **Generate Invoice** → appears in money, shows in workspace
- [ ] **Log Call** → appears in calls, linked to contact/work item
- [ ] **Send Message** → appears in messages, linked to company
- [ ] **Complete Task** → updates work item status, appears in activity log

### Implementation Approach

For each journey:
1. Verify API endpoint exists (POST/PATCH routes)
2. Verify database schema supports all fields
3. Connect form submission to API
4. Verify success response and redirect
5. Verify record appears on relevant list pages immediately

---

## Sprint 3: Universal Search

**Goal**: One search experience covering all business objects.

### Search Scope
- [ ] Companies (by name, number, plan)
- [ ] Contacts (by name, email, phone)
- [ ] Documents (by name, metadata)
- [ ] Work Items (by title, notes, company)
- [ ] Tasks (by label, work item)
- [ ] Calls (by contact, notes)
- [ ] Messages (by thread name, content)
- [ ] Quotes (by contact, work item)
- [ ] Invoices (by invoice number, contact)

### Implementation

- [ ] Create `/api/search` endpoint accepting query string
- [ ] Return grouped results by entity type
- [ ] Create search UI page `/os/search?q=...`
- [ ] Add search button to main navigation
- [ ] Add keyboard shortcut (cmd+K / ctrl+K)

---

## Sprint 4: Activity & Audit

**Goal**: Unified timeline for every company and workspace.

### Timeline Display

Show in two places:
1. Company workspace: "Recent Activity" section (done in Phase 3)
2. Company activity page: full timeline (`/os/workspace/[companyId]/activity`)

### Activity Types

- [ ] Document uploaded
- [ ] Contact added
- [ ] Work item created/updated/completed
- [ ] Task completed
- [ ] Call logged
- [ ] Message sent
- [ ] Decision made
- [ ] Invoice generated
- [ ] Quote sent

### Implementation

- [ ] Verify `activity_logs` table captures all events
- [ ] Create `/os/workspace/[companyId]/activity` full timeline page
- [ ] Add filters: by date, by type, by person
- [ ] Export activity as CSV (optional)

---

## Sprint 5: AI Assistant

**Goal**: Build AI features on top of the live data.

### Features

- [ ] **Daily Summary**: "3 tasks completed, 1 invoice sent, 1 new contact"
- [ ] **Draft Emails**: AI suggests follow-up emails based on activity
- [ ] **Follow-Up Suggestions**: "Contact XYZ last contacted 30 days ago"
- [ ] **Compliance Reminders**: "FineGuard filing due in 14 days"
- [ ] **Invoice Summaries**: "£5,200 invoiced this week, £2,100 outstanding"
- [ ] **Company Health Insights**: "Activity is down 20% vs. last month"

### Implementation Approach

- [ ] Use existing OpenAI integration (UltAi module)
- [ ] Query live database for context
- [ ] Display on dashboard or daily summary page
- [ ] Do NOT use placeholder data

---

## Current State Assessment

**What's Working (Phase 3):**
- ✅ Workspace overview with live data
- ✅ ComplianceStatus showing real FineGuard alerts
- ✅ RecentActivity showing real activity logs
- ✅ Quick stats pulling from database

**What Needs Work:**
- Companies page KPIs (needs verification)
- Today page (needs verification)
- Work Items list (needs verification)
- Documents, Contacts, Calls, Money, Messages pages (likely placeholders)
- Search (not yet implemented)
- Activity page full timeline (not yet implemented)
- AI features (not yet integrated)

---

## Success Criteria for Phase 4

Phase 4 is complete when:

- ✅ Every navigation item is functional (doesn't return 404 or placeholder)
- ✅ Every list page shows real data from database (not hardcoded)
- ✅ Every create/edit form saves to database and updates immediately
- ✅ Search works across all entity types
- ✅ Activity timeline shows complete operational history
- ✅ Dashboard metrics reflect live business state
- ✅ A new user can create a company, add contacts, create work items, upload documents, log calls, and track tasks entirely within UltraTech OS
- ✅ No placeholder values or dead-end pages remain
- ✅ All 5 sprints complete

---

## Dependencies & Risks

### Blocking Issues
- [ ] Verify all required API endpoints exist
- [ ] Verify database schema matches what's being queried
- [ ] Verify auth is working on all routes (requireAuth check)
- [ ] Verify no N+1 queries or performance issues

### Known Gaps
- Create Company form (may not exist)
- Add Contact form (may not exist)
- Universal search API (doesn't exist yet)
- Full activity page (doesn't exist yet)
- AI integration to live data (not yet wired)

---

## Next Step

Begin Sprint 1: Live Data audit. Map every screen and identify which are connected to database vs. which show placeholders.
