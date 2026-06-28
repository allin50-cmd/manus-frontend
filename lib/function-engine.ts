import { getBusinessFunction, BUSINESS_FUNCTION_REGISTRY } from './business-functions'

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

  // 4. Execute — capture all thrown errors as a structured result
  try {
    return await runner.execute(context)
  } catch (err) {
    return failure([err instanceof Error ? err.message : String(err)])
  }
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
