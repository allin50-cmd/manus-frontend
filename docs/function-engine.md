# Function Engine

The deterministic execution layer for UltraTech Business Functions.
Read alongside `docs/business-functions.md` and `docs/app-contract.md`.

---

## What It Is

The Function Engine is a thin execution wrapper around Business Functions. It provides:

- A standard contract for running any function (`runFunction`)
- A registration API for attaching real implementations (`registerFunction`)
- A uniform result envelope (`FunctionResult`) so callers always get the same shape
- Error capture so no function can bring down the caller

It does not schedule, queue, poll, or call AI. It runs one function, synchronously, to completion, and returns a result.

---

## Execution Flow

```
caller calls runFunction(id, context)
    ↓
1. Verify — is this id in BUSINESS_FUNCTION_REGISTRY?
    ↓  (no → return failure)
2. Validate — does context have a companyId?
    ↓  (no → return failure)
3. Resolve — is there a runner registered for this id?
    ↓  (no → return warning result, not an error)
4. Execute — call runner.execute(context)
    ↓  (throws → catch and return failure)
5. Return FunctionResult to caller
```

All errors are caught. `runFunction` never throws. The caller always receives a `FunctionResult`.

---

## Core Types

```ts
interface FunctionContext {
  companyId: string    // required — which workspace this runs in
  userId?: string      // optional — who triggered it (for audit)
  app?: string         // optional — which app surface triggered it
  payload?: unknown    // optional — function-specific input data
}

interface FunctionResult {
  success: boolean
  events: string[]     // things that happened (append-only, human-readable)
  warnings: string[]   // non-fatal issues
  errors: string[]     // failure reasons (populated when success is false)
  data?: unknown       // structured output for the caller (optional)
}

interface BusinessFunctionRunner {
  id: string
  execute(context: FunctionContext): Promise<FunctionResult>
}
```

---

## Engine API

### `registerFunction(runner: BusinessFunctionRunner): void`

Attach an implementation to a function id. The id must already exist in `BUSINESS_FUNCTION_REGISTRY` — runners cannot be registered for unknown functions.

Calling `registerFunction` twice with the same id replaces the first runner. This is how placeholder stubs are replaced by real implementations.

```ts
registerFunction({
  id: 'lead-capture',
  async execute(context) {
    // real implementation
    return { success: true, events: ['Lead captured'], warnings: [], errors: [] }
  },
})
```

### `runFunction(id: string, context: FunctionContext): Promise<FunctionResult>`

Execute a function by id. Returns a `FunctionResult` in all cases — success, warning, or failure. Never throws.

```ts
const result = await runFunction('lead-capture', {
  companyId: 'builder-big-jobs',
  userId: 'george',
  payload: { name: 'Alex', phone: '07700900000' },
})
```

### `listFunctions(): string[]`

Returns the ids of all functions that currently have a registered runner.

### `hasFunction(id: string): boolean`

Returns `true` if a runner exists for this id.

---

## Registration

Functions are defined in `lib/business-functions.ts` (the definition registry). Runners are registered in `lib/function-engine.ts` or in a module that imports the engine.

A function can exist in the definition registry without a runner — this represents a planned function. `runFunction` returns a warning result (not an error) for functions without runners, making it safe to call any function id regardless of implementation status.

The five initial placeholder runners are registered automatically when `lib/function-engine.ts` is imported:

| Function id | Status |
|---|---|
| `lead-capture` | placeholder |
| `quote-builder` | placeholder |
| `scheduler` | placeholder |
| `invoicing` | placeholder |
| `fineguard-compliance` | placeholder |

---

## Replacing a Placeholder

When a real implementation is ready, import the engine and call `registerFunction` with the same id. The new runner replaces the stub:

```ts
// lib/runners/lead-capture.ts
import { registerFunction } from '@/lib/function-engine'
import { getDb } from '@/lib/db'
import { osLeads } from '@/db/schema'

registerFunction({
  id: 'lead-capture',
  async execute(context) {
    const db = await getDb()
    const lead = context.payload as { name: string; phone: string }
    await db.insert(osLeads).values({ ...lead, companyId: context.companyId })
    return {
      success: true,
      events: [`Lead captured: ${lead.name}`],
      warnings: [],
      errors: [],
    }
  },
})
```

Import this runner module from the app that uses it. The engine picks up the real implementation automatically.

---

## Context Design

`companyId` is the only required field. This is deliberate — the function engine is workspace-aware by contract. Every function execution is scoped to a company. This prevents data from leaking between workspaces.

`payload` is typed as `unknown`. Each runner is responsible for validating its own payload shape. The engine does not validate payload contents.

`userId` is optional but should be passed whenever a human triggered the execution. It is available for audit trail use inside runner implementations.

`app` is optional. It identifies which Application surface triggered the function. Useful for routing, logging, and future permission checks.

---

## Result Design

### `events`

Append-only log of what happened. Human-readable. Surfaced in the Activity feed.

```ts
events: ['Lead captured: Alex', 'Work item created: #1042']
```

### `warnings`

Non-fatal issues. Execution succeeded but something noteworthy happened.

```ts
warnings: ['Phone number missing — lead captured without contact number']
```

### `errors`

Failure reasons. Always populated when `success` is `false`. May be shown to the operator or logged.

```ts
errors: ['Unknown function id: foo']
errors: ['FunctionContext.companyId is required']
errors: ['Database connection failed']
```

### `data`

Optional structured output for the caller. Untyped at the engine level — each runner defines its own output shape.

---

## Future AI Integration Point

AI advice belongs **after** deterministic execution, never before or instead of it.

The integration point is inside the caller, not inside the engine:

```ts
const result = await runFunction('lead-capture', context)

if (result.success && shouldRequestAdvice) {
  const advice = await ultai.advise({
    function: 'lead-capture',
    result,
    context,
  })
  return { ...result, data: { ...result.data, aiAdvice: advice } }
}

return result
```

Rules for AI integration:
1. AI runs only after the deterministic function succeeds
2. AI is never in the execution path — it is advisory output appended to a result
3. AI never controls what the function does or writes
4. `requestAiAdvice` must be explicitly opted into by the caller — never on by default
5. A failed AI call must not change the function's `success` status

---

## What Must Not Change

- `runFunction` must never throw — it always returns a `FunctionResult`
- `registerFunction` must reject unknown function ids — runners must match the definition registry
- `companyId` validation is mandatory — no function may execute without workspace scope
- Placeholder runners must not write to the database or make network calls
- The engine must not import from application code (`app/`) — only from `lib/`
