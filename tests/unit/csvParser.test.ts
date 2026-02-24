/**
 * Unit tests for the CSV Parser Service
 */
import { describe, it, expect } from 'vitest';
import { Readable } from 'stream';
import { parseCsvStream, DEFAULT_MAPPING_TEMPLATES, type CsvMappingTemplate } from '../../server/services/csvParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStream(content: string): Readable {
  return Readable.from([content]);
}

function makeTemplate(mappings: Record<string, string>): CsvMappingTemplate {
  return {
    id: 'test-template',
    tenantId: 'test-tenant',
    name: 'Test',
    source: 'csv',
    mappings,
  };
}

const GENERIC_MAPPING = DEFAULT_MAPPING_TEMPLATES[2].mappings;
const TENANT_ID = 'test-tenant';
const IMPORT_ID = 'test-import';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseCsvStream', () => {
  it('parses a valid CSV with required fields', async () => {
    const csv = `invoice_id,client_id,date,net_amount,vat_amount,vat_code,currency
INV-001,CLIENT-A,2024-01-15,1000.00,200.00,OUTPUT,GBP
INV-002,CLIENT-B,2024-02-20,500.00,100.00,OUTPUT,GBP`;

    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(2);
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.records[0].invoiceId).toBe('INV-001');
    expect(result.records[0].netAmount).toBe(1000);
    expect(result.records[0].vatAmount).toBe(200);
    expect(result.records[0].source).toBe('csv');
  });

  it('converts DD/MM/YYYY dates to YYYY-MM-DD', async () => {
    const csv = `invoice_id,client_id,date,net_amount,vat_amount
INV-001,CLIENT-A,15/01/2024,1000.00,200.00`;

    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.records[0].date).toBe('2024-01-15');
  });

  it('errors on invalid date format', async () => {
    const csv = `invoice_id,client_id,date,net_amount,vat_amount
INV-001,CLIENT-A,not-a-date,1000.00,200.00`;

    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.validRows).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('date');
  });

  it('errors on missing required field (date)', async () => {
    const csv = `invoice_id,net_amount,vat_amount
INV-001,1000.00,200.00`;

    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.validRows).toBe(0);
    expect(result.errors.some((e) => e.field === 'date')).toBe(true);
  });

  it('handles quoted CSV fields with commas', async () => {
    const csv = `invoice_id,client_id,date,net_amount,vat_amount
"INV,001","Client, Ltd",2024-01-15,1000.00,200.00`;

    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.records[0].invoiceId).toBe('INV,001');
    expect(result.records[0].clientId).toBe('Client, Ltd');
  });

  it('calculates confidence correctly', async () => {
    const csv = `invoice_id,client_id,date,net_amount,vat_amount,vat_code,currency
INV-001,CLIENT-A,2024-01-15,1000.00,200.00,OUTPUT,GBP`;

    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    // All optional fields present → confidence should be 1.0
    expect(result.records[0].confidence).toBe(1.0);
  });

  it('reduces confidence when optional fields are missing', async () => {
    // Only required fields — missing invoiceId, clientId, vatCode, currency
    const csv = `date,net_amount,vat_amount
2024-01-15,1000.00,200.00`;

    const template = makeTemplate({ date: 'date', net_amount: 'netAmount', vat_amount: 'vatAmount' });
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.records[0].confidence).toBeLessThan(1.0);
  });

  it('handles empty CSV (header only)', async () => {
    const csv = 'invoice_id,date,net_amount,vat_amount';
    const template = makeTemplate(GENERIC_MAPPING);
    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);

    expect(result.totalRows).toBe(0);
    expect(result.validRows).toBe(0);
    expect(result.records).toHaveLength(0);
  });

  it('applies Xero export mapping template', async () => {
    const csv = `InvoiceNumber,ContactName,InvoiceDate,SubTotal,TotalTax,TaxType,Currency
INV-001,ACME Ltd,2024-01-15,1000.00,200.00,OUTPUT,GBP`;

    const xeroMapping = DEFAULT_MAPPING_TEMPLATES[0];
    const template: CsvMappingTemplate = {
      id: 'xero-template',
      tenantId: TENANT_ID,
      ...xeroMapping,
    };

    const result = await parseCsvStream(makeStream(csv), TENANT_ID, IMPORT_ID, template);
    expect(result.records[0].invoiceId).toBe('INV-001');
    expect(result.records[0].clientId).toBe('ACME Ltd');
    expect(result.records[0].vatCode).toBe('OUTPUT');
  });
});
