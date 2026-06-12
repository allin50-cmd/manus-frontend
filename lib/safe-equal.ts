import { timingSafeEqual } from 'crypto'

// Constant-time string comparison. The dummy run on the mismatch branch uses
// bBuf (the secret) so elapsed time is always proportional to the secret's
// length, not the attacker's input.
export function safeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, 'utf8')
    const bBuf = Buffer.from(b, 'utf8')
    if (aBuf.length !== bBuf.length) {
      timingSafeEqual(bBuf, bBuf)
      return false
    }
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}
