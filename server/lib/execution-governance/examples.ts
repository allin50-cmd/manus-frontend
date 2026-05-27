/**
 * Execution Governance — Domain Examples
 *
 * Illustrates how to call evaluateExecutionGovernance() for each of the
 * four supported domains. Each function returns a GovernanceDecision so
 * callers can inspect the result in tests or integration scenarios.
 */

import { evaluateExecutionGovernance } from './decisionGate';
import type { GovernanceDecision } from './types';

// ─── 1. Compliance workflow governance ───────────────────────────────────────

/** ALLOW path: high-confidence, known jurisdiction. */
export function exampleComplianceAllow(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'cw-001',
      domain: 'compliance_workflow',
      actor: 'clerkos.engine',
      source: 'intake_form',
      actionRequested: 'advance_matter_state',
      inputSummary: 'Advance matter MAT-001 from captured to analysed',
      confidenceScore: 0.95,
      riskLevel: 'medium',
      jurisdiction: 'GB',
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
      payload: { matterId: 'MAT-001', fromState: 'captured', toState: 'analysed' },
    },
    { clientId: 'client-accuracy' },
  );
}

/** ESCALATE path: jurisdiction not set. */
export function exampleComplianceEscalate(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'cw-002',
      domain: 'compliance_workflow',
      actor: 'clerkos.engine',
      source: 'intake_form',
      actionRequested: 'submit_regulatory_filing',
      inputSummary: 'Submit filing for matter MAT-002 — jurisdiction unknown',
      confidenceScore: 0.88,
      riskLevel: 'high',
      jurisdiction: null,
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
    },
    { clientId: 'client-accuracy' },
  );
}

// ─── 2. Payment approval governance ──────────────────────────────────────────

/** ALLOW path: amount within threshold. */
export function examplePaymentAllow(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'pa-001',
      domain: 'payment_approval',
      actor: 'billing.service',
      source: 'stripe_checkout',
      actionRequested: 'charge_client',
      inputSummary: 'Charge £500 for compliance bundle MAT-005',
      confidenceScore: 0.99,
      riskLevel: 'low',
      jurisdiction: 'GB',
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
      payload: { amountPence: 50_000 }, // £500
    },
    { clientId: 'client-accuracy', paymentApprovalThresholdPence: 100_000 }, // £1,000 threshold
  );
}

/** ESCALATE path: payment exceeds threshold. */
export function examplePaymentEscalate(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'pa-002',
      domain: 'payment_approval',
      actor: 'billing.service',
      source: 'stripe_checkout',
      actionRequested: 'charge_client',
      inputSummary: 'Charge £5,000 for enterprise compliance bundle',
      confidenceScore: 0.97,
      riskLevel: 'medium',
      jurisdiction: 'GB',
      clientId: 'client-enterprise',
      createdAt: new Date().toISOString(),
      payload: { amountPence: 500_000 }, // £5,000
    },
    { clientId: 'client-enterprise', paymentApprovalThresholdPence: 100_000 }, // £1,000 threshold
  );
}

// ─── 3. Document release governance ──────────────────────────────────────────

/** ALLOW path: no confidential data detected. */
export function exampleDocumentReleaseAllow(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'dr-001',
      domain: 'document_release',
      actor: 'document.service',
      source: 'compliance_bundle',
      actionRequested: 'release_document',
      inputSummary: 'Release standard engagement letter for matter MAT-007',
      confidenceScore: 0.92,
      riskLevel: 'low',
      jurisdiction: 'GB',
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
      payload: { documentType: 'engagement_letter', classification: 'standard' },
    },
    {
      clientId: 'client-accuracy',
      confidentialDataPatterns: ['pep_screening', 'sanctions_check', 'aml_report'],
    },
  );
}

/** DENY path: confidential data in high-risk document. */
export function exampleDocumentReleaseDeny(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'dr-002',
      domain: 'document_release',
      actor: 'document.service',
      source: 'compliance_bundle',
      actionRequested: 'release_document',
      inputSummary: 'Release AML report containing pep_screening results',
      confidenceScore: 0.85,
      riskLevel: 'high',
      jurisdiction: 'GB',
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
      payload: { documentType: 'aml_report', containsData: 'pep_screening' },
    },
    {
      clientId: 'client-accuracy',
      confidentialDataPatterns: ['pep_screening', 'sanctions_check', 'aml_report'],
    },
  );
}

// ─── 4. AI call-centre oversight ─────────────────────────────────────────────

/** ALLOW path: routine information query. */
export function exampleCallCentreAllow(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'cc-001',
      domain: 'ai_call_centre',
      actor: 'ai.agent.v1',
      source: 'inbound_call',
      actionRequested: 'provide_matter_status',
      inputSummary: 'Customer asking for status of their planning matter',
      confidenceScore: 0.91,
      riskLevel: 'low',
      jurisdiction: 'GB',
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
      payload: { intent: 'status_enquiry', matterId: 'MAT-024' },
    },
    { clientId: 'client-accuracy' },
  );
}

/** ESCALATE path: caller requests refund — restricted action. */
export function exampleCallCentreEscalate(): GovernanceDecision {
  return evaluateExecutionGovernance(
    {
      id: 'cc-002',
      domain: 'ai_call_centre',
      actor: 'ai.agent.v1',
      source: 'inbound_call',
      actionRequested: 'process_refund',
      inputSummary: 'Customer requesting refund of £750 compliance fee',
      confidenceScore: 0.88,
      riskLevel: 'medium',
      jurisdiction: 'GB',
      clientId: 'client-accuracy',
      createdAt: new Date().toISOString(),
      payload: { intent: 'refund', amountPence: 75_000 },
    },
    { clientId: 'client-accuracy' },
  );
}
