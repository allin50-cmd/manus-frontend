import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifySignature } from '@/lib/verticals/compliance/deliver';

const SECRET = 'test-secret';

let prev: string | undefined;
beforeEach(() => {
  prev = process.env.WEBHOOK_SIGNING_SECRET;
  process.env.WEBHOOK_SIGNING_SECRET = SECRET;
});
afterEach(() => {
  if (prev === undefined) delete process.env.WEBHOOK_SIGNING_SECRET;
  else process.env.WEBHOOK_SIGNING_SECRET = prev;
});

describe('verifySignature', () => {
  it('accepts a correctly signed payload', () => {
    const payload = JSON.stringify({ hello: 'world' });
    const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
    expect(verifySignature(payload, sig)).toBe(true);
  });

  it('rejects an altered payload', () => {
    const payload = JSON.stringify({ hello: 'world' });
    const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
    expect(verifySignature(payload + 'tamper', sig)).toBe(false);
  });

  it('rejects a wrong-length signature without throwing', () => {
    expect(verifySignature('x', 'abcd')).toBe(false);
  });

  it('returns false when no secret configured', () => {
    delete process.env.WEBHOOK_SIGNING_SECRET;
    expect(verifySignature('x', 'x')).toBe(false);
  });
});
