# Changelog

## 2026-07-02 — Server-side workflow engine

### Added
- `server/workflow/` — reusable workflow engine (`workflowTransitions.ts`, `workflowPermissions.ts`, `workflowActivity.ts`, `workflowEngine.ts`). Status rules live in one map (`WORK_ITEM_TRANSITIONS`); `runTransition` is an entity-agnostic pipeline (permission → load → validate → apply → record) usable by Prisma and Drizzle entities; `transitionWorkItem` runs it inside one `db.$transaction`.
- `server/workflow/__tests__/workflow.test.ts` — 13 tests for the map, activity payload, pipeline, and Prisma adapter; 3 new route tests for PATCH transition wiring (148 total).

### Changed
- `PATCH /api/work-items/[id]` — status changes now go through `transitionWorkItem` (atomic update + activity log + `lastTouchedAt`); field-only updates unchanged. API surface unchanged.
- Behaviour deltas (deliberate): leaving `Completed`/`NotFit`/`Archived` is restricted to explicit reopen/restore transitions and other requests get 400; a failed activity write now rolls back the status change instead of being swallowed; `lastTouchedAt` is stamped on every transition.
- `tsconfig.json` include + `vitest.config.ts` now cover `server/**` (removed stale exclude left from the rejected PR #27 layout).

## 2026-07-02 — Today Workspace + AI memory plugin

### Added
- `app/os/today/page.tsx`, `app/os/today/TodayWorkspace.tsx` — mobile Today Workspace (KPI tiles, Start Job / Complete Job modals, jobs due/overdue/blocked tasks/my tasks/pending decisions lists, team workload). Built on existing Prisma models and API routes only — no new tables, no new dependency, no Supabase client SDK.
- `NavBar` — "Today Workspace" link in the mobile More menu, pointing at `/os/today`.
- `plugins/ultratech-ai-memory/` — Claude Code dev-tooling plugin. Deterministic markdown project memory only: a `SessionStart` hook that prints `ai/00_READ_THIS_FIRST.md`, `ai/02_CURRENT_STATE.md`, `ai/10_KNOWN_ISSUES.md` into context, plus a `project-memory` skill documenting how to read/update the `ai/` files. No AI/LLM calls, no external services.
- `.claude-plugin/marketplace.json` — local marketplace entry so the plugin can be enabled with `/plugin marketplace add .`.

## 2026-06-28 — Consolidation Phase 1

### Fixed
- Restored type-check, build, and 130/130 tests on `chore/drizzle-full-migration`
- Fixed module-level PrismaClient crash with lazy Proxy init in `lib/db.ts`
- Fixed TS2635 errors in `app/activity/page.tsx`, `app/contacts/page.tsx`, `app/decisions/page.tsx`
- Fixed 14 routes importing from `@prisma/client` — moved to `@/lib/types`
- Removed stale `.next/types/app/api/os/message-threads` reference
- Added `.claude/` to `.gitignore`
- Installed `drizzle-orm` (was in package.json but not node_modules)
- Added `osMessageThreads` to `db/schema.ts`
- Added `getDb()` and `osMessageThreads` re-export to `lib/db.ts`

### Added
- `lib/types.ts` — Prisma-independent enum types (WorkItemType, WorkItemStatus, Priority, ActionType, ActionStatus, EventType, DecisionStatus, RecipientRole, DeliveryChannel) + WorkItem interface
- `lib/voice/known-entities.ts` — KNOWN_COMPANIES for secondary company extraction
- `lib/voice/types.ts` — added `status?: string` to DraftRecord
- `lib/work-item-enums.ts` — added TYPE_SYNONYMS for spoken voice matching
- `lib/voice/parser.ts` — improved NLP: suggestStatus(), tiered extractOwner(), richer date parsing (today/tomorrow/quarters/this weekday/end of Q-), extractTitle() strips preambles and owner tails, synonym matching
- `lib/crm-utils.ts` — CRM pipeline stage labels, ordering, daysSinceLastTouch, nextFollowUpDate
- `lib/template-utils.ts` — resolveTemplate, extractVariables, buildVariableMap
- `lib/compliance/thresholds.ts` — filing deadline thresholds and category labels
- `lib/queries/briefing.ts` — getBriefingItems(), isOverdue(), endOfToday()
- `app/activity/ActivityClient.tsx` — filterable activity timeline (signal tiers, person, date range)
- `app/activity/page.tsx` — server/client split, 500 event limit, Date serialisation
- `app/dashboard/DashboardClient.tsx` — Morning Briefing component with collapsible sections and action tiles
- `app/dashboard/page.tsx` — Morning Briefing section (George only), parallel data fetch
- `app/api/dashboard/briefing/route.ts` — GET /api/dashboard/briefing
- `app/team/page.tsx` — team capacity view with per-person card grid
- `app/api/team/capacity/route.ts` — GET /api/team/capacity
- `app/my-tasks/page.tsx` — per-person task list (ActionStatus from @/lib/types)
- `app/my-tasks/MyTasksClient.tsx` — filterable task list with mark-done + reassign UI
- `app/api/my-tasks/route.ts` — GET /api/my-tasks with filters
- `components/NavBar.tsx` — Voice tab in mobile bottom bar; My Tasks, Team Capacity, Filings, Pipeline in More menu
- `ai/` directory — 14 documentation files for AI session continuity
- `docs/PHASE-3-MERGE-STRATEGY.md` — updated: canonical is chore/drizzle-full-migration
- `docs/PHASE-4-DATABASE-CONSOLIDATION.md` — updated: do not delete Prisma
- `docs/PHASE-5-SHEETOPS-ASSESSMENT.md` — SheetOps remains archive/reference only
- `docs/PHASE-6-VERCEL-CONSOLIDATION.md` — no Vercel deletions until promotion verified

### Decisions documented
- D01: Canonical branch is chore/drizzle-full-migration
- D02: Do not remove Prisma yet
- D03: lib/types.ts is the enum source of truth
- D04: Lazy Prisma initialisation
- D05: Never merge sheetops wholesale
- D06: vercel.json must not use db push --accept-data-loss
- D07: No Vercel deletions until canonical branch stable on main
- D08: New routes use @/lib/types for enum imports

### Not yet implemented (blocked on schema migration)
- Partnerships / Pipeline CRM (PipelineStage, OutreachLog)
- Filings detail (Filing model)
- Template workflow (Template.category/variables/etc.)
- Voice quality signals (VoiceIntake.transcriptConfidence/qualityFlags)
- Action reassign endpoint (Action.reassignedFrom/At/By/handoffNote)
