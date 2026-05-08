/**
 * UltraCore Decision Gate
 *
 * Pure deterministic gate — single source of truth for intake decisions.
 * Every intake MUST pass through this gate. No exceptions.
 *
 * Decision hierarchy (evaluated top-down, first match wins):
 *   ESCALATE → immediate human review required
 *   DENY     → intake cannot proceed as submitted
 *   MODIFY   → intake can proceed but needs solicitor review first
 *   ALLOW    → standard intake, proceed to matter creation
 */

export type Decision = 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE';

export interface GateResult {
  decision: Decision;
  reason: string;
  rules: string[];  // every rule that was evaluated (for audit trail)
}

interface GateInput {
  issueType: string;
  urgency: 'normal' | 'high' | 'critical';
  riskScore: number;
  description?: string;
}

export function ultraCoreGate(input: GateInput): GateResult {
  const rules: string[] = [];

  // ── Rule 1: Critical risk score → always escalate ────────────────────────
  rules.push(`R1: riskScore=${input.riskScore} ${input.riskScore >= 80 ? '≥80 → ESCALATE' : '<80 → continue'}`);
  if (input.riskScore >= 80) {
    return { decision: 'ESCALATE', reason: `Risk score ${input.riskScore}/100 exceeds critical threshold (80)`, rules };
  }

  // ── Rule 2: Critical urgency → escalate ─────────────────────────────────
  rules.push(`R2: urgency=${input.urgency} ${input.urgency === 'critical' ? '→ ESCALATE' : '→ continue'}`);
  if (input.urgency === 'critical') {
    return { decision: 'ESCALATE', reason: 'Matter flagged as critical urgency by Lunar triage', rules };
  }

  // ── Rule 3: Missing or invalid issue type → deny ─────────────────────────
  const hasIssueType = input.issueType && input.issueType.trim().length >= 2;
  rules.push(`R3: issueType="${input.issueType}" ${hasIssueType ? '→ continue' : '→ DENY'}`);
  if (!hasIssueType) {
    return { decision: 'DENY', reason: 'Issue type must be provided (minimum 2 characters)', rules };
  }

  // ── Rule 4: Description too short → deny ────────────────────────────────
  const descLength = input.description?.trim().length ?? 0;
  rules.push(`R4: descriptionLength=${descLength} ${descLength < 10 ? '→ DENY' : '→ continue'}`);
  if (descLength < 10) {
    return { decision: 'DENY', reason: 'Description too short — please provide more detail (minimum 10 characters)', rules };
  }

  // ── Rule 5: Elevated risk → modify (solicitor review) ───────────────────
  rules.push(`R5: riskScore=${input.riskScore} ${input.riskScore >= 50 ? '≥50 → MODIFY' : '<50 → continue'}`);
  if (input.riskScore >= 50) {
    return { decision: 'MODIFY', reason: `Elevated risk score (${input.riskScore}/100) — solicitor review required before matter creation`, rules };
  }

  // ── Rule 6: High urgency (non-critical) → modify ────────────────────────
  rules.push(`R6: urgency=${input.urgency} ${input.urgency === 'high' ? '→ MODIFY' : '→ continue'}`);
  if (input.urgency === 'high') {
    return { decision: 'MODIFY', reason: 'High-urgency matter — expedited review recommended', rules };
  }

  // ── Default: standard intake ─────────────────────────────────────────────
  rules.push('R7: all checks passed → ALLOW');
  return { decision: 'ALLOW', reason: 'Standard intake — proceed to matter creation', rules };
}
