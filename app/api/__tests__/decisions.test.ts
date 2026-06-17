import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    decision: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    workItem: { findUnique: vi.fn(), update: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}))

vi.mock('../../../lib/auth', () => ({ getSession }))
vi.mock('../../../lib/db', () => ({ db }))

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
    db.workItem.update.mockResolvedValue({})

    const res = await PATCH(jsonReq({ status: 'MoreInfoNeeded' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.update).toHaveBeenCalledTimes(1)
    expect(db.workItem.update.mock.calls[0][0].data.decisionNeeded).toBe(false)
  })

  it('does NOT clear decisionNeeded for MoreInfoNeeded while an Open decision remains', async () => {
    db.decision.count.mockResolvedValue(1)

    const res = await PATCH(jsonReq({ status: 'MoreInfoNeeded' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.update).not.toHaveBeenCalled()
  })

  it('does not call workItem.update when the work item is missing', async () => {
    db.decision.count.mockResolvedValue(0)
    db.workItem.findUnique.mockResolvedValue(null)

    const res = await PATCH(jsonReq({ status: 'Approved' }), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.update).not.toHaveBeenCalled()
  })
})
