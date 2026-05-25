import { describe, it, expect } from 'vitest';
import { PieOpportunitySchema, buildSourceRef } from './lib/pie-schema';

// These tests require no database — they cover the Zod schema contract
// and the sourceRef construction logic used by POST /api/pie/opportunity.

describe('PIE schema: valid payloads', () => {
  it('accepts minimal required payload', () => {
    const result = PieOpportunitySchema.safeParse({
      externalRef: '24/AP/1234',
      applicantName: 'Bromley Development Ltd',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.urgency).toBe('medium'); // default
    expect(result.data.applicantEmail).toBeUndefined();
  });

  it('accepts full payload', () => {
    const result = PieOpportunitySchema.safeParse({
      externalRef: '24/AP/5678',
      applicantName: 'London Build Co',
      applicantEmail: 'contact@londonbuild.co.uk',
      applicantPhone: '07700900123',
      description: 'Residential development, 4 dwellings',
      siteAddress: '12 High Street, Bromley BR1 1AB',
      district: 'Bromley',
      urgency: 'high',
      estimatedValue: '£2,400,000',
      submittedAt: '2026-05-25T09:00:00+01:00',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.urgency).toBe('high');
    expect(result.data.district).toBe('Bromley');
    expect(result.data.estimatedValue).toBe('£2,400,000');
  });
});

describe('PIE schema: validation failures', () => {
  it('rejects missing externalRef', () => {
    const result = PieOpportunitySchema.safeParse({ applicantName: 'Test' });
    expect(result.success).toBe(false);
    if (result.success) return;
    const fields = result.error.flatten().fieldErrors;
    expect(fields.externalRef).toBeDefined();
  });

  it('rejects missing applicantName', () => {
    const result = PieOpportunitySchema.safeParse({ externalRef: '24/AP/1234' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.applicantName).toBeDefined();
  });

  it('rejects empty externalRef', () => {
    const result = PieOpportunitySchema.safeParse({ externalRef: '', applicantName: 'Test' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid urgency value', () => {
    const result = PieOpportunitySchema.safeParse({
      externalRef: '24/AP/1234',
      applicantName: 'Test',
      urgency: 'extreme',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.urgency).toBeDefined();
  });

  it('rejects malformed email', () => {
    const result = PieOpportunitySchema.safeParse({
      externalRef: '24/AP/1234',
      applicantName: 'Test',
      applicantEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.applicantEmail).toBeDefined();
  });

  it('rejects externalRef exceeding 100 chars', () => {
    const result = PieOpportunitySchema.safeParse({
      externalRef: 'X'.repeat(101),
      applicantName: 'Test',
    });
    expect(result.success).toBe(false);
  });
});

describe('buildSourceRef', () => {
  it('produces PIE:<externalRef> format', () => {
    expect(buildSourceRef('24/AP/1234')).toBe('PIE:24/AP/1234');
  });

  it('preserves slashes and special chars in externalRef', () => {
    expect(buildSourceRef('BRO/2024/0042/FUL')).toBe('PIE:BRO/2024/0042/FUL');
  });
});
