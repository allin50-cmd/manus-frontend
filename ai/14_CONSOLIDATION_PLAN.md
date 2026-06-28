# Consolidation Plan

## Objective

One canonical branch (`chore/drizzle-full-migration`) → promoted to `main` → one production Vercel project → one database implementation → no duplicates.

## Source branches

| Branch | Role | Status |
|---|---|---|
| `chore/drizzle-full-migration` | **Canonical. Develop here.** | Active |
| `claude/ultracore-sheetops-mvp-wAwwp` | Feature source — selective cherry-pick only | Read-only |
| `claude/jolly-hawking-xqufwo` | Docs/reference source | Read-only |

## Cherry-pick status from sheetops

### Safe to cherry-pick (done)
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

### Blocked on schema migration (not yet done)

**Requires Migration 2a (VoiceIntake fields):**
- [ ] `lib/voice/transcription.ts` — Quality signals (confidenceScore, qualityFlags)
- [ ] `app/api/voice/transcribe/route.ts` — Uses new return type
- [ ] `app/api/voice/upload/route.ts` — Updated pipeline
- [ ] `app/api/voice/drafts/route.ts` — New endpoint (VoiceIntake.transcriptConfidence)
- [ ] `app/voice-intake/page.tsx` — Quality badges, draft recovery

**Requires Migration 2b (Action reassign fields):**
- [ ] `app/api/work-items/[id]/actions/[actionId]/reassign/route.ts` — Reassign endpoint

**Requires Migration 2c (Template workflow fields):**
- [ ] `app/api/templates/[id]/approve/route.ts`
- [ ] `app/api/templates/[id]/reject/route.ts`
- [ ] `app/api/templates/[id]/submit/route.ts`
- [ ] `components/TemplatesClient.tsx`
- [ ] `components/TemplatePreviewPanel.tsx`

**Requires Migration 2d (Company CRM fields):**
- [ ] `app/api/companies/route.ts` — Company.isActive filter

**Requires Migrations 2e+2f (OutreachLog + PipelineStage):**
- [ ] `app/api/partnerships/route.ts`
- [ ] `app/api/partnerships/[id]/stage/route.ts`
- [ ] `app/partnerships/PartnershipBoard.tsx`
- [ ] `app/partnerships/PartnershipList.tsx`
- [ ] `app/partnerships/page.tsx`
- [ ] `app/api/work-items/[id]/outreach/route.ts`
- [ ] `app/api/outreach/[id]/route.ts`
- [ ] `components/OutreachLogSection.tsx`

**Requires Migration 2g (Filing model):**
- [ ] `app/api/filings/route.ts`
- [ ] `app/api/filings/[id]/route.ts`
- [ ] `app/api/filings/health/route.ts`
- [ ] `app/api/filings/refresh-status/route.ts`
- [ ] `app/filings/FilingsClient.tsx`

### Never cherry-pick (architecturally incompatible)

| File | Reason |
|---|---|
| `lib/db.ts` (sheetops version) | Removes Drizzle layer and lazy-init proxy |
| `package.json` (sheetops version) | Removes drizzle-orm and postgres packages |
| `vercel.json` (sheetops version) | Uses `db push --accept-data-loss` — destructive |
| `app/api/dashboard/route.ts` (sheetops version) | Reverts @/lib/types import to @prisma/client |
| Sheetops deletion of `db/schema.ts` | Critical — Drizzle schema |
| Sheetops deletion of `lib/types.ts` | Critical — independent enum types |
| Sheetops deletion of 7 OS form pages | Removes Phase 4 Sprint 1 forms |

## Duplicate implementations to clean up

| Item | Status | Action |
|---|---|---|
| `lib/db.drizzle-wip.ts` | Orphaned (nothing imports it) | Delete when convenient |
| Sheetops Vercel projects | Running but no longer canonical | Delete after Phase 4 |
| Docs in `docs/` referencing old branch strategy | Updated | Monitor for drift |

## Success criteria

- [ ] `chore/drizzle-full-migration` passes type-check + build + 130 tests
- [ ] All Phase 2 schema migrations applied and verified
- [ ] All safe cherry-picks from sheetops applied
- [ ] `/partnerships` page exists and works
- [ ] `/filings` detail page exists and works
- [ ] Template workflow (submit/approve/reject) exists and works
- [ ] Voice quality signals displayed in voice intake
- [ ] `chore/drizzle-full-migration` promoted to `main`
- [ ] `manus-frontend` Vercel project verified
- [ ] Unused Vercel projects removed
