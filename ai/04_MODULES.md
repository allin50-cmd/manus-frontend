# Modules

## Core modules

### Work Items (`app/work-items/`, `app/api/work-items/`)
The central entity. A Work Item is any trackable obligation, lead, compliance task, or internal task.

**Key fields:** id, title, company, type, status, priority, owner, dueDate, notes, nextAction, decisionNeeded
**API:** GET/POST `/api/work-items`, GET/PUT/DELETE `/api/work-items/[id]`

### Actions (`app/api/work-items/[id]/actions/`)
Tasks attached to Work Items. Assigned to team members.

**Key fields:** id, workItemId, actionType, label, status, assignedTo, dueDate, result
**API:** GET/POST `/api/work-items/[id]/actions`, PATCH `/api/work-items/[id]/actions/[actionId]`

### Decisions (`app/decisions/`, `app/api/decisions/`)
Approval queue for George. Work items can require decisions.

**Key fields:** id, workItemId, question, options, recommendation, decisionBy, status, dueDate
**API:** PATCH `/api/decisions/[id]` (approve/reject/pause/more-info)

### Activity Log (`app/activity/`)
Append-only audit trail. Never editable.

**Key fields:** id, workItemId, person, eventType, summary, oldStatus, newStatus, createdAt
**UI:** Filterable by signal tier, person, date range with relative timestamps

### Voice Intake (`app/voice-intake/`, `app/api/voice/`)
Audio recording → Whisper transcription → parsed draft → user review → create work item.

**API:** POST `/api/voice/upload`, POST `/api/voice/transcribe`, POST `/api/voice/approve`
**Parser:** `lib/voice/parser.ts` — NLP extraction of type, status, priority, owner, company, due date
**Transcription:** `lib/voice/transcription.ts` — Whisper API wrapper

### My Tasks (`app/my-tasks/`, `app/api/my-tasks/`)
Per-person view of open Actions. Supports mark-done and reassign UI.

**API:** GET `/api/my-tasks?person=George&status=Open,Blocked&dueBefore=2026-07-01`
**UI:** Filter by status (Open/Blocked/Done) and due date (today/week/overdue)

### Team Capacity (`app/team/`, `app/api/team/capacity/`)
Overview of open/blocked/overdue tasks per team member.

**API:** GET `/api/team/capacity`
**UI:** Cards per person linking to `/my-tasks?person=Name`

### Morning Briefing (`app/dashboard/DashboardClient.tsx`, `lib/queries/briefing.ts`)
George-only. Shows decisions needed, overdue items, escalations, and follow-ups due today.

**Triggered by:** `session.person === 'George'` in `app/dashboard/page.tsx`
**API:** GET `/api/dashboard/briefing`

## Deferred modules (blocked on schema migration)

### Partnerships / CRM Pipeline
- Requires: `PipelineStage` enum, `WorkItem.pipelineStage`, `WorkItem.dealValue`, `OutreachLog` model
- Logic: `lib/crm-utils.ts` (stage labels, daysSinceLastTouch, nextFollowUpDate)
- Source: `claude/ultracore-sheetops-mvp-wAwwp` branch

### Filings / Compliance
- Requires: `Filing` model, `FilingStatus`, `FilingCategory`, `FilingSource` enums
- Logic: `lib/compliance/thresholds.ts` (deadline day thresholds)
- Source: `claude/ultracore-sheetops-mvp-wAwwp` branch

### Template Workflow (approve/reject/submit)
- Requires: `Template.category`, `Template.variables`, `Template.pendingReview`, etc.
- Logic: `lib/template-utils.ts` (variable substitution, extractVariables, buildVariableMap)
- Source: `claude/ultracore-sheetops-mvp-wAwwp` branch

### Voice Quality Signals
- Requires: `VoiceIntake.transcriptConfidence`, `VoiceIntake.qualityFlags`
- Logic: enhanced `lib/voice/transcription.ts` (confidence scoring, low_confidence / high_silence flags)
- Source: `claude/ultracore-sheetops-mvp-wAwwp` branch
