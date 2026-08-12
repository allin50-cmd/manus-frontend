import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    template: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({ getSession }))
vi.mock('@/lib/db', () => ({ db }))

import { POST as submitTemplate } from '@/app/api/templates/[id]/submit/route'
import { POST as approveTemplate } from '@/app/api/templates/[id]/approve/route'
import { POST as rejectTemplate } from '@/app/api/templates/[id]/reject/route'

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

const params = { params: { id: 't1' } }

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ person: 'George' })
  db.template.updateMany.mockResolvedValue({ count: 1 })
  db.template.findUniqueOrThrow.mockResolvedValue({ id: 't1' })
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
})

describe('POST /api/templates/[id]/submit', () => {
  it('returns 401 when there is no session', async () => {
    getSession.mockResolvedValue(null)

    const res = await submitTemplate(jsonReq({}), params)

    expect(res.status).toBe(401)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when the template does not exist', async () => {
    db.template.findUnique.mockResolvedValue(null)

    const res = await submitTemplate(jsonReq({}), params)

    expect(res.status).toBe(404)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a template already pending review', async () => {
    db.template.findUnique.mockResolvedValue({ approved: false, pendingReview: true })

    const res = await submitTemplate(jsonReq({}), params)

    expect(res.status).toBe(409)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('submits atomically and removes the template from approved use while pending', async () => {
    db.template.findUnique.mockResolvedValue({ approved: true, pendingReview: false })

    const res = await submitTemplate(jsonReq({}), params)

    expect(res.status).toBe(200)
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.template.updateMany).toHaveBeenCalledWith({
      where: { id: 't1', approved: true, pendingReview: false },
      data: {
        approved: false,
        pendingReview: true,
        approvedBy: null,
        approvedAt: null,
        reviewNote: null,
      },
    })
    expect(db.template.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 't1' } })
  })

  it('returns 409 when the template changes concurrently', async () => {
    db.template.findUnique.mockResolvedValue({ approved: true, pendingReview: false })
    db.template.updateMany.mockResolvedValue({ count: 0 })

    const res = await submitTemplate(jsonReq({}), params)

    expect(res.status).toBe(409)
    expect(db.template.findUniqueOrThrow).not.toHaveBeenCalled()
  })

  it('returns 503 when the submit transaction fails', async () => {
    db.template.findUnique.mockResolvedValue({ approved: true, pendingReview: false })
    db.$transaction.mockRejectedValue(new Error('database unavailable'))

    const res = await submitTemplate(jsonReq({}), params)

    expect(res.status).toBe(503)
  })
})

describe('POST /api/templates/[id]/approve', () => {
  it('returns 401 when there is no session', async () => {
    getSession.mockResolvedValue(null)

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(401)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('returns 403 when the authenticated person is not George', async () => {
    getSession.mockResolvedValue({ person: 'Dagon' })

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(403)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when the template does not exist', async () => {
    db.template.findUnique.mockResolvedValue(null)

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(404)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects approval when the template is not pending review', async () => {
    db.template.findUnique.mockResolvedValue({
      body: 'Hello',
      approved: false,
      pendingReview: false,
    })

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(409)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('approves atomically, records George, and refreshes extracted variables', async () => {
    db.template.findUnique.mockResolvedValue({
      body: 'Dear {{company}}, due {{today}}. {{company}}',
      approved: false,
      pendingReview: true,
    })

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(200)
    const update = db.template.updateMany.mock.calls[0][0]
    expect(update.where).toEqual({ id: 't1', approved: false, pendingReview: true })
    expect(update.data).toMatchObject({
      approved: true,
      pendingReview: false,
      approvedBy: 'George',
      reviewNote: null,
      variables: ['company', 'today'],
    })
    expect(update.data.approvedAt).toBeInstanceOf(Date)
    expect(db.template.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 't1' } })
  })

  it('returns 409 when the template changes concurrently', async () => {
    db.template.findUnique.mockResolvedValue({
      body: 'Hello',
      approved: false,
      pendingReview: true,
    })
    db.template.updateMany.mockResolvedValue({ count: 0 })

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(409)
    expect(db.template.findUniqueOrThrow).not.toHaveBeenCalled()
  })

  it('returns 503 when the approval transaction fails', async () => {
    db.template.findUnique.mockResolvedValue({
      body: 'Hello',
      approved: false,
      pendingReview: true,
    })
    db.$transaction.mockRejectedValue(new Error('database unavailable'))

    const res = await approveTemplate(jsonReq({}), params)

    expect(res.status).toBe(503)
  })
})

describe('POST /api/templates/[id]/reject', () => {
  it('returns 401 when there is no session', async () => {
    getSession.mockResolvedValue(null)

    const res = await rejectTemplate(jsonReq({}), params)

    expect(res.status).toBe(401)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('returns 403 when the authenticated person is not George', async () => {
    getSession.mockResolvedValue({ person: 'Dagon' })

    const res = await rejectTemplate(jsonReq({}), params)

    expect(res.status).toBe(403)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON', async () => {
    const res = await rejectTemplate(badJsonReq(), params)

    expect(res.status).toBe(400)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a non-string review note', async () => {
    const res = await rejectTemplate(jsonReq({ note: 123 }), params)

    expect(res.status).toBe(400)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('rejects an overlong review note', async () => {
    const res = await rejectTemplate(jsonReq({ note: 'x'.repeat(1001) }), params)

    expect(res.status).toBe(400)
    expect(db.template.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a template that is not pending review', async () => {
    db.template.findUnique.mockResolvedValue({ approved: false, pendingReview: false })

    const res = await rejectTemplate(jsonReq({ note: 'Needs changes' }), params)

    expect(res.status).toBe(409)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('rejects atomically and stores a trimmed review note', async () => {
    db.template.findUnique.mockResolvedValue({ approved: false, pendingReview: true })

    const res = await rejectTemplate(jsonReq({ note: '  Update the deadline wording.  ' }), params)

    expect(res.status).toBe(200)
    expect(db.template.updateMany).toHaveBeenCalledWith({
      where: { id: 't1', approved: false, pendingReview: true },
      data: {
        approved: false,
        pendingReview: false,
        approvedBy: null,
        approvedAt: null,
        reviewNote: 'Update the deadline wording.',
      },
    })
    expect(db.template.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 't1' } })
  })

  it('returns 409 when the template changes concurrently', async () => {
    db.template.findUnique.mockResolvedValue({ approved: false, pendingReview: true })
    db.template.updateMany.mockResolvedValue({ count: 0 })

    const res = await rejectTemplate(jsonReq({ note: 'Needs changes' }), params)

    expect(res.status).toBe(409)
    expect(db.template.findUniqueOrThrow).not.toHaveBeenCalled()
  })

  it('returns 503 when the rejection transaction fails', async () => {
    db.template.findUnique.mockResolvedValue({ approved: false, pendingReview: true })
    db.$transaction.mockRejectedValue(new Error('database unavailable'))

    const res = await rejectTemplate(jsonReq({ note: 'Needs changes' }), params)

    expect(res.status).toBe(503)
  })
})
