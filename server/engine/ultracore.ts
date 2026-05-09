/**
 * UltraCore Decision Gate
 *
 * Pure deterministic gate — single source of truth for intake decisions.
 * Every intake MUST pass through this gate. No exceptions.
 *
 * Decision hierarchy (evaluated top-down, first match wins):
 *   ESCALATE            → immediate human review required
 *   DENY                → intake cannot proceed as submitted
 *   REFER_TO_SPECIALIST → specialist assessment required (immigration/asylum)
 *   MODIFY              → intake can proceed but needs solicitor review first
 *   ALLOW               → standard intake, proceed to matter creation
 */

export type Decision = 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE' | 'REFER_TO_SPECIALIST';

export interface GateResult {
  decision: Decision;
  reason: string;
  rules: string[];         // every rule evaluated, in order (full audit trail)
  confidence: number;      // 0–100: certainty of decision
  recommendedActions: string[]; // concrete next steps for the intake team
}

interface GateInput {
  issueType: string;
  urgency: 'normal' | 'high' | 'critical';
  riskScore: number;
  description?: string;
  flagCount?: number;      // number of matched keywords from Lunar
}

const SPECIALIST_TYPES = ['immigration', 'asylum', 'visa', 'deportation', 'right to remain'];

function isSpecialistCase(issueType: string): boolean {
  const lower = issueType.toLowerCase();
  return SPECIALIST_TYPES.some(t => lower.includes(t));
}

export function ultraCoreGate(input: GateInput): GateResult {
  const rules: string[] = [];
  const flagCount = input.flagCount ?? 0;

  // ── Rule 1: Critical risk score → always escalate ────────────────────────
  rules.push(
    input.riskScore >= 80
      ? `R1: riskScore=${input.riskScore} ≥80 → ESCALATE (critical risk threshold exceeded)`
      : `R1: riskScore=${input.riskScore} <80 → continue evaluation`,
  );
  if (input.riskScore >= 80) {
    return {
      decision: 'ESCALATE',
      reason: `Risk score ${input.riskScore}/100 exceeds critical threshold (80)`,
      rules,
      confidence: 100,
      recommendedActions: [
        'Assign to senior solicitor within 30 minutes',
        'Send urgent notification to duty supervisor',
        'Flag matter for same-day review',
      ],
    };
  }

  // ── Rule 2: Critical urgency → escalate ─────────────────────────────────
  rules.push(
    input.urgency === 'critical'
      ? `R2: urgency=critical → ESCALATE (Lunar flagged critical urgency)`
      : `R2: urgency=${input.urgency} → continue evaluation`,
  );
  if (input.urgency === 'critical') {
    return {
      decision: 'ESCALATE',
      reason: 'Matter flagged as critical urgency by Lunar triage',
      rules,
      confidence: 95,
      recommendedActions: [
        'Immediate telephone callback to client',
        'Check for time-limited court deadlines',
        'Escalate to duty solicitor',
      ],
    };
  }

  // ── Rule 2.5: Multiple high-risk categories simultaneously ───────────────
  const multiCategoryEscalate = flagCount >= 5 && input.riskScore >= 60;
  rules.push(
    multiCategoryEscalate
      ? `R2.5: flagCount=${flagCount} ≥5 AND riskScore=${input.riskScore} ≥60 → ESCALATE (multi-category risk)`
      : `R2.5: flagCount=${flagCount}, riskScore=${input.riskScore} → no multi-category escalation`,
  );
  if (multiCategoryEscalate) {
    return {
      decision: 'ESCALATE',
      reason: `Matter spans ${flagCount} high-risk legal categories (score: ${input.riskScore}/100) — senior review required`,
      rules,
      confidence: 90,
      recommendedActions: [
        'Assign specialist solicitor covering multiple practice areas',
        'Request full matter summary from client',
        'Initiate conflict check immediately',
      ],
    };
  }

  // ── Rule 3: Missing or invalid issue type → deny ─────────────────────────
  const hasIssueType = input.issueType && input.issueType.trim().length >= 2;
  rules.push(
    hasIssueType
      ? `R3: issueType="${input.issueType}" is valid → continue evaluation`
      : `R3: issueType="${input.issueType}" is missing or too short → DENY`,
  );
  if (!hasIssueType) {
    return {
      decision: 'DENY',
      reason: 'Issue type must be provided (minimum 2 characters)',
      rules,
      confidence: 100,
      recommendedActions: [
        'Ask client to select a practice area from the dropdown',
        'Resubmit intake form with issue type completed',
      ],
    };
  }

  // ── Rule 4: Description too short → deny ────────────────────────────────
  const descLength = input.description?.trim().length ?? 0;
  rules.push(
    descLength < 10
      ? `R4: descriptionLength=${descLength} <10 → DENY (insufficient detail)`
      : `R4: descriptionLength=${descLength} chars → continue evaluation`,
  );
  if (descLength < 10) {
    return {
      decision: 'DENY',
      reason: 'Description too short — please provide more detail (minimum 10 characters)',
      rules,
      confidence: 100,
      recommendedActions: [
        'Ask client to provide a brief description of their legal issue',
        'Minimum 10 characters required to proceed',
      ],
    };
  }

  // ── Rule 4.5: Many keyword flags → minimum MODIFY ───────────────────────
  const manyFlags = flagCount >= 4;
  rules.push(
    manyFlags
      ? `R4.5: flagCount=${flagCount} ≥4 → MODIFY (elevated flag count)`
      : `R4.5: flagCount=${flagCount} <4 → continue evaluation`,
  );

  // ── Rule 5: Immigration/asylum → specialist referral ─────────────────────
  const needsSpecialist = isSpecialistCase(input.issueType);
  rules.push(
    needsSpecialist
      ? `R5: issueType="${input.issueType}" matches specialist categories → REFER_TO_SPECIALIST`
      : `R5: issueType="${input.issueType}" is standard → continue evaluation`,
  );
  if (needsSpecialist) {
    return {
      decision: 'REFER_TO_SPECIALIST',
      reason: `${input.issueType} matters require an accredited immigration specialist`,
      rules,
      confidence: 92,
      recommendedActions: [
        'Route to immigration law team',
        'Check OISC accreditation level required',
        'Advise client of specialist referral process',
      ],
    };
  }

  // ── Rule 6: Elevated risk → modify (solicitor review) ───────────────────
  const elevatedRisk = input.riskScore >= 50 || manyFlags;
  rules.push(
    elevatedRisk
      ? `R6: riskScore=${input.riskScore} ≥50 or flagCount=${flagCount} ≥4 → MODIFY (solicitor review)`
      : `R6: riskScore=${input.riskScore} <50 → continue evaluation`,
  );
  if (elevatedRisk) {
    return {
      decision: 'MODIFY',
      reason: `Elevated risk score (${input.riskScore}/100) — solicitor review required before matter creation`,
      rules,
      confidence: 78,
      recommendedActions: [
        'Queue for solicitor review within 24 hours',
        'Send holding acknowledgement to client',
        'Do not create matter until review complete',
      ],
    };
  }

  // ── Rule 7: High urgency (non-critical) → modify ────────────────────────
  rules.push(
    input.urgency === 'high'
      ? `R7: urgency=high → MODIFY (expedited review recommended)`
      : `R7: urgency=${input.urgency} → continue evaluation`,
  );
  if (input.urgency === 'high') {
    return {
      decision: 'MODIFY',
      reason: 'High-urgency matter — expedited review recommended',
      rules,
      confidence: 72,
      recommendedActions: [
        'Prioritise solicitor review within 4 hours',
        'Check for imminent deadlines',
      ],
    };
  }

  // ── Default: standard intake ─────────────────────────────────────────────
  rules.push('R8: all checks passed → ALLOW (standard intake pathway)');
  return {
    decision: 'ALLOW',
    reason: 'Standard intake — proceed to matter creation',
    rules,
    confidence: 88,
    recommendedActions: [
      'Create matter automatically',
      'Send confirmation email to client',
      'Assign to next available clerk',
    ],
  };
}
