import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    template: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({ getSession }))
vi.mock('@/lib/db', () => ({ db }))

import { GET, POST } from '@/app/api/templates/route'

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

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ person: 'George' })
  db.template.findMany.mockResolvedValue([])
  db.template.findFirst.mockResolvedValue(null)
  db.template.create.mockResolvedValue({ id: 't1' })
  db.template.update.mockResolvedValue({ id: 't1' })
})

describe('GET /api/templates', () => {
  it('returns 401 without a session', async () => {
    getSession.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(db.template.findMany).not.toHaveBeenCalled()
  })

  it('returns all templates for an authenticated user', async () => {
    db.template.findMany.mockResolvedValue([{ id: 't1', approved: false }])

    const res = await GET()

    expect(res.status).toBe(200)
    expect(db.template.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } })
  })
})

describe('POST /api/templates', () => {
  it('returns 401 without a session', async () => {
    getSession.mockResolvedValue(null)

    const res = await POST(jsonReq({ name: 'Draft', body: 'Hello' }))

    expect(res.status).toBe(401)
    expect(db.template.create).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON', async () => {
    const res = await POST(badJsonReq())

    expect(res.status).toBe(400)
    expect(db.template.create).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid category', async () => {
    const res = await POST(jsonReq({ name: 'Draft', body: 'Hello', category: 'Bogus' }))

    expect(res.status).toBe(400)
    expect(db.template.findFirst).not.toHaveBeenCalled()
  })

  it('requires a name and body', async () => {
    const noName = await POST(jsonReq({ body: 'Hello' }))
    const noBody = await POST(jsonReq({ name: 'Draft' }))

    expect(noName.status).toBe(400)
    expect(noBody.status).toBe(400)
    expect(db.template.findFirst).not.toHaveBeenCalled()
  })

  it('creates a categorized draft and ignores an approved=true bypass attempt', async () => {
    const res = await POST(jsonReq({
      name: 'Client reminder',
      useCase: 'Client communication',
      body: 'Hello {{recipientName}}, deadline {{dueDate}}. {{recipientName}}',
      category: 'Compliance',
      approved: true,
    }))

    expect(res.status).toBe(201)
    expect(db.template.create).toHaveBeenCalledWith({
      data: {
        name: 'Client reminder',
        useCase: 'Client communication',
        body: 'Hello {{recipientName}}, deadline {{dueDate}}. {{recipientName}}',
        approved: false,
        pendingReview: false,
        approvedBy: null,
        approvedAt: null,
        reviewNote: null,
        category: 'Compliance',
        variables: ['recipientName', 'dueDate'],
      },
    })
  })

  it('defaults an omitted category to General', async () => {
    const res = await POST(jsonReq({ name: 'General draft', body: 'Hello' }))

    expect(res.status).toBe(201)
    expect(db.template.create.mock.calls[0][0].data.category).toBe('General')
  })

  it('demotes an existing approved template to a fresh draft when its content is updated', async () => {
    db.template.findFirst.mockResolvedValue({ id: 'existing-1' })

    const res = await POST(jsonReq({
      name: 'Existing template',
      useCase: 'Internal process',
      body: 'Updated {{company}} wording',
      category: 'Operations',
    }))

    expect(res.status).toBe(201)
    expect(db.template.update).toHaveBeenCalledWith({
      where: { id: 'existing-1' },
      data: {
        useCase: 'Internal process',
        body: 'Updated {{company}} wording',
        approved: false,
        pendingReview: false,
        approvedBy: null,
        approvedAt: null,
        reviewNote: null,
        category: 'Operations',
        variables: ['company'],
      },
    })
  })

  it('returns 503 when persistence fails', async () => {
    db.template.findFirst.mockRejectedValue(new Error('database unavailable'))

    const res = await POST(jsonReq({ name: 'Draft', body: 'Hello' }))

    expect(res.status).toBe(503)
  })
})
