import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    decision: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    workItem: { findUnique: vi.fn(), updateMany: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({ getSession }))
vi.mock('@/lib/db', () => ({ db }))

import { PATCH } from '@/app/api/decisions/[id]/route'

function jsonReq(body: unknown) {
  return { json: async () => body } as never
}
function badJsonReq() {
  return { json: async () => { throw new SyntaxError('Unexpected token') } } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ person: 'George' })
  db.decision.findUnique.mockResolvedValue({ id: 'd1', workItemId: 'w1' })
  db.decision.update.mockResolvedValue({ id: 'd1', status: 'MoreInfoNeeded' })
  db.activityLog.create.mockResolvedValue({})
})

describe('PATCH /api/decisions/[id]', () => {
  it('returns 400 on malformed JSON', async () => {
    const res = await PATCH(badJsonReq(), { params: { id: 'd1' } })
    expect(res.status).toBe(400)
    expect(db.decision.update).not.toHaveBeenCalled()
  })

  it('clears decisionNeeded for MoreInfoNeeded when no Open decisions remain', async () => {
    db.decision.count.mockResolvedValue(0)
    db.workItem.findUnique.mockResolvedValue({ status: 'DecisionNeeded' })
    db.workItem.updateMany.mockResolvedValue({ count: 1 })

    const res = await PATCH(jsonReq({ status: 'MoreInfoNeeded' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.updateMany).toHaveBeenCalledTimes(1)
    expect(db.workItem.updateMany.mock.calls[0][0].data.decisionNeeded).toBe(false)
    // Conditioned on the status just read, so a concurrent change can't be clobbered.
    expect(db.workItem.updateMany.mock.calls[0][0].where).toEqual({ id: 'w1', status: 'DecisionNeeded' })
  })

  it('does NOT clear decisionNeeded for MoreInfoNeeded while an Open decision remains', async () => {
    db.decision.count.mockResolvedValue(1)

    const res = await PATCH(jsonReq({ status: 'MoreInfoNeeded' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.updateMany).not.toHaveBeenCalled()
  })

  it('does not call workItem.updateMany when the work item is missing', async () => {
    db.decision.count.mockResolvedValue(0)
    db.workItem.findUnique.mockResolvedValue(null)

    const res = await PATCH(jsonReq({ status: 'Approved' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.updateMany).not.toHaveBeenCalled()
  })

  it('skips the activity log when a concurrent change already moved the work item', async () => {
    db.decision.count.mockResolvedValue(0)
    db.workItem.findUnique.mockResolvedValue({ status: 'DecisionNeeded' })
    db.workItem.updateMany.mockResolvedValue({ count: 0 })

    const res = await PATCH(jsonReq({ status: 'MoreInfoNeeded' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.activityLog.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'StatusChanged' }) }),
    )
  })
})
