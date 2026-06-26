# UltraTechOS Product Test Matrix

> Manual test checklist for verifying core product flows.
> Run before each production deployment.

---

## Utility Launcher

### Talk (AI Receptionist Entry)

**Purpose:** Primary voice/text entry point for AI-assisted work capture.

**Daily value:** Capture instructions, notes, and requests without navigating menus.

**Manual test steps:**
1. Open `/os` — verify Talk button is visible with microphone icon
2. Tap Talk — verify page transitions to `/os/talk` within 200ms
3. Tap the microphone button — verify browser requests microphone permission
4. Grant permission — verify "Listening…" state with pulse animation
5. Deny permission — verify fallback text input appears with clear explanation
6. Type text in fallback input — verify Send button activates
7. Tap Send — verify "Processing…" state renders
8. Tap back arrow — verify return to launcher

**Expected outcome:** Talk opens instantly, captures voice or text, shows processing state, never dead-ends the user.

**Failure meaning:** If microphone permission prompt does not appear, browser may not support `getUserMedia`. Fallback text input must always appear as alternative.

---

### Book (Smart Diary)

**Purpose:** Create appointment records stored as tasks with due dates.

**Daily value:** Book meetings without leaving the app; appointments appear in Go.

**Manual test steps:**
1. Tap Book on launcher — verify transition to `/os/book`
2. Verify Contact field is auto-focused
3. Fill: Contact = "Test Client", Date = tomorrow, Time = 10:00
4. Tap Book Appointment — verify "Saving…" spinner appears
5. Verify success screen shows contact name, date, time
6. Tap "View in Go" — verify `/os/go` shows the booked appointment
7. Submit with empty Contact — verify button stays disabled
8. Tap back arrow — verify return to launcher without data loss prompt

**Expected outcome:** Appointment saved as `os_task` with title `Appointment: {contact}` and correct `dueAt`. Appears in Go page.

**Failure meaning:** If POST to `/api/os/tasks` fails, error banner must appear with retry option. No blank/broken states.

---

### Quote (Quick Estimate)

**Purpose:** Create draft quotes for customers without entering the full Money module.

**Daily value:** Capture a quote during or immediately after a customer call.

**Manual test steps:**
1. Tap Quote on launcher — verify transition to `/os/quote`
2. Verify Customer field is auto-focused
3. Fill: Customer = "Acme Ltd", Amount = 450
4. Tap Create Quote — verify "Creating quote…" spinner
5. Verify success screen shows customer name and £450.00
6. Verify quote number format: `Q-YYYYMMDD-NNN`
7. Tap "View Quote" — verify redirect to `/os/money`
8. Submit with empty Customer — verify button stays disabled

**Expected outcome:** Quote created in `os_quotes` with status Draft. Quote number is unique.

**Failure meaning:** If number collision occurs (duplicate `Q-*` on same day), API returns 400. Retry generates new random suffix.

---

### Inbox (Unified Inbox Placeholder)

**Purpose:** Entry point for all inbound communication — placeholder for Phase 2 integration.

**Daily value:** Single place to check all inbound activity.

**Manual test steps:**
1. Tap Inbox on launcher — verify transition to `/os/inbox`
2. Verify "Unified inbox coming soon" notice is visible
3. Verify 4 source links: Messages, Calls, Leads, Alerts
4. Tap Messages — verify navigation to `/os/messages`
5. Tap back — return to inbox
6. Tap Calls — verify navigation to `/os/calls`
7. Tap Alerts — verify navigation to `/os/alerts`

**Expected outcome:** Inbox renders the coming-soon notice and four working source navigation links.

**Failure meaning:** If source links return 404, the target module routes are missing from the app.

---

### Go (Route Planner Placeholder)

**Purpose:** Show upcoming appointments and future travel planning.

**Daily value:** See what's on for today and where you need to be.

**Manual test steps:**
1. Tap Go on launcher — verify transition to `/os/go`
2. Verify "Maps & travel time coming soon" notice visible
3. If no appointments: verify empty state with "Book one now" link
4. Book an appointment via `/os/book` — return to Go
5. Verify appointment appears with correct contact name, date, time
6. Tap "Book Appointment" button — verify navigation to `/os/book`

**Expected outcome:** Upcoming appointments (tasks prefixed `Appointment:`) display with time hierarchy. Empty state provides clear next action.

**Failure meaning:** Appointments not appearing means the `LIKE 'Appointment:%'` filter on `os_tasks` is not matching. Verify task title format.

---

### Scan (Document Upload)

**Purpose:** Capture documents via camera or file picker into VaultLine.

**Daily value:** Scan a receipt, contract, or site photo directly into the document store.

**Manual test steps:**
1. Tap Scan on launcher — verify transition to `/os/scan`
2. Tap the upload area — verify file picker opens
3. On mobile: verify camera option appears (via `capture="environment"`)
4. Select a valid image file (JPEG < 10 MB)
5. Verify file name and size appear in the drop zone
6. Tap Upload Document — verify "Uploading…" state
7. Verify success screen with file name and "Pending review" status
8. Tap "View in Vault" — verify navigation to `/os/documents`
9. Tap "Scan Another" — verify return to idle state
10. Select a file > 10 MB — verify error "File must be under 10 MB"

**Expected outcome:** Document record created in `os_documents` with `source = Scan`, `status = PendingReview`. No actual file binary stored yet (Phase 2).

**Failure meaning:** If upload fails, inline error must appear with retry option. File picker must always be accessible.

---

## Validation & Measurement Framework

### OCR Widget (`/today`)

**Purpose:** Display Operational Consolidation Rate — % of work captured in UltraTechOS vs. external tools.

**Manual test steps:**
1. Visit `/today`
2. Verify OCR widget renders (not blank/error)
3. Verify current week rate shown as percentage
4. If previous week data exists, verify trend indicator (up/down/flat)
5. Log a workflow_leak event via POST `/api/ut/workflow-leak`
6. Reload `/today` — verify rate changes reflect new leak

**Expected outcome:** Widget renders current week live from `ut_activity_events`. Previous week pulled from `ut_weekly_reports`.

---

### Daily Aggregation

**Manual test steps:**
1. POST `/api/ut/aggregate/daily` with valid `CRON_SECRET` header
2. Verify response `{"success": true}`
3. POST again — verify idempotent (no duplicate records)
4. POST without cron secret — verify HTTP 401

**Expected outcome:** Idempotent daily rollup. Second run updates existing record via `onConflictDoUpdate`.

---

### Weekly Aggregation

**Manual test steps:**
1. POST `/api/ut/aggregate/weekly` with valid `CRON_SECRET` header
2. Verify response contains `{"success": true, "report": {...}}`
3. Verify `weekStart` is the most recent completed Monday (not current week)
4. Run on a Sunday — verify `weekStart` is the Monday 7 days back (not 14)
5. POST again — verify idempotent

**Expected outcome:** `weekStart` always resolves to the correct Monday via `getWeekBounds()`. Upserts safely on re-run.

---

## Security Checks

| Check | Test | Expected |
|---|---|---|
| Metadata size limit | POST `/api/ut/event` with `metadata` > 2 KB | HTTP 400 |
| Invalid task status | PATCH `/api/os/tasks/:id` with `status: "Invalid"` | HTTP 400 |
| Message fromName spoof | POST `/api/os/messages` with `fromName: "attacker"` | `fromName` = session user |
| Valid cron auth | POST aggregate route with correct `CRON_SECRET` | HTTP 200 |
| Invalid cron auth | POST aggregate route with wrong secret | HTTP 401 |

---

## FineGuard

### Process Run

**Manual test steps:**
1. POST `/api/fineguard/process` with valid `CRON_SECRET`
2. Verify `runId` returned in response
3. Verify `run_id` stored in `fg_audit_runs`
4. Run again — verify no duplicate alerts created
5. Verify `msgStatus` is computed before `trackEvent` call

**Expected outcome:** Idempotent. Same companies produce same alerts. No double-dispatch.
