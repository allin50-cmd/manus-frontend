/**
 * FineGuard - Compliance Health Panel Generator
 *
 * Aggregates compliance status across all four FineGuard modules:
 *   1. MTD VAT             — HMRC Making Tax Digital for VAT
 *   2. Corporation Tax     — CT600 filings and deadlines
 *   3. Self-Assessment     — SA100/SA302 for director self-assessment
 *   4. Companies House     — Annual accounts + confirmation statement
 *
 * The panel is the primary JSON response shape consumed by the
 * FineGuard dashboard UI. It provides:
 *   - Per-module status, score, alerts, and next deadlines
 *   - Aggregated overall compliance score
 *   - Estimated penalty exposure across all modules
 *   - Overall grade (A–F) derived from the compliance score engine
 */

import { calculateComplianceScore } from './complianceScore.js';
import type {
  ComplianceHealthPanel,
  ModuleHealth,
  ModuleStatus,
  ComplianceScoreInput,
} from './types.js';

// ============================================================================
// TYPES FOR MODULE DATA INPUT
// ============================================================================

export interface VatModuleData {
  lastReturnDate?: string;
  nextReturnDue?: string;
  daysUntilDue?: number;
  outstandingReturns?: number;
  lastVarianceCheckPassed?: boolean;
  lastVarianceCheckDate?: string;
  estimatedPenalty?: number; // pence
}

export interface CTModuleData {
  lastCT600Filed?: string;
  nextCT600Due?: string;
  daysUntilDue?: number;
  requiresLongPeriodSplit?: boolean;
  estimatedTaxDue?: number; // pence
  estimatedPenalty?: number; // pence
}

export interface SAModuleData {
  lastSAFiled?: string;
  nextSADue?: string;
  daysUntilDue?: number;
  outstandingReturns?: number;
  estimatedPenalty?: number; // pence
}

export interface CHModuleData {
  accountsNextDue?: string;
  accountsDaysUntilDue?: number;
  accountsOverdue?: boolean;
  confirmationStatementNextDue?: string;
  csDaysUntilDue?: number;
  csOverdue?: boolean;
  estimatedPenalty?: number; // pence
}

export interface HealthPanelInput {
  companyNumber: string;
  companyName: string;
  vat?: VatModuleData;
  ct?: CTModuleData;
  sa?: SAModuleData;
  ch?: CHModuleData;
  scoreInputs?: Partial<ComplianceScoreInput>;
  previousScore?: number;
}

// ============================================================================
// MODULE HEALTH BUILDERS
// ============================================================================

function buildVatModule(data: VatModuleData = {}): ModuleHealth {
  const alerts: ModuleHealth['alerts'] = [];
  let status: ModuleStatus = 'compliant';

  if (data.outstandingReturns && data.outstandingReturns > 0) {
    status = 'overdue';
    alerts.push({
      severity: 'critical',
      message: `${data.outstandingReturns} VAT return(s) outstanding and overdue. HMRC may initiate a compliance check.`,
      errorCode: 'ERR_V_002',
    });
  } else if (data.daysUntilDue !== undefined && data.daysUntilDue <= 7 && data.daysUntilDue >= 0) {
    status = 'warning';
    alerts.push({
      severity: 'warning',
      message: `VAT return due in ${data.daysUntilDue} day(s). Ensure your Zero-Variance check passes before submission.`,
    });
  } else if (data.daysUntilDue !== undefined && data.daysUntilDue < 0) {
    status = 'overdue';
    alerts.push({
      severity: 'critical',
      message: `VAT return is ${Math.abs(data.daysUntilDue)} day(s) overdue. Immediate action required to avoid surcharge.`,
    });
  }

  if (data.lastVarianceCheckPassed === false) {
    if (status !== 'overdue') status = 'action_required';
    alerts.push({
      severity: 'critical',
      message: 'Last Zero-Variance check failed. Submission is blocked until discrepancies are resolved.',
      errorCode: 'ERR_V_001',
    });
  }

  const score = computeModuleScore(status, data.daysUntilDue);

  return {
    moduleId: 'mtd_vat',
    displayName: 'MTD VAT',
    status,
    score,
    nextDeadline: data.nextReturnDue
      ? {
          description: 'VAT Return',
          dueDate: data.nextReturnDue,
          daysUntilDue: data.daysUntilDue ?? 0,
        }
      : undefined,
    lastAction: data.lastReturnDate
      ? { description: 'VAT return submitted', date: data.lastReturnDate }
      : undefined,
    alerts,
    lastChecked: new Date().toISOString(),
  };
}

function buildCTModule(data: CTModuleData = {}): ModuleHealth {
  const alerts: ModuleHealth['alerts'] = [];
  let status: ModuleStatus = 'compliant';

  if (data.daysUntilDue !== undefined && data.daysUntilDue < 0) {
    status = 'overdue';
    alerts.push({
      severity: 'critical',
      message: `CT600 is ${Math.abs(data.daysUntilDue)} day(s) overdue. HMRC penalty applies from the filing deadline.`,
      errorCode: 'ERR_CT_002',
    });
  } else if (data.daysUntilDue !== undefined && data.daysUntilDue <= 30) {
    status = 'warning';
    alerts.push({
      severity: 'warning',
      message: `CT600 due in ${data.daysUntilDue} day(s). Tax payment also due ${data.daysUntilDue} day(s) from now.`,
    });
  }

  if (data.requiresLongPeriodSplit) {
    if (status === 'compliant') status = 'action_required';
    alerts.push({
      severity: 'warning',
      message: 'Accounting period exceeds 12 months. FineGuard has prepared two CT600 returns for your review.',
      errorCode: 'ERR_CT_001',
    });
  }

  const score = computeModuleScore(status, data.daysUntilDue);

  return {
    moduleId: 'corporation_tax',
    displayName: 'Corporation Tax',
    status,
    score,
    nextDeadline: data.nextCT600Due
      ? {
          description: 'CT600 Filing',
          dueDate: data.nextCT600Due,
          daysUntilDue: data.daysUntilDue ?? 0,
        }
      : undefined,
    lastAction: data.lastCT600Filed
      ? { description: 'CT600 filed', date: data.lastCT600Filed }
      : undefined,
    alerts,
    lastChecked: new Date().toISOString(),
  };
}

function buildSAModule(data: SAModuleData = {}): ModuleHealth {
  const alerts: ModuleHealth['alerts'] = [];
  let status: ModuleStatus = 'compliant';

  if (data.outstandingReturns && data.outstandingReturns > 0) {
    status = 'overdue';
    alerts.push({
      severity: 'critical',
      message: `${data.outstandingReturns} Self-Assessment return(s) outstanding. A £100 late filing penalty has been applied by HMRC.`,
      errorCode: 'ERR_SA_001',
    });
  } else if (data.daysUntilDue !== undefined && data.daysUntilDue <= 30) {
    status = 'warning';
    alerts.push({
      severity: 'warning',
      message: `Self-Assessment return due in ${data.daysUntilDue} day(s) (31 January deadline).`,
    });
  }

  const score = computeModuleScore(status, data.daysUntilDue);

  return {
    moduleId: 'self_assessment',
    displayName: 'Self-Assessment',
    status,
    score,
    nextDeadline: data.nextSADue
      ? {
          description: 'Self-Assessment Return (SA100)',
          dueDate: data.nextSADue,
          daysUntilDue: data.daysUntilDue ?? 0,
        }
      : undefined,
    lastAction: data.lastSAFiled
      ? { description: 'SA return filed', date: data.lastSAFiled }
      : undefined,
    alerts,
    lastChecked: new Date().toISOString(),
  };
}

function buildCHModule(data: CHModuleData = {}): ModuleHealth {
  const alerts: ModuleHealth['alerts'] = [];
  let status: ModuleStatus = 'compliant';
  const minDays = Math.min(
    data.accountsDaysUntilDue ?? 999,
    data.csDaysUntilDue ?? 999,
  );

  if (data.accountsOverdue) {
    status = 'overdue';
    alerts.push({
      severity: 'critical',
      message: 'Annual Accounts are overdue at Companies House. Late filing penalties start at £150 and escalate to £1,500.',
    });
  }

  if (data.csOverdue) {
    status = 'overdue';
    alerts.push({
      severity: 'critical',
      message: 'Confirmation Statement is overdue. This is a criminal offence — the company may be struck off the register.',
    });
  }

  if (!data.accountsOverdue && data.accountsDaysUntilDue !== undefined && data.accountsDaysUntilDue <= 30) {
    if (status === 'compliant') status = 'warning';
    alerts.push({
      severity: 'warning',
      message: `Annual Accounts due at Companies House in ${data.accountsDaysUntilDue} day(s).`,
    });
  }

  if (!data.csOverdue && data.csDaysUntilDue !== undefined && data.csDaysUntilDue <= 14) {
    if (status === 'compliant') status = 'warning';
    alerts.push({
      severity: 'warning',
      message: `Confirmation Statement due in ${data.csDaysUntilDue} day(s).`,
    });
  }

  const score = computeModuleScore(status, minDays === 999 ? undefined : minDays);

  return {
    moduleId: 'companies_house',
    displayName: 'Companies House',
    status,
    score,
    nextDeadline: data.accountsNextDue
      ? {
          description: 'Annual Accounts',
          dueDate: data.accountsNextDue,
          daysUntilDue: data.accountsDaysUntilDue ?? 0,
        }
      : undefined,
    alerts,
    lastChecked: new Date().toISOString(),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Maps module status and days-until-due to a 0–100 module score.
 * Used internally — the overall score is computed by the weighted formula.
 */
function computeModuleScore(status: ModuleStatus, daysUntilDue?: number): number {
  if (status === 'overdue') return Math.max(0, 30 - Math.abs(daysUntilDue ?? 0));
  if (status === 'action_required') return 55;
  if (status === 'warning') {
    // Scale from 60-80 based on how close the deadline is
    const days = daysUntilDue ?? 14;
    return Math.max(60, Math.min(80, 80 - (14 - days) * 2));
  }
  if (status === 'not_configured') return 0;
  return 95; // compliant
}

/**
 * Determines the worst overall status from all module statuses.
 */
function aggregateStatus(modules: ModuleHealth[]): ModuleStatus {
  const priority: ModuleStatus[] = ['overdue', 'action_required', 'warning', 'compliant', 'not_configured'];
  for (const p of priority) {
    if (modules.some(m => m.status === p)) return p;
  }
  return 'compliant';
}

/**
 * Sum all estimated penalty exposures across modules.
 */
function totalPenaltyExposure(
  vat?: VatModuleData,
  ct?: CTModuleData,
  sa?: SAModuleData,
  ch?: CHModuleData,
): number {
  return (
    (vat?.estimatedPenalty ?? 0) +
    (ct?.estimatedPenalty ?? 0) +
    (sa?.estimatedPenalty ?? 0) +
    (ch?.estimatedPenalty ?? 0)
  );
}

/** ISO date for next review (7 days from now) */
function nextReviewDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().split('T')[0];
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generates a ComplianceHealthPanel — the primary JSON payload for the
 * FineGuard dashboard compliance overview widget.
 *
 * @param input  Aggregated module data + company identifiers
 * @returns      Full ComplianceHealthPanel ready for API response
 */
export function generateComplianceHealthPanel(input: HealthPanelInput): ComplianceHealthPanel {
  const vatModule = buildVatModule(input.vat);
  const ctModule = buildCTModule(input.ct);
  const saModule = buildSAModule(input.sa);
  const chModule = buildCHModule(input.ch);

  const modules = [vatModule, ctModule, saModule, chModule];

  // Derive compliance score inputs from module scores if not explicitly provided
  const scoreInputs: ComplianceScoreInput = {
    timeliness: input.scoreInputs?.timeliness ?? averageModuleScore(modules, ['overdue']),
    accuracy: input.scoreInputs?.accuracy ?? averageModuleScore(modules, ['action_required']),
    completeness: input.scoreInputs?.completeness ?? (modules.filter(m => m.status !== 'not_configured').length / modules.length) * 100,
    risk: input.scoreInputs?.risk ?? riskFromModules(modules),
  };

  const scoreResult = calculateComplianceScore(scoreInputs, input.previousScore);

  return {
    companyNumber: input.companyNumber,
    companyName: input.companyName,
    overallScore: scoreResult.score,
    overallStatus: aggregateStatus(modules),
    grade: scoreResult.grade,
    modules,
    estimatedPenaltyExposure: totalPenaltyExposure(input.vat, input.ct, input.sa, input.ch),
    generatedAt: new Date().toISOString(),
    nextReviewDate: nextReviewDate(),
  };
}

function averageModuleScore(modules: ModuleHealth[], excludeStatuses: ModuleStatus[]): number {
  const relevant = modules.filter(m => !excludeStatuses.includes(m.status) && m.status !== 'not_configured');
  if (relevant.length === 0) return 75;
  return relevant.reduce((sum, m) => sum + m.score, 0) / relevant.length;
}

function riskFromModules(modules: ModuleHealth[]): number {
  const overdueCount = modules.filter(m => m.status === 'overdue').length;
  const warningCount = modules.filter(m => m.status === 'warning' || m.status === 'action_required').length;
  return Math.min(100, overdueCount * 30 + warningCount * 10);
}
