/**
 * Stripe checkout metadata parsing tests.
 *
 * Verifies parseFineGuardMetadata:
 * - Returns null for absent/missing company_number
 * - Returns parsed data for valid metadata
 * - Throws for structurally invalid metadata (present but bad format)
 * - Validates company_number format (alphanumeric, 2-8 chars)
 * - Validates tenant_id as UUID when present
 */
import { describe, it, expect } from 'vitest';
import { parseFineGuardMetadata, isValidFineGuardMetadata } from '../../types/stripe';

describe('parseFineGuardMetadata', () => {
  it('returns null when metadata is null', () => {
    expect(parseFineGuardMetadata(null)).toBeNull();
  });

  it('returns null when metadata is undefined', () => {
    expect(parseFineGuardMetadata(undefined)).toBeNull();
  });

  it('returns null when company_number is absent', () => {
    expect(parseFineGuardMetadata({ source: 'check_page' })).toBeNull();
  });

  it('parses valid minimal metadata', () => {
    const result = parseFineGuardMetadata({ company_number: '12345678' });
    expect(result).not.toBeNull();
    expect(result!.company_number).toBe('12345678');
  });

  it('parses full metadata', () => {
    const result = parseFineGuardMetadata({
      company_number: 'SC123456',
      company_name: 'Acme Ltd',
      alert_types: 'accounts_filing,confirmation_statement',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      fg_ref: 'fg-ref-001',
      source: 'check_page',
    });
    expect(result).not.toBeNull();
    expect(result!.company_number).toBe('SC123456');
    expect(result!.tenant_id).toBe('00000000-0000-0000-0000-000000000001');
    expect(result!.source).toBe('check_page');
  });

  it('throws for company_number that is too short', () => {
    expect(() =>
      parseFineGuardMetadata({ company_number: 'X' }),
    ).toThrow();
  });

  it('throws for company_number that is too long', () => {
    expect(() =>
      parseFineGuardMetadata({ company_number: '123456789' }),
    ).toThrow();
  });

  it('throws for company_number with special characters', () => {
    expect(() =>
      parseFineGuardMetadata({ company_number: '1234-56' }),
    ).toThrow();
  });

  it('throws for invalid tenant_id (not a UUID)', () => {
    expect(() =>
      parseFineGuardMetadata({
        company_number: '12345678',
        tenant_id: 'not-a-uuid',
      }),
    ).toThrow();
  });

  it('accepts lowercase company_number (alphanumeric regex is case-insensitive)', () => {
    const result = parseFineGuardMetadata({ company_number: 'sc123456' });
    expect(result).not.toBeNull();
  });
});

describe('isValidFineGuardMetadata', () => {
  it('returns false for null', () => {
    expect(isValidFineGuardMetadata(null)).toBe(false);
  });

  it('returns true for valid parsed metadata', () => {
    const meta = parseFineGuardMetadata({ company_number: '12345678' });
    expect(isValidFineGuardMetadata(meta)).toBe(true);
  });
});
