# UltraTechOS Code Asset Inventory

> Created: 2026-06-24
> Purpose: Complete inventory of all code assets, their status, and consolidation recommendation.

---

## Section 1 — Active Production Assets (Keep)

| # | Name | Location | Purpose | Status | Uses Spine | Duplicates | Risk | Recommendation | Next Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | FineGuard Workflow | `lib/fineguard-workflow.ts` + `app/api/fineguard/` | Companies House compliance deadline monitoring, alert scheduling, email dispatch | Working | Yes | No | **HIGH** — do not touch | Keep — locked | No action without explicit instruction |
| 2 | UltraTechOS Shell | `components/OsShell.tsx` + `app/os/layout.tsx` | Main app shell: sidebar (desktop), bottom nav (mobile), workspace area | Working | Yes | No | Medium | Keep | No action |
| 3 | Work Items | `app/os/work-items/` + `app/api/work-items/` | Primary operational unit — capture, control, track every piece of live work | Working | Yes | No | Low | Keep | No action |
| 4 | Tasks | `app/os/tasks/page.tsx` + `app/api/os/tasks/` | Lightweight action items linked to work items | Working | Yes | No | Low | Keep | No action |
| 5 | Money (Invoices + Quotes) | `app/os/money/page.tsx` + `app/api/os/invoices/` + `app/api/os/quotes/` | Financial tracking — invoices and quotes in pence | Working | Yes | No | Low | Keep | No action |
| 6 | Messages | `app/os/messages/page.tsx` + `app/api/os/messages/` | Internal thread-based messaging with unread count | Working | Yes | No | Low | Keep | No action |
| 7 | Calls | `app/os/calls/page.tsx` + `app/api/os/calls/` | Call log — inbound/outbound, duration, outcome | Working | Yes | No | Low | Keep | No action |
| 8 | Contacts (People) | `app/os/contacts/page.tsx` + `app/api/os/people/` | Business contacts with categories and context | Working | Yes | No | Low | Keep | No action |
| 9 | Decisions | `app/os/decisions/page.tsx` + `app/api/decisions/` | Escalation and decision tracking | Working | Yes | No | Low | Keep | No action |
| 10 | Alerts | `app/os/alerts/page.tsx` + `app/api/os/alerts/` | OS-level business alerts with severity | Working | Yes | No | Low | Keep | No action |
| 11 | Documents (VaultLine) | `app/os/documents/page.tsx` + `app/api/os/documents/` | Document vault — records with pending review state | Working | Yes | No | Low | Keep | No action |
| 12 | Templates | `app/os/templates/page.tsx` | Reusable message/document templates | Working | Yes | No | Low | Keep | No action |
| 13 | Today Command Centre | `app/today/page.tsx` | Post-login default — OCR widget, priorities, activity | Working | Yes | No | Low | Keep | No action |
| 14 | Utility Launcher | `app/os/page.tsx` + `app/os/talk/` + `app/os/book/` + `app/os/quote/` + `app/os/inbox/` + `app/os/go/` + `app/os/scan/` | Action-first launcher (Phase 1) — Talk, Book, Quote, Inbox, Go, Scan | Partial (Phase 1) | Yes | No | Low | Keep — extend in Phase 2 | Complete Phase 2 integrations |
| 15 | UT Measurement Framework | `lib/ut-tracker.ts` + `app/api/ut/` + `db/migrations/0007_ut_metrics.sql` | Fire-and-forget event tracking + daily/weekly aggregation + OCR widget | Working (pending DB migration) | Yes | No | Low | Keep | **Apply migration 0007 in Supabase** |
| 16 | Auth | `lib/auth.ts` + `app/api/auth/` | JWT session auth via jose — passcode login | Working | Yes | No | **HIGH** — do not touch | Keep — locked | No action without explicit instruction |
| 17 | DB Client | `lib/db.ts` + `db/schema.ts` | Drizzle singleton + full schema — source of truth | Working | Yes | No | **HIGH** | Keep — locked | No action |
| 18 | Middleware | `middleware.ts` | Next.js route protection + session propagation | Working | Yes | No | **HIGH** | Keep — locked | No action |
| 19 | Stripe Integration | `app/api/stripe/` | FineGuard subscription checkout + webhook handler | Working | Partial | No | **HIGH** — do not touch | Keep — locked | No action without explicit instruction |
| 20 | Companies House Client | `lib/companiesHouse.ts` | REST API proxy for Companies House deadline data | Working | Yes (FineGuard) | No | Medium | Keep | No action |
| 21 | Builder Big Jobs | `app/os/leads/builder-big-jobs/` + `app/api/builder-big-jobs/` + `db/migrations/0005_builder_big_jobs.sql` | Lead generation product for construction sector | Working | Partial | No | Low | Keep | No action |
| 22 | Voice Intake (UltAi) | `lib/voice/` + `app/api/voice/` + `app/os/talk/page.tsx` | OpenAI Whisper transcription + transcript parsing to structured drafts | Partial | Yes | No | Low | Keep — Phase 2 hook-up | Wire `app/os/talk` to `/api/voice/transcribe` |
| 23 | FineGuard Intake | `app/intake/fineguard/` + `app/check/` | Public company check widget + lead capture | Working | No | No | Low | Keep | No action |
| 24 | Governance Scripts | `scripts/check-governance.js` + `ULTRATECHOS.md` + `ANTI_DRIFT.md` + `CLAUDE.md` | Pre-build governance enforcement | Working | N/A | No | Low | Keep | No action |

---

## Section 2 — Archive Candidates

| # | Name | Location | Reason | Risk | Recommendation | Next Action |
|---|---|---|---|---|---|---|
| 1 | Azure Scripts | `deploy-azure.sh` + `check-azure-prereqs.sh` + `integrate-azure.sh` | Project is Vercel-only; Azure violates architecture constraint | Low | Archive | Remove from root — move to `archive/` if user wants history |
| 2 | `/hub` route | `app/hub/page.tsx` | Legacy redirect alias to `/os` — adds confusion, not in ULTRATECHOS.md nav | Low | Archive | Remove once confirmed no live links |
| 3 | `/landing` route | `app/landing/page.tsx` | Appears to be a duplicate/empty redirect; `/` is the canonical landing | Low | Archive | Verify no external links, then remove |
| 4 | `/builder-big-jobs` root route | `app/builder-big-jobs/page.tsx` | Bare redirect — purpose unclear vs `/os/leads/builder-big-jobs` | Low | Archive | Verify and remove if no external traffic |
| 5 | Old compliance docs | `docs/blocker-04-report.md` + `docs/blocker-completion-report.md` + `docs/blockers.md` + `docs/final-production-audit.md` + `docs/verification-report.md` + `docs/consolidation-plan.md` + `docs/CONSOLIDATION-AUDIT.md` | Historical debug docs — completed, no longer active | None | Archive | Move to `docs/archive/` folder |
| 6 | `docs/p1-dependencies.md` + `docs/p1-system-verification.md` | `docs/` | Phase 1 pre-launch planning docs — completed | None | Archive | Move to `docs/archive/` |
| 7 | Accuracy intake | `app/intake/accuracy/page.tsx` + `app/os/companies/accuracy/page.tsx` | UI shells with no backing tables or API; product not yet scoped | Low | Archive until scoped | Do not build on without explicit product spec |

---

## Section 3 — Inactive / Schema-Only (Do Not Delete Yet)

| # | Name | Location | Notes | Recommendation |
|---|---|---|---|---|
| 1 | ClerkOS tables | `db/schema.ts` (tenants, clerk_users, clerk_cases, clerk_hearings, etc. — 8 tables) | Full legal case management schema in `db/schema.ts` but no routes or UI built | Keep schema in place; no UI until explicitly requested |
| 2 | `os_quotes` table prior to 0007 | `db/schema.ts` | Table definition exists in schema; migration 0007 creates it with `IF NOT EXISTS` — safe | Apply migration 0007 |
| 3 | Deployment tracking | `scripts/` + `docs/deployment-*.md` | Multiple deployment tracking documents and a test shell script | Keep docs; archive test scripts |

---

## Section 4 — Duplicate Detection

| Area | Routes | Status |
|---|---|---|
| Dashboards | `/today` (canonical), `/os/today` (OS-scoped), `/dashboard` (redirect to /today) | Not duplicates — `/today` and `/os/today` serve different purposes; `/dashboard` is a legacy redirect |
| Launcher | `/os` (new launcher), old module grid (removed) | Resolved — launcher replaces module grid |
| Inbox | `/os/inbox` (placeholder), `/os/messages` (working) | Not duplicates — inbox will aggregate messages + calls + leads in Phase 2 |
| Quotes | `/os/quote` (create flow), `/os/money` (list/manage) | Not duplicates — creation vs. management |
| Documents | `/os/scan` (upload entry), `/os/documents` (list/manage) | Not duplicates — entry point vs. vault |

---

## Section 5 — Missing Critical Pieces

| # | Gap | Impact | Priority |
|---|---|---|---|
| 1 | **Migration 0007 not applied to Supabase** | OCR widget shows empty data; UT tracking silently fails; daily/weekly aggregation errors at runtime | **CRITICAL — manual action required** |
| 2 | **VaultLine has no blob storage** | `os_documents.storagePath` is always null; Scan uploads record metadata only, no actual file stored | Medium — Phase 2 |
| 3 | **Talk page not wired to UltAi** | `/os/talk` has voice capture UI but the `// TODO` hook to `/api/voice/transcribe` is not connected | Medium — Phase 2 |
| 4 | **Inbox has no data source** | `/os/inbox` shows placeholder only; no query to messages/calls/leads/alerts | Low — Phase 2 |
| 5 | **Go has no maps integration** | `/os/go` shows appointments but no routing, travel time, or parking data | Low — Phase 2 |
| 6 | **PR #27 Deploy CI failing** | `VERCEL_TOKEN` GitHub secret is empty; Deploy job errors with "missing token value" | Low for code quality, Medium for CI hygiene |
| 7 | **Accuracy product has no backing schema** | `app/intake/accuracy/page.tsx` and `app/os/companies/accuracy/page.tsx` exist but no tables | Low — not a live product |
| 8 | **No automated test suite** | `npm run test` exits 0 with message about DATABASE_URL; no unit tests run in CI | Low — acceptable for current stage |

---

## Section 6 — Top 10 Assets to Keep (Priority Order)

1. **FineGuard Workflow** (`lib/fineguard-workflow.ts`) — revenue-generating compliance product; do not touch
2. **Auth + Middleware** (`lib/auth.ts`, `middleware.ts`) — security foundation; locked
3. **DB Schema** (`db/schema.ts`, `lib/db.ts`) — single source of truth; locked
4. **Work Items** — primary operational spine of the OS
5. **UT Measurement Framework** — validates OS value; critical once migration is applied
6. **Utility Launcher** — new primary UX; Phase 2 hooks needed
7. **Today Command Centre** — post-login default with OCR widget
8. **Money (Invoices + Quotes)** — financial tracking; frequently used
9. **Voice Intake (UltAi)** (`lib/voice/`) — needs Phase 2 wiring but core logic is done
10. **Stripe Integration** — FineGuard billing; locked

---

## Section 7 — Top 10 Assets to Archive (Priority Order)

1. `deploy-azure.sh` + `check-azure-prereqs.sh` + `integrate-azure.sh` — violates hosting constraint
2. `docs/blocker-*.md` + `docs/final-production-audit.md` — completed historical docs
3. `docs/p1-*.md` — Phase 1 pre-launch planning (completed)
4. `app/hub/page.tsx` — legacy redirect not in canonical nav
5. `app/builder-big-jobs/page.tsx` — bare redirect, verify traffic first
6. `docs/consolidation-plan.md` + `docs/CONSOLIDATION-AUDIT.md` — superseded by this inventory
7. `docs/verification-report.md` — superseded by PRODUCT_TEST_MATRIX.md
8. `app/landing/page.tsx` — duplicate/empty, verify external links first
9. `app/intake/accuracy/page.tsx` + `app/os/companies/accuracy/page.tsx` — placeholder shells for unscoped product
10. `test-deployment-tracking.sh` — unused test script

---

## Section 8 — Safest Consolidation Order

1. **Apply `db/migrations/0007_ut_metrics.sql` in Supabase SQL Editor** — unblocks UT framework; safe, additive only
2. **Fix PR #27 CI** — add `VERCEL_TOKEN` secret in GitHub repository settings
3. **Wire Talk to `/api/voice/transcribe`** — connects existing UltAi backend to the new launcher UI
4. **Wire Inbox to live data** — query messages + calls + alerts in `/os/inbox`
5. **Add blob storage for Scan** — connect `/api/os/documents` to Supabase Storage or similar
6. **Archive Azure scripts** — clean root directory
7. **Archive completed audit docs** — move to `docs/archive/`
8. **Verify and remove legacy redirects** (`/hub`, `/landing`, `/builder-big-jobs`)
9. **Scope or remove Accuracy** — decide whether it becomes a real product
10. **Decide ClerkOS fate** — schema in place; either build it or drop from `db/schema.ts`

---

## Section 9 — Risk Summary

| Risk | Severity | Action |
|---|---|---|
| Migration 0007 not applied | Critical | Manual: apply in Supabase SQL Editor |
| FineGuard workflow modified without instruction | Critical | Architecture lock in place |
| Auth layer modified without instruction | Critical | Architecture lock in place |
| `VERCEL_TOKEN` CI secret missing | Medium | Add in GitHub repo settings |
| Voice intake unconnected | Medium | Phase 2 task |
| No blob storage for documents | Medium | Phase 2 task |
| ClerkOS tables in schema but no UI | Low | Do not build without explicit instruction |
| Azure scripts in root | Low | Archive |
