# UltraCore SheetOps — Operator Test Pack

**Version:** MVP  
**Duration:** 30 minutes  
**Format:** Three people, one device each, working through real records already in the system

---

## Purpose

Find out whether three real operators can complete their daily workflow without help. This is not a usability study. The question is binary: can the app do the job today, or does something need to be fixed before it is used for real work?

---

## Roles

| Person | Role in the app | What they care about |
|--------|----------------|----------------------|
| Dagon | Relationship opener | Capturing leads, logging outreach, setting next actions |
| Alissa | Spreadsheet/controller operator | Tracking progress, updating statuses, keeping records tidy |
| George | Decision maker | Reviewing escalations, approving or rejecting decisions |

---

## Test Records Already in the System

These five records should be seeded before the session. Run `npm run db:seed` if the database is empty.

1. **EasyEstimate partnership target** — Partnership, Dagon, High priority
2. **Price A Job partnership target** — Partnership, Dagon, High priority
3. **HBXL benchmark trial** — Partnership, George, Medium priority
4. **Accuracy Havelock Walk quote** — Construction Lead, Alissa, High priority
5. **FineGuard alert workflow** — Compliance Alert, George, High priority

---

## 30-Minute Test Script

### Before you start (5 minutes)

- Open the app on each person's device
- Log in with the shared passcode
- Do not explain how anything works — just say "try to do the task"
- Note anything that causes confusion, hesitation, or a wrong tap

---

### Block 1 — Dagon (10 minutes)

**Context:** You have just had a call with Paul at EasyEstimate. It went well. You need to record what happened and set up the next step.

**Task 1.1 — Find the right record**  
Go to Work Items. Find "EasyEstimate partnership target". Open it.

**Task 1.2 — Log a note**  
Log a note: "Spoke to Paul. He is interested. Wants to see a one-pager."

**Task 1.3 — Create a follow-up action**  
Create a follow-up action: "Send EasyEstimate one-pager" due in 3 days, assigned to Dagon.

**Task 1.4 — Check Today's Actions**  
Go to Today's Actions. Confirm the follow-up you just created appears.

**Task 1.5 — Use a template to start a new outreach**  
Go to Templates. Find "EasyEstimate outreach". Click "Use template →". Review the pre-filled form. Change the title to "EasyEstimate follow-up outreach". Submit.

**Task 1.6 — Check Activity Log**  
Open the EasyEstimate partnership target. Scroll to Activity Log. Confirm the note and follow-up appear.

---

### Block 2 — Alissa (10 minutes)

**Context:** You are reviewing the week's pipeline. Two items need status updates and one needs to go to George.

**Task 2.1 — Update a status**  
Open "Accuracy Havelock Walk quote". Change the status to In Progress. Confirm the change shows in the detail view.

**Task 2.2 — Edit a field**  
Open "Price A Job partnership target". Edit the Next Action field to: "Send integration pilot brief". Save.

**Task 2.3 — Filter the list**  
Go to Work Items. Filter by Owner = Alissa. Confirm only Alissa's items show. Clear the filter.

**Task 2.4 — Filter by status**  
Filter by Status = In Progress. Confirm you can find the Accuracy record you just updated. Clear the filter.

**Task 2.5 — Escalate to George**  
Open "FineGuard alert workflow". Click "Escalate to George". Enter the question: "Do we build the alert recipient logic ourselves or rely on FineGuard's API?" Add a recommendation: "Use FineGuard's API to avoid scope creep." Submit.

**Task 2.6 — Confirm escalation**  
Check that the work item status changed to Escalated. Open the Decision Queue and confirm the FineGuard decision appears.

---

### Block 3 — George (10 minutes)

**Context:** You have been notified that a decision is waiting. Review it and make a call.

**Task 3.1 — Find the decision**  
Go to Decision Queue. Find the FineGuard decision Alissa just escalated.

**Task 3.2 — Open the linked work item**  
Click "Open work item →". Confirm it takes you to the FineGuard record. Go back.

**Task 3.3 — Approve the decision**  
Add a note: "Agreed. Use FineGuard's API. Dagon to confirm endpoint availability." Click Approve.

**Task 3.4 — Confirm the work item updated**  
Open "FineGuard alert workflow". Confirm status is now In Progress and Decision needed is cleared.

**Task 3.5 — Check Activity Log**  
Scroll to the Activity Log. Confirm you can see DecisionMade and StatusChanged entries.

**Task 3.6 — Review HBXL benchmark trial**  
Open "HBXL benchmark trial". Check the current status and next action. Log a note: "George reviewed. Waiting for Dagon to run the test quote."

**Task 3.7 — Mark complete (bonus)**  
If time allows, find any open follow-up action on any record and mark it Done using the "✓ Done" button. Confirm it disappears from Open Actions.

---

## Pass / Fail Checklist

Mark each item P (pass), F (fail), or N (not tested).

### Dagon

| # | Task | Result | Notes |
|---|------|--------|-------|
| 1.1 | Found EasyEstimate record | |  |
| 1.2 | Logged a note successfully | |  |
| 1.3 | Created a follow-up action with due date | |  |
| 1.4 | Follow-up visible in Today's Actions | |  |
| 1.5 | Template pre-filled the form | |  |
| 1.6 | Activity Log shows note and action | |  |

### Alissa

| # | Task | Result | Notes |
|---|------|--------|-------|
| 2.1 | Status updated to In Progress | |  |
| 2.2 | Next Action field edited and saved | |  |
| 2.3 | Owner filter narrowed results | |  |
| 2.4 | Status filter found updated record | |  |
| 2.5 | Escalation submitted to George | |  |
| 2.6 | Work item shows Escalated, Decision Queue shows entry | |  |

### George

| # | Task | Result | Notes |
|---|------|--------|-------|
| 3.1 | Found FineGuard decision in queue | |  |
| 3.2 | "Open work item →" link worked | |  |
| 3.3 | Decision approved with note | |  |
| 3.4 | Work item returned to In Progress, decision cleared | |  |
| 3.5 | Activity Log shows DecisionMade and StatusChanged | |  |
| 3.6 | Note logged on HBXL record | |  |
| 3.7 | Completed action disappeared from Open Actions (bonus) | |  |

### Overall

| Check | Result |
|-------|--------|
| App loaded on all three devices without error | |
| No crashes or blank screens during the session | |
| All three users completed their block without external help | |
| Activity Log accurately reflected everything that happened | |

---

## Questions to Ask After Testing

Ask each person immediately after their block. Keep it brief.

1. Was there anything you expected to find that you could not find?
2. Was there a step where you were not sure what to do next?
3. Did anything feel slow or take more taps than it should?
4. Is there anything you would need to do in your real work that the app does not support?
5. Would you use this instead of your current method? If not, what is stopping you?

---

## Bugs / Issues Log

Add a row for each problem observed during the session.

| # | Who | Task | What happened | Severity | Fixed? |
|---|-----|------|---------------|----------|--------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

**Severity scale:**  
- **Blocker** — the user could not complete the task at all  
- **Major** — the user completed the task but only with significant difficulty or workaround  
- **Minor** — small friction, confusing label, extra tap  
- **Polish** — cosmetic, does not affect task completion  

---

## Decision After Testing

Choose one outcome after reviewing the checklist and bug log.

### Continue
All three blocks completed. No Blockers. Fewer than 3 Majors. Move to real data and daily use.

### Fix first
One or more Blockers, or 3+ Majors. List the specific issues. Fix them before using the app for real work. Re-run only the affected block.

### Pause
The workflow does not match how the team actually works. The test has surfaced a structural mismatch. Stop development, hold a 30-minute re-scoping conversation, then decide whether to adapt the app or abandon it.

---

**Outcome recorded:**

| Field | Entry |
|-------|-------|
| Date | |
| Testers present | |
| Blockers found | |
| Majors found | |
| Decision | Continue / Fix first / Pause |
| Owner of next action | |
| Due date | |
