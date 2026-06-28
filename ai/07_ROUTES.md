# Routes — UltraCore

**Last updated:** 2026-06-28

---

## Authentication Routes

| Route | Description |
|---|---|
| `/login` | Passcode login page |
| `/` | Root — redirects to `/os/today` (post-login) |

---

## OS Module Pages (`/os/*`)

All require valid session. Middleware protects these.

### Core Navigation

| Route | Description |
|---|---|
| `/os` | OS hub page |
| `/os/today` | Today command centre (post-login default) |
| `/os/activity` | Full activity/audit feed |
| `/os/alerts` | System alerts list |
| `/os/book` | Booking interface |
| `/os/go` | Quick-go / universal search |
| `/os/inbox` | Inbox view |
| `/os/scan` | QR/document scan |
| `/os/talk` | AI assistant (UltAi) |

### Work Items

| Route | Description |
|---|---|
| `/os/work-items` | Work items list |
| `/os/work-items/new` | Create new work item |
| `/os/work-items/[id]` | Work item detail |

### Tasks

| Route | Description |
|---|---|
| `/os/tasks` | Tasks list |
| `/os/tasks/new` | Create task form (Phase 4 Sprint 1) |

### Contacts

| Route | Description |
|---|---|
| `/os/contacts` | Contacts list |
| `/os/contacts/new` | Create contact form (Phase 4 Sprint 1) |

### Calls

| Route | Description |
|---|---|
| `/os/calls` | Call log list |
| `/os/calls/new` | Log call form (Phase 4 Sprint 1) |

### Messages

| Route | Description |
|---|---|
| `/os/messages` | Message threads list |
| `/os/messages/new` | Compose new thread (Phase 4 Sprint 1) |

### Money

| Route | Description |
|---|---|
| `/os/money` | Money hub (invoices overview) |
| `/os/money/invoices/new` | Create invoice (Phase 4 Sprint 1) |
| `/os/money/quotes/new` | Create quote (Phase 4 Sprint 1) |
| `/os/quote` | Quote list/view page |

### Documents

| Route | Description |
|---|---|
| `/os/documents` | Documents list |
| `/os/documents/upload` | Upload document form (Phase 4 Sprint 1) |

### Decisions & Templates

| Route | Description |
|---|---|
| `/os/decisions` | Decisions list |
| `/os/templates` | Templates list |

### Companies

| Route | Description |
|---|---|
| `/os/companies` | Company monitoring hub |
| `/os/companies/fineguard` | FineGuard companies |
| `/os/companies/builder-big-jobs` | Builder sector leads |
| `/os/companies/ultratech` | UltraTech companies |
| `/os/companies/accuracy` | Companies House accuracy check |

### Company Workspace

| Route | Description |
|---|---|
| `/os/workspace/[companyId]` | Per-company workspace |
| `/os/workspace/[companyId]/activity` | Company activity feed |
| `/os/workspace/[companyId]/apps` | Company apps |
| `/os/workspace/[companyId]/apps/fineguard` | FineGuard for company |

### Leads

| Route | Description |
|---|---|
| `/os/leads/builder-big-jobs` | Builder Big Jobs leads |

---

## Public App Routes (`/apps/*`)

No login required. Customer-facing.

| Route | Description |
|---|---|
| `/apps` | Apps hub/landing |
| `/apps/receptionist` | AI Receptionist form |
| `/apps/quote` | Quote Builder form |
| `/apps/booking` | Appointment Booking form |
| `/apps/[slug]` | Other placeholder app pages |

---

## Notes

- Phase 4 Sprint 1 form routes (marked above) exist on `claude/jolly-hawking-xqufwo` but not yet on `main`.
- All `/os/*` routes are protected by `middleware.ts`.
- `/apps/*` and `/api/apps/*` are PUBLIC — listed in `middleware.ts` PUBLIC_PATHS.
