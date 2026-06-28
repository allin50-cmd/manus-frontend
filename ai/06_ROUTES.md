# UI Routes

All routes require authentication (redirect to `/login`).

## Core navigation

| Route | Page | Notes |
|---|---|---|
| `/dashboard` | Compliance Dashboard | Morning Briefing for George only |
| `/activity` | Activity Log | 500 events, filterable by signal/person/date |
| `/decisions` | Decision Queue | Open decisions only |
| `/filings` | Filings | Compliance deadlines |
| `/portfolio` | Portfolio | Work item portfolio view |
| `/work-items` | Work Item List | Filter by status/type/owner |
| `/work-items/new` | Create Work Item | — |
| `/work-items/[id]` | Work Item Detail | Actions, decisions, activity |
| `/voice-intake` | Voice Intake | Recording → transcription → review → create |
| `/templates` | Templates | Template library |
| `/contacts` | Contacts | Contact list |
| `/alerts` | Alerts | Alert dashboard |
| `/alert-recipients` | Alert Recipients | Recipient management |
| `/alert-events` | Alert Audit | Delivery history |

## Task management

| Route | Page | Notes |
|---|---|---|
| `/my-tasks` | My Tasks | `?person=Name` for team drill-down |
| `/team` | Team Capacity | Per-person counts, links to /my-tasks |

## OS Module (Phase 4)

| Route | Page | Notes |
|---|---|---|
| `/os/calls/new` | New Call Form | — |
| `/os/contacts/new` | New Contact Form | — |
| `/os/documents/upload` | Document Upload | — |
| `/os/messages/new` | New Message Form | — |
| `/os/money/invoices/new` | New Invoice Form | — |
| `/os/money/quotes/new` | New Quote Form | — |
| `/os/tasks/new` | New Task Form | — |

## Deferred (blocked on schema migration)

| Route | Status |
|---|---|
| `/partnerships` | Blocked — PipelineStage enum not in schema |
| `/filings/*` (detail) | Blocked — Filing model not in schema |

## Auth

| Route | Page |
|---|---|
| `/login` | Login form |
