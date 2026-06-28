# Stabilisation Audit — 2026-06-28

Branch audited: `chore/drizzle-full-migration`

---

## Audit 1 — Build

| Check | Result |
|---|---|
| `npm run type-check` | **PASS** — 0 errors |
| `npm run build` | **PASS** — 0 errors, 0 warnings |
| `npm test` | **PASS** — 130/130 (10 test files) |

The canonical branch is buildable, type-safe, and fully tested.

---

## Audit 2 — Routes

### All page routes

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Active (dashboard redirect) |
| `/dashboard` | `app/dashboard/page.tsx` | Active |
| `/today` | `app/today/page.tsx` | Active |
| `/work-items` | `app/work-items/page.tsx` | Active |
| `/work-items/new` | `app/work-items/new/page.tsx` | Active |
| `/work-items/[id]` | `app/work-items/[id]/page.tsx` | Active |
| `/work-items/[id]/edit` | `app/work-items/[id]/edit/page.tsx` | Active |
| `/decisions` | `app/decisions/page.tsx` | Active |
| `/contacts` | `app/contacts/page.tsx` | Active |
| `/filings` | `app/filings/page.tsx` | Active (uses WorkItem model, no Filing model) |
| `/activity` | `app/activity/page.tsx` | Active |
| `/my-tasks` | `app/my-tasks/page.tsx` | Active |
| `/team` | `app/team/page.tsx` | Active |
| `/teams` | `app/teams/page.tsx` | Active — **DUPLICATE** of `/team` (different UI, same data) |
| `/templates` | `app/templates/page.tsx` | Active (read-only, no workflow yet) |
| `/alerts` | `app/alerts/page.tsx` | Active |
| `/alerts/new` | `app/alerts/new/page.tsx` | Active |
| `/alert-events` | `app/alert-events/page.tsx` | Active |
| `/alert-recipients` | `app/alert-recipients/page.tsx` | Active |
| `/portfolio` | `app/portfolio/page.tsx` | Active |
| `/settings` | `app/settings/page.tsx` | Active |
| `/login` | `app/login/page.tsx` | Active |
| `/voice-intake` | `app/voice-intake/page.tsx` | Active (no quality signals yet) |
| `/partnerships` | **MISSING** — nav link exists → 404 | **ORPHANED NAV LINK** |
| `/os/calls/new` | `app/os/calls/new/page.tsx` | Orphaned — no nav link |
| `/os/contacts/new` | `app/os/contacts/new/page.tsx` | Orphaned — no nav link |
| `/os/documents/upload` | `app/os/documents/upload/page.tsx` | Orphaned — no nav link |
| `/os/messages/new` | `app/os/messages/new/page.tsx` | Orphaned — no nav link |
| `/os/money/invoices/new` | `app/os/money/invoices/new/page.tsx` | Orphaned — no nav link |
| `/os/money/quotes/new` | `app/os/money/quotes/new/page.tsx` | Orphaned — no nav link |
| `/os/tasks/new` | `app/os/tasks/new/page.tsx` | Orphaned — no nav link |

### Findings

**Orphaned nav link (K03):** `/partnerships` is in the More menu but the page and API do not exist.

**Duplicate pages:** `/team` (per-person capacity cards from cherry-pick) and `/teams` (pre-existing team grid by team-group) both exist. Different UIs, overlapping purpose. No nav link points to `/team` — it is reachable only from `/my-tasks?person=X` back-links. No immediate action needed but the duplication should be resolved post-schema-migration.

**Orphaned OS form pages:** Seven Phase 4 Sprint 1 form pages under `/os/` have no nav links and no parent page. They build successfully. Status: preserved intentionally (sheetops tried to delete them; that deletion was blocked). They are not accessible to end users without direct URL entry.

---

## Audit 3 — API Endpoints

### Dashboard

| Endpoint | Methods | Status |
|---|---|---|
| `/api/dashboard` | GET | Active — summary stats |
| `/api/dashboard/briefing` | GET | Active — Morning Briefing for George |

### Work Items

| Endpoint | Methods | Status |
|---|---|---|
| `/api/work-items` | GET, POST | Active |
| `/api/work-items/[id]` | GET, PATCH | Active |
| `/api/work-items/[id]/actions` | POST | Active |
| `/api/work-items/[id]/actions/[actionId]` | PATCH | Active (mark done) |
| `/api/work-items/[id]/escalate` | POST | Active |
| `/api/work-items/[id]/log` | POST | Active |

Missing (blocked on schema):
- `/api/work-items/[id]/actions/[actionId]/reassign` — needs Action reassign fields (K02)
- `/api/work-items/[id]/outreach` — needs OutreachLog model

### Voice

| Endpoint | Methods | Status |
|---|---|---|
| `/api/voice/upload` | POST | Active — stores audio bytes |
| `/api/voice/transcribe` | POST | Active — calls Whisper, parses transcript |
| `/api/voice/approve` | POST | Active |
| `/api/voice/reject` | POST | Active |

Missing (blocked on schema):
- `/api/voice/drafts` — needs VoiceIntake.transcriptConfidence field

### Activity

| Endpoint | Methods | Status |
|---|---|---|
| `/api/my-tasks` | GET | Active — per-person action list |

Note: Activity data is fetched directly server-side in `app/activity/page.tsx` (no dedicated API route).

### Contacts

| Endpoint | Methods | Status |
|---|---|---|
| `/api/contacts` | GET, POST | Active |
| `/api/contacts/[id]` | PATCH, DELETE | Active |

### Filings

No dedicated filings API exists. `/filings` page queries WorkItem directly server-side.

Missing (blocked on schema — requires Filing model):
- `/api/filings` — list + create
- `/api/filings/[id]` — detail + update
- `/api/filings/health` — compliance health check
- `/api/filings/refresh-status` — status refresh

### Partnerships

No partnerships API or page exists. Nav link leads to 404.

Missing (blocked on schema — requires PipelineStage, OutreachLog):
- `/api/partnerships`
- `/api/partnerships/[id]/stage`
- `/api/outreach/[id]`

### Templates

| Endpoint | Methods | Status |
|---|---|---|
| `/api/templates` | GET, POST | Active (basic list/create only) |

Missing (blocked on schema — requires Template workflow fields):
- `/api/templates/[id]/submit`
- `/api/templates/[id]/approve`
- `/api/templates/[id]/reject`

### Companies

| Endpoint | Methods | Status |
|---|---|---|
| `/api/portfolio` | GET, POST | Active — Company list with WorkItem counts |

Note: The endpoint path is `/api/portfolio`, not `/api/companies`. Functional but misleadingly named.

### Alerts

| Endpoint | Methods | Status |
|---|---|---|
| `/api/alert-recipients` | GET, POST | Active |
| `/api/alert-recipients/[id]` | GET, PATCH, DELETE | Active |
| `/api/alert-recipients/[id]/suppress` | POST | Active |
| `/api/alert-recipients/[id]/unsuppress` | POST | Active |
| `/api/alert-deliveries` | GET | Active |
| `/api/alert-deliveries/ack` | GET (token-based) | Active |
| `/api/alert-deliveries/[id]/acknowledge` | POST | Active |
| `/api/alert-deliveries/[id]/retry` | POST | Active |
| `/api/alert-escalation-check` | GET, POST | Active (cron-triggered) |

### Auth / Infra

| Endpoint | Methods | Status |
|---|---|---|
| `/api/auth/login` | POST | Active |
| `/api/auth/logout` | POST | Active |
| `/api/auth/change-password` | POST | Active |
| `/api/team/capacity` | GET | Active |
| `/api/debugdb` | GET | Active (health probe) |

### Duplicates

None confirmed. `/api/dashboard` and `/api/dashboard/briefing` are complementary, not duplicates.
`/api/portfolio` functions as a companies endpoint — naming is the only issue.

---

## Audit 4 — Database Matrix

### Prisma models vs Drizzle tables

| Model / Table | Prisma | Drizzle | Status | Notes |
|---|---|---|---|---|
| WorkItem / work_items | ✅ | ✅ | **Duplicated** | Prisma is runtime; Drizzle schema-only |
| Action / actions | ✅ | ✅ | **Duplicated** | Same |
| ActivityLog / activity_logs | ✅ | ✅ | **Duplicated** | Same |
| Decision / decisions | ✅ | ✅ | **Duplicated** | Same |
| Template / templates | ✅ | ✅ | **Duplicated** | Same |
| AlertRecipient / alert_recipients | ✅ | ✅ (minimal) | **Partial duplicate** | Drizzle schema lacks many Prisma fields |
| AlertDelivery / alert_deliveries | ✅ | ✅ (minimal) | **Partial duplicate** | Drizzle schema lacks many Prisma fields |
| AlertEvent / alert_events | ✅ | ✅ (minimal) | **Partial duplicate** | Drizzle schema lacks many Prisma fields |
| VoiceIntake | ✅ | ❌ | **Prisma-only** | Not in Drizzle |
| UserPassword | ✅ | ❌ | **Prisma-only** | Not in Drizzle |
| Company | ✅ | ❌ | **Prisma-only** | Not in Drizzle |
| Contact | ✅ | ❌ | **Prisma-only** | Not in Drizzle |
| OsMessageThread / os_message_threads | ❌ | ✅ | **Drizzle-only** | Added to support legacy OS screen; not in Prisma |
| Filing | ❌ | ❌ | **Planned (2g)** | Needed for dedicated filings feature |
| OutreachLog | ❌ | ❌ | **Planned (2e)** | Needed for partnerships CRM |
| PipelineStage (enum) | ❌ | ❌ | **Planned (2f)** | Needed for partnerships pipeline |

### Prisma enums vs Drizzle enums

| Enum | Prisma | Drizzle | Delta |
|---|---|---|---|
| WorkItemType | ✅ (10 values) | ✅ (9 values) | Drizzle **missing** `Operations`, `TechTask` |
| WorkItemStatus | ✅ (11 values) | ✅ (11 values) | In sync |
| Priority | ✅ (4 values) | ✅ (4 values) | In sync |
| ActionType | ✅ (9 values) | ✅ (9 values) | In sync |
| ActionStatus | ✅ (4 values) | ✅ (4 values) | In sync |
| EventType | ✅ (9 values) | ✅ (9 values) | In sync |
| DecisionStatus | ✅ (5 values) | ✅ (5 values) | In sync |
| RecipientRole | ✅ (7 values) | ❌ | Drizzle uses plain `text` |
| DeliveryChannel | ✅ (4 values) | ❌ | Drizzle uses plain `text` |
| DeliveryStatus | ✅ (6 values) | ❌ | Drizzle uses plain `text` |
| AlertEventType | ✅ (10 values) | ❌ | Drizzle uses plain `text` |
| VoiceIntakeStatus | ✅ (6 values) | ❌ | Not in Drizzle at all |

### Summary

- **Active ORM:** Prisma (all production queries)
- **Drizzle:** Schema defined, not used in any production query. `getDb()` exported but called nowhere.
- **Drizzle schema gap:** Missing `Operations`, `TechTask` enum values in `WorkItemType`. Missing 4 models (VoiceIntake, UserPassword, Company, Contact). Partial alert models with text instead of typed enums.
- **Orphaned:** `lib/db.drizzle-wip.ts` — nothing imports it.

---

## Audit 5 — Vercel Deployments

| Project | Branch/Source | Recommendation | Rationale |
|---|---|---|---|
| `manus-frontend` | Production target — `chore/drizzle-full-migration` | **KEEP** | Canonical production project |
| `agent-x` | Unknown | **KEEP (review)** | May serve separate agent functionality |
| `ult-ai-lite` | Unknown | **KEEP (review)** | May serve separate lite-mode functionality |
| `manus-frontend-c9li` | Unknown | **Archive later** | Likely a preview/clone. Safe to remove after canonical promotion |
| `manus-frontend-edg7` | Unknown | **Archive later** | Likely a preview/clone. Safe to remove after canonical promotion |
| `manus-frontend-sheetops` | `claude/ultracore-sheetops-mvp-wAwwp` | **Archive later** | SheetOps branch is read-only reference. Remove after Phase 4 |
| `manus-frontend-sheetops-iphone` | SheetOps branch | **Archive later** | Same as above |

**Constraint:** No deletions until `chore/drizzle-full-migration` is promoted to `main` and deployment verified on `manus-frontend`. (Decision D07)

---

## Audit 6 — Technical Debt: Top 20 Risks

Ordered by production impact → migration risk → architectural risk.

| # | Risk | Impact | Category |
|---|---|---|---|
| 1 | **`/partnerships` nav link → 404** | Users hit a dead link in the primary nav | Production (K03) |
| 2 | **My Tasks reassign → 404** | Reassign button silently fails for all users | Production (K02) |
| 3 | **Drizzle `WorkItemType` missing `Operations`, `TechTask`** | If any code path uses Drizzle for WorkItem queries, those two types cannot be represented | Schema drift |
| 4 | **`lib/db.drizzle-wip.ts` orphaned** | Shadow of the removed Drizzle-first approach. Exports a `db` symbol that shadows the Prisma `db` if accidentally imported | Naming collision risk |
| 5 | **`lib/supabase.ts` unused** | Dead code; implies a Supabase integration that was never completed or was removed. Creates dependency (`@supabase/supabase-js`) that must be kept up-to-date for no benefit | Dead dependency |
| 6 | **`/teams` and `/team` both exist** | Two pages serve overlapping team capacity data. `/team` (new cherry-pick) has no nav link; `/teams` is linked from dashboard. Causes confusion about which is authoritative | Duplicate/confusion |
| 7 | **Drizzle `alertRecipients` schema is a minimal stub** | If Drizzle ever becomes the runtime ORM, the alert recipient system will be broken — stub is missing suppression fields, escalation fields, alertCategories array | Migration risk |
| 8 | **VoiceIntake not in Drizzle schema** | Complete absence means any Drizzle migration path for voice intake must be written from scratch | Migration risk |
| 9 | **`app/api/portfolio` named "portfolio" but serves companies** | Route naming mismatch. The portfolio page is for company CRM; the route is not at `/api/companies`. Any future `/api/companies` route would create a conflict | Naming confusion |
| 10 | **Template model has no workflow fields** | `Template.approved` is a boolean with no submit/approve/reject flow. The UI presents templates as if a workflow exists, but POSTing creates auto-approved records. Misleads users | Feature gap |
| 11 | **No `Filing` model** | Filings page works by querying WorkItems and applying a compliance filter. A dedicated Filing model with deadline tracking, category, status, and reference number is needed for real compliance management | Feature gap |
| 12 | **No OutreachLog/PipelineStage models** | Partnerships/Pipeline is blocked entirely — the nav link leads to 404, there is no CRM for partner relationships | Feature gap |
| 13 | **Voice quality signals not stored** | `transcriptConfidence` and `qualityFlags` are computed by the transcription pipeline but not persisted. Data is computed and discarded on every transcription (K04) | Feature gap |
| 14 | **Action reassign fields absent** | `Action.reassignedFrom/At/By/handoffNote` are needed for the reassign workflow. The UI calls the endpoint; it returns 404 every time | Schema gap |
| 15 | **`lib/queries/briefing.ts` has no tests** | Morning briefing query is business-critical (George's daily workflow) but has 0 test coverage | Test coverage |
| 16 | **`app/api/dashboard/briefing/route.ts` has no tests** | Same as above — API layer untested | Test coverage |
| 17 | **OS form pages (7) unreachable without direct URL** | Phase 4 Sprint 1 forms are preserved but inaccessible — no nav, no parent page. Users cannot discover them | UX/navigation |
| 18 | **Dual ORM state adds cognitive load** | Every new route author must know to use Prisma (not Drizzle). This decision is documented but not enforced at the code level | Architectural risk |
| 19 | **`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env vars required** | `lib/supabase.ts` requires these vars. If the module is ever accidentally imported during build, the build will fail in environments without them. Currently safe because nothing imports it | Latent env risk |
| 20 | **No end-to-end tests** | Unit tests cover 130 pure-logic cases. There are no integration or E2E tests for any API route or page render path | Test coverage |

---

## Audit 7 — Consolidation Status

See updated `ai/14_CONSOLIDATION_PLAN.md` below.
