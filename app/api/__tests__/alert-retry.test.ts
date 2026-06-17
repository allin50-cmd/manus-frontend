import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
const { sendAlertEmail } = vi.hoisted(() => ({ sendAlertEmail: vi.fn() }))
const { db } = vi.hoisted(() => ({
  db: {
    alertDelivery: { findUnique: vi.fn(), create: vi.fn() },
    alertEvent: { create: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}))

vi.mock('../../../lib/auth', () => ({ getSession }))
vi.mock('../../../lib/alert-dispatch', () => ({ sendAlertEmail }))
vi.mock('../../../lib/db', () => ({ db }))

import { POST } from '@/app/api/alert-deliveries/[id]/retry/route'

const params = { params: { id: 'del1' } }
const req = {} as never

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ person: 'George' })
  db.alertEvent.create.mockResolvedValue({})
  db.activityLog.create.mockResolvedValue({})
  sendAlertEmail.mockResolvedValue(undefined)
})

function failedDelivery(overrides = {}) {
  return {
    id: 'del1',
    status: 'Failed',
    escalationLevel: 3,
    channel: 'Dashboard',
    workItemId: 'w1',
    recipientId: 'r1',
    workItem: { id: 'w1', title: 'Accounts overdue' },
    recipient: { id: 'r1', name: 'George', email: 'g@firm.co.uk' },
    ...overrides,
  }
}

describe('POST /api/alert-deliveries/[id]/retry', () => {
  it('rejects a Sent delivery with 409', async () => {
    db.alertDelivery.findUnique.mockResolvedValue(failedDelivery({ status: 'Sent' }))
    const res = await POST(req, params)
    expect(res.status).toBe(409)
    expect(db.alertDelivery.create).not.toHaveBeenCalled()
  })

  it('rejects a Pending delivery with 409', async () => {
    db.alertDelivery.findUnique.mockResolvedValue(failedDelivery({ status: 'Pending' }))
    const res = await POST(req, params)
    expect(res.status).toBe(409)
    expect(db.alertDelivery.create).not.toHaveBeenCalled()
  })

  it('retries a Failed delivery, preserving escalationLevel and writing an AlertEvent', async () => {
    db.alertDelivery.findUnique
      .mockResolvedValueOnce(failedDelivery())
      .mockResolvedValueOnce({ id: 'del2', escalationLevel: 3 })
    db.alertDelivery.create.mockResolvedValue({
      id: 'del2', escalationLevel: 3, ackToken: 'tok', channel: 'Dashboard', workItemId: 'w1', recipientId: 'r1',
    })

    const res = await POST(req, params)
    expect(res.status).toBe(201)
    expect(db.alertDelivery.create.mock.calls[0][0].data.escalationLevel).toBe(3)
    expect(db.alertEvent.create).toHaveBeenCalledTimes(1)
    expect(db.alertEvent.create.mock.calls[0][0].data.deliveryId).toBe('del2')
    // Dashboard channel still writes its activity log.
    expect(db.activityLog.create).toHaveBeenCalledTimes(1)
  })

  it('writes an AlertEvent for an Email retry too', async () => {
    db.alertDelivery.findUnique
      .mockResolvedValueOnce(failedDelivery({ channel: 'Email' }))
      .mockResolvedValueOnce({ id: 'del2', escalationLevel: 3 })
    db.alertDelivery.create.mockResolvedValue({
      id: 'del2', escalationLevel: 3, ackToken: 'tok', channel: 'Email', workItemId: 'w1', recipientId: 'r1',
    })

    const res = await POST(req, params)
    expect(res.status).toBe(201)
    expect(db.alertEvent.create).toHaveBeenCalledTimes(1)
    expect(sendAlertEmail).toHaveBeenCalledTimes(1)
    expect(db.activityLog.create).not.toHaveBeenCalled()
  })
})
