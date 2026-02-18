import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  data: any[][];
  sheetName: string;
}

export interface ParsedWorkbook {
  sheetNames: string[];
  sheets: Record<string, ParsedSheet>;
}

export const MAPPABLE_FIELDS = [
  { key: 'companyNumber', label: 'Company Number', required: true },
  { key: 'companyName', label: 'Company Name', required: true },
  { key: 'clientRef', label: 'Client Reference', required: false },
  { key: 'serviceType', label: 'Service Type', required: true },
  { key: 'acspRegNumber', label: 'ACSP Reg Number', required: false },
  { key: 'lastFilingDate', label: 'Last Filing Date', required: false },
  { key: 'nextFilingDue', label: 'Next Filing Due', required: false },
  { key: 'notes', label: 'Notes', required: false },
] as const;

export type FieldKey = typeof MAPPABLE_FIELDS[number]['key'];

export type ColumnMapping = Partial<Record<FieldKey, string>>;

/**
 * Parse an uploaded file (XLSX, XLS, or CSV) into structured data
 */
export function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets: Record<string, ParsedSheet> = {};
        for (const name of workbook.SheetNames) {
          const sheet = workbook.Sheets[name];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          if (jsonData.length > 0) {
            sheets[name] = {
              headers: (jsonData[0] || []).map((h: any) => String(h ?? '').trim()),
              data: jsonData.slice(1).filter((row) => row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')),
              sheetName: name,
            };
          }
        }

        resolve({ sheetNames: workbook.SheetNames, sheets });
      } catch (err) {
        reject(new Error('Failed to parse file. Ensure it is a valid XLSX, XLS, or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-map spreadsheet column headers to ACSP client fields
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const matchers: Record<FieldKey, string[]> = {
    companyNumber: ['companynumber', 'companyno', 'compno', 'companieshousenumber', 'chnumber', 'registrationnumber', 'regnum', 'compnum'],
    companyName: ['companyname', 'company', 'name', 'firmname', 'businessname', 'tradingname'],
    clientRef: ['clientref', 'reference', 'ref', 'clientreference', 'internalref', 'clientid'],
    serviceType: ['servicetype', 'service', 'type', 'servicecategory'],
    acspRegNumber: ['acspreg', 'acspregnumber', 'acspregistration', 'acspno'],
    lastFilingDate: ['lastfiling', 'lastfilingdate', 'fileddate', 'lastfiled'],
    nextFilingDue: ['nextfiling', 'nextfilingdue', 'duedate', 'nextdue', 'filingdue'],
    notes: ['notes', 'comments', 'memo', 'description', 'remarks'],
  };

  for (const [field, keywords] of Object.entries(matchers)) {
    const idx = lowerHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));
    if (idx !== -1) {
      mapping[field as FieldKey] = headers[idx];
    }
  }

  return mapping;
}

/**
 * Normalize a company number: uppercase, strip whitespace, pad to 8 digits if numeric
 */
export function normalizeCompanyNumber(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).toUpperCase().replace(/\s/g, '');
  // If purely numeric, pad to 8 digits
  if (/^\d+$/.test(str) && str.length < 8) {
    return str.padStart(8, '0');
  }
  return str;
}

/**
 * Parse various date formats into YYYY-MM-DD string
 */
export function parseDateValue(value: any): string | null {
  if (!value) return null;

  // If it's a number, treat as Excel serial date
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    return null;
  }

  const str = String(value).trim();
  if (!str) return null;

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  // Try MM/DD/YYYY
  const mdyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdyMatch && parseInt(mdyMatch[1]) > 12) {
    // Day > 12 means DD/MM/YYYY (already handled above)
    return null;
  }

  return null;
}

/**
 * Validate a single row against the mapping
 */
export function validateRow(
  row: any[],
  headers: string[],
  mapping: ColumnMapping,
  defaultServiceType?: string
): { valid: boolean; errors: string[]; mapped: Record<string, any> } {
  const errors: string[] = [];
  const mapped: Record<string, any> = {};

  const getVal = (fieldKey: FieldKey): any => {
    const headerName = mapping[fieldKey];
    if (!headerName) return undefined;
    const idx = headers.indexOf(headerName);
    if (idx === -1 || idx >= row.length) return undefined;
    return row[idx];
  };

  // Company Number
  const rawNumber = getVal('companyNumber');
  const companyNumber = normalizeCompanyNumber(rawNumber);
  if (!companyNumber) {
    errors.push('Missing company number');
  }
  mapped.companyNumber = companyNumber;

  // Company Name
  const companyName = getVal('companyName');
  if (!companyName || !String(companyName).trim()) {
    errors.push('Missing company name');
  }
  mapped.companyName = companyName ? String(companyName).trim() : '';

  // Service Type
  const serviceType = getVal('serviceType') || defaultServiceType;
  if (!serviceType) {
    errors.push('Missing service type');
  }
  mapped.serviceType = serviceType ? String(serviceType).toLowerCase().replace(/\s/g, '_') : '';

  // Optional fields
  mapped.clientRef = getVal('clientRef') ? String(getVal('clientRef')).trim() : null;
  mapped.acspRegNumber = getVal('acspRegNumber') ? String(getVal('acspRegNumber')).trim() : null;
  mapped.lastFilingDate = parseDateValue(getVal('lastFilingDate'));
  mapped.nextFilingDue = parseDateValue(getVal('nextFilingDue'));
  mapped.notes = getVal('notes') ? String(getVal('notes')).trim() : null;

  return { valid: errors.length === 0, errors, mapped };
}
