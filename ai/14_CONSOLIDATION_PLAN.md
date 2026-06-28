# Consolidation Plan

## Objective

One canonical branch (`chore/drizzle-full-migration`) → promoted to `main` → one production Vercel project → one database implementation → no duplicates.

## Source branches

| Branch | Role | Status |
|---|---|---|
| `chore/drizzle-full-migration` | **Canonical. Develop here.** | Active |
| `claude/ultracore-sheetops-mvp-wAwwp` | Feature source — selective cherry-pick only | Read-only |
| `claude/jolly-hawking-xqufwo` | Docs/reference source | Read-only |

---

## Phase 1 — Stabilisation ✅ COMPLETE

**Build status:** type-check ✅ · build ✅ · 130/130 tests ✅

**Completed:**
- [x] Restored type-check, build, 130/130 tests
- [x] Fixed lazy Prisma init (K01 resolved)
- [x] Fixed all @prisma/client enum imports (R03 resolved)
- [x] Added `lib/types.ts` as enum source of truth
- [x] Added AI documentation directory (15 files)
- [x] Stabilisation audit completed (`ai/15_STABILISATION_AUDIT.md`)

**Safe cherry-picks applied:**
- [x] `lib/voice/known-entities.ts` — Known company names
- [x] `lib/voice/types.ts` — DraftRecord.status field
- [x] `lib/voice/parser.ts` — Improved NLP
- [x] `lib/work-item-enums.ts` — TYPE_SYNONYMS
- [x] `lib/crm-utils.ts` — CRM pipeline utils
- [x] `lib/template-utils.ts` — Template variable utils
- [x] `lib/compliance/thresholds.ts` — Filing thresholds
- [x] `lib/queries/briefing.ts` — Morning briefing query
- [x] `app/activity/ActivityClient.tsx` — Filterable activity
- [x] `app/activity/page.tsx` — Server/client split
- [x] `app/dashboard/DashboardClient.tsx` — Morning Briefing UI
- [x] `app/api/dashboard/briefing/route.ts` — Briefing API
- [x] `app/team/page.tsx` — Team capacity
- [x] `app/api/team/capacity/route.ts` — Team capacity API
- [x] `app/my-tasks/page.tsx` — My Tasks (import fixed)
- [x] `app/my-tasks/MyTasksClient.tsx` — My Tasks UI
- [x] `app/api/my-tasks/route.ts` — My Tasks API (import fixed)
- [x] `components/NavBar.tsx` — Voice tab + new menu items

---

## Phase 2 — Schema Migrations (BLOCKED — not yet started)

Each migration must:
1. Be written as a Prisma migration file (`prisma migrate dev --name <name>`)
2. Not use `prisma db push --accept-data-loss`
3. Be verified: type-check + build + 130 tests pass after each one

### Migration 2a — VoiceIntake quality signals

**New fields on `VoiceIntake`:**
- `transcriptConfidence Float?`
- `qualityFlags String[]`

**Unlocks:**
- [ ] `lib/voice/transcription.ts` — Quality signals
- [ ] `app/api/voice/transcribe/route.ts` — Updated return type
- [ ] `app/api/voice/upload/route.ts` — Updated pipeline
- [ ] `app/api/voice/drafts/route.ts` — New endpoint
- [ ] `app/voice-intake/page.tsx` — Quality badges, draft recovery

### Migration 2b — Action reassign fields

**New fields on `Action`:**
- `reassignedFrom String?`
- `reassignedAt DateTime?`
- `reassignedBy String?`
- `handoffNote String?`

**Unlocks:**
- [ ] `app/api/work-items/[id]/actions/[actionId]/reassign/route.ts`

### Migration 2c — Template workflow fields

**New enum `TemplateCategory`** and new fields on `Template`:
- `category TemplateCategory`
- `variables String[]`
- `pendingReview Boolean`
- `approvedBy String?`
- `approvedAt DateTime?`
- `reviewNote String?`

**Unlocks:**
- [ ] `app/api/templates/[id]/approve/route.ts`
- [ ] `app/api/templates/[id]/reject/route.ts`
- [ ] `app/api/templates/[id]/submit/route.ts`
- [ ] `components/TemplatesClient.tsx`
- [ ] `components/TemplatePreviewPanel.tsx`

### Migration 2d — Company CRM fields

**New fields on `Company`:**
- `isActive Boolean @default(true)`
- `companiesHouseNumber String?`
- `incorporationDate DateTime?`
- `jurisdiction String?`

**Unlocks:**
- [ ] `app/api/companies/route.ts` — isActive filter (rename from portfolio)

### Migration 2e+2f — OutreachLog + PipelineStage

**New enum `PipelineStage`** and new model `OutreachLog`, new fields on `WorkItem`:
- `WorkItem.pipelineStage PipelineStage?`
- `WorkItem.lastTouchedAt DateTime?`
- `OutreachLog` model with fields: id, workItemId, person, channel, summary, occurredAt

**Unlocks:**
- [ ] `app/api/partnerships/route.ts`
- [ ] `app/api/partnerships/[id]/stage/route.ts`
- [ ] `app/partnerships/page.tsx`
- [ ] `app/partnerships/PartnershipBoard.tsx`
- [ ] `app/partnerships/PartnershipList.tsx`
- [ ] `app/api/work-items/[id]/outreach/route.ts`
- [ ] `app/api/outreach/[id]/route.ts`
- [ ] `components/OutreachLogSection.tsx`

### Migration 2g — Filing model

**New model `Filing`** with fields: id, title, category, referenceNumber, status, dueDate, filedDate, notes, workItemId?

**Unlocks:**
- [ ] `app/api/filings/route.ts`
- [ ] `app/api/filings/[id]/route.ts`
- [ ] `app/api/filings/health/route.ts`
- [ ] `app/api/filings/refresh-status/route.ts`
- [ ] `app/filings/FilingsClient.tsx`

---

## Phase 3 — Drizzle Schema Sync (DEFERRED)

After Phase 2 schema migrations are complete and Prisma is stable in production, bring Drizzle schema into parity:

- Add `Operations`, `TechTask` to `workItemType` enum in `db/schema.ts`
- Add `VoiceIntake`, `UserPassword`, `Company`, `Contact` tables
- Upgrade alert tables from minimal stubs to full parity
- Delete `lib/db.drizzle-wip.ts`
- Decide: keep Drizzle as future ORM or remove entirely (Decision needed: D09)

---

## Phase 4 — Main Promotion (BLOCKED on Phase 2+3)

- [ ] `chore/drizzle-full-migration` passes type-check + build + 130 tests
- [ ] All Phase 2 schema migrations applied and verified in production
- [ ] `/partnerships` page exists and works
- [ ] `/filings` detail page (dedicated Filing model) exists and works
- [ ] Template workflow (submit/approve/reject) exists and works
- [ ] Voice quality signals displayed in voice intake
- [ ] Smoke test: login → create work item → view dashboard → view partnerships → view filings
- [ ] `chore/drizzle-full-migration` promoted to `main`
- [ ] `manus-frontend` Vercel project verified on new `main`
- [ ] Rollback path documented

---

## Phase 5 — Vercel Cleanup (BLOCKED on Phase 4)

Only after Phase 4 promotion is verified:

| Project | Action |
|---|---|
| `manus-frontend` | KEEP — canonical production |
| `agent-x` | Review — may serve separate function |
| `ult-ai-lite` | Review — may serve separate function |
| `manus-frontend-c9li` | Delete |
| `manus-frontend-edg7` | Delete |
| `manus-frontend-sheetops` | Delete |
| `manus-frontend-sheetops-iphone` | Delete |

---

## Never cherry-pick

| File | Reason |
|---|---|
| `lib/db.ts` (sheetops version) | Removes Drizzle layer and lazy-init proxy |
| `package.json` (sheetops version) | Removes drizzle-orm and postgres packages |
| `vercel.json` (sheetops version) | Uses `db push --accept-data-loss` — destructive |
| `app/api/dashboard/route.ts` (sheetops version) | Reverts @/lib/types import to @prisma/client |
| Sheetops deletion of `db/schema.ts` | Critical — Drizzle schema |
| Sheetops deletion of `lib/types.ts` | Critical — independent enum types |
| Sheetops deletion of 7 OS form pages | Removes Phase 4 Sprint 1 forms |

---

## Open cleanup items (do when convenient, no schema needed)

| Item | Status | Action |
|---|---|---|
| `lib/db.drizzle-wip.ts` | Orphaned — nothing imports it | Delete |
| `lib/supabase.ts` | Dead code — nothing imports it | Delete (verify `@supabase/supabase-js` then removable from package.json too) |
| `/teams` vs `/team` | Duplicate team capacity views | Resolve post-schema-migration |
| `/api/portfolio` naming | Serves companies, not portfolio | Rename to `/api/companies` after audit |
| OS form pages | Unreachable without direct URL | Add to nav or remove in Phase 4 |
