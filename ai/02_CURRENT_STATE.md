# Current State

Last updated: 2026-07-03

See `CLAUDE.md` → **Product Vision** and **AgentMail Integration Policy** for the product direction and AI-scope rules this state is tracked against.

## Branch status

| Branch | Status |
|---|---|
| `chore/drizzle-full-migration` | **CANONICAL** — type-checks, builds, 130/130 tests |
| `claude/jolly-hawking-xqufwo` | Source-only for selective extraction, NOT a merge target |
| `claude/ultracore-sheetops-mvp-wAwwp` | Source-only for selective extraction, NOT a merge target |

## Verification status on canonical branch

- `npm run type-check`: PASS (0 errors)
- `npm run build`: PASS
- `npm test`: PASS (130/130)

## What exists and works

### Pages / Routes
- `/dashboard` — Compliance dashboard + Morning Briefing (George only)
- `/activity` — Filterable activity log (signal tiers, person, date range)
- `/decisions` — Decision queue
- `/filings` — Filings list page
- `/portfolio` — Portfolio view
- `/work-items` — Work item list + `/work-items/[id]` detail
- `/work-items/new` — Create work item form
- `/voice-intake` — Voice recording → transcription → review
- `/templates` — Template management
- `/contacts` — Contacts list
- `/alerts`, `/alert-recipients`, `/alert-events` — Alert management
- `/my-tasks` — Per-person task list with mark-done
- `/team` — Team capacity overview
- `/settings` — User settings

### OS module (Phase 4 forms)
- `/os/calls/new`
- `/os/contacts/new`
- `/os/documents/upload`
- `/os/messages/new`
- `/os/money/invoices/new`
- `/os/money/quotes/new`
- `/os/tasks/new`
- `/os/today` — mobile Today Workspace: KPI tiles, Start Job / Complete Job modals, jobs due/overdue/blocked/my-tasks/pending-decisions lists, team workload. Uses existing Prisma models via existing API routes (`PATCH /api/work-items/[id]`, `POST /api/work-items/[id]/log`) — no new schema, no new dependency.

### Workflow engine
- `server/workflow/` — single source of truth for `WorkItem` status transitions (`WORK_ITEM_TRANSITIONS`). `PATCH /api/work-items/[id]` runs status changes through it: permission check, transition validation, atomic update + activity log + `lastTouchedAt` in one transaction. `runTransition` is entity-agnostic so future modules (os tasks, quotes, bookings) can reuse it with their own map and persistence closures. See D09.

### API Routes
- `/api/work-items` — CRUD
- `/api/work-items/[id]/actions` — Action management
- `/api/work-items/[id]/actions/[actionId]` — Update action status
- `/api/decisions/[id]` — Decision approve/reject
- `/api/dashboard` — Dashboard stats
- `/api/dashboard/briefing` — Morning briefing items (George)
- `/api/my-tasks` — Task list with filters
- `/api/team/capacity` — Per-person task counts
- `/api/voice/transcribe` — Whisper transcription
- `/api/voice/upload` — Upload audio for VoiceIntake
- `/api/voice/approve` — Approve voice intake → create work item
- `/api/templates` — Template CRUD
- `/api/alert-recipients` — Alert recipient management
- `/api/portfolio` — Portfolio data
- `/api/auth/*` — Login/logout/session

## What is partially implemented

### Partnerships / CRM pipeline
- `lib/crm-utils.ts` — Stage labels and helpers (pure logic, no DB)
- Schema requires: `PipelineStage` enum, `WorkItem.pipelineStage`, `WorkItem.dealValue`, `WorkItem.companyId`, `WorkItem.contactId`, `OutreachLog` model
- Pages exist in sheetops branch but NOT in canonical (blocked on schema migration)

### Filings
- `lib/compliance/thresholds.ts` — Threshold config (pure logic, no DB)
- Requires: `Filing` model + `FilingStatus`/`FilingCategory`/`FilingSource` enums
- Pages exist in sheetops branch but NOT in canonical (blocked on schema migration)

### Template workflow (approve/reject/submit)
- `lib/template-utils.ts` — Variable substitution engine (pure logic, no DB)
- Requires: `Template.category`, `Template.variables`, `Template.pendingReview`, `Template.approvedBy`, `Template.approvedAt`, `Template.reviewNote` + `TemplateCategory` enum
- Pages exist in sheetops branch but NOT in canonical (blocked on schema migration)

### Voice quality signals
- Requires: `VoiceIntake.transcriptConfidence`, `VoiceIntake.qualityFlags`
- Voice improvements exist in sheetops branch but NOT in canonical (blocked on schema migration)

### Action reassignment
- Requires: `Action.reassignedFrom`, `Action.reassignedAt`, `Action.reassignedBy`, `Action.handoffNote`
- My Tasks reassign UI exists but the API endpoint is blocked on schema migration

### AgentMail (persistent conversational email)
- **Approved in policy, zero code exists.** No `EmailThread` model, no API routes, no dependency installed. Do not assume any voice command like "email the customer" or "read my messages" is wired up — it isn't.
- Requires: `EmailThread` model, `WorkItem.emailThreadId` (see `ai/09_ROADMAP.md` Migration 2h)
- Scope when built: communication mechanics only (find thread, draft, summarise, send, log) inside a user-triggered flow ending in a deterministic activity/task record — never autonomous business decisions. See `CLAUDE.md` → AgentMail Integration Policy.

## ORM state

| Layer | Status |
|---|---|
| Prisma | Active runtime. All existing routes use `db.model.*` |
| Drizzle | Schema defined (`db/schema.ts`). `getDb()` exported from `lib/db.ts`. NOT used in production routes yet. |

## Known issues

See `ai/10_KNOWN_ISSUES.md`
