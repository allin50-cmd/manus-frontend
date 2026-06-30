# Phase 5 — SheetOps Assessment

**Date:** 2026-06-28 (confirmed 2026-06-28 after canonical branch correction)  
**Branch assessed:** `origin/claude/ultracore-sheetops-mvp-wAwwp`  
**Compared against:** `origin/main` and `origin/chore/drizzle-full-migration`  
**Method:** `git diff --name-only` for file inventory; `git show` for code inspection  
**Status:** Verdict unchanged — SheetOps remains archive/reference only  

---

## Status After Canonical Branch Correction

The canonical branch is now `chore/drizzle-full-migration`, not `claude/jolly-hawking-xqufwo`. This does not change the SheetOps verdict: SheetOps is still Prisma-only and incompatible. Note that `chore/drizzle-full-migration` appears to have incorporated some SheetOps-origin routes already — do not re-import routes that are already present.

---

## Executive Summary

SheetOps contains **unique business logic that does not exist in main**. However, **every unique route uses Prisma** (`db.*` calls via the Prisma client exported from `lib/db.ts`). This means none of the unique routes can be merged directly — they require a full rewrite to Drizzle before they would work in UltraCore.

**Verdict:** Archive the SheetOps branch. Document the unique logic in this file as the extraction record. Do not merge.

---

## Why SheetOps Cannot Be Merged

### Root Cause: Incompatible Database Layer

SheetOps `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
```

UltraCore `lib/db.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
export async function getDb(): Promise<DrizzleDb> { ... }
```

Every SheetOps route uses `db.model.findMany()` / `db.model.create()` Prisma syntax. Every UltraCore route uses `const db = await getDb(); db.select().from(table)` Drizzle syntax. These cannot coexist without a full rewrite.

### Installation Failure

`npm install` on the SheetOps branch fails because `@prisma/client` requires `prisma generate` to build the client binary, and that binary is not present. The branch cannot run at all in its current state.

---

## Unique Business Logic in SheetOps

### 1. Alert Delivery System (24 routes/files)

**What it does:** Tracks alert delivery to individual recipients, supports retry-on-failure, acknowledgement, and suppression per recipient.

**Routes:**
- `GET/POST /api/alert-deliveries` — list/create delivery records
- `POST /api/alert-deliveries/ack` — bulk acknowledgement endpoint
- `GET/POST /api/alert-deliveries/[id]/acknowledge` — per-delivery ack
- `POST /api/alert-deliveries/[id]/retry` — retry a failed delivery
- `GET /api/alert-escalation-check` — escalation status check (cron-compatible)
- `GET/POST /api/alert-recipients` — manage alert recipient list
- `GET/PATCH/DELETE /api/alert-recipients/[id]` — per-recipient CRUD
- `POST /api/alert-recipients/[id]/suppress` — suppress a recipient
- `POST /api/alert-recipients/[id]/unsuppress` — unsuppress a recipient

**Unique value:** UltraCore has `os_alerts` table (created in main) but has no delivery tracking, no per-recipient suppression, and no retry logic. This is a genuine capability gap.

**Data model required:** `AlertDelivery`, `AlertRecipient` Prisma models (need Drizzle equivalents).

---

### 2. Voice Intake System (5 routes)

**What it does:** Audio file upload → transcription via OpenAI Whisper → structured parsing → draft work items. Includes approve/reject workflow for transcribed content.

**Routes:**
- `POST /api/voice/upload` — accept audio file upload
- `POST /api/voice/transcribe` — call Whisper API, parse result
- `GET /api/voice/drafts` — list pending draft items
- `POST /api/voice/approve` — approve a transcription draft → creates work item
- `POST /api/voice/reject` — reject a draft

**Supporting libraries (SheetOps only):**
- `lib/voice/transcription.ts` — Whisper API wrapper
- `lib/voice/parser.ts` — transcript-to-structured-data parser

**Unique value:** Not present anywhere in main. Voice-to-task capability is entirely new.

**Data model required:** `VoiceIntake` Prisma model (needs Drizzle equivalent: `voice_intakes` table).

---

### 3. Partnership / CRM Pipeline (3 routes)

**What it does:** CRM pipeline for tracking partnerships, construction leads, and planning leads through pipeline stages.

**Routes:**
- `GET/POST /api/partnerships` — list/create pipeline entries (supports `type`, `stage` filters)
- `PATCH /api/partnerships/[id]/stage` — move entry to new stage
- `GET /api/outreach/[id]` — single outreach record

**Supporting libraries:**
- `lib/crm-utils.ts` — `daysSinceLastTouch()` utility

**Unique value:** UltraCore has Contacts (`os_people`) but no CRM pipeline stages or lead-type tracking. This is additive.

**Data model required:** A pipeline/partnerships table (not in main Drizzle schema).

---

### 4. Companies House Filings Integration (4 routes)

**What it does:** Fetches Companies House filing records, caches them, and provides health/refresh endpoints. Used by FineGuard compliance workflow.

**Routes:**
- `GET/POST /api/filings` — list filings for a company number
- `GET /api/filings/[id]` — single filing detail
- `GET /api/filings/health` — health check for Companies House API connectivity
- `POST /api/filings/refresh-status` — force re-fetch from Companies House

**Unique value:** FineGuard in main calls Companies House directly in `lib/fineguard-workflow.ts`. SheetOps has a separate caching layer for filings. This may overlap with existing FineGuard functionality.

**Data model required:** `Filing` Prisma model.

---

### 5. Team Capacity (1 route)

**What it does:** Returns per-person task load vs. capacity metrics for team workload management.

**Route:** `GET /api/team/capacity` — aggregate task count vs capacity per team member

**Unique value:** No equivalent in main. Supports multi-person workload planning.

---

### 6. Portfolio Overview (1 route)

**What it does:** Aggregated view of active work items, tasks, and financial totals for an executive dashboard.

**Route:** `GET /api/portfolio` — cross-module aggregation query

**Unique value:** No equivalent in main. Different from per-module list pages.

---

### 7. My Tasks (1 route)

**What it does:** Returns tasks assigned to the authenticated session user (person-scoped task list).

**Route:** `GET /api/my-tasks` — tasks where `assignedTo = session.person`

**Unique value:** UltraCore `app/api/os/tasks/` returns all tasks. This endpoint is person-scoped. Additive.

---

### 8. Dashboard Briefing (1 route + lib)

**What it does:** Generates a structured daily briefing: overdue items, today's tasks, pending alerts. Surfaces in a dashboard widget.

**Route:** `GET /api/dashboard/briefing` — briefing aggregation via `lib/queries/briefing.ts`

**Unique value:** `app/today/page.tsx` in main shows a command centre but does not use this endpoint. SheetOps has a dedicated briefing query library.

---

### 9. Change Password (1 route)

**What it does:** Allows authenticated users to change their passcode.

**Route:** `POST /api/auth/change-password`

**Unique value:** Not present in main (which has no passcode change flow). Additive for multi-user deployments.

---

## Summary of Unique Capabilities

| Capability | Routes | In Main? | Rewrite Effort |
|---|---|---|---|
| Alert Delivery + Recipients | 9 | No | High (schema + routes) |
| Voice Intake + Transcription | 5 | No | High (schema + routes + lib) |
| CRM Pipeline / Partnerships | 3 | No | Medium (schema + routes) |
| Companies House Filings Cache | 4 | Partial (fineguard) | Medium |
| Team Capacity | 1 | No | Low (routes only) |
| Portfolio Overview | 1 | No | Low (routes only) |
| My Tasks (person-scoped) | 1 | No | Low (routes only) |
| Dashboard Briefing | 1 | No | Medium (routes + lib) |
| Change Password | 1 | No | Low (routes only) |

**Total unique routes: 26**  
**All require Drizzle rewrite before use.**

---

## What SheetOps Also Contains (But Main Already Has)

These exist in both branches (modified in SheetOps but functionally equivalent):
- `app/api/companies/*` — Companies House search (also in main via FineGuard)
- `app/api/decisions/*` — Decisions CRUD (also in main)
- `app/api/builder-big-jobs/*` — Builder leads (also in main)
- `app/api/work-items/*` — Work items (different route prefix than main's `/api/os/work-items/`)
- `app/api/auth/login/route.ts` — Login endpoint (also in main, protected file)

---

## Archive Decision

**SheetOps will not be merged.** Rationale:

1. **Cannot install**: `npm install` fails due to Prisma binary requirement.
2. **Cannot build**: Installation failure prevents any build.
3. **Cannot merge routes**: All unique routes use Prisma syntax — direct merge would introduce zero functional code.
4. **Unique value requires rewrite**: The 26 unique routes represent real product ideas but need full Drizzle translation before they can run.
5. **Incompatible route structure**: SheetOps uses `/api/work-items/` vs main's `/api/os/work-items/` — merging would create conflicting routes.

**Archive method:**
```bash
# Tag the branch before archival
git tag archive/sheetops-mvp origin/claude/ultracore-sheetops-mvp-wAwwp
git push origin archive/sheetops-mvp

# Do NOT delete yet — tag preserves history
```

---

## Recommended Future Work (Not Now)

If the unique capabilities are needed in UltraCore, implement them fresh in Drizzle:

| Priority | Feature | Prerequisite |
|---|---|---|
| Medium | Alert delivery tracking | Add `os_alert_deliveries` Drizzle table |
| Medium | Dashboard briefing widget | Rewrite `lib/queries/briefing.ts` using Drizzle |
| Low | Voice intake / transcription | Add `voice_intakes` Drizzle table + Whisper integration |
| Low | CRM pipeline stages | Add `os_pipeline` Drizzle table |
| Low | Team capacity view | Use existing `os_tasks` with `assignedTo` aggregate |
| Low | Person-scoped tasks | Add `?assignedTo=me` filter to `/api/os/tasks` |
| Low | Change password | Add `/api/auth/change-password` route |

These are feature additions, not consolidation tasks. They are deferred until the consolidation (Phases 1–7) is complete.
