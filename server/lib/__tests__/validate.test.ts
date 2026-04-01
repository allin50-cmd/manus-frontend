// ============================================================================
// Input Validation Unit Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { validateString, validateEmail, collect } from '../validate.js';

describe('validateString', () => {
  it('returns null for valid optional string', () => {
    expect(validateString('hello', 'name')).toBeNull();
  });

  it('returns null when optional field is undefined', () => {
    expect(validateString(undefined, 'name')).toBeNull();
  });

  it('returns null when optional field is null', () => {
    expect(validateString(null, 'name')).toBeNull();
  });

  it('returns error when required field is missing', () => {
    const err = validateString(undefined, 'name', { required: true });
    expect(err).not.toBeNull();
    expect(err?.field).toBe('name');
  });

  it('returns error when required field is empty string', () => {
    const err = validateString('   ', 'name', { required: true });
    expect(err).not.toBeNull();
  });

  it('returns error when value is not a string', () => {
    const err = validateString(123, 'name');
    expect(err).not.toBeNull();
    expect(err?.message).toContain('string');
  });

  it('returns null when value is within maxLength', () => {
    expect(validateString('hello', 'name', { maxLength: 10 })).toBeNull();
  });

  it('returns error when value exceeds maxLength', () => {
    const err = validateString('a'.repeat(256), 'name', { maxLength: 255 });
    expect(err).not.toBeNull();
    expect(err?.message).toContain('255');
  });

  it('returns null at exactly maxLength', () => {
    expect(validateString('a'.repeat(255), 'name', { maxLength: 255 })).toBeNull();
  });
});

describe('validateEmail', () => {
  it('returns null for valid email', () => {
    expect(validateEmail('user@example.com', 'email')).toBeNull();
  });

  it('returns error for missing email', () => {
    const err = validateEmail(undefined, 'email');
    expect(err).not.toBeNull();
  });

  it('returns error for invalid email format', () => {
    const err = validateEmail('not-an-email', 'email');
    expect(err).not.toBeNull();
    expect(err?.message).toContain('valid email');
  });

  it('returns error for email without domain', () => {
    const err = validateEmail('user@', 'email');
    expect(err).not.toBeNull();
  });

  it('returns error for email exceeding 255 chars', () => {
    const long = 'a'.repeat(250) + '@b.com';
    const err = validateEmail(long, 'email');
    expect(err).not.toBeNull();
  });
});

describe('collect', () => {
  it('returns empty array when all null', () => {
    expect(collect(null, null, null)).toEqual([]);
  });

  it('filters out nulls and returns errors', () => {
    const err = { field: 'name', message: 'required' };
    const result = collect(null, err, null);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(err);
  });

  it('returns all errors when all present', () => {
    const e1 = { field: 'a', message: 'err a' };
    const e2 = { field: 'b', message: 'err b' };
    expect(collect(e1, e2)).toHaveLength(2);
  });
});
