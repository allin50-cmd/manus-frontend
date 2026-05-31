import { describe, it, expect } from 'vitest';
import { safeString, isSafeWebhookUrl, safeWebhookUrl } from '@/lib/validators';

describe('safeString', () => {
  it('accepts normal strings', () => {
    const schema = safeString();
    expect(schema.safeParse('hello').success).toBe(true);
    expect(schema.safeParse('Jane Doe').success).toBe(true);
    expect(schema.safeParse('').success).toBe(true);
  });

  it('rejects NULL bytes', () => {
    const schema = safeString();
    expect(schema.safeParse('hello\x00world').success).toBe(false);
    expect(schema.safeParse('has\x00null').success).toBe(false);
    expect(schema.safeParse('\x00').success).toBe(false);
  });

  it('enforces min/max length', () => {
    const schema = safeString({ min: 2, max: 5 });
    expect(schema.safeParse('ab').success).toBe(true);
    expect(schema.safeParse('abc').success).toBe(true);
    expect(schema.safeParse('abcde').success).toBe(true);
    expect(schema.safeParse('a').success).toBe(false);
    expect(schema.safeParse('abcdef').success).toBe(false);
  });

  it('handles unicode', () => {
    const schema = safeString();
    expect(schema.safeParse('日本語').success).toBe(true);
    expect(schema.safeParse('🔥').success).toBe(true);
  });
});

describe('isSafeWebhookUrl', () => {
  it('accepts https URLs with public domains', () => {
    expect(isSafeWebhookUrl('https://example.com/hook')).toBe(true);
    expect(isSafeWebhookUrl('https://tenant.example.com/hooks/ch')).toBe(true);
    expect(isSafeWebhookUrl('https://api.example.com:8443/webhook')).toBe(true);
  });

  it('rejects non-HTTP schemes', () => {
    expect(isSafeWebhookUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeWebhookUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeWebhookUrl('ftp://example.com')).toBe(false);
  });

  it('rejects loopback addresses', () => {
    expect(isSafeWebhookUrl('http://localhost/hook')).toBe(false);
    expect(isSafeWebhookUrl('http://127.0.0.1/hook')).toBe(false);
    expect(isSafeWebhookUrl('http://127.255.255.255/hook')).toBe(false);
  });

  it('rejects link-local addresses', () => {
    expect(isSafeWebhookUrl('http://169.254.169.254/')).toBe(false);
    expect(isSafeWebhookUrl('http://169.254.0.1/')).toBe(false);
  });

  it('rejects private IPv4 ranges', () => {
    expect(isSafeWebhookUrl('http://10.0.0.1/')).toBe(false);
    expect(isSafeWebhookUrl('http://192.168.1.1/')).toBe(false);
    expect(isSafeWebhookUrl('http://172.16.0.1/')).toBe(false);
    expect(isSafeWebhookUrl('http://172.31.255.255/')).toBe(false);
  });

  it('rejects localhost hostname', () => {
    expect(isSafeWebhookUrl('http://localhost:8080/hook')).toBe(false);
    expect(isSafeWebhookUrl('https://localhost/')).toBe(false);
  });

  it('rejects IPv6 loopback and link-local', () => {
    expect(isSafeWebhookUrl('http://[::1]/')).toBe(false);
    expect(isSafeWebhookUrl('http://[fe80::1]/')).toBe(false);
  });

  it('accepts http for public URLs (not just https)', () => {
    expect(isSafeWebhookUrl('http://example.com/hook')).toBe(true);
  });
});

describe('safeWebhookUrl schema', () => {
  it('validates safe URLs', () => {
    expect(safeWebhookUrl.safeParse('https://example.com/hook').success).toBe(true);
  });

  it('rejects unsafe URLs', () => {
    expect(safeWebhookUrl.safeParse('http://localhost/hook').success).toBe(false);
    expect(safeWebhookUrl.safeParse('javascript:alert(1)').success).toBe(false);
    expect(safeWebhookUrl.safeParse('http://169.254.169.254/').success).toBe(false);
  });
});
