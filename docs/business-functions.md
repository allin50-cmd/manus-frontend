# Business Functions

The architectural layer between Applications and raw data.
Read alongside `docs/app-contract.md` and `docs/workspace-architecture.md`.

---

## Layered Model

```
Workspace
    └── orchestrates navigation, company context, tabs
         ↓
Applications  (FineGuard, VaultLine, SmartReceptionist …)
    └── provide specialist capability within their domain
         ↓
Business Functions  (Job Tracker, Invoicing, Lead Capture …)
    └── execute specific, bounded work against shared tables
         ↓
Optional AI Advice  (UltAi — only when requested, never autonomous)
```

Each layer has one responsibility. Business Functions sit in the middle: they own a workflow end-to-end but do not decide UI or infrastructure.

---

## What a Business Function Is

A Business Function is a deterministic, bounded module that:

- Owns a specific business workflow (e.g. "turn a lead into a quote")
- Reads from one or more shared `os_*` or `fg_*` tables
- Optionally writes back to those tables
- May surface inside an Application or stand alone
- Has a named human owner who supervises it
- Does not call an LLM, schedule a cron, or manage state autonomously

Business Functions **execute work**. They are not AI agents, not microservices, and not background jobs. They are the named, auditable units of work that the business runs on.

---

## What a Business Function Is Not

- Not an autonomous agent
- Not a background worker or queue consumer
- Not an AI pipeline or chain
- Not an Application (Applications provide specialist capability; Functions use that capability)
- Not a database table (tables store state; Functions define what happens to it)
- Not a Workspace tab (the Workspace shell is never modified to install a Function)

---

## Relationship to Applications

An Application may host one or more Business Functions. A Function may declare which Application it surfaces in via the optional `app` field.

```
Application: FineGuard
    └── Business Function: FineGuard Compliance   (owns the monitoring workflow)
    └── Business Function: Companies House        (owns the data lookup workflow)
```

A Function without an `app` field stands alone — it is not yet assigned to an Application or surfaces directly in the OS spine.

---

## Relationship to the Workspace

The Workspace does not know about Business Functions directly. It knows only about Applications (from `APP_REGISTRY`). Business Functions are registered in `BUSINESS_FUNCTION_REGISTRY` in `lib/business-functions.ts` and are consumed by Application pages, API routes, or future tooling — not by the Workspace shell.

**Do not modify Workspace pages to add Business Function awareness.**

---

## Relationship to AI

AI (UltAi) sits below Business Functions in the stack — it is an optional advisory layer, not an orchestrator. A Business Function may, in the future, call UltAi to request a draft, a classification, or a recommendation. The Function remains in control of the workflow; AI provides input only when asked.

No Business Function in this codebase calls an LLM today. AI integration is a future capability, not a dependency.

---

## Executive Roles

Each Business Function has a named owner from the executive team. Owners supervise the function — they are responsible for the work it produces, not its technical implementation.

| Owner | Area |
|---|---|
| Jobe | Executive, Technology |
| Devin | Sales, Support |
| Lola | Operations, Marketing |
| Vincent | Finance |
| Adonis | Compliance, Documents |

---

## Registry

Business Functions are registered in `lib/business-functions.ts` as `BusinessFunction` objects in `BUSINESS_FUNCTION_REGISTRY`.

### Interface

```ts
interface BusinessFunction {
  id: string           // URL-safe slug, e.g. 'job-tracker'
  name: string         // Display name, e.g. 'Job Tracker'
  description: string  // One sentence — what this function does
  department: BFDepartment
  status: BFStatus     // 'planned' | 'beta' | 'live'
  owner: BFOwner       // Named executive responsible
  app?: string         // App id from APP_REGISTRY (optional)
  watches?: string[]   // Tables this function reads
  writesTo?: string[]  // Tables this function writes
}
```

### Status Lifecycle

```
planned  →  beta  →  live
```

- `planned`: function is defined and owned but not yet built
- `beta`: implementation exists, actively used, may have rough edges
- `live`: stable, primary path for this workflow

Promoting a function from `planned` to `beta` or `live` requires only a one-line change to its `status` field in the registry. No Workspace, Application, or schema changes are needed.

### Adding a Business Function

1. Add a `BusinessFunction` entry to `BUSINESS_FUNCTION_REGISTRY` in `lib/business-functions.ts`
2. Set `status: 'planned'`
3. Assign an `owner`
4. Declare `watches` and `writesTo` so data flow is documented from day one
5. Optionally set `app` once the function is assigned to an Application

That is all that is required to register a function. UI, routes, and API routes are built separately as implementation work.

---

## Current Registry

### Executive

| Function | Status | Owner |
|---|---|---|
| Business Health | planned | Jobe |
| KPI Dashboard | planned | Jobe |
| Decision Register | planned | Jobe |

### Sales

| Function | Status | Owner |
|---|---|---|
| Lead Capture | planned | Devin |
| Quote Builder | beta | Devin |
| CRM | planned | Devin |
| Follow-ups | planned | Devin |

### Operations

| Function | Status | Owner |
|---|---|---|
| Scheduler | planned | Lola |
| Job Tracker | beta | Lola |
| Procurement | planned | Lola |
| Workforce | planned | Lola |

### Finance

| Function | Status | Owner |
|---|---|---|
| Invoicing | planned | Vincent |
| Cash Flow | planned | Vincent |
| Expenses | planned | Vincent |

### Compliance

| Function | Status | Owner |
|---|---|---|
| FineGuard | live | Adonis |
| Companies House | live | Adonis |
| HMRC | planned | Adonis |

### Documents

| Function | Status | Owner |
|---|---|---|
| VaultLine | planned | Adonis |
| Contracts | planned | Adonis |

### Technology

| Function | Status | Owner |
|---|---|---|
| Deployments | planned | Jobe |
| Monitoring | planned | Jobe |

### Marketing

| Function | Status | Owner |
|---|---|---|
| Campaigns | planned | Lola |

### Support

| Function | Status | Owner |
|---|---|---|
| Customer Support | planned | Devin |

---

## Data Flow Convention

The `watches` and `writesTo` fields are documentation, not enforcement. They describe intended data access so that:

- Future maintainers know which tables a function touches
- Conflicts between functions can be spotted before implementation
- The AI advice layer knows which context to retrieve

All writes go through existing Drizzle-backed API routes. Functions do not write to the database directly from the browser; they call `/api/os/*` or `/api/fineguard/*` routes which own the actual inserts and updates.

---

## What Must Not Change

- Business Functions are **not** AI agents. Do not add autonomous execution, polling, or background scheduling.
- Business Functions **do not** modify the Workspace shell. The Workspace tab bar, layout, and navigation are fixed.
- Business Functions **do not** own their own database tables. They read and write shared `os_*` tables.
- The `owner` field is a named person, not a role string. It must be one of the five defined names.
- `lib/business-functions.ts` is **pure in-memory data** — no async, no DB, no imports from application code.
