# Accuracy PIE Source Verification

**Authority:** Direct source inspection only. Every claim cites a file and line number.  
**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-26  
**Role:** Accuracy PIE Verification Engineer  

---

## Verdict

**NO.**

Accuracy PIE cannot produce one real Bromley planning opportunity today. No planning data source exists in this repository. Evidence follows.

---

## 1. Source Discovery

### Search Terms Executed

| Term | Files Searched | Results |
|---|---|---|
| `Bromley` | `**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.json`, `**/*.sql` | Test fixtures and documentation only |
| `Lewisham` | same | **ZERO RESULTS** |
| `IDOX` / `idox` | same | **ZERO RESULTS** |
| `planning.data.gov.uk` | same | **ZERO RESULTS** |
| `scraper` / `scrape` | same | **ZERO RESULTS** |
| `planning_records` | same | **ZERO RESULTS** |
| `applicationReference` | same | **ZERO RESULTS** |
| `externalRef` | same | Schema field name and tests only |
| `planningportal` | same | **ZERO RESULTS** |
| `lpa` | same | **ZERO RESULTS** |
| `gov.uk` | same | **ZERO RESULTS** |
| `council` | same | **ZERO RESULTS** |

### Outbound HTTP Clients in `server/`

| File | Target | Relevance |
|---|---|---|
| `server/lib/companiesHouse.ts` | `https://api.company-information.service.gov.uk` | Companies House only — not planning data |
| `server/lib/blobStorage.ts` | Azure Blob Storage | File storage — not planning data |
| `server/lib/serviceBus.ts` | Azure Service Bus | Message queue — not planning data |

No HTTP client targeting any planning authority, planning portal, planning API, or IDOX endpoint exists in any file in this repository.

---

## 2. Source Inventory

### Sources Discovered: NONE

No planning data source exists in this repository.

| Source Name | Status |
|---|---|
| Bromley London Borough planning portal | **ABSENT** — mentioned in documentation as aspiration only |
| IDOX public access | **ABSENT** — zero code references |
| planning.data.gov.uk API | **ABSENT** — zero code references |
| Planning portal scraper | **ABSENT** — zero code references |
| LPA direct API | **ABSENT** — zero code references |
| Manual CSV import | **ABSENT** — zero code references |
| Manual data entry (PIE-specific) | **ABSENT** — `IntakeSheet.tsx` is a generic form |

`apps/registry.json` explicitly records the gap:

```json
"sourceRepo": "unknown — requires verification"
```

---

## 3. Code Walkthrough: Raw Source → Opportunity Record

### Stage 1: Raw Source → Parsed Record

**Status: UNKNOWN — no source exists**

The raw source stage requires a component that retrieves planning application data from an authoritative system (portal scrape, API call, file import, or manual entry). No such component exists in this repository.

Evidence: zero code files contain any planning data retrieval mechanism. `docs/end-to-end-workflow.md` states explicitly:

> "Code that would handle it: NONE. Accuracy PIE does not exist in this repository."

No raw source. No parsed record. Stage 1 cannot be demonstrated.

---

### Stage 2: Parsed Record → Opportunity Record

**Status: UNKNOWN — dependent on Stage 1**

The PIE opportunity schema (`server/lib/pie-schema.ts:1–45`) defines the inbound contract:

```typescript
// server/lib/pie-schema.ts:14
externalRef: z.string().min(1).max(100),
// server/lib/pie-schema.ts:16
applicantName: z.string().min(1).max(255),
// server/lib/pie-schema.ts:18 (optional)
applicantEmail: z.string().email().optional(),
// server/lib/pie-schema.ts:22 (optional)
description: z.string().max(2000).optional(),
// server/lib/pie-schema.ts:24 (optional)
urgency: z.enum(['low','medium','high','critical']).default('medium'),
// server/lib/pie-schema.ts:27 (optional)
estimatedValue: z.string().max(50).optional(),
// server/lib/pie-schema.ts:25 (optional)
district: z.string().max(100).optional(),
```

This schema defines what shape an opportunity record should take. It does not define how that record is populated. The population step requires Stage 1, which does not exist.

No real planning record has ever passed through this schema from an authoritative source.

---

### Stage 3: Opportunity Record → Receiving Endpoint

**Status: IMPLEMENTED — endpoint accepts payloads**

The receiving endpoint exists and functions:

| Component | File | Line |
|---|---|---|
| Route handler | `server/app.ts` | 538 |
| Schema validation | `server/lib/pie-schema.ts` | Zod parse at app.ts:555 |
| DB insert | `server/app.ts` | 619–629 |
| FineGuard trigger | `server/lib/pie-fineguard.ts` | Called at app.ts:644 |
| Audit write | `server/app.ts` | 658–675 |

The endpoint is sound. It will process any payload that conforms to the schema. The problem is upstream: nothing populates real planning data into a conforming payload.

---

### Stage 4: Scoring Output

**Status: NOT IMPLEMENTED**

No scoring step exists. The only evaluation is in `server/lib/fineguard-rules.ts:90`:

```
activate = pieOriginated AND (highUrgency OR highValue)
```

This is a binary activation gate, not a score. It produces `true` or `false`. There is no:
- Opportunity score
- Confidence level
- Ranking mechanism
- False-positive filter
- Relevance assessment

Output of the "scoring" step is a boolean: FineGuard activates or it does not.

---

## 4. Required Credentials and Environment Variables

For a functional PIE data pipeline, the following would be required. None are currently configured because no pipeline exists.

| Credential / Variable | Purpose | Current Status |
|---|---|---|
| Planning portal session cookie or API key | Authenticate against LPA public access system | **NOT CONFIGURED — no target system** |
| IDOX API credentials | Authenticate against IDOX planning system | **NOT CONFIGURED — no IDOX client** |
| planning.data.gov.uk API key | Authenticate against national planning dataset | **NOT CONFIGURED — no client** |
| `PIE_SOURCE_URL` | Base URL of the planning data source | **NOT IN `.env` or `.env.example`** |
| `PIE_API_KEY` | API key for planning data source | **NOT IN `.env` or `.env.example`** |
| `PIE_DISTRICT_FILTER` | LPA filter for opportunity scoping | **NOT IN `.env` or `.env.example`** |

The only environment variables relevant to PIE in `.env.example`:

```
DATABASE_URL=...
DIRECT_URL=...
ADMIN_API_KEY=...
```

No planning data source variables exist.

---

## 5. "Bromley" Occurrences — Full Account

Every occurrence of "Bromley" in the repository:

| File | Line | Content | Assessment |
|---|---|---|---|
| `server/workflow-proof.test.ts` | ~45 | `district: 'Bromley'` in test fixture | **Simulation only** |
| `server/pie.test.ts` | ~38 | `district: 'Bromley'` in test fixture | **Simulation only** |
| `server/integration.test.ts` | ~52 | `district: 'Bromley'` in test fixture | **Simulation only** |
| `apps/registry.json` | ~200 | "Bromley activation proof" in resolvedBlockers | **Documentation reference** |
| `docs/end-to-end-workflow.md` | ~12 | "Source: Bromley London Borough planning portal" | **Aspirational documentation** |
| `docs/pie-revenue-validation.md` | ~186 | Walkthrough using example ref `24/AP/1234` | **Analytical document — this session** |

Every Bromley reference is test fixture data, documentation, or analysis. Zero references connect to a live data retrieval mechanism.

---

## 6. Final Assessment

### Can Accuracy PIE produce one real Bromley opportunity today?

**NO.**

| Requirement | Status | Evidence |
|---|---|---|
| A component that reads from a planning data source | **ABSENT** | Zero files with planning/portal/scrape/IDOX/gov.uk code |
| A planning API client | **ABSENT** | `server/lib/` contains only Companies House, Azure Blob, Azure Bus |
| Credentials for any planning data source | **ABSENT** | `.env.example` has no planning-related variables |
| A known `sourceRepo` for the Accuracy PIE sender | **UNKNOWN** | `apps/registry.json: "sourceRepo": "unknown — requires verification"` |
| Any record of a real planning application in the database | **UNVERIFIABLE** | Database unreachable from this environment (TCP 5432 blocked) |

The PIE receiving endpoint (`server/app.ts:538`) is functional. It will accept and process a correctly formed POST payload.

The PIE sending component — the system that would obtain real planning applications from an authoritative source and POST them to this endpoint — does not exist in this repository, has no verified external source, and has no deployment record.

**The pipeline has a sink. It has no source.**

---

*File generated by direct source inspection. No claims are made beyond what the repository contains.*
