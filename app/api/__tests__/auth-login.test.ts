import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { db, createSessionToken, verifyPassword, safeEqual } = vi.hoisted(() => ({
  db: {
    userPassword: {
      findUnique: vi.fn(),
    },
  },
  createSessionToken: vi.fn(),
  verifyPassword: vi.fn(),
  safeEqual: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth', () => ({
  COOKIE_NAME: 'session',
  createSessionToken,
  sessionCookieOptions: () => ({ httpOnly: true, sameSite: 'lax', path: '/' }),
}))
vi.mock('@/lib/password', () => ({ verifyPassword }))
vi.mock('@/lib/safe-equal', () => ({ safeEqual }))

import { POST } from '@/app/api/auth/login/route'

function request(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.DEFAULT_PASSCODE = 'configured-passcode'
  db.userPassword.findUnique.mockResolvedValue(null)
  safeEqual.mockReturnValue(true)
  verifyPassword.mockResolvedValue(true)
  createSessionToken.mockResolvedValue('signed-session-token')
})

afterEach(() => {
  delete process.env.DEFAULT_PASSCODE
})

describe('POST /api/auth/login', () => {
  it('fails closed when the password database lookup fails', async () => {
    db.userPassword.findUnique.mockRejectedValue(new Error('database unavailable'))

    const res = await POST(request({ person: 'George', passcode: 'configured-passcode' }))

    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'Authentication unavailable' })
    expect(safeEqual).not.toHaveBeenCalled()
    expect(createSessionToken).not.toHaveBeenCalled()
  })

  it('uses the configured bootstrap passcode when only the UserPassword table is missing', async () => {
    db.userPassword.findUnique.mockRejectedValue({ code: 'P2021' })

    const res = await POST(request({ person: 'George', passcode: 'configured-passcode' }))

    expect(res.status).toBe(200)
    expect(safeEqual).toHaveBeenCalledWith('configured-passcode', 'configured-passcode')
    expect(createSessionToken).toHaveBeenCalledWith('George')
    expect(res.cookies.get('session')?.value).toBe('signed-session-token')
  })

  it('does not fall back to a hard-coded demo passcode when DEFAULT_PASSCODE is missing', async () => {
    delete process.env.DEFAULT_PASSCODE

    const res = await POST(request({ person: 'George', passcode: 'demo1234' }))

    expect(res.status).toBe(503)
    expect(safeEqual).not.toHaveBeenCalled()
    expect(createSessionToken).not.toHaveBeenCalled()
  })

  it('uses the configured shared passcode only when no personal password exists', async () => {
    const res = await POST(request({ person: 'George', passcode: 'configured-passcode' }))

    expect(res.status).toBe(200)
    expect(safeEqual).toHaveBeenCalledWith('configured-passcode', 'configured-passcode')
    expect(createSessionToken).toHaveBeenCalledWith('George')
    expect(res.cookies.get('session')?.value).toBe('signed-session-token')
  })

  it('uses a stored personal password without requiring DEFAULT_PASSCODE', async () => {
    delete process.env.DEFAULT_PASSCODE
    db.userPassword.findUnique.mockResolvedValue({ person: 'George', hash: 'stored-hash' })

    const res = await POST(request({ person: 'George', passcode: 'personal-passcode' }))

    expect(res.status).toBe(200)
    expect(verifyPassword).toHaveBeenCalledWith('personal-passcode', 'stored-hash')
    expect(safeEqual).not.toHaveBeenCalled()
  })

  it('returns 503 instead of a session when JWT signing is unavailable', async () => {
    createSessionToken.mockRejectedValue(new Error('JWT_SECRET is required'))

    const res = await POST(request({ person: 'George', passcode: 'configured-passcode' }))

    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'Authentication unavailable' })
    expect(res.cookies.get('session')).toBeUndefined()
  })
})
