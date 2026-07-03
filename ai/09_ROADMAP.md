# Roadmap

See `CLAUDE.md` → **Product Vision** and **AgentMail Integration Policy** for the product direction and AI-scope rules every phase below operates under: this is a mobile-first, voice-first business OS, not an AI app, and AgentMail/Whisper are the only two approved non-deterministic AI paths.

## Phase 1: Consolidation (current)

**Goal:** One stable, verified canonical branch.

- [x] Restore type-check, build, 130 tests on `chore/drizzle-full-migration`
- [x] Fix Prisma lazy init (module-load crash)
- [x] Create `lib/types.ts` (Prisma-independent enum types)
- [x] Update 14 routes to use `@/lib/types` instead of `@prisma/client`
- [x] Add `TYPE_SYNONYMS` to voice NLP parser
- [x] Improved voice NLP parser (tiered owner extraction, richer date parsing, suggestStatus)
- [x] Activity feed client/server split with signal filtering
- [x] Morning Briefing for George on dashboard
- [x] My Tasks page with mark-done and reassign UI
- [x] Team Capacity page
- [x] Voice tab in mobile nav
- [x] AI documentation (`ai/` directory)

## Phase 2: Schema migration (required before deferred features)

**Goal:** Extend Prisma schema to enable deferred features. Each migration must be atomic and deployed via `prisma migrate deploy`.

### Migration 2a: VoiceIntake quality signals
```
VoiceIntake.transcriptConfidence Float?
VoiceIntake.qualityFlags         String[]
```
**Unlocks:** Voice transcription quality badges, draft confidence display

### Migration 2b: Action reassignment
```
Action.reassignedFrom String?
Action.reassignedAt   DateTime?
Action.reassignedBy   String?
Action.handoffNote    String?
```
**Unlocks:** Full My Tasks reassign functionality, `/api/work-items/[id]/actions/[actionId]/reassign`

### Migration 2c: Template workflow
```
Template.category     TemplateCategory (enum)
Template.variables    String[]
Template.pendingReview Boolean @default(false)
Template.approvedBy   String?
Template.approvedAt   DateTime?
Template.reviewNote   String?
```
**Unlocks:** Template approval workflow (submit/approve/reject), TemplatesClient, TemplatePreviewPanel

### Migration 2d: Company CRM fields
```
Company.isActive                Boolean @default(true)
Company.companiesHouseNumber    String?
Company.incorporationDate       DateTime?
Company.jurisdiction            String?
```
**Unlocks:** Companies API, Companies House integration

### Migration 2e: Outreach + WorkItem CRM fields (prerequisite for Partnerships)
```
OutreachLog model (new)
OutreachChannel enum (new)
OutreachDirection enum (new)
WorkItem.companyId    String?
WorkItem.contactId    String?
```
**Unlocks:** OutreachLogSection, work item CRM linking

### Migration 2f: Partnerships / Pipeline CRM (depends on 2d, 2e)
```
PipelineStage enum (new — ~26 values)
WorkItem.pipelineStage PipelineStage?
WorkItem.dealValue     Float?
```
**Unlocks:** Partnerships page, PartnershipBoard kanban, pipeline stage API

### Migration 2g: Filings / Compliance
```
Filing model (new)
FilingStatus enum (new: UPCOMING, AT_RISK, OVERDUE, COMPLETED, EXEMPT)
FilingCategory enum (new: CONFIRMATION_STATEMENT, ANNUAL_ACCOUNTS, etc.)
FilingSource enum (new: MANUAL, COMPANIES_HOUSE_API, CSV_IMPORT)
```
**Unlocks:** Filings list, detail, health endpoint, status refresh cron

### Migration 2h: AgentMail integration (approved, not started — no code exists yet)
```
EmailThread model (new) — persistent conversation, linked to Contact/Company/WorkItem
WorkItem.emailThreadId String?
```
**Unlocks:** Voice-triggered email actions ("email the customer", "reply to Dagon", "read my messages"), conversation continuity, AgentMail-backed drafting/summarisation.

**Scope reminder:** AgentMail is approved only for communication mechanics (find thread, draft, summarise, send, log) inside a user-triggered flow that always ends in a deterministic activity/task record — never autonomous business decisions. See `CLAUDE.md` → AgentMail Integration Policy for the full scope and the "Why This Isn't the Rejected PR #27 AI Agent" reconciliation before building this. Check `ai/02_CURRENT_STATE.md` before assuming any part of this is already implemented.

## Phase 3: Drizzle migration

**Goal:** Replace Prisma with Drizzle as the active query layer.

- Extend `db/schema.ts` to match all Prisma models
- Convert routes one by one, verifying each
- Remove Prisma dependency once all routes verified
- Remove `lib/db.drizzle-wip.ts` (already dead code)

## Phase 4: Promotion to main

**Goal:** Canonical branch becomes main, single production Vercel project.

- Promote `chore/drizzle-full-migration` to `main`
- Verify deployment on manus-frontend (production Vercel project)
- Archive/delete unused Vercel projects
- Tag v1.0 release
