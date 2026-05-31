import { describe, it, expect } from 'vitest';
import {
  daysUntil,
  isValidCompanyNumber,
  normaliseCompanyNumber,
} from '@/lib/verticals/compliance/companiesHouse';

describe('normaliseCompanyNumber', () => {
  it('pads short numeric IDs to 8 digits', () => {
    expect(normaliseCompanyNumber('12345')).toBe('00012345');
  });

  it('uppercases alphanumeric codes', () => {
    expect(normaliseCompanyNumber('sc123456')).toBe('SC123456');
  });

  it('strips spaces', () => {
    expect(normaliseCompanyNumber(' 12 34 56 78 ')).toBe('12345678');
  });
});

describe('isValidCompanyNumber', () => {
  it('accepts 8-digit numeric', () => {
    expect(isValidCompanyNumber('12345678')).toBe(true);
  });
  it('accepts 2-letter prefix + 6 digits', () => {
    expect(isValidCompanyNumber('SC123456')).toBe(true);
    expect(isValidCompanyNumber('NI123456')).toBe(true);
  });
  it('rejects too-short or malformed values', () => {
    expect(isValidCompanyNumber('1234')).toBe(false);
    expect(isValidCompanyNumber('ABCDEFGH')).toBe(false);
    expect(isValidCompanyNumber('')).toBe(false);
  });
});

describe('daysUntil', () => {
  it('returns 999 for undefined input', () => {
    expect(daysUntil(undefined)).toBe(999);
  });
  it('returns negative for past dates', () => {
    const past = new Date(Date.now() - 5 * 86_400_000).toISOString();
    expect(daysUntil(past)).toBeLessThanOrEqual(-4);
  });
  it('returns positive for future dates', () => {
    const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
    expect(daysUntil(future)).toBeGreaterThanOrEqual(9);
  });
});
