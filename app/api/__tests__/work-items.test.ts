import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { dispatchAlerts } = vi.hoisted(() => ({ dispatchAlerts: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    workItem: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}))

vi.mock('../../../lib/auth', () => ({ getSession }))
vi.mock('../../../lib/alert-dispatch', () => ({ dispatchAlerts }))
vi.mock('../../../lib/db', () => ({ db }))

import { POST } from '@/app/api/work-items/route'
import { PATCH } from '@/app/api/work-items/[id]/route'

function jsonReq(body: unknown) {
  return { json: async () => body } as never
}
function badJsonReq() {
  return { json: async () => { throw new SyntaxError('Unexpected token') } } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ person: 'George' })
  db.activityLog.create.mockResolvedValue({})
})

describe('POST /api/work-items — enum validation', () => {
  it('rejects an invalid type with 400', async () => {
    const res = await POST(jsonReq({ title: 'X', type: 'Bogus', owner: 'George' }))
    expect(res.status).toBe(400)
    expect(db.workItem.create).not.toHaveBeenCalled()
  })

  it('rejects Critical priority with 400', async () => {
    const res = await POST(jsonReq({ title: 'X', type: 'InternalTask', owner: 'George', priority: 'Critical' }))
    expect(res.status).toBe(400)
    expect(db.workItem.create).not.toHaveBeenCalled()
  })

  it('rejects Awaiting status with 400', async () => {
    const res = await POST(jsonReq({ title: 'X', type: 'InternalTask', owner: 'George', status: 'Awaiting' }))
    expect(res.status).toBe(400)
    expect(db.workItem.create).not.toHaveBeenCalled()
  })

  it('accepts Urgent priority and creates the item (201)', async () => {
    db.workItem.create.mockResolvedValue({ id: 'w1', title: 'X', status: 'Captured', type: 'InternalTask' })
    const res = await POST(jsonReq({ title: 'X', type: 'InternalTask', owner: 'George', priority: 'Urgent' }))
    expect(res.status).toBe(201)
    expect(db.workItem.create).toHaveBeenCalledTimes(1)
    expect(db.workItem.create.mock.calls[0][0].data.priority).toBe('Urgent')
  })

  it('returns 400 on malformed JSON', async () => {
    const res = await POST(badJsonReq())
    expect(res.status).toBe(400)
    expect(db.workItem.create).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/work-items/[id]', () => {
  beforeEach(() => {
    db.workItem.findUnique.mockResolvedValue({ id: 'w1', status: 'Captured', title: 'X' })
    db.workItem.update.mockResolvedValue({ id: 'w1' })
  })

  it('returns 400 on malformed JSON', async () => {
    const res = await PATCH(badJsonReq(), { params: { id: 'w1' } })
    expect(res.status).toBe(400)
    expect(db.workItem.update).not.toHaveBeenCalled()
  })

  it('returns 400 for an unparseable dueDate', async () => {
    const res = await PATCH(jsonReq({ dueDate: 'not-a-date' }), { params: { id: 'w1' } })
    expect(res.status).toBe(400)
    expect(db.workItem.update).not.toHaveBeenCalled()
  })

  it('accepts a valid dueDate and updates', async () => {
    const res = await PATCH(jsonReq({ dueDate: '2026-09-01' }), { params: { id: 'w1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.update).toHaveBeenCalledTimes(1)
    expect(db.workItem.update.mock.calls[0][0].data.dueDate).toBeInstanceOf(Date)
  })

  it('accepts a null dueDate (clears it)', async () => {
    const res = await PATCH(jsonReq({ dueDate: null }), { params: { id: 'w1' } })
    expect(res.status).toBe(200)
    expect(db.workItem.update.mock.calls[0][0].data.dueDate).toBeNull()
  })
})
