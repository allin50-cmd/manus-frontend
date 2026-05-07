import { describe, it, expect } from 'vitest';
import { isValidEmail, sanitise } from '../server/utils/validation.js';

describe('isValidEmail', () => {
  it('returns true for a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns false for a bad email', () => {
    expect(isValidEmail('bad-email')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns true for a short valid email', () => {
    expect(isValidEmail('a@b.c')).toBe(true);
  });
});

describe('sanitise', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitise('  hello  ')).toBe('hello');
  });

  it('strips < characters', () => {
    expect(sanitise('<script>')).toBe('script');
  });

  it('strips > characters', () => {
    expect(sanitise('foo>bar')).toBe('foobar');
  });

  it('strips both < and > characters', () => {
    expect(sanitise('<b>bold</b>')).toBe('bbold/b');
  });

  it('trims and strips in combination', () => {
    expect(sanitise('  <hello>  ')).toBe('hello');
  });

  it('returns empty string for non-string input (number)', () => {
    expect(sanitise(42)).toBe('');
  });

  it('returns empty string for non-string input (null)', () => {
    expect(sanitise(null)).toBe('');
  });

  it('returns empty string for non-string input (object)', () => {
    expect(sanitise({})).toBe('');
  });
});
