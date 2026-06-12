import { describe, it, expect } from 'vitest'
import { safeEqual } from '../safe-equal'

describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('secret', 'secret')).toBe(true)
  })

  it('returns false when strings differ in content', () => {
    expect(safeEqual('secret', 'Secret')).toBe(false)
  })

  it('returns false when strings differ in length', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })

  it('returns false for empty vs non-empty', () => {
    expect(safeEqual('', 'x')).toBe(false)
  })

  it('returns true for two empty strings', () => {
    expect(safeEqual('', '')).toBe(true)
  })

  it('handles multi-byte UTF-8 characters correctly', () => {
    expect(safeEqual('pässwörd', 'pässwörd')).toBe(true)
    expect(safeEqual('pässwörd', 'password')).toBe(false)
  })

  it('returns false when b is longer than a (not just different content)', () => {
    expect(safeEqual('pass', 'password')).toBe(false)
  })
})
