/**
 * Unit tests for the Secrets Manager (token encryption/decryption)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { encryptToken, decryptToken } from '../../server/services/secretsManager';

const TEST_KEY = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20';

beforeEach(() => {
  process.env.LOCAL_ENCRYPTION_KEY = TEST_KEY;
});

describe('encryptToken / decryptToken', () => {
  it('round-trips a plaintext token', async () => {
    const original = 'access-token-abc123xyz';
    const encrypted = await encryptToken(original);
    const decrypted = await decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', async () => {
    const token = 'same-token';
    const enc1 = await encryptToken(token);
    const enc2 = await encryptToken(token);
    expect(enc1).not.toBe(enc2);
  });

  it('encrypted format is iv:authTag:ciphertext', async () => {
    const encrypted = await encryptToken('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(0); // IV
    expect(parts[1].length).toBeGreaterThan(0); // authTag
    expect(parts[2].length).toBeGreaterThan(0); // ciphertext
  });

  it('throws on tampered ciphertext (auth tag mismatch)', async () => {
    const encrypted = await encryptToken('test');
    const parts = encrypted.split(':');
    parts[2] = Buffer.from('tampered').toString('base64');
    const tampered = parts.join(':');
    await expect(decryptToken(tampered)).rejects.toThrow();
  });

  it('throws on malformed format', async () => {
    await expect(decryptToken('not:valid')).rejects.toThrow('Invalid encrypted token format');
  });

  it('handles long token strings (e.g. Xero access tokens)', async () => {
    const longToken = 'a'.repeat(2000);
    const encrypted = await encryptToken(longToken);
    const decrypted = await decryptToken(encrypted);
    expect(decrypted).toBe(longToken);
  });

  it('preserves special characters in tokens', async () => {
    const specialToken = 'token+with/special=chars==';
    const encrypted = await encryptToken(specialToken);
    const decrypted = await decryptToken(encrypted);
    expect(decrypted).toBe(specialToken);
  });

  it('throws if LOCAL_ENCRYPTION_KEY is not set', async () => {
    delete process.env.LOCAL_ENCRYPTION_KEY;
    await expect(encryptToken('test')).rejects.toThrow('LOCAL_ENCRYPTION_KEY not set');
    process.env.LOCAL_ENCRYPTION_KEY = TEST_KEY;
  });
});
