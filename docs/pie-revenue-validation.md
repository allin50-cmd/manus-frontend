# PIE Revenue Validation

**Authority:** apps/registry.json  
**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-26  
**Method:** Direct source inspection only. Every claim cites a file and line number. No invention.

---

## Verdict

**NO.**

A Bromley planning application entering the system today would NOT produce output reliable enough for Dagon White to act on.

Evidence follows.

---

## 1. Verified Data Sources

### What exists in this repository

| Component | File | What it does |
|---|---|---|
| PIE receiving endpoint | `server/app.ts:538` | Accepts `POST /api/pie/opportunity`, validates against schema, inserts to DB |
| PIE schema | `server/lib/pie-schema.ts` | Zod schema defining the inbound payload contract |
| PIE→FineGuard bridge | `server/lib/pie-fineguard.ts` | Activates monitoring based on received data |
| FineGuard rules | `server/lib/fineguard-rules.ts` | Evaluates activation criteria |

### What does NOT exist in this repository

| Component | Status | Evidence |
|---|---|---|
| Accuracy PIE sender | **UNKNOWN** | `apps/registry.json`: `"sourceRepo": "unknown — requires verification"` |
| Planning portal scraper | **ABSENT** | No files matching `planningportal`, `scrape`, `lpa`, `gov.uk`, `council` in any `.ts` file |
| Planning API client | **ABSENT** | No HTTP client targeting any planning data API |
| CSV import | **ABSENT** | No CSV parser, no file reader |
| Manual entry flow for PIE data | **ABSENT** | IntakeSheet UI (`src/pages/IntakeSheet.tsx`) is a generic form — no fields for `externalRef`, `district`, `siteAddress`, `submittedAt` |
| Opportunity discovery logic | **ABSENT** | No code that finds, scores, or ranks planning applications |

**The receiving endpoint exists. The sender does not.**  
Every field in every PIE opportunity must come from an external system that has no verified source, no deployment URL, and no code in this repository.

---

## 2. Opportunity Schema Audit

Source: `server/lib/pie-schema.ts`

| Field | Required? | Validation | Trusted? | Notes |
|---|---|---|---|---|
| `externalRef` | **YES** | `string.min(1).max(100)` | UNKNOWN | Idempotency key. Format not enforced. Not validated against any planning authority. Could be `"test"`, `"1"`, or a real LPA ref — system cannot tell. |
| `applicantName` | **YES** | `string.min(1).max(255)` | UNKNOWN | Free text. Used as `companyName` in `monitored_companies`. No deduplication, no Companies House lookup at ingest. |
| `applicantEmail` | optional | `string.email()` | LOW | Email format validated. Existence not confirmed. |
| `applicantPhone` | optional | `string.max(50)` | LOW | Free text. No format enforcement. |
| `description` | optional | `string.max(2000)` | LOW | Free text. No NLP, no classification, no extraction. |
| `siteAddress` | optional | `string.max(500)` | LOW | Free text. Not geocoded, not validated against UPRN or address API. Stored in audit metadata only — not in `intake_forms` table. |
| `district` | optional | `string.max(100)` | LOW | Free text. Not validated against LPA authority list. "Bromley", "bromley", "London Borough of Bromley" are all accepted. Stored in audit metadata only. |
| `urgency` | optional | `enum('low','medium','high','critical')`, default `'medium'` | **NOT TRUSTED** | Set entirely by the upstream PIE system. No independent corroboration. The FineGuard activation threshold fires on `urgency='high'`. If PIE sends every opportunity as `high`, all of them activate. |
| `estimatedValue` | optional | `string.max(50)` | **NOT TRUSTED** | Free text. `"£2,400,000"`, `"2.4m"`, `"tbc"`, `"large"`, `"£1m-£5m"` all pass validation. The FineGuard `highValue` rule fires at `≥ £1,000,000`. Range resolution takes lower bound — conservative but still dependent on PIE accuracy. |
| `submittedAt` | optional | `string.datetime({ offset: true })` | UNKNOWN | ISO 8601 timestamp. Not used in any business logic. Stored in audit metadata only. |

**Schema storage gap:** `siteAddress`, `district`, and `submittedAt` are stored only in `clerk_audit_events.metadata` (JSON blob). They are NOT columns in `intake_forms`. A query against `intake_forms` cannot filter by district or address.

---

## 3. Commercial Decision Audit

### FineGuard activation rule

Source: `server/lib/fineguard-rules.ts:90`

```
activate = pieOriginated AND (highUrgency OR highValue)

pieOriginated  = sourceRef.startsWith("PIE:")           → always true for PIE path
highUrgency    = urgency ∈ {"high", "critical"}
highValue      = parseClaimValueGbp(claimValue) >= £1,000,000
```

**This is the only commercial decision in the system.**  
There is no opportunity score. No ranking. No confidence level. No false-positive filter. No human review gate before activation.

The decision is binary: either FineGuard monitoring activates or it does not.

### Value parsing

Source: `server/lib/fineguard-rules.ts:47–75`

The parser handles: `"£2,400,000"`, `"2.4m"`, `"500k"`, `"1.5bn"`, ranges (takes lower bound).  
It returns `null` for strings with no numeric content (`"tbc"`, `"large"`, `"see report"`).  
`null` resolves to `highValue = false`.

This is deterministic and conservative. It is also entirely dependent on PIE providing a parseable value. If PIE sends `"tbc"`, `highValue` is false. The opportunity still activates if `urgency = 'high'`.

### matterRef generation

Source: `server/app.ts:625`

```typescript
const matterRef = `MAT-${Date.now()}`;
```

`MAT-<unix timestamp milliseconds>`. Not linked to any planning authority reference. Not sequential. Not queryable by LPA ref without joining on `source_ref`.

### No ANALYSED, ESTIMATED, VERIFIED, CONFIRMED logic

Source: `apps/registry.json:173–187`, `server/engine/clerkOS.engine.ts`

The target lifecycle defines 10 states. The ClerkOS engine implements 4: `open`, `in_progress`, `on_hold`, `closed`. The states ANALYSED, ESTIMATED, VERIFIED, CONFIRMED, HITL_REQUIRED, APPROVED, EXECUTED, RECORDED do not exist in any code file in this repository. `packages/core-workflow` does not exist.

---

## 4. Data Quality Risks

### HIGH

| Risk | Evidence | Impact |
|---|---|---|
| **PIE sender is unverified** | `registry.json: sourceRepo: "unknown"` | All data quality depends on a system that cannot be inspected, tested, or controlled |
| **`urgency` is PIE-asserted, not independently verified** | `pie-schema.ts:24` — enum, no corroboration | If PIE miscalibrates urgency, FineGuard activates on low-value or irrelevant opportunities |
| **`estimatedValue` is free text with no authoritative source** | `pie-schema.ts:27` — `string.max(50)` | FineGuard £1M threshold fires on unverified developer estimates |
| **`externalRef` not validated against planning authority** | `pie-schema.ts:14` — `string.min(1)` | Any string is accepted as a planning reference. Fake, test, or malformed refs persist |
| **No human review gate before FineGuard activates** | `server/app.ts:677–682` — activation is immediate, synchronous | A bad PIE payload creates a `monitored_companies` row and 3 audit events with no human approval |

### MEDIUM

| Risk | Evidence | Impact |
|---|---|---|
| **`district` is free text, not LPA-validated** | `pie-schema.ts:25` — `string.max(100)` | Cannot reliably filter opportunities by borough — "Bromley", "LB Bromley", "London Borough of Bromley" are separate strings |
| **`siteAddress` not stored as a column** | `server/db/schema.ts` — not in `intakeForms` | Cannot query intake_forms by address. Address only queryable via `metadata` JSON in audit log |
| **`applicantName` used as `companyName` with no CH lookup** | `server/app.ts:634`, `pie-fineguard.ts:91` | monitored_companies.companyName is whatever PIE sends, not verified against Companies House |
| **`matterRef` is timestamp-based** | `server/app.ts:625` | Clock skew under concurrent ingestion could produce collisions (UNIQUE constraint prevents insert but does not prevent race) |
| **Stale opportunity risk** | No `submittedAt` TTL or staleness check | A PIE opportunity submitted months ago activates FineGuard on ingestion regardless of age |

### LOW

| Risk | Evidence | Impact |
|---|---|---|
| **`applicantEmail` format-validated but not confirmed** | `pie-schema.ts:18` | Email alerts to unverified addresses |
| **Duplicate risk under concurrent delivery** | `server/db/schema.ts` — UNIQUE on `source_ref` added in migration 0002, but race window exists before DB constraint fires | Mitigated by constraint; residual risk is a 500 error not a duplicate row |
| **`description` is unstructured** | `pie-schema.ts:22` — `string.max(2000)` | No extraction, classification, or NLP applied |

---

## 5. Human Decision Requirements

**What Dagon White would need before deciding whether Accuracy PIE should act on a planning opportunity:**

### Required fields (without these, the decision cannot be made)

| Field | Why required | Current status |
|---|---|---|
| LPA planning reference | Verifiable unique identifier, cross-checkable on planning portal | `externalRef` exists but not validated |
| LPA name / district | Scope of opportunity — which authority, which area | `district` exists but free text, not a column |
| Site address | Physical location of development | `siteAddress` exists but metadata-only, not queryable |
| Development description | Nature of work — residential, commercial, mixed | `description` exists but free text, no classification |
| Application status on portal | Is this still live? Approved? Refused? Withdrawn? | **NOT CAPTURED** — PIE sends no status field |
| Development value (authoritative) | Is this worth pursuing? | `estimatedValue` exists but unverified free text |
| Applicant / agent contact | Who to approach | `applicantName` + `applicantEmail` exist but unverified |
| Date received by LPA | Urgency calibration | `submittedAt` exists but optional and unverified |

### Nice-to-have fields

| Field | Why useful |
|---|---|
| Number of dwellings / floor area | Better value proxy than developer estimate |
| Consultation deadline | Actual urgency signal |
| Objections / representations count | Indicator of controversy / opportunity |
| Previous applications at same address | Pattern recognition |
| Agent / architect name | Relationship intelligence |

### Missing fields (not captured anywhere in current system)

| Field | Gap |
|---|---|
| **Application status** | PIE schema has no `status` field. Approved, refused, pending, withdrawn — none captured. |
| **LPA decision deadline** | No deadline field. |
| **Opportunity score / confidence** | No scoring output from PIE. Only `urgency` (PIE-asserted) and `estimatedValue` (free text). |
| **Source verification** | No field indicating whether data came from official portal, scrape, or manual entry. |
| **Agent / professional contact** | Separate from applicant. |

---

## 6. Bromley Opportunity Walkthrough

Using `externalRef: "24/AP/1234"`, `urgency: "high"`, `estimatedValue: "£2,400,000"`, `district: "Bromley"`.

### CAPTURED ✅ IMPLEMENTED

**Code:** `server/app.ts:538–693`, `server/lib/pie-schema.ts`

Input fields received:
- `externalRef` → used to build `sourceRef = "PIE:24/AP/1234"`
- `applicantName` → stored as `intake_forms.clientName`
- `applicantEmail` → stored as `intake_forms.clientEmail`
- `urgency: "high"` → stored as `intake_forms.urgency`
- `estimatedValue: "£2,400,000"` → stored as `intake_forms.claimValue`
- `district: "Bromley"` → stored in `clerk_audit_events.metadata` only
- `siteAddress` → stored in `clerk_audit_events.metadata` only

Transformations applied:
- `matterRef = "MAT-" + Date.now()`
- `matterType = "planning"` (hardcoded for all PIE intakes)
- `sourceRef = "PIE:24/AP/1234"` (idempotency key)

Output:
- 1 row in `intake_forms`
- 1 audit event: `action = "captured"`
- FineGuard evaluation triggered (see below)

What Dagon White sees at CAPTURED: client name, email, urgency, claim value, matter ref. No planning authority confirmation. No status. No deadline.

---

### ANALYSED ❌ NOT IMPLEMENTED

No analysis step exists. No NLP on `description`. No extraction of dwelling count, floor area, or development category. No classification. No enrichment from planning portal.

After CAPTURED, the intake row sits in `intake_forms` with raw fields. Nothing processes it.

---

### ESTIMATED ❌ NOT IMPLEMENTED

No estimation logic exists. `claimValue` is whatever PIE sent — `"£2,400,000"` stored verbatim as varchar. No independent valuation. No comparable transaction lookup. No fee estimate.

---

### VERIFIED ❌ NOT IMPLEMENTED

No verification step. `externalRef: "24/AP/1234"` is never checked against the Planning Portal API, any LPA system, or any external source. The application could be withdrawn, refused, or fictional — the system has no way to know.

---

### CONFIRMED ❌ NOT IMPLEMENTED

No confirmation gate. No human approval step. No HITL (Human In The Loop) enforcement. The FineGuard activation at CAPTURED is automatic with no human sign-off.

---

## 7. Exact Blockers Preventing Commercial Use

| # | Blocker | Severity | What's needed |
|---|---|---|---|
| B1 | Accuracy PIE sender does not exist in this repository | **CRITICAL** | Locate PIE source, verify it reads from an authoritative planning data source |
| B2 | Planning application status not captured | **CRITICAL** | Add `status` field to PIE schema — withdrawn/refused applications should not activate |
| B3 | `urgency` is PIE-asserted with no independent corroboration | **HIGH** | Either verify PIE's urgency calibration or add an independent signal (consultation deadline, decision date) |
| B4 | `estimatedValue` is free text from an unverified source | **HIGH** | Either validate against a fee scale / comparable or treat as indicative only and add human review before acting |
| B5 | `district` and `siteAddress` not stored as queryable columns | **MEDIUM** | Add `district` and `site_address` columns to `intake_forms` |
| B6 | No ANALYSED, ESTIMATED, VERIFIED, CONFIRMED steps | **HIGH** | Without these states, there is no structured path from raw opportunity to actionable instruction |
| B7 | No human review gate before FineGuard auto-activates | **HIGH** | Automatic activation on unverified data means every bad PIE payload creates a monitored company |
| B8 | `externalRef` not validated against LPA or planning portal | **HIGH** | Any string accepted — no confirmation the application actually exists |

---

## Final Answer

**NO.**

The system correctly receives and stores a PIE payload. The plumbing works.

But the data in that payload is unverified on every commercially significant dimension: the application status is not captured, the urgency is asserted by an unknown system, the value is free text, the sender itself has no verified source or code, and there is no human review before FineGuard activates.

Dagon White would be acting on a developer's self-reported description of their own planning application, transmitted by a system whose data source cannot be identified, with no check that the application is still live, no independent value assessment, and no structured analysis step.

The infrastructure is sound. The data pipeline is not.
