import { describe, it, expect } from 'vitest';
import { evaluateExecutionGovernance } from './decisionGate';
import type { GovernanceEvent, ClientPolicy } from './types';
import {
  exampleComplianceAllow,
  exampleComplianceEscalate,
  examplePaymentAllow,
  examplePaymentEscalate,
  exampleDocumentReleaseAllow,
  exampleDocumentReleaseDeny,
  exampleCallCentreAllow,
  exampleCallCentreEscalate,
} from './examples';

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<GovernanceEvent> = {}): GovernanceEvent {
  return {
    id: 'test-id',
    domain: 'compliance_workflow',
    actor: 'test.actor',
    source: 'test.source',
    actionRequested: 'advance_state',
    inputSummary: 'Test action summary',
    confidenceScore: 0.9,
    riskLevel: 'low',
    jurisdiction: 'GB',
    clientId: 'client-test',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const defaultPolicy: ClientPolicy = { clientId: 'client-test' };

// ─── Rule 1: Low confidence → ESCALATE ───────────────────────────────────────

describe('rule: low confidence', () => {
  it('escalates when confidenceScore is below 0.7', () => {
    const d = evaluateExecutionGovernance(makeEvent({ confidenceScore: 0.5 }), defaultPolicy);
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('LOW_CONFIDENCE');
    expect(d.humanReviewRequired).toBe(true);
  });

  it('allows when confidenceScore is exactly 0.7', () => {
    const d = evaluateExecutionGovernance(makeEvent({ confidenceScore: 0.7 }), defaultPolicy);
    expect(d.decision).toBe('ALLOW');
  });

  it('allows when confidenceScore is above threshold', () => {
    const d = evaluateExecutionGovernance(makeEvent({ confidenceScore: 0.95 }), defaultPolicy);
    expect(d.decision).toBe('ALLOW');
  });

  it('respects client minimum confidence override', () => {
    const policy: ClientPolicy = { clientId: 'client-test', minimumConfidenceScore: 0.85 };
    const d = evaluateExecutionGovernance(makeEvent({ confidenceScore: 0.8 }), policy);
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('LOW_CONFIDENCE');
  });
});

// ─── Rule 2: Critical risk → DENY ────────────────────────────────────────────

describe('rule: critical risk', () => {
  it('denies when riskLevel is critical and no human override', () => {
    const d = evaluateExecutionGovernance(makeEvent({ riskLevel: 'critical' }), defaultPolicy);
    expect(d.decision).toBe('DENY');
    expect(d.reasonCodes).toContain('CRITICAL_RISK');
    expect(d.humanReviewRequired).toBe(true);
  });

  it('allows when riskLevel is critical but humanOverrideActive is true', () => {
    const policy: ClientPolicy = { clientId: 'client-test', humanOverrideActive: true };
    const d = evaluateExecutionGovernance(makeEvent({ riskLevel: 'critical' }), policy);
    // No critical-risk denial — may still be escalated for other reasons
    expect(d.reasonCodes).not.toContain('CRITICAL_RISK');
  });

  it('does not deny for high risk (only critical triggers this rule)', () => {
    const d = evaluateExecutionGovernance(makeEvent({ riskLevel: 'high' }), defaultPolicy);
    expect(d.reasonCodes).not.toContain('CRITICAL_RISK');
  });
});

// ─── Rule 3: Payment threshold → ESCALATE ────────────────────────────────────

describe('rule: payment approval threshold', () => {
  const paymentPolicy: ClientPolicy = {
    clientId: 'client-test',
    paymentApprovalThresholdPence: 100_000,
  };

  it('escalates when payment amount exceeds threshold', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'payment_approval', payload: { amountPence: 150_000 } }),
      paymentPolicy,
    );
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('PAYMENT_THRESHOLD_EXCEEDED');
    expect(d.requiredActions).toContain('require_payment_approval');
  });

  it('allows when payment amount is within threshold', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'payment_approval', payload: { amountPence: 50_000 } }),
      paymentPolicy,
    );
    expect(d.decision).toBe('ALLOW');
    expect(d.reasonCodes).not.toContain('PAYMENT_THRESHOLD_EXCEEDED');
  });

  it('allows when no threshold is configured for the client', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'payment_approval', payload: { amountPence: 999_999 } }),
      defaultPolicy,
    );
    expect(d.reasonCodes).not.toContain('PAYMENT_THRESHOLD_EXCEEDED');
  });

  it('does not apply to non-payment domains', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'compliance_workflow', payload: { amountPence: 999_999 } }),
      paymentPolicy,
    );
    expect(d.reasonCodes).not.toContain('PAYMENT_THRESHOLD_EXCEEDED');
  });
});

// ─── Rule 4: Confidential document → ESCALATE / DENY ─────────────────────────

describe('rule: confidential document release', () => {
  const docPolicy: ClientPolicy = {
    clientId: 'client-test',
    confidentialDataPatterns: ['aml_report', 'sanctions_check'],
  };

  it('escalates when inputSummary contains a confidential pattern and risk is medium', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'document_release', riskLevel: 'medium', inputSummary: 'Release aml_report for matter' }),
      docPolicy,
    );
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('CONFIDENTIAL_DATA_DETECTED');
  });

  it('denies when payload contains confidential pattern and risk is high', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({
        domain: 'document_release',
        riskLevel: 'high',
        inputSummary: 'Release document',
        payload: { containsData: 'sanctions_check' },
      }),
      docPolicy,
    );
    expect(d.decision).toBe('DENY');
    expect(d.reasonCodes).toContain('CONFIDENTIAL_DATA_DETECTED');
  });

  it('allows document release when no confidential pattern matched', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'document_release', inputSummary: 'Release standard engagement letter' }),
      docPolicy,
    );
    expect(d.reasonCodes).not.toContain('CONFIDENTIAL_DATA_DETECTED');
  });

  it('does not apply to non-document domains', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'compliance_workflow', inputSummary: 'Contains aml_report data' }),
      docPolicy,
    );
    expect(d.reasonCodes).not.toContain('CONFIDENTIAL_DATA_DETECTED');
  });
});

// ─── Rule 5: AI call-centre restricted actions → ESCALATE ────────────────────

describe('rule: AI call-centre restricted actions', () => {
  it('escalates for refund action', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'ai_call_centre', actionRequested: 'process_refund' }),
      defaultPolicy,
    );
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('CALL_CENTRE_RESTRICTED_ACTION');
    expect(d.requiredActions).toContain('transfer_to_human_agent');
  });

  it('escalates for legal advice action', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'ai_call_centre', actionRequested: 'provide_legal_advice' }),
      defaultPolicy,
    );
    expect(d.reasonCodes).toContain('CALL_CENTRE_RESTRICTED_ACTION');
  });

  it('escalates for cancellation action', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'ai_call_centre', actionRequested: 'cancel_subscription' }),
      defaultPolicy,
    );
    expect(d.reasonCodes).toContain('CALL_CENTRE_RESTRICTED_ACTION');
  });

  it('escalates for payment promise action', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'ai_call_centre', actionRequested: 'make_payment_promise' }),
      defaultPolicy,
    );
    expect(d.reasonCodes).toContain('CALL_CENTRE_RESTRICTED_ACTION');
  });

  it('allows routine call-centre actions', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'ai_call_centre', actionRequested: 'provide_matter_status' }),
      defaultPolicy,
    );
    expect(d.decision).toBe('ALLOW');
    expect(d.reasonCodes).not.toContain('CALL_CENTRE_RESTRICTED_ACTION');
  });

  it('does not apply restricted-action rule to non-call-centre domains', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'compliance_workflow', actionRequested: 'process_refund' }),
      defaultPolicy,
    );
    expect(d.reasonCodes).not.toContain('CALL_CENTRE_RESTRICTED_ACTION');
  });
});

// ─── Rule 6: Compliance workflow + missing jurisdiction → ESCALATE ────────────

describe('rule: jurisdiction missing on compliance workflow', () => {
  it('escalates when jurisdiction is null', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'compliance_workflow', jurisdiction: null }),
      defaultPolicy,
    );
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('JURISDICTION_MISSING');
  });

  it('escalates when jurisdiction is empty string', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'compliance_workflow', jurisdiction: '  ' }),
      defaultPolicy,
    );
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('JURISDICTION_MISSING');
  });

  it('allows when jurisdiction is set', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'compliance_workflow', jurisdiction: 'GB' }),
      defaultPolicy,
    );
    expect(d.reasonCodes).not.toContain('JURISDICTION_MISSING');
  });

  it('does not apply jurisdiction rule to non-compliance domains', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ domain: 'payment_approval', jurisdiction: null }),
      defaultPolicy,
    );
    expect(d.reasonCodes).not.toContain('JURISDICTION_MISSING');
  });
});

// ─── Rule 7: Default → ALLOW ──────────────────────────────────────────────────

describe('rule: default allow', () => {
  it('returns ALLOW with POLICY_ALLOW when no rules fire', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy);
    expect(d.decision).toBe('ALLOW');
    expect(d.reasonCodes).toEqual(['POLICY_ALLOW']);
    expect(d.requiredActions).toEqual([]);
    expect(d.humanReviewRequired).toBe(false);
  });
});

// ─── Adaptive stability ───────────────────────────────────────────────────────

describe('adaptive stability: system states', () => {
  it('GREEN: allows normal traffic', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy, 'GREEN');
    expect(d.decision).toBe('ALLOW');
  });

  it('AMBER: escalates borderline confidence (0.8 < 0.9 threshold)', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ confidenceScore: 0.8 }),
      defaultPolicy,
      'AMBER',
    );
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('LOW_CONFIDENCE');
  });

  it('AMBER: allows high-confidence traffic', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ confidenceScore: 0.95 }),
      defaultPolicy,
      'AMBER',
    );
    expect(d.decision).toBe('ALLOW');
  });

  it('RED: escalates all traffic with SYSTEM_STATE_RED', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy, 'RED');
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('SYSTEM_STATE_RED');
    expect(d.humanReviewRequired).toBe(true);
  });

  it('BLACK: denies all traffic with SYSTEM_STATE_BLACK', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy, 'BLACK');
    expect(d.decision).toBe('DENY');
    expect(d.reasonCodes).toContain('SYSTEM_STATE_BLACK');
    expect(d.requiredActions).toContain('no_mutations_permitted');
  });

  it('DENY beats ESCALATE when multiple rules fire', () => {
    // BLACK (DENY) + low confidence (ESCALATE) → DENY wins
    const d = evaluateExecutionGovernance(
      makeEvent({ confidenceScore: 0.4 }),
      defaultPolicy,
      'BLACK',
    );
    expect(d.decision).toBe('DENY');
  });
});

// ─── Audit payload ────────────────────────────────────────────────────────────

describe('audit payload (vaultLineEvent)', () => {
  it('produces a vaultLineEvent on every decision', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy);
    expect(d.vaultLineEvent).toBeDefined();
    expect(d.vaultLineEvent.entityType).toBe('governance_decision');
    expect(d.vaultLineEvent.action).toBe('ALLOW');
  });

  it('sets action to the decision value', () => {
    const d = evaluateExecutionGovernance(
      makeEvent({ confidenceScore: 0.3 }),
      defaultPolicy,
    );
    expect(d.vaultLineEvent.action).toBe('ESCALATE');
  });

  it('embeds reason codes and domain in metadata JSON', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy);
    const meta = JSON.parse(d.vaultLineEvent.metadata!);
    expect(meta.domain).toBe('compliance_workflow');
    expect(meta.reasonCodes).toContain('POLICY_ALLOW');
  });

  it('sets correlationId from the event id', () => {
    const d = evaluateExecutionGovernance(makeEvent({ id: 'fixed-event-id' }), defaultPolicy);
    expect(d.vaultLineEvent.correlationId).toBe('fixed-event-id');
  });

  it('does not include tenantId (caller responsibility)', () => {
    const d = evaluateExecutionGovernance(makeEvent(), defaultPolicy);
    expect('tenantId' in d.vaultLineEvent).toBe(false);
  });
});

// ─── Examples (integration smoke tests) ──────────────────────────────────────

describe('domain examples', () => {
  it('exampleComplianceAllow returns ALLOW', () => {
    expect(exampleComplianceAllow().decision).toBe('ALLOW');
  });

  it('exampleComplianceEscalate returns ESCALATE (missing jurisdiction)', () => {
    const d = exampleComplianceEscalate();
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('JURISDICTION_MISSING');
  });

  it('examplePaymentAllow returns ALLOW', () => {
    expect(examplePaymentAllow().decision).toBe('ALLOW');
  });

  it('examplePaymentEscalate returns ESCALATE (threshold exceeded)', () => {
    const d = examplePaymentEscalate();
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('PAYMENT_THRESHOLD_EXCEEDED');
  });

  it('exampleDocumentReleaseAllow returns ALLOW', () => {
    expect(exampleDocumentReleaseAllow().decision).toBe('ALLOW');
  });

  it('exampleDocumentReleaseDeny returns DENY (confidential + high risk)', () => {
    const d = exampleDocumentReleaseDeny();
    expect(d.decision).toBe('DENY');
    expect(d.reasonCodes).toContain('CONFIDENTIAL_DATA_DETECTED');
  });

  it('exampleCallCentreAllow returns ALLOW', () => {
    expect(exampleCallCentreAllow().decision).toBe('ALLOW');
  });

  it('exampleCallCentreEscalate returns ESCALATE (refund action)', () => {
    const d = exampleCallCentreEscalate();
    expect(d.decision).toBe('ESCALATE');
    expect(d.reasonCodes).toContain('CALL_CENTRE_RESTRICTED_ACTION');
  });
});
