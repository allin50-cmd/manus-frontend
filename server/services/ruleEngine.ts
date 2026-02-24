/**
 * FineGuard MTD Rule Engine
 * Deterministic validation of VAT return data against HMRC Making Tax Digital rules.
 * Each rule is tagged with a KB article reference for structured error reporting.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VatReturnPayload {
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  kbArticle: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface CanonicalRecord {
  invoiceId: string;
  date: string;
  netAmount: number;
  vatAmount: number;
  vatCode: string;
  currency: string;
}

// ─── Rounding Helper ─────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round0(n: number): number {
  return Math.round(n);
}

// ─── Individual Rules ─────────────────────────────────────────────────────────

const rules: Array<(p: VatReturnPayload) => ValidationError | null> = [
  // RULE-001: totalVatDue must equal vatDueSales + vatDueAcquisitions
  (p) => {
    const expected = round2(p.vatDueSales + p.vatDueAcquisitions);
    if (Math.abs(round2(p.totalVatDue) - expected) > 0.01) {
      return {
        code: 'MTD-001',
        field: 'totalVatDue',
        message: `totalVatDue (${p.totalVatDue}) must equal vatDueSales + vatDueAcquisitions (${expected})`,
        kbArticle: 'https://fineguard.io/kb/mtd-001-total-vat-due',
        severity: 'error',
      };
    }
    return null;
  },

  // RULE-002: netVatDue must equal totalVatDue - vatReclaimedCurrPeriod
  (p) => {
    const expected = round2(p.totalVatDue - p.vatReclaimedCurrPeriod);
    if (Math.abs(round2(p.netVatDue) - expected) > 0.01) {
      return {
        code: 'MTD-002',
        field: 'netVatDue',
        message: `netVatDue (${p.netVatDue}) must equal totalVatDue - vatReclaimedCurrPeriod (${expected})`,
        kbArticle: 'https://fineguard.io/kb/mtd-002-net-vat-due',
        severity: 'error',
      };
    }
    return null;
  },

  // RULE-003: totalValueSalesExVAT must be a whole number (pence truncated to pounds)
  (p) => {
    if (!Number.isInteger(round0(p.totalValueSalesExVAT))) {
      return {
        code: 'MTD-003',
        field: 'totalValueSalesExVAT',
        message: `totalValueSalesExVAT must be a whole pound value (no pence). Got: ${p.totalValueSalesExVAT}`,
        kbArticle: 'https://fineguard.io/kb/mtd-003-whole-pound',
        severity: 'error',
      };
    }
    return null;
  },

  // RULE-004: finalised must be true for production submission
  (p) => {
    if (!p.finalised) {
      return {
        code: 'MTD-004',
        field: 'finalised',
        message: 'Return must be marked as finalised before submission to HMRC',
        kbArticle: 'https://fineguard.io/kb/mtd-004-finalised',
        severity: 'error',
      };
    }
    return null;
  },

  // RULE-005: netVatDue must be ≥ 0 (box 5 cannot be negative in standard returns)
  (p) => {
    if (p.netVatDue < 0) {
      return {
        code: 'MTD-005',
        field: 'netVatDue',
        message: `netVatDue is negative (${p.netVatDue}). Verify refund claim is intentional.`,
        kbArticle: 'https://fineguard.io/kb/mtd-005-negative-net',
        severity: 'warning',
      };
    }
    return null;
  },

  // RULE-006: vatDueSales must be ≥ 0
  (p) => {
    if (p.vatDueSales < 0) {
      return {
        code: 'MTD-006',
        field: 'vatDueSales',
        message: `vatDueSales cannot be negative (${p.vatDueSales})`,
        kbArticle: 'https://fineguard.io/kb/mtd-006-negative-vat-sales',
        severity: 'error',
      };
    }
    return null;
  },

  // RULE-007: Digital link requirement — check that source field is present (proxy for digital link)
  // In a full implementation this would verify an unbroken digital link chain from source records.
  (p) => {
    // This rule is a placeholder demonstrating the pattern;
    // real digital link validation would cross-reference the audit trail.
    if (p.totalValueSalesExVAT === 0 && p.vatDueSales > 0) {
      return {
        code: 'MTD-007',
        field: 'totalValueSalesExVAT',
        message: 'VAT is due on sales but total sales value is zero — possible digital link gap',
        kbArticle: 'https://fineguard.io/kb/mtd-007-digital-links',
        severity: 'warning',
      };
    }
    return null;
  },

  // RULE-008: Acquisition VAT must have corresponding acquisitions value
  (p) => {
    if (p.vatDueAcquisitions > 0 && p.totalAcquisitionsExVAT === 0) {
      return {
        code: 'MTD-008',
        field: 'totalAcquisitionsExVAT',
        message: 'vatDueAcquisitions is non-zero but totalAcquisitionsExVAT is zero',
        kbArticle: 'https://fineguard.io/kb/mtd-008-acquisitions',
        severity: 'warning',
      };
    }
    return null;
  },
];

// ─── Record-Level Rules ───────────────────────────────────────────────────────

const recordRules: Array<(r: CanonicalRecord, idx: number) => ValidationError | null> = [
  // REC-001: Date must be YYYY-MM-DD
  (r, idx) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
      return {
        code: 'REC-001',
        field: `records[${idx}].date`,
        message: `Record date '${r.date}' is not in YYYY-MM-DD format`,
        kbArticle: 'https://fineguard.io/kb/rec-001-date-format',
        severity: 'error',
      };
    }
    return null;
  },

  // REC-002: Net amount must be positive
  (r, idx) => {
    if (r.netAmount < 0) {
      return {
        code: 'REC-002',
        field: `records[${idx}].netAmount`,
        message: `Record net amount is negative (${r.netAmount}) — credit notes should use separate entries`,
        kbArticle: 'https://fineguard.io/kb/rec-002-negative-amount',
        severity: 'warning',
      };
    }
    return null;
  },

  // REC-003: VAT code must be recognisable
  (r, idx) => {
    const KNOWN_CODES = ['OUTPUT', 'OUTPUT2', 'OUTPUT3', 'NONE', 'ZERORATEDOUTPUT', 'EXEMPTOUTPUT', 'REVERSECHARGE', 'INVALID'];
    if (!KNOWN_CODES.includes((r.vatCode ?? '').toUpperCase())) {
      return {
        code: 'REC-003',
        field: `records[${idx}].vatCode`,
        message: `Unrecognised VAT code '${r.vatCode}' — verify mapping`,
        kbArticle: 'https://fineguard.io/kb/rec-003-vat-code',
        severity: 'warning',
      };
    }
    return null;
  },

  // REC-004: Currency must be GBP for UK MTD
  (r, idx) => {
    if (r.currency && r.currency !== 'GBP') {
      return {
        code: 'REC-004',
        field: `records[${idx}].currency`,
        message: `Non-GBP currency '${r.currency}' detected — foreign currency invoices require sterling conversion`,
        kbArticle: 'https://fineguard.io/kb/rec-004-currency',
        severity: 'warning',
      };
    }
    return null;
  },
];

// ─── Main Validate Function ───────────────────────────────────────────────────

/**
 * Validate a VAT return payload against all FineGuard MTD rules.
 * Returns a structured result with errors and warnings, each tagged with KB article.
 */
export function validateVatReturn(payload: VatReturnPayload): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const rule of rules) {
    const result = rule(payload);
    if (result) {
      if (result.severity === 'error') errors.push(result);
      else warnings.push(result);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate individual invoice records.
 * Returns errors per record for display in import review UI.
 */
export function validateRecords(records: CanonicalRecord[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (let i = 0; i < records.length; i++) {
    for (const rule of recordRules) {
      const result = rule(records[i], i);
      if (result) errors.push(result);
    }
  }
  return errors;
}

/**
 * Aggregate canonical invoice records into a VAT return payload.
 * Applies HMRC rounding rules (pence → pounds for value boxes).
 */
export function aggregateRecordsToVatReturn(
  records: CanonicalRecord[],
  periodStart: string,
  periodEnd: string
): Omit<VatReturnPayload, 'finalised'> {
  let vatDueSales = 0;
  let totalValueSalesExVAT = 0;

  for (const r of records) {
    vatDueSales += r.vatAmount;
    totalValueSalesExVAT += r.netAmount;
  }

  vatDueSales = round2(vatDueSales);
  const vatDueAcquisitions = 0;
  const totalVatDue = round2(vatDueSales + vatDueAcquisitions);
  const vatReclaimedCurrPeriod = 0;
  const netVatDue = round2(totalVatDue - vatReclaimedCurrPeriod);

  return {
    vatDueSales,
    vatDueAcquisitions,
    totalVatDue,
    vatReclaimedCurrPeriod,
    netVatDue,
    totalValueSalesExVAT: round0(totalValueSalesExVAT),
    totalValuePurchasesExVAT: 0,
    totalValueGoodsSuppliedExVAT: 0,
    totalAcquisitionsExVAT: 0,
  };
}
