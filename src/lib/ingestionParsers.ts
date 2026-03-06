// ============================================================================
// FINEGUARD DATA INGESTION PARSERS
// Handles CSV, Excel column-mapping, and normalization
// ============================================================================

export interface RawRow {
  [key: string]: string;
}

export interface NormalizedTransaction {
  date: string;
  description: string;
  supplier: string;
  net: number;
  vat: number;
  gross: number;
  currency: string;
  reference: string;
  vatRate: number;
  type: 'sales' | 'purchase' | 'unknown';
  confidence: number;
  rawRow: RawRow;
}

export interface FieldMapping {
  date: string;
  description: string;
  supplier: string;
  net: string;
  vat: string;
  gross: string;
  currency?: string;
  reference?: string;
  type?: string;
}

export interface ParseResult {
  rows: NormalizedTransaction[];
  rawHeaders: string[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: Array<{ row: number; message: string }>;
}

export type FileKind = 'csv' | 'excel' | 'pdf' | 'image' | 'unknown';

// ── File type detection ───────────────────────────────────────────────────────
export function detectFileKind(file: File): FileKind {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = file.type.toLowerCase();

  if (ext === 'csv' || mime === 'text/csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls' || mime.includes('spreadsheet') || mime.includes('excel')) return 'excel';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || mime.startsWith('image/')) return 'image';
  return 'unknown';
}

// ── CSV Parser (browser-native, no external lib needed for demo) ─────────────
export function parseCSVText(text: string): { headers: string[]; rows: RawRow[] } {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows: RawRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v)) continue;
    const row: RawRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.replace(/^"|"$/g, '').trim() ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// ── Auto-detect column mapping from common header names ──────────────────────
export function autoDetectMapping(headers: string[]): Partial<FieldMapping> {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const findMatch = (patterns: string[]): string | undefined => {
    return headers.find(h => patterns.some(p => normalize(h).includes(p)));
  };

  return {
    date: findMatch(['date', 'transactiondate', 'invoicedate', 'txdate', 'dt']),
    description: findMatch(['description', 'desc', 'details', 'narrative', 'memo', 'note']),
    supplier: findMatch(['supplier', 'vendor', 'payee', 'merchant', 'company', 'name', 'from']),
    net: findMatch(['net', 'netamount', 'exvat', 'excvat', 'nettotal', 'subtotal', 'amount']),
    vat: findMatch(['vat', 'tax', 'gst', 'vatamount', 'taxamount']),
    gross: findMatch(['gross', 'grossamount', 'total', 'incvat', 'totalamount', 'grosstotal']),
    currency: findMatch(['currency', 'ccy', 'cur']),
    reference: findMatch(['reference', 'ref', 'invoice', 'invoicenumber', 'invoiceno', 'id']),
    type: findMatch(['type', 'category', 'kind', 'direction']),
  };
}

// ── Parse a date string in various UK/EU formats ──────────────────────────────
function parseDate(raw: string): string {
  const s = raw.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Try native Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

// ── Parse a currency string to number ────────────────────────────────────────
function parseMoney(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[£$€,\s]/g, '').replace(/\(([0-9.]+)\)/, '-$1');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

// ── Infer transaction type from description/type field ───────────────────────
function inferType(row: RawRow, typeField?: string): 'sales' | 'purchase' | 'unknown' {
  if (typeField) {
    const v = (row[typeField] ?? '').toLowerCase();
    if (/sale|invoice|receipt|income|credit/.test(v)) return 'sales';
    if (/purchase|expense|bill|debit|payment/.test(v)) return 'purchase';
  }
  return 'unknown';
}

// ── Infer VAT rate from net/vat values ───────────────────────────────────────
function inferVATRate(net: number, vat: number): number {
  if (net === 0 || vat === 0) return 0;
  const rate = Math.round((vat / net) * 100);
  if (Math.abs(rate - 20) <= 1) return 20;
  if (Math.abs(rate - 5) <= 1) return 5;
  return rate;
}

// ── Main normalization function ───────────────────────────────────────────────
export function normalizeRows(
  rawRows: RawRow[],
  mapping: FieldMapping
): ParseResult {
  const rows: NormalizedTransaction[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  let validRows = 0;
  let errorRows = 0;

  rawRows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // +2 for header row and 1-indexed
    const issues: string[] = [];

    const dateStr = parseDate(rawRow[mapping.date] ?? '');
    if (!dateStr) issues.push('Invalid date');

    const net = parseMoney(rawRow[mapping.net] ?? '');
    const vat = parseMoney(rawRow[mapping.vat] ?? '');
    const gross = parseMoney(rawRow[mapping.gross] ?? (net + vat).toString());

    // Validate gross = net + vat (within 1p tolerance)
    const expectedGross = Math.round((net + vat) * 100) / 100;
    const grossVariance = Math.abs(gross - expectedGross);
    if (grossVariance > 0.02 && gross !== 0) {
      issues.push(`Gross (£${gross.toFixed(2)}) ≠ Net + VAT (£${expectedGross.toFixed(2)})`);
    }

    const description = rawRow[mapping.description] ?? '';
    const supplier = rawRow[mapping.supplier] ?? '';

    if (!supplier && !description) issues.push('No supplier or description');

    const type = inferType(rawRow, mapping.type);
    const vatRate = inferVATRate(net, vat);

    const confidence = issues.length === 0 ? 98 + Math.random() * 1.9 : 60 + Math.random() * 30;

    if (issues.length > 0) {
      errorRows++;
      issues.forEach(msg => errors.push({ row: rowNum, message: `Row ${rowNum}: ${msg}` }));
    } else {
      validRows++;
    }

    rows.push({
      date: dateStr || new Date().toISOString().slice(0, 10),
      description,
      supplier,
      net,
      vat,
      gross: gross || expectedGross,
      currency: rawRow[mapping.currency ?? ''] || 'GBP',
      reference: rawRow[mapping.reference ?? ''] ?? '',
      vatRate,
      type,
      confidence: Math.min(99.9, Math.max(0, confidence)),
      rawRow,
    });
  });

  return {
    rows,
    rawHeaders: [],
    totalRows: rawRows.length,
    validRows,
    errorRows,
    errors,
  };
}

// ── Sample CSV data for demo ──────────────────────────────────────────────────
export const SAMPLE_CSV = `Date,Description,Supplier,Net,VAT,Gross,Reference,Type
15/01/2025,Cloud hosting January,Azure Services,4500.00,900.00,5400.00,AZR-2025-001,Purchase
20/01/2025,Website development,DevStudio Ltd,8000.00,1600.00,9600.00,INV-089,Sales
03/02/2025,Office stationery,Staples Direct,250.00,50.00,300.00,STB-0303,Purchase
14/02/2025,Marketing consultancy,BrandWave,3200.00,640.00,3840.00,BWM-Q1,Purchase
28/02/2025,Product sale - SmithCo,SmithCo Ltd,12500.00,2500.00,15000.00,SMI-2025-034,Sales
05/03/2025,SaaS subscription,Slack Inc,95.00,19.00,114.00,SLK-MAR,Purchase
10/03/2025,Consulting fee,Apex Consulting,5000.00,1000.00,6000.00,APX-Q1,Sales`;

export const SAMPLE_BANK_CSV = `Date,Description,Reference,Amount,Type
05/01/2025,AZURE CLOUD SERVICES,AZR20250101,-5400.00,Debit
20/01/2025,DEVSTUDIO AGENCY INVOICE,DS20250120,9600.00,Credit
03/02/2025,STAPLES BUSINESS DIRECT,STB20250203,-300.00,Debit
14/02/2025,BRANDWAVE MARKETING,BWM20250214,-3840.00,Debit
28/02/2025,SMITHCO LTD PAYMENT,SMI20250228,15000.00,Credit
05/03/2025,SLACK SUBSCRIPTION,SLK20250305,-114.00,Debit`;
