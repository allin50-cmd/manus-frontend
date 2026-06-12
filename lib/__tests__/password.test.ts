import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../password'

describe('hashPassword', () => {
  it('returns a salt:hash string', async () => {
    const h = await hashPassword('testpass')
    expect(h).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/)
  })

  it('produces different hashes for the same password', async () => {
    const h1 = await hashPassword('testpass')
    const h2 = await hashPassword('testpass')
    expect(h1).not.toBe(h2)
  })
})

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hash = await hashPassword('correct-horse')
    expect(await verifyPassword('correct-horse', hash)).toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct-horse')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('returns false for an empty password', async () => {
    const hash = await hashPassword('somepass')
    expect(await verifyPassword('', hash)).toBe(false)
  })

  it('returns false when stored hash has no colon separator', async () => {
    expect(await verifyPassword('pass', 'noseparator')).toBe(false)
  })

  it('returns false when hash segment has wrong byte length (< 64 bytes)', async () => {
    // 32 hex chars = 16 bytes, not 64 — triggers the length guard
    const badHash = 'a'.repeat(32) + ':' + 'b'.repeat(32)
    expect(await verifyPassword('pass', badHash)).toBe(false)
  })

  it('returns false when hash segment has wrong byte length (> 64 bytes)', async () => {
    const badHash = 'a'.repeat(32) + ':' + 'b'.repeat(256)
    expect(await verifyPassword('pass', badHash)).toBe(false)
  })

  it('returns false when salt is empty', async () => {
    const badHash = ':' + 'a'.repeat(128)
    expect(await verifyPassword('pass', badHash)).toBe(false)
  })

  it('round-trips a password with special characters', async () => {
    const pw = 'p@$$w0rd!#%^&*()'
    const hash = await hashPassword(pw)
    expect(await verifyPassword(pw, hash)).toBe(true)
  })

  it('round-trips a very long password', async () => {
    const pw = 'x'.repeat(500)
    const hash = await hashPassword(pw)
    expect(await verifyPassword(pw, hash)).toBe(true)
  })
})
