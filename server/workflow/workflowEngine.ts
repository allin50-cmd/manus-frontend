import { db } from '@/lib/db'
import type { WorkItemStatus } from '@/lib/types'
import { WORK_ITEM_TRANSITIONS, canTransition, type TransitionMap } from './workflowTransitions'
import { canTransitionStatus } from './workflowPermissions'
import { statusChangeActivity } from './workflowActivity'

export type TransitionFailure = {
  ok: false
  code: 'forbidden' | 'not_found' | 'invalid_transition' | 'unavailable'
  error: string
}

export type TransitionResult<T> = { ok: true; entity: T } | TransitionFailure

export interface TransitionSteps<S extends string, T> {
  person: string
  to: S
  transitions: TransitionMap<S>
  load: () => Promise<{ status: S } | null>
  apply: () => Promise<T>
  record: (from: S) => Promise<unknown>
}

// Entity-agnostic pipeline: permission → load → validate → apply → record.
// Callers own persistence and the transaction, so this works for Prisma and
// Drizzle entities alike. `apply` and `record` only run for a valid transition.
export async function runTransition<S extends string, T>(
  steps: TransitionSteps<S, T>
): Promise<TransitionResult<T>> {
  if (!canTransitionStatus(steps.person)) {
    return { ok: false, code: 'forbidden', error: 'Not allowed to change status' }
  }
  const current = await steps.load()
  if (!current) {
    return { ok: false, code: 'not_found', error: 'Not found' }
  }
  if (!canTransition(steps.transitions, current.status, steps.to)) {
    return {
      ok: false,
      code: 'invalid_transition',
      error: `Cannot change status from ${current.status} to ${steps.to}`,
    }
  }
  const entity = await steps.apply()
  await steps.record(current.status)
  return { ok: true, entity }
}

// `updates` lets a route apply other validated field edits atomically with the
// status change (PATCH /api/work-items/[id] accepts both in one body).
export async function transitionWorkItem(input: {
  workItemId: string
  to: WorkItemStatus
  person: string
  note?: string
  updates?: Record<string, unknown>
}): Promise<TransitionResult<unknown>> {
  const { workItemId, to, person, note, updates } = input
  try {
    return await db.$transaction(async (tx) =>
      runTransition({
        person,
        to,
        transitions: WORK_ITEM_TRANSITIONS,
        load: () => tx.workItem.findUnique({ where: { id: workItemId }, select: { status: true } }),
        apply: () => {
          const data: Record<string, unknown> = { ...updates, status: to, lastTouchedAt: new Date() }
          return tx.workItem.update({ where: { id: workItemId }, data })
        },
        record: (from) =>
          tx.activityLog.create({
            data: { workItemId, ...statusChangeActivity({ person, from, to, note }) },
          }),
      })
    )
  } catch {
    return { ok: false, code: 'unavailable', error: 'Could not update work item' }
  }
}
