import { describe, it, expect } from 'vitest';
import { generateApiKey, hashKey } from '@/lib/auth';

describe('auth key helpers', () => {
  it('hashes deterministically', () => {
    const a = hashKey('uios_static');
    const b = hashKey('uios_static');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('different inputs produce different hashes', () => {
    expect(hashKey('a')).not.toBe(hashKey('b'));
  });

  it('generated keys are prefixed and unique', () => {
    const one = generateApiKey();
    const two = generateApiKey();
    expect(one.raw).toMatch(/^uios_[0-9a-f]{48}$/);
    expect(one.raw).not.toBe(two.raw);
    expect(one.hash).toBe(hashKey(one.raw));
  });
});
