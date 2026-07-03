import { describe, it, expect, vi, beforeEach } from 'vitest'

const { db, tx } = vi.hoisted(() => {
  const tx = {
    workItem: { findUnique: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
    activityLog: { create: vi.fn() },
  }
  const db = {
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  }
  return { db, tx }
})

vi.mock('@/lib/db', () => ({ db }))

import {
  WORK_ITEM_TRANSITIONS,
  canTransition,
  allowedTransitions,
} from '@/server/workflow/workflowTransitions'
import { statusChangeActivity } from '@/server/workflow/workflowActivity'
import { runTransition, transitionWorkItem } from '@/server/workflow/workflowEngine'
import { WORK_ITEM_STATUSES } from '@/lib/work-item-enums'

beforeEach(() => {
  vi.clearAllMocks()
  db.$transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
  tx.activityLog.create.mockResolvedValue({})
})

describe('WORK_ITEM_TRANSITIONS', () => {
  it('defines an entry for every work item status', () => {
    for (const status of WORK_ITEM_STATUSES) {
      expect(WORK_ITEM_TRANSITIONS[status]).toBeDefined()
    }
  })

  it('never allows a self-transition', () => {
    for (const status of WORK_ITEM_STATUSES) {
      expect(canTransition(WORK_ITEM_TRANSITIONS, status, status)).toBe(false)
    }
  })

  it('lets active items start, complete, and archive', () => {
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'Captured', 'InProgress')).toBe(true)
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'Controlled', 'InProgress')).toBe(true)
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'InProgress', 'Completed')).toBe(true)
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'Waiting', 'Archived')).toBe(true)
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'Escalated', 'InProgress')).toBe(true)
  })

  it('only reopens or archives completed items', () => {
    expect(allowedTransitions(WORK_ITEM_TRANSITIONS, 'Completed')).toEqual(['InProgress', 'Archived'])
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'Completed', 'Waiting')).toBe(false)
  })

  it('only restores archived items to Captured', () => {
    expect(allowedTransitions(WORK_ITEM_TRANSITIONS, 'Archived')).toEqual(['Captured'])
    expect(canTransition(WORK_ITEM_TRANSITIONS, 'Archived', 'Completed')).toBe(false)
  })
})

describe('statusChangeActivity', () => {
  it('matches the historical summary format', () => {
    const entry = statusChangeActivity({ person: 'Dagon', from: 'Captured', to: 'InProgress' })
    expect(entry).toEqual({
      person: 'Dagon',
      eventType: 'StatusChanged',
      summary: 'Status changed to InProgress',
      oldStatus: 'Captured',
      newStatus: 'InProgress',
    })
  })

  it('appends an optional note to the summary', () => {
    const entry = statusChangeActivity({ person: 'Dagon', from: 'Captured', to: 'InProgress', note: 'kick-off call done' })
    expect(entry.summary).toBe('Status changed to InProgress — kick-off call done')
  })
})

describe('runTransition', () => {
  const steps = () => ({
    person: 'Dagon',
    to: 'InProgress' as const,
    transitions: WORK_ITEM_TRANSITIONS,
    load: vi.fn().mockResolvedValue({ status: 'Captured' as const }),
    apply: vi.fn().mockResolvedValue({ id: 'w1' }),
    record: vi.fn().mockResolvedValue({}),
  })

  it('applies and records a valid transition', async () => {
    const s = steps()
    const result = await runTransition(s)
    expect(result).toEqual({ ok: true, entity: { id: 'w1' } })
    expect(s.apply).toHaveBeenCalledTimes(1)
    expect(s.record).toHaveBeenCalledWith('Captured')
  })

  it('rejects a disallowed transition without touching the entity', async () => {
    const s = steps()
    s.load.mockResolvedValue({ status: 'Archived' })
    const result = await runTransition(s)
    expect(result).toMatchObject({ ok: false, code: 'invalid_transition' })
    expect(s.apply).not.toHaveBeenCalled()
    expect(s.record).not.toHaveBeenCalled()
  })

  it('returns not_found when the entity is missing', async () => {
    const s = steps()
    s.load.mockResolvedValue(null)
    const result = await runTransition(s)
    expect(result).toMatchObject({ ok: false, code: 'not_found' })
    expect(s.apply).not.toHaveBeenCalled()
  })

  it('rejects a blank person before loading anything', async () => {
    const s = steps()
    s.person = ''
    const result = await runTransition(s)
    expect(result).toMatchObject({ ok: false, code: 'forbidden' })
    expect(s.load).not.toHaveBeenCalled()
  })
})

describe('transitionWorkItem', () => {
  it('updates status, timestamps, and activity in one transaction', async () => {
    tx.workItem.findUnique.mockResolvedValue({ status: 'Captured' })
    tx.workItem.updateMany.mockResolvedValue({ count: 1 })
    tx.workItem.findUniqueOrThrow.mockResolvedValue({ id: 'w1', status: 'InProgress' })

    const result = await transitionWorkItem({
      workItemId: 'w1',
      to: 'InProgress',
      person: 'Dagon',
    })

    expect(result).toEqual({ ok: true, entity: { id: 'w1', status: 'InProgress' } })
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    const call = tx.workItem.updateMany.mock.calls[0][0]
    expect(call.where).toEqual({ id: 'w1', status: 'Captured' })
    expect(call.data.status).toBe('InProgress')
    expect(call.data.lastTouchedAt).toBeInstanceOf(Date)
    const logData = tx.activityLog.create.mock.calls[0][0].data
    expect(logData).toMatchObject({
      workItemId: 'w1',
      person: 'Dagon',
      eventType: 'StatusChanged',
      oldStatus: 'Captured',
      newStatus: 'InProgress',
    })
  })

  it('merges extra field updates into the same write', async () => {
    tx.workItem.findUnique.mockResolvedValue({ status: 'InProgress' })
    tx.workItem.updateMany.mockResolvedValue({ count: 1 })
    tx.workItem.findUniqueOrThrow.mockResolvedValue({ id: 'w1', status: 'Completed' })

    await transitionWorkItem({
      workItemId: 'w1',
      to: 'Completed',
      person: 'Dagon',
      updates: { nextAction: null },
    })

    const updateData = tx.workItem.updateMany.mock.calls[0][0].data
    expect(updateData.nextAction).toBeNull()
    expect(updateData.status).toBe('Completed')
  })

  it('refuses an invalid transition without writing', async () => {
    tx.workItem.findUnique.mockResolvedValue({ status: 'Completed' })

    const result = await transitionWorkItem({
      workItemId: 'w1',
      to: 'Waiting',
      person: 'Dagon',
    })

    expect(result).toMatchObject({ ok: false, code: 'invalid_transition' })
    expect(tx.workItem.updateMany).not.toHaveBeenCalled()
    expect(tx.activityLog.create).not.toHaveBeenCalled()
  })

  it('reports a conflict when a concurrent transition already moved the row', async () => {
    tx.workItem.findUnique.mockResolvedValue({ status: 'InProgress' })
    tx.workItem.updateMany.mockResolvedValue({ count: 0 })

    const result = await transitionWorkItem({
      workItemId: 'w1',
      to: 'Completed',
      person: 'Dagon',
    })

    expect(result).toMatchObject({ ok: false, code: 'conflict' })
    expect(tx.workItem.findUniqueOrThrow).not.toHaveBeenCalled()
    expect(tx.activityLog.create).not.toHaveBeenCalled()
  })

  it('maps a failed transaction to unavailable', async () => {
    db.$transaction.mockRejectedValue(new Error('connection lost'))

    const result = await transitionWorkItem({
      workItemId: 'w1',
      to: 'InProgress',
      person: 'Dagon',
    })

    expect(result).toMatchObject({ ok: false, code: 'unavailable' })
  })
})
