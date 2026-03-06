// ============================================================================
// FINEGUARD VAT VALIDATION ENGINE
// Zero-tolerance arithmetic validator for HMRC MTD submissions
// Every pence matters — 1p difference can trigger HMRC audit
// ============================================================================

export interface VATBoxValues {
  box1: number; // VAT due on sales (and other outputs)
  box2: number; // VAT due on acquisitions from EU countries
  box3: number; // Total VAT due (calculated: box1 + box2)
  box4: number; // VAT reclaimed on purchases
  box5: number; // Net VAT to pay/reclaim (calculated: box3 - box4)
  box6: number; // Total value of sales and other outputs (ex VAT)
  box7: number; // Total value of purchases and other inputs (ex VAT)
  box8: number; // Total value of goods supplied to EU countries (ex VAT)
  box9: number; // Total value of goods acquired from EU countries (ex VAT)
}

export interface TransactionVATSummary {
  salesVAT: number;     // Sum of VAT on all sales invoices
  purchaseVAT: number;  // Sum of VAT on all purchase invoices
  netSales: number;     // Sum of net on all sales
  netPurchases: number; // Sum of net on all purchases
  euSales: number;
  euPurchases: number;
}

export interface VATValidationResult {
  isValid: boolean;
  errors: VATValidationError[];
  warnings: VATValidationWarning[];
  auditRisk: AuditRiskLevel;
  hmrcPayload: HMRCVATPayload | null;
}

export interface VATValidationError {
  code: string;
  field: string;
  message: string;
  expected: number;
  actual: number;
  variance: number;
  isBlocking: boolean;
}

export interface VATValidationWarning {
  code: string;
  message: string;
  details: string;
}

export type AuditRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface HMRCVATPayload {
  periodKey: string;
  vatDueSales: number;           // Box 1
  vatDueAcquisitions: number;    // Box 2
  totalVatDue: number;           // Box 3
  vatReclaimedCurrPeriod: number;// Box 4
  netVatDue: number;             // Box 5
  totalValueSalesExVAT: number;  // Box 6
  totalValuePurchasesExVAT: number; // Box 7
  totalValueGoodsSuppliedExVAT: number; // Box 8
  totalAcquisitionsExVAT: number;       // Box 9
  finalised: boolean;
}

// Round to nearest penny — prevents floating point drift
function pence(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// CORE VALIDATION
// ============================================================================

export function validateVATBoxes(
  boxes: VATBoxValues,
  transactions: TransactionVATSummary,
  periodKey: string
): VATValidationResult {
  const errors: VATValidationError[] = [];
  const warnings: VATValidationWarning[] = [];

  // ── Rule 1: Box 3 = Box 1 + Box 2 (arithmetic integrity) ──────────────────
  const expectedBox3 = pence(boxes.box1 + boxes.box2);
  const actualBox3 = pence(boxes.box3);
  if (actualBox3 !== expectedBox3) {
    errors.push({
      code: 'BOX3_ARITHMETIC',
      field: 'box3',
      message: 'Box 3 must equal Box 1 + Box 2',
      expected: expectedBox3,
      actual: actualBox3,
      variance: pence(actualBox3 - expectedBox3),
      isBlocking: true,
    });
  }

  // ── Rule 2: Box 5 = Box 3 − Box 4 (net VAT) ───────────────────────────────
  const expectedBox5 = pence(boxes.box3 - boxes.box4);
  const actualBox5 = pence(boxes.box5);
  if (actualBox5 !== expectedBox5) {
    errors.push({
      code: 'BOX5_ARITHMETIC',
      field: 'box5',
      message: 'Box 5 must equal Box 3 − Box 4',
      expected: expectedBox5,
      actual: actualBox5,
      variance: pence(actualBox5 - expectedBox5),
      isBlocking: true,
    });
  }

  // ── Rule 3: 1p Audit Trigger — Box 1 vs transaction-level sales VAT ───────
  const transactionBox1 = pence(transactions.salesVAT);
  const variance1 = pence(Math.abs(boxes.box1 - transactionBox1));
  if (variance1 > 0) {
    const isBlocking = variance1 >= 0.01;
    errors.push({
      code: 'BOX1_LEDGER_MISMATCH',
      field: 'box1',
      message: `Box 1 (VAT on Sales) differs from ledger total by ${formatVariance(variance1)}`,
      expected: transactionBox1,
      actual: pence(boxes.box1),
      variance: variance1,
      isBlocking,
    });
  }

  // ── Rule 4: Box 4 vs transaction-level purchase VAT ───────────────────────
  const transactionBox4 = pence(transactions.purchaseVAT);
  const variance4 = pence(Math.abs(boxes.box4 - transactionBox4));
  if (variance4 > 0) {
    const isBlocking = variance4 >= 0.01;
    errors.push({
      code: 'BOX4_LEDGER_MISMATCH',
      field: 'box4',
      message: `Box 4 (VAT Reclaimable) differs from ledger total by ${formatVariance(variance4)}`,
      expected: transactionBox4,
      actual: pence(boxes.box4),
      variance: variance4,
      isBlocking,
    });
  }

  // ── Rule 5: Box 6 vs transaction-level net sales ──────────────────────────
  const varianceBox6 = pence(Math.abs(boxes.box6 - transactions.netSales));
  if (varianceBox6 > 1.00) {
    warnings.push({
      code: 'BOX6_SALES_VARIANCE',
      message: `Box 6 (Total Sales) differs from ledger net sales by £${varianceBox6.toFixed(2)}`,
      details: `Ledger: £${transactions.netSales.toFixed(2)} | Declared: £${boxes.box6.toFixed(2)}`,
    });
  }

  // ── Rule 6: Box 7 vs transaction-level net purchases ─────────────────────
  const varianceBox7 = pence(Math.abs(boxes.box7 - transactions.netPurchases));
  if (varianceBox7 > 1.00) {
    warnings.push({
      code: 'BOX7_PURCHASES_VARIANCE',
      message: `Box 7 (Total Purchases) differs from ledger net purchases by £${varianceBox7.toFixed(2)}`,
      details: `Ledger: £${transactions.netPurchases.toFixed(2)} | Declared: £${boxes.box7.toFixed(2)}`,
    });
  }

  // ── Rule 7: Negative box checks ───────────────────────────────────────────
  if (boxes.box1 < 0) {
    errors.push({
      code: 'BOX1_NEGATIVE',
      field: 'box1',
      message: 'Box 1 cannot be negative',
      expected: 0,
      actual: boxes.box1,
      variance: boxes.box1,
      isBlocking: true,
    });
  }

  // ── Rule 8: Unusually large net VAT (>£1M) ────────────────────────────────
  if (Math.abs(boxes.box5) > 1_000_000) {
    warnings.push({
      code: 'BOX5_LARGE_VALUE',
      message: 'Net VAT exceeds £1,000,000 — manual partner review required',
      details: `Net VAT: £${boxes.box5.toFixed(2)}`,
    });
  }

  // ── Determine audit risk level ────────────────────────────────────────────
  const blockingErrors = errors.filter(e => e.isBlocking);
  const totalVariance = errors.reduce((sum, e) => sum + e.variance, 0);

  let auditRisk: AuditRiskLevel = 'none';
  if (blockingErrors.length > 0) {
    auditRisk = 'critical';
  } else if (errors.length > 0) {
    auditRisk = 'high';
  } else if (warnings.length >= 2) {
    auditRisk = 'medium';
  } else if (warnings.length === 1) {
    auditRisk = 'low';
  }

  const isValid = blockingErrors.length === 0;

  const hmrcPayload: HMRCVATPayload | null = isValid
    ? {
        periodKey,
        vatDueSales: pence(boxes.box1),
        vatDueAcquisitions: pence(boxes.box2),
        totalVatDue: pence(boxes.box3),
        vatReclaimedCurrPeriod: pence(boxes.box4),
        netVatDue: pence(boxes.box5),
        totalValueSalesExVAT: Math.round(boxes.box6),
        totalValuePurchasesExVAT: Math.round(boxes.box7),
        totalValueGoodsSuppliedExVAT: Math.round(boxes.box8),
        totalAcquisitionsExVAT: Math.round(boxes.box9),
        finalised: true,
      }
    : null;

  return { isValid, errors, warnings, auditRisk, hmrcPayload };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVariance(v: number): string {
  if (v === 0) return '£0.00';
  if (v < 0.01) return `${(v * 100).toFixed(4)}p`;
  return `£${v.toFixed(2)}`;
}

export function getAuditRiskConfig(level: AuditRiskLevel): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
} {
  const configs = {
    none: {
      label: 'No Risk',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'All VAT calculations reconcile perfectly. Safe to submit.',
    },
    low: {
      label: 'Low Risk',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Minor advisory warnings. Submission permitted.',
    },
    medium: {
      label: 'Medium Risk',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Multiple warnings detected. Review before submitting.',
    },
    high: {
      label: 'High Risk',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Variance detected between ledger and VAT boxes. Reconcile required.',
    },
    critical: {
      label: 'BLOCKED',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Critical arithmetic errors. Submission blocked until resolved.',
    },
  };
  return configs[level];
}

// ── Generate a mock transaction summary from ledger entries ──────────────────
export function summariseTransactions(
  entries: Array<{ type: string; net: number; vat: number; gross: number }>
): TransactionVATSummary {
  return entries.reduce<TransactionVATSummary>(
    (acc, e) => {
      if (e.type === 'sales') {
        acc.salesVAT = pence(acc.salesVAT + e.vat);
        acc.netSales = pence(acc.netSales + e.net);
      } else if (e.type === 'purchase') {
        acc.purchaseVAT = pence(acc.purchaseVAT + e.vat);
        acc.netPurchases = pence(acc.netPurchases + e.net);
      }
      return acc;
    },
    { salesVAT: 0, purchaseVAT: 0, netSales: 0, netPurchases: 0, euSales: 0, euPurchases: 0 }
  );
}
