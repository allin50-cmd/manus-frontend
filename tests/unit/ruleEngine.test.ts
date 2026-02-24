/**
 * Unit tests for the FineGuard MTD Rule Engine
 */
import { describe, it, expect } from 'vitest';
import {
  validateVatReturn,
  validateRecords,
  aggregateRecordsToVatReturn,
  type VatReturnPayload,
  type CanonicalRecord,
} from '../../server/services/ruleEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validPayload(overrides: Partial<VatReturnPayload> = {}): VatReturnPayload {
  return {
    vatDueSales: 200.00,
    vatDueAcquisitions: 0.00,
    totalVatDue: 200.00,
    vatReclaimedCurrPeriod: 0.00,
    netVatDue: 200.00,
    totalValueSalesExVAT: 1000,
    totalValuePurchasesExVAT: 0,
    totalValueGoodsSuppliedExVAT: 0,
    totalAcquisitionsExVAT: 0,
    finalised: true,
    ...overrides,
  };
}

function validRecord(overrides: Partial<CanonicalRecord> = {}): CanonicalRecord {
  return {
    invoiceId: 'INV-001',
    date: '2024-01-15',
    netAmount: 1000.00,
    vatAmount: 200.00,
    vatCode: 'OUTPUT',
    currency: 'GBP',
    ...overrides,
  };
}

// ─── validateVatReturn ────────────────────────────────────────────────────────

describe('validateVatReturn', () => {
  it('passes a valid payload', () => {
    const result = validateVatReturn(validPayload());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when totalVatDue does not equal vatDueSales + vatDueAcquisitions', () => {
    const result = validateVatReturn(validPayload({ totalVatDue: 250.00 }));
    expect(result.valid).toBe(false);
    const err = result.errors.find((e) => e.code === 'MTD-001');
    expect(err).toBeDefined();
    expect(err?.field).toBe('totalVatDue');
    expect(err?.kbArticle).toContain('mtd-001');
  });

  it('fails when netVatDue != totalVatDue - vatReclaimedCurrPeriod', () => {
    const result = validateVatReturn(validPayload({ netVatDue: 999.00 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MTD-002')).toBe(true);
  });

  it('fails when finalised is false', () => {
    const result = validateVatReturn(validPayload({ finalised: false }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MTD-004')).toBe(true);
  });

  it('fails when vatDueSales is negative', () => {
    const result = validateVatReturn(validPayload({
      vatDueSales: -10,
      totalVatDue: -10,
      netVatDue: -10,
    }));
    expect(result.errors.some((e) => e.code === 'MTD-006')).toBe(true);
  });

  it('warns when netVatDue is negative (refund)', () => {
    const result = validateVatReturn(validPayload({
      vatReclaimedCurrPeriod: 500,
      netVatDue: -300,
    }));
    expect(result.warnings.some((e) => e.code === 'MTD-005')).toBe(true);
  });

  it('warns on digital link gap', () => {
    const result = validateVatReturn(validPayload({
      totalValueSalesExVAT: 0,
    }));
    expect(result.warnings.some((e) => e.code === 'MTD-007')).toBe(true);
  });

  it('handles floating point rounding correctly', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in JS — rule engine should handle this
    const result = validateVatReturn(validPayload({
      vatDueSales: 0.1,
      vatDueAcquisitions: 0.2,
      totalVatDue: 0.3,
      netVatDue: 0.3,
    }));
    expect(result.errors.filter((e) => e.code === 'MTD-001')).toHaveLength(0);
  });
});

// ─── validateRecords ──────────────────────────────────────────────────────────

describe('validateRecords', () => {
  it('passes valid records', () => {
    const errors = validateRecords([validRecord()]);
    expect(errors).toHaveLength(0);
  });

  it('detects invalid date format', () => {
    const errors = validateRecords([validRecord({ date: '15-01-2024' })]);
    expect(errors.some((e) => e.code === 'REC-001')).toBe(true);
  });

  it('warns on negative net amount', () => {
    const errors = validateRecords([validRecord({ netAmount: -100 })]);
    expect(errors.some((e) => e.code === 'REC-002')).toBe(true);
  });

  it('warns on unrecognised VAT code', () => {
    const errors = validateRecords([validRecord({ vatCode: 'MYSTERY' })]);
    expect(errors.some((e) => e.code === 'REC-003')).toBe(true);
  });

  it('warns on non-GBP currency', () => {
    const errors = validateRecords([validRecord({ currency: 'USD' })]);
    expect(errors.some((e) => e.code === 'REC-004')).toBe(true);
  });

  it('includes field reference with record index', () => {
    const errors = validateRecords([validRecord({ vatCode: 'BAD' })]);
    expect(errors[0].field).toContain('records[0]');
  });
});

// ─── aggregateRecordsToVatReturn ──────────────────────────────────────────────

describe('aggregateRecordsToVatReturn', () => {
  it('correctly aggregates VAT amounts', () => {
    const records: CanonicalRecord[] = [
      validRecord({ netAmount: 1000, vatAmount: 200 }),
      validRecord({ netAmount: 500, vatAmount: 100 }),
    ];

    const result = aggregateRecordsToVatReturn(records, '2024-01-01', '2024-03-31');

    expect(result.vatDueSales).toBe(300.00);
    expect(result.totalVatDue).toBe(300.00);
    expect(result.netVatDue).toBe(300.00);
    expect(result.totalValueSalesExVAT).toBe(1500); // rounded to whole pound
  });

  it('rounds totalValueSalesExVAT to whole pounds', () => {
    const records: CanonicalRecord[] = [
      validRecord({ netAmount: 1000.49, vatAmount: 200 }),
    ];
    const result = aggregateRecordsToVatReturn(records, '2024-01-01', '2024-03-31');
    expect(Number.isInteger(result.totalValueSalesExVAT)).toBe(true);
  });

  it('returns zero-valued fields for empty record set', () => {
    const result = aggregateRecordsToVatReturn([], '2024-01-01', '2024-03-31');
    expect(result.vatDueSales).toBe(0);
    expect(result.netVatDue).toBe(0);
  });
});
