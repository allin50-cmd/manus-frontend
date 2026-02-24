/**
 * CSV Ingestion Service
 * Streaming CSV parser with per-tenant header mapping, validation, and confidence scoring.
 * Uses Node.js streams to handle large files without loading them into memory.
 */
import { Readable } from 'stream';
import { auditWriter } from './auditWriter.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CsvMappingTemplate {
  id: string;
  tenantId: string;
  name: string;
  source: 'csv';
  mappings: Record<string, string>; // csvHeader → canonicalField
}

export interface CanonicalRecord {
  invoiceId: string;
  tenantId: string;
  clientId: string;
  date: string;
  netAmount: number;
  vatAmount: number;
  vatCode: string;
  currency: string;
  source: 'csv';
  confidence: number;
  rawRow?: Record<string, string>;
}

export interface CsvParseResult {
  records: CanonicalRecord[];
  errors: Array<{ row: number; field: string; message: string }>;
  totalRows: number;
  validRows: number;
  confidenceAvg: number;
}

// ─── Required canonical fields ────────────────────────────────────────────────

const REQUIRED_FIELDS = ['date', 'netAmount', 'vatAmount'] as const;

// ─── Streaming CSV Parser ─────────────────────────────────────────────────────

/**
 * Parse a CSV stream using a mapping template, returning canonical records.
 * Streams line by line to handle large files without memory pressure.
 *
 * @param stream          Readable stream of CSV data
 * @param tenantId        FineGuard tenant UUID
 * @param importId        Import record UUID
 * @param template        Column mapping template
 * @param maxRows         Safety limit (default 100,000)
 */
export async function parseCsvStream(
  stream: Readable,
  tenantId: string,
  importId: string,
  template: CsvMappingTemplate,
  maxRows = 100_000
): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const records: CanonicalRecord[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];
    let headers: string[] = [];
    let rowIndex = 0;
    let buffer = '';

    function processLine(line: string): void {
      const trimmed = line.trim();
      if (!trimmed) return;

      const cols = parseCsvLine(trimmed);

      if (rowIndex === 0) {
        headers = cols.map((h) => h.trim());
        rowIndex++;
        return;
      }

      if (rowIndex > maxRows) {
        errors.push({ row: rowIndex, field: '_', message: `Row limit of ${maxRows} exceeded` });
        rowIndex++;
        return;
      }

      const rawRow = buildRowObject(headers, cols);
      const mapped = applyMapping(rawRow, template.mappings);
      const { record, rowErrors } = validateAndBuild(mapped, rowIndex, tenantId, importId);

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      }

      if (record) {
        records.push({ ...record, rawRow });
      }

      rowIndex++;
    }

    stream.on('data', (chunk: Buffer | string) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // Keep incomplete line in buffer
      for (const line of lines) {
        processLine(line);
      }
    });

    stream.on('end', async () => {
      if (buffer.trim()) processLine(buffer);

      const validRows = records.length;
      const totalRows = rowIndex - 1; // exclude header
      const confidenceSum = records.reduce((sum, r) => sum + r.confidence, 0);
      const confidenceAvg = validRows > 0 ? confidenceSum / validRows : 0;

      await auditWriter.write(tenantId, 'import.csv_parsed', 'import', importId, {
        totalRows,
        validRows,
        errorCount: errors.length,
        templateId: template.id,
        confidenceAvg: Math.round(confidenceAvg * 100) / 100,
      });

      resolve({ records, errors, totalRows, validRows, confidenceAvg });
    });

    stream.on('error', (err) => reject(err));
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a single CSV line, respecting quoted fields with commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function buildRowObject(headers: string[], cols: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    obj[headers[i]] = (cols[i] ?? '').trim();
  }
  return obj;
}

function applyMapping(
  rawRow: Record<string, string>,
  mappings: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [csvHeader, canonicalField] of Object.entries(mappings)) {
    if (rawRow[csvHeader] !== undefined) {
      result[canonicalField] = rawRow[csvHeader];
    }
  }
  return result;
}

function validateAndBuild(
  mapped: Record<string, string>,
  rowIndex: number,
  tenantId: string,
  importId: string
): { record: CanonicalRecord | null; rowErrors: Array<{ row: number; field: string; message: string }> } {
  const rowErrors: Array<{ row: number; field: string; message: string }> = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!mapped[field]) {
      rowErrors.push({ row: rowIndex, field, message: `Required field '${field}' is missing` });
    }
  }

  if (rowErrors.length > 0) {
    return { record: null, rowErrors };
  }

  // Parse numeric fields
  const netAmount = parseFloat(mapped['netAmount'] ?? '0');
  const vatAmount = parseFloat(mapped['vatAmount'] ?? '0');

  if (isNaN(netAmount)) {
    rowErrors.push({ row: rowIndex, field: 'netAmount', message: `Invalid number: '${mapped['netAmount']}'` });
  }
  if (isNaN(vatAmount)) {
    rowErrors.push({ row: rowIndex, field: 'vatAmount', message: `Invalid number: '${mapped['vatAmount']}'` });
  }

  if (rowErrors.length > 0) {
    return { record: null, rowErrors };
  }

  // Confidence scoring: deduct for missing optional fields
  let confidence = 1.0;
  if (!mapped['invoiceId']) confidence -= 0.05;
  if (!mapped['clientId']) confidence -= 0.05;
  if (!mapped['vatCode']) confidence -= 0.05;
  if (!mapped['currency']) confidence -= 0.05;

  // Validate date format
  const dateStr = mapped['date'] ?? '';
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
  let normalizedDate = dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = dateStr.split('/');
    normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    confidence -= 0.02; // Minor penalty for non-standard format
  } else if (!dateValid) {
    rowErrors.push({ row: rowIndex, field: 'date', message: `Unrecognised date format: '${dateStr}'` });
    return { record: null, rowErrors };
  }

  const record: CanonicalRecord = {
    invoiceId: mapped['invoiceId'] ?? `CSV-${importId}-${rowIndex}`,
    tenantId,
    clientId: mapped['clientId'] ?? '',
    date: normalizedDate,
    netAmount,
    vatAmount,
    vatCode: mapped['vatCode'] ?? 'OUTPUT',
    currency: mapped['currency'] ?? 'GBP',
    source: 'csv',
    confidence: Math.max(0, confidence),
  };

  return { record, rowErrors: [] };
}

// ─── Default Mapping Templates ────────────────────────────────────────────────

/**
 * Common default mapping templates for popular accounting CSV export formats.
 */
export const DEFAULT_MAPPING_TEMPLATES: Omit<CsvMappingTemplate, 'id' | 'tenantId'>[] = [
  {
    name: 'Xero Invoice Export',
    source: 'csv',
    mappings: {
      'InvoiceNumber': 'invoiceId',
      'ContactName': 'clientId',
      'InvoiceDate': 'date',
      'SubTotal': 'netAmount',
      'TotalTax': 'vatAmount',
      'TaxType': 'vatCode',
      'Currency': 'currency',
    },
  },
  {
    name: 'QuickBooks Invoice Export',
    source: 'csv',
    mappings: {
      'Invoice No': 'invoiceId',
      'Customer': 'clientId',
      'Invoice Date': 'date',
      'Amount': 'netAmount',
      'Tax Amount': 'vatAmount',
      'Tax Code': 'vatCode',
    },
  },
  {
    name: 'Generic UK VAT CSV',
    source: 'csv',
    mappings: {
      'invoice_id': 'invoiceId',
      'client_id': 'clientId',
      'date': 'date',
      'net_amount': 'netAmount',
      'vat_amount': 'vatAmount',
      'vat_code': 'vatCode',
      'currency': 'currency',
    },
  },
];
