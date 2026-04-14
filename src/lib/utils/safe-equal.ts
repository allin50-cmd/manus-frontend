/**
 * Constant-time string comparison.
 *
 * Uses HMAC-SHA256 to normalize both inputs to the same fixed length before
 * calling crypto.timingSafeEqual.  This prevents timing attacks on both
 * content AND length — a plain Buffer comparison leaks length information
 * when the two strings differ in size.
 *
 * The per-process random nonce means an attacker cannot pre-compute HMACs
 * to speed up a brute-force across process restarts.
 */
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const _nonce = randomBytes(32);

export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac('sha256', _nonce).update(a).digest();
  const hb = createHmac('sha256', _nonce).update(b).digest();
  return timingSafeEqual(ha, hb);
}
