import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SignJWT } from 'jose'

// verifyToken uses process.env.JWT_SECRET via the secret() helper.
// We import after setting the env var.
const TEST_SECRET = 'test-secret-32-chars-minimum-len'

async function makeToken(payload: Record<string, unknown>, secret: string, expiresIn = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret))
}

describe('verifyToken', () => {
  let verifyToken: (token: string) => Promise<{ person: string } | null>

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET
    // Re-import to pick up the env var (vitest caches modules, but secret() reads env at call time)
    const mod = await import('../auth')
    verifyToken = mod.verifyToken
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  it('returns payload for a valid token', async () => {
    const token = await makeToken({ person: 'Dagon' }, TEST_SECRET)
    const result = await verifyToken(token)
    expect(result).toMatchObject({ person: 'Dagon' })
  })

  it('returns null for an expired token', async () => {
    const token = await makeToken({ person: 'Dagon' }, TEST_SECRET, '-1s')
    const result = await verifyToken(token)
    expect(result).toBeNull()
  })

  it('returns null when signed with the wrong secret', async () => {
    const token = await makeToken({ person: 'Dagon' }, 'wrong-secret-value-here-xxxxxxxx')
    const result = await verifyToken(token)
    expect(result).toBeNull()
  })

  it('returns null for a malformed / empty token', async () => {
    expect(await verifyToken('')).toBeNull()
    expect(await verifyToken('not.a.jwt')).toBeNull()
  })

  it('returns null when JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET
    const token = await makeToken({ person: 'Dagon' }, TEST_SECRET)
    // secret() throws inside the try/catch, so verifyToken returns null gracefully
    expect(await verifyToken(token)).toBeNull()
  })
})
