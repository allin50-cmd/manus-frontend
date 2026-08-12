import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SignJWT } from 'jose'

const TEST_SECRET = 'test-secret-32-chars-minimum-len'

async function makeToken(payload: Record<string, unknown>, secret: string, expiresIn = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret))
}

describe('session tokens', () => {
  let verifyToken: (token: string) => Promise<{ person: string } | null>
  let createSessionToken: (person: string) => Promise<string>

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET
    const mod = await import('../auth')
    verifyToken = mod.verifyToken
    createSessionToken = mod.createSessionToken
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.DEFAULT_PASSCODE
  })

  it('creates and verifies a token with JWT_SECRET', async () => {
    const token = await createSessionToken('Dagon')
    await expect(verifyToken(token)).resolves.toEqual({ person: 'Dagon' })
  })

  it('returns payload for a valid token', async () => {
    const token = await makeToken({ person: 'Dagon' }, TEST_SECRET)
    const result = await verifyToken(token)
    expect(result).toEqual({ person: 'Dagon' })
  })

  it('returns null for an expired token', async () => {
    const token = await makeToken({ person: 'Dagon' }, TEST_SECRET, '-1s')
    expect(await verifyToken(token)).toBeNull()
  })

  it('returns null when signed with the wrong secret', async () => {
    const token = await makeToken({ person: 'Dagon' }, 'wrong-secret-value-here-xxxxxxxx')
    expect(await verifyToken(token)).toBeNull()
  })

  it('returns null for a token without a person', async () => {
    const token = await makeToken({ scope: 'other' }, TEST_SECRET)
    expect(await verifyToken(token)).toBeNull()
  })

  it('returns null for a malformed or empty token', async () => {
    expect(await verifyToken('')).toBeNull()
    expect(await verifyToken('not.a.jwt')).toBeNull()
  })

  it('returns null when JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET
    process.env.DEFAULT_PASSCODE = 'must-not-be-used-for-jwt'
    const token = await makeToken({ person: 'Dagon' }, TEST_SECRET)
    expect(await verifyToken(token)).toBeNull()
  })

  it('refuses to create a token without JWT_SECRET even when DEFAULT_PASSCODE exists', async () => {
    delete process.env.JWT_SECRET
    process.env.DEFAULT_PASSCODE = 'must-not-be-used-for-jwt'
    await expect(createSessionToken('Dagon')).rejects.toThrow('JWT_SECRET is required')
  })
})
