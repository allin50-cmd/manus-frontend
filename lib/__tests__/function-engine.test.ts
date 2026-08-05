/**
 * Unit tests for the function engine and the funding-finder runner.
 *
 * Run with:  npm run test:unit
 * Uses Node's built-in test runner via tsx — no test framework dependency.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  runFunction,
  registerFunction,
  hasFunction,
  listFunctions,
  FUNCTION_TIMEOUT_MS,
  type FunctionResult,
} from '../function-engine'
import { getBusinessFunction } from '../business-functions'

// ── Engine contract ───────────────────────────────────────────────────────────

describe('engine contract', () => {
  test('unknown function id fails without throwing', async () => {
    const r = await runFunction('no-such-function', { companyId: 'ultratech' })
    assert.equal(r.success, false)
    assert.ok(r.errors[0].includes('Unknown function id'))
  })

  test('missing companyId fails', async () => {
    const r = await runFunction('funding-finder', { companyId: '' })
    assert.equal(r.success, false)
    assert.ok(r.errors[0].includes('companyId is required'))
  })

  test('a function defined but with no runner warns rather than errors', async () => {
    // 'crm' is in BUSINESS_FUNCTION_REGISTRY but has no registered runner.
    assert.ok(getBusinessFunction('crm'))
    assert.equal(hasFunction('crm'), false)
    const r = await runFunction('crm', { companyId: 'ultratech' })
    assert.deepEqual(r.errors, [])
    assert.ok(r.warnings.length > 0)
  })

  test('registerFunction rejects an id absent from the definition registry', () => {
    assert.throws(
      () => registerFunction({ id: 'ghost-function', async execute() { return ok() } }),
      /unknown id/,
    )
  })

  test('a throwing runner is captured, not propagated', async () => {
    registerFunction({
      id: 'monitoring',
      async execute() { throw new Error('boom') },
    })
    const r = await runFunction('monitoring', { companyId: 'ultratech' })
    assert.equal(r.success, false)
    assert.deepEqual(r.errors, ['boom'])
  })

  test('a runner throwing a non-Error is still captured', async () => {
    registerFunction({
      id: 'monitoring',
      async execute() { throw 'plain string' },
    })
    const r = await runFunction('monitoring', { companyId: 'ultratech' })
    assert.equal(r.success, false)
    assert.deepEqual(r.errors, ['plain string'])
  })

  test('re-registering replaces the previous runner', async () => {
    registerFunction({ id: 'monitoring', async execute() { return ok(['first']) } })
    registerFunction({ id: 'monitoring', async execute() { return ok(['second']) } })
    const r = await runFunction('monitoring', { companyId: 'ultratech' })
    assert.deepEqual(r.events, ['second'])
  })

  test('listFunctions reports registered runners only', () => {
    assert.ok(listFunctions().includes('funding-finder'))
    assert.ok(!listFunctions().includes('crm'))
  })
})

// ── Result contract ───────────────────────────────────────────────────────────
//
// runFunction promises a FunctionResult in every case. A misbehaving runner
// must not be able to break that promise for its caller.

describe('result normalisation', () => {
  const cases: Array<[string, unknown]> = [
    ['undefined', undefined],
    ['null', null],
    ['a string', 'done'],
    ['a number', 42],
    ['an array', []],
  ]

  for (const [label, value] of cases) {
    test(`a runner returning ${label} yields a usable failure`, async () => {
      registerFunction({ id: 'monitoring', async execute() { return value as never } })
      const r = await runFunction('monitoring', { companyId: 'ultratech' })
      assert.equal(typeof r, 'object')
      assert.equal(r.success, false)
      assert.ok(Array.isArray(r.events) && Array.isArray(r.warnings) && Array.isArray(r.errors))
      assert.ok(r.errors.length > 0)
    })
  }

  test('a result missing the array fields is filled in, not passed through', async () => {
    registerFunction({ id: 'monitoring', async execute() { return { success: true } as never } })
    const r = await runFunction('monitoring', { companyId: 'ultratech' })
    assert.equal(r.success, true)
    assert.deepEqual(r.events, [])
    assert.deepEqual(r.warnings, [])
    assert.deepEqual(r.errors, [])
  })

  test('a result with a non-boolean success is rejected', async () => {
    registerFunction({ id: 'monitoring', async execute() { return { success: 'yes' } as never } })
    const r = await runFunction('monitoring', { companyId: 'ultratech' })
    assert.equal(r.success, false)
    assert.ok(r.errors[0].includes("no boolean 'success'"))
  })

  test('a well-formed result passes through untouched, data included', async () => {
    registerFunction({
      id: 'monitoring',
      async execute() {
        return { success: true, events: ['e'], warnings: ['w'], errors: [], data: { n: 1 } }
      },
    })
    const r = await runFunction('monitoring', { companyId: 'ultratech' })
    assert.deepEqual(r, { success: true, events: ['e'], warnings: ['w'], errors: [], data: { n: 1 } })
  })
})

describe('execution is bounded and isolated', () => {
  test('a runner that never settles times out instead of hanging', async () => {
    registerFunction({ id: 'monitoring', async execute() { return new Promise(() => {}) } })
    const raced = await Promise.race([
      runFunction('monitoring', { companyId: 'ultratech' }).then((r) => r),
      new Promise<'HUNG'>((r) => setTimeout(() => r('HUNG'), FUNCTION_TIMEOUT_MS + 2_000).unref?.()),
    ])
    assert.notEqual(raced, 'HUNG', 'runFunction hung past its own timeout')
    assert.equal((raced as FunctionResult).success, false)
    assert.ok((raced as FunctionResult).errors[0].includes('did not complete within'))
  })

  test('a runner cannot mutate the caller-owned context', async () => {
    registerFunction({
      id: 'monitoring',
      async execute(ctx) {
        ;(ctx as { companyId: string }).companyId = 'hijacked'
        return { success: true, events: [], warnings: [], errors: [] }
      },
    })
    const context = { companyId: 'ultratech' }
    await runFunction('monitoring', context)
    assert.equal(context.companyId, 'ultratech')
  })
})

// ── funding-finder runner ─────────────────────────────────────────────────────

describe('funding-finder runner', () => {
  test('runs for every registered venture', async () => {
    for (const id of ['fineguard', 'ultratech', 'builder-big-jobs', 'accuracy']) {
      const r = await runFunction('funding-finder', { companyId: id })
      assert.equal(r.success, true, id)
      assert.ok((r.data as any).matches.length > 0, id)
    }
  })

  test('a company with no funding profile fails with a usable message', async () => {
    const r = await runFunction('funding-finder', { companyId: 'not-a-company' })
    assert.equal(r.success, false)
    assert.ok(r.errors[0].includes('No funding profile'))
  })

  test('rejects an invalid profile override', async () => {
    const r = await runFunction('funding-finder', {
      companyId: 'ultratech',
      payload: { profile: { employees: -3 } },
    })
    assert.equal(r.success, false)
    assert.ok(r.errors[0].includes('Invalid profile override'))
  })

  test('payload cannot reassign the company', async () => {
    const r = await runFunction('funding-finder', {
      companyId: 'accuracy',
      payload: { profile: { companyId: 'ultratech' } as never },
    })
    assert.equal((r.data as any).companyId, 'accuracy')
  })

  test('a confirmed profile drops the assumed-values warning', async () => {
    const assumed = await runFunction('funding-finder', { companyId: 'ultratech' })
    const confirmed = await runFunction('funding-finder', {
      companyId: 'ultratech',
      payload: { profile: { assumed: false } },
    })
    assert.ok(assumed.warnings.some((w) => w.includes('assumed values')))
    assert.ok(!confirmed.warnings.some((w) => w.includes('assumed values')))
  })

  test('warns while matched schemes are unverified', async () => {
    const r = await runFunction('funding-finder', { companyId: 'ultratech' })
    assert.ok(r.warnings.some((w) => w.includes('never been confirmed')))
  })

  test('kind filter narrows the result', async () => {
    const r = await runFunction('funding-finder', {
      companyId: 'ultratech',
      payload: { kinds: ['equity'] },
    })
    assert.ok((r.data as any).matches.every((m: any) => m.source.kind === 'equity'))
  })

  test('tightening the profile removes schemes it no longer qualifies for', async () => {
    const r = await runFunction('funding-finder', {
      companyId: 'ultratech',
      payload: { profile: { employees: 300, tradingMonths: 120, assumed: false } },
    })
    const excludedIds = (r.data as any).excluded.map((e: any) => e.id)
    for (const id of ['seis', 'eis', 'start-up-loans']) {
      assert.ok(excludedIds.includes(id), `${id} should be excluded at 300 staff / 120 months`)
    }
  })

  test('events report ceilings per kind, never one combined total', async () => {
    const r = await runFunction('funding-finder', { companyId: 'ultratech' })
    const ceilingEvents = r.events.filter((e) => e.includes('ceiling'))
    assert.ok(ceilingEvents.length > 1, 'expected a line per kind')
    assert.ok(!r.events.some((e) => /total|combined/i.test(e)))
  })
})

function ok(events: string[] = []): FunctionResult {
  return { success: true, events, warnings: [], errors: [] }
}
