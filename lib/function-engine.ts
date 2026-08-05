import { getBusinessFunction } from './business-functions'
import {
  findFunding,
  getFundingProfile,
  validateProfile,
  auditCatalogue,
  STALE_AFTER_MONTHS,
  type CompanyFundingProfile,
  type FundingKind,
} from './funding-sources'

// ── Core Types ────────────────────────────────────────────────────────────────

export interface FunctionContext {
  companyId: string
  userId?: string
  app?: string
  payload?: unknown
}

export interface FunctionResult {
  success: boolean
  events: string[]
  warnings: string[]
  errors: string[]
  data?: unknown
}

export interface BusinessFunctionRunner {
  id: string
  execute(context: FunctionContext): Promise<FunctionResult>
}

// ── Engine ────────────────────────────────────────────────────────────────────

// Module-level singleton map — one runner per function id.
// Runners are registered at startup (or on first import in serverless).
const RUNNER_REGISTRY = new Map<string, BusinessFunctionRunner>()

/**
 * Hard ceiling on a single execution. A runner that never settles would
 * otherwise hang the caller — and in a server component, the request — forever.
 * Functions are meant to be short, synchronous units of work; anything
 * approaching this limit is doing something it should not.
 */
export const FUNCTION_TIMEOUT_MS = 10_000

/**
 * Register a runner for a function that already exists in BUSINESS_FUNCTION_REGISTRY.
 * Throws if the function id is not known — prevents ghost runners.
 */
export function registerFunction(runner: BusinessFunctionRunner): void {
  if (!getBusinessFunction(runner.id)) {
    throw new Error(
      `registerFunction: unknown id '${runner.id}'. ` +
      `Add the function to BUSINESS_FUNCTION_REGISTRY in lib/business-functions.ts first.`
    )
  }
  RUNNER_REGISTRY.set(runner.id, runner)
}

/**
 * Execute a business function by id.
 * Steps: verify → validate → execute → return standard result.
 * All errors are captured — this never throws.
 */
export async function runFunction(
  id: string,
  context: FunctionContext,
): Promise<FunctionResult> {
  // 1. Verify the function exists in the definition registry
  const definition = getBusinessFunction(id)
  if (!definition) {
    return failure([`Unknown function id: '${id}'`])
  }

  // 2. Validate minimal context
  if (!context.companyId || typeof context.companyId !== 'string') {
    return failure(['FunctionContext.companyId is required and must be a non-empty string'])
  }

  // 3. Look up the runner
  const runner = RUNNER_REGISTRY.get(id)
  if (!runner) {
    return {
      success: false,
      events: [],
      warnings: [
        `Function '${id}' (${definition.name}) is registered in the definition registry ` +
        `with status '${definition.status}' but has no runner. ` +
        `Call registerFunction() to provide an implementation.`,
      ],
      errors: [],
    }
  }

  // 4. Execute — bounded, isolated, and normalised.
  //
  // The context is copied so a runner cannot mutate the caller's object.
  // Note this is shallow: `payload` is still shared by reference, so a runner
  // can still mutate a payload the caller holds. Runners must treat payload as
  // read-only.
  const isolatedContext: FunctionContext = { ...context }

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const raw = await Promise.race([
      runner.execute(isolatedContext),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(
            `Function '${id}' did not complete within ${FUNCTION_TIMEOUT_MS}ms`,
          )),
          FUNCTION_TIMEOUT_MS,
        )
      }),
    ])
    return normaliseResult(raw, id)
  } catch (err) {
    return failure([err instanceof Error ? err.message : String(err)])
  } finally {
    // Without this the pending timer keeps the event loop alive.
    if (timer) clearTimeout(timer)
  }
}

/**
 * Coerce whatever a runner returned into a real FunctionResult.
 *
 * `runFunction` promises callers a FunctionResult in every case. A runner that
 * returns undefined, a non-object, or an object missing the array fields would
 * otherwise break that promise and crash callers doing `result.errors.length`.
 */
function normaliseResult(raw: unknown, id: string): FunctionResult {
  if (raw === null || typeof raw !== 'object') {
    return failure([
      `Function '${id}' returned ${raw === undefined ? 'undefined' : JSON.stringify(raw)} ` +
      `instead of a FunctionResult`,
    ])
  }

  const result = raw as Partial<FunctionResult>

  if (typeof result.success !== 'boolean') {
    return failure([`Function '${id}' returned a result with no boolean 'success' field`])
  }

  const normalised: FunctionResult = {
    success: result.success,
    events: Array.isArray(result.events) ? result.events : [],
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    errors: Array.isArray(result.errors) ? result.errors : [],
  }
  if (result.data !== undefined) normalised.data = result.data

  return normalised
}

/** Return all function ids that have registered runners. */
export function listFunctions(): string[] {
  return Array.from(RUNNER_REGISTRY.keys())
}

/** True if a runner exists for this function id. */
export function hasFunction(id: string): boolean {
  return RUNNER_REGISTRY.has(id)
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function failure(errors: string[]): FunctionResult {
  return { success: false, events: [], warnings: [], errors }
}

// ── Placeholder Runners ───────────────────────────────────────────────────────
// These stubs satisfy the contract so the engine can be tested end-to-end
// before real business logic is built. Each returns a minimal success result.
// Replace a stub by calling registerFunction() again with the same id —
// the new runner overwrites the placeholder.

function placeholder(id: string): BusinessFunctionRunner {
  return {
    id,
    async execute(_context: FunctionContext): Promise<FunctionResult> {
      return {
        success: true,
        events: ['Function executed'],
        warnings: [],
        errors: [],
      }
    },
  }
}

registerFunction(placeholder('lead-capture'))
registerFunction(placeholder('quote-builder'))
registerFunction(placeholder('scheduler'))
registerFunction(placeholder('invoicing'))
registerFunction(placeholder('fineguard-compliance'))

// ── Real Runners ──────────────────────────────────────────────────────────────

export interface FundingFinderPayload {
  /** Overrides for assumed profile values, e.g. { employees: 12, assumed: false }. */
  profile?: Partial<CompanyFundingProfile>
  /** Restrict the search, e.g. ['grant'] to exclude loans and equity. */
  kinds?: FundingKind[]
}

// Matches a venture against the UK funding catalogue in lib/funding-sources.ts.
// Pure and synchronous — reads no tables and makes no network calls. Callers
// decide what to do with the result; the function itself persists nothing.
registerFunction({
  id: 'funding-finder',
  async execute(context: FunctionContext): Promise<FunctionResult> {
    const payload = (context.payload ?? {}) as FundingFinderPayload

    const base = getFundingProfile(context.companyId)
    if (!base) {
      return failure([
        `No funding profile for company '${context.companyId}'. ` +
        `Add one to COMPANY_FUNDING_PROFILES in lib/funding-sources.ts.`,
      ])
    }

    // Reject bad overrides before they reach the matcher — a negative headcount
    // or an unknown sector would otherwise produce confident nonsense.
    if (payload.profile) {
      const profileErrors = validateProfile(payload.profile)
      if (profileErrors.length > 0) {
        return failure(profileErrors.map((e) => `Invalid profile override: ${e}`))
      }
    }

    // Caller overrides win, but the company can never be reassigned.
    const profile: CompanyFundingProfile = {
      ...base,
      ...payload.profile,
      companyId: context.companyId,
    }

    const result = findFunding(profile, payload.kinds)

    // Registry profiles bypass the override check above, so findFunding
    // re-validates. Surface that as a failure rather than an empty result.
    if (result.profileErrors.length > 0) {
      return failure(
        result.profileErrors.map(
          (e) => `Invalid funding profile for '${context.companyId}': ${e}`,
        ),
      )
    }

    const events = [
      `Matched ${result.matches.length} funding schemes for '${context.companyId}' ` +
      `(${result.excluded.length} excluded)`,
    ]
    // Reported per kind — grant, debt, and equity money are not interchangeable
    // and a combined total would overstate what is realistically available.
    for (const [kind, ceiling] of Object.entries(result.ceilingByKind)) {
      events.push(`Indicative ${kind} ceiling: £${ceiling.toLocaleString('en-GB')}`)
    }
    for (const match of result.matches.slice(0, 5)) {
      const award = match.source.maxAward
        ? ` (up to £${match.source.maxAward.toLocaleString('en-GB')})`
        : ''
      events.push(`${match.source.name} — ${match.source.provider}${award}`)
    }

    const warnings: string[] = []
    if (profile.assumed) {
      warnings.push(
        `Funding profile for '${context.companyId}' uses assumed values ` +
        `(${profile.employees} employees, region '${profile.region}', ${profile.tradingMonths} months trading). ` +
        `Several schemes turn on exactly these fields — confirm them before relying on this result.`,
      )
    }
    const withCaveats = result.matches.filter((m) => m.caveats.length > 0).length
    if (withCaveats > 0) {
      warnings.push(`${withCaveats} matched schemes carry conditions the matcher could not evaluate — read the caveats before applying.`)
    }
    if (result.matches.length === 0) {
      warnings.push('No schemes matched this profile. Widen the search or review the exclusion reasons.')
    }

    // Data quality is a first-class result here: award figures drive real
    // funding decisions, so an unverified or stale catalogue must be loud.
    const health = auditCatalogue()
    if (result.unverifiedMatches > 0) {
      warnings.push(
        `${result.unverifiedMatches} of ${result.matches.length} matched schemes have never been ` +
        `confirmed against the provider. Award figures and eligibility rules are indicative only — ` +
        `open each reviewUrl and set verified: true before acting on them.`,
      )
    }
    if (health.stale) {
      warnings.push(
        `Catalogue figures are ${health.oldestMonths} months old (stale after ${STALE_AFTER_MONTHS}). ` +
        `UK scheme terms change frequently — re-check before relying on these results.`,
      )
    }
    if (health.issues.length > 0) {
      warnings.push(`Catalogue integrity issues: ${health.issues.join('; ')}`)
    }

    return { success: true, events, warnings, errors: [], data: result }
  },
})

// ── Future AI Integration Point ───────────────────────────────────────────────
// When AI advice is needed, add it AFTER deterministic execution:
//
//   const result = await runner.execute(context)
//   if (result.success && context.requestAiAdvice) {
//     const advice = await ultai.advise({ function: id, result, context })
//     return { ...result, data: { ...result.data, aiAdvice: advice } }
//   }
//   return result
//
// AI never runs before or instead of the deterministic step.
// AI never controls the execution path.
// AI is optional input to a result, not the result itself.
