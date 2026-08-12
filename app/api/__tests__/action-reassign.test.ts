import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    action: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    activityLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({ getSession }))
vi.mock('@/lib/db', () => ({ db }))

import { PATCH } from '@/app/api/work-items/[id]/actions/[actionId]/reassign/route'

function jsonReq(body: unknown) {
  return { json: async () => body } as never
}

function badJsonReq() {
  return {
    json: async () => {
      throw new SyntaxError('Unexpected token')
    },
  } as never
}

const params = { params: { id: 'w1', actionId: 'a1' } }

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ person: 'George' })
  db.action.findUnique.mockResolvedValue({
    id: 'a1',
    workItemId: 'w1',
    label: 'Call client',
    status: 'Open',
    assignedTo: 'George',
  })
  db.action.updateMany.mockResolvedValue({ count: 1 })
  db.action.findUniqueOrThrow.mockResolvedValue({
    id: 'a1',
    workItemId: 'w1',
    label: 'Call client',
    status: 'Open',
    assignedTo: 'Dagon',
  })
  db.activityLog.create.mockResolvedValue({})
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
})

describe('PATCH /api/work-items/[id]/actions/[actionId]/reassign', () => {
  it('returns 401 when there is no session', async () => {
    getSession.mockResolvedValue(null)

    const res = await PATCH(jsonReq({ assignedTo: 'Dagon' }), params)

    expect(res.status).toBe(401)
    expect(db.action.findUnique).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON', async () => {
    const res = await PATCH(badJsonReq(), params)

    expect(res.status).toBe(400)
    expect(db.action.findUnique).not.toHaveBeenCalled()
  })

  it('rejects an assignee outside the repository owner list', async () => {
    const res = await PATCH(jsonReq({ assignedTo: 'Mallory' }), params)

    expect(res.status).toBe(400)
    expect(db.action.findUnique).not.toHaveBeenCalled()
  })

  it('rejects an overlong handoff note', async () => {
    const res = await PATCH(
      jsonReq({ assignedTo: 'Dagon', handoffNote: 'x'.repeat(1001) }),
      params,
    )

    expect(res.status).toBe(400)
    expect(db.action.findUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when the action belongs to a different work item', async () => {
    db.action.findUnique.mockResolvedValue({
      id: 'a1',
      workItemId: 'w2',
      label: 'Call client',
      status: 'Open',
      assignedTo: 'George',
    })

    const res = await PATCH(jsonReq({ assignedTo: 'Dagon' }), params)

    expect(res.status).toBe(404)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it.each(['Done', 'Cancelled'])('rejects terminal action status %s', async (status) => {
    db.action.findUnique.mockResolvedValue({
      id: 'a1',
      workItemId: 'w1',
      label: 'Call client',
      status,
      assignedTo: 'George',
    })

    const res = await PATCH(jsonReq({ assignedTo: 'Dagon' }), params)

    expect(res.status).toBe(409)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects reassignment to the existing assignee without writing an audit event', async () => {
    const res = await PATCH(jsonReq({ assignedTo: 'George' }), params)

    expect(res.status).toBe(409)
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(db.activityLog.create).not.toHaveBeenCalled()
  })

  it('reassigns atomically and writes an audit event with the handoff note', async () => {
    const res = await PATCH(
      jsonReq({ assignedTo: 'Dagon', handoffNote: '  Please call before noon.  ' }),
      params,
    )

    expect(res.status).toBe(200)
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.action.updateMany).toHaveBeenCalledTimes(1)

    const update = db.action.updateMany.mock.calls[0][0]
    expect(update.where).toEqual({
      id: 'a1',
      workItemId: 'w1',
      assignedTo: 'George',
      status: { notIn: ['Done', 'Cancelled'] },
    })
    expect(update.data).toMatchObject({
      assignedTo: 'Dagon',
      reassignedFrom: 'George',
      reassignedBy: 'George',
      handoffNote: 'Please call before noon.',
    })
    expect(update.data.reassignedAt).toBeInstanceOf(Date)

    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: {
        workItemId: 'w1',
        actionId: 'a1',
        person: 'George',
        eventType: 'NoteAdded',
        summary: 'Action reassigned from George to Dagon — Please call before noon.',
      },
    })
    expect(db.action.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'a1' } })
  })

  it('returns 409 and does not write an audit event when the row changed concurrently', async () => {
    db.action.updateMany.mockResolvedValue({ count: 0 })

    const res = await PATCH(jsonReq({ assignedTo: 'Dagon' }), params)

    expect(res.status).toBe(409)
    expect(db.activityLog.create).not.toHaveBeenCalled()
    expect(db.action.findUniqueOrThrow).not.toHaveBeenCalled()
  })

  it('returns 503 when the reassignment transaction fails', async () => {
    db.$transaction.mockRejectedValue(new Error('database unavailable'))

    const res = await PATCH(jsonReq({ assignedTo: 'Dagon' }), params)

    expect(res.status).toBe(503)
  })
})
