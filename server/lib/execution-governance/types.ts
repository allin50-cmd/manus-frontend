import type { InsertAuditEvent } from '../../drizzle/schema';

// ─── Core enumerations ────────────────────────────────────────────────────────

export type ExecutionDomain =
  | 'compliance_workflow'
  | 'payment_approval'
  | 'document_release'
  | 'ai_call_centre';

export type ExecutionDecision = 'ALLOW' | 'MODIFY' | 'ESCALATE' | 'DENY';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Adaptive system state — narrows allowed action as uncertainty increases.
 *
 * GREEN  full automation allowed
 * AMBER  assisted automation only (high-confidence paths only)
 * RED    execution blocked; human review required
 * BLACK  read-only / audit-only; no mutations
 */
export type SystemState = 'GREEN' | 'AMBER' | 'RED' | 'BLACK';

// ─── Reason codes ─────────────────────────────────────────────────────────────

export type ReasonCode =
  | 'LOW_CONFIDENCE'
  | 'CRITICAL_RISK'
  | 'PAYMENT_THRESHOLD_EXCEEDED'
  | 'CONFIDENTIAL_DATA_DETECTED'
  | 'CALL_CENTRE_RESTRICTED_ACTION'
  | 'JURISDICTION_MISSING'
  | 'SYSTEM_STATE_AMBER'
  | 'SYSTEM_STATE_RED'
  | 'SYSTEM_STATE_BLACK'
  | 'POLICY_ALLOW';

// ─── Inbound event ────────────────────────────────────────────────────────────

export interface GovernanceEvent {
  /** Unique event ID (caller supplies or use crypto.randomUUID) */
  id: string;
  /** Which governance boundary this event crosses */
  domain: ExecutionDomain;
  /** Human or system actor requesting execution */
  actor: string;
  /** Originating system or channel */
  source: string;
  /** Verb describing the requested action */
  actionRequested: string;
  /** Short human-readable summary of the input data */
  inputSummary: string;
  /** 0.0 – 1.0; model or system confidence in the proposed action */
  confidenceScore: number;
  riskLevel: RiskLevel;
  /** ISO 3166-1 alpha-2 or BCP 47 region code; null when unknown */
  jurisdiction: string | null;
  clientId: string;
  createdAt: string; // ISO 8601
  /** Domain-specific payload (payment amount, document flags, call intent, etc.) */
  payload?: Record<string, unknown>;
}

// ─── Client policy ────────────────────────────────────────────────────────────

export interface ClientPolicy {
  clientId: string;
  /** Payment approval: escalate if amount (in pence/smallest unit) exceeds this */
  paymentApprovalThresholdPence?: number;
  /** Document release: patterns that mark a document as confidential */
  confidentialDataPatterns?: string[];
  /**
   * Human override is active for this client — lifts the DENY on critical risk.
   * Must be set explicitly; never assumed.
   */
  humanOverrideActive?: boolean;
  /** Minimum confidence score this client requires before allowing automation */
  minimumConfidenceScore?: number;
}

// ─── Decision output ──────────────────────────────────────────────────────────

export interface GovernanceDecision {
  decision: ExecutionDecision;
  reasonCodes: ReasonCode[];
  /** Specific actions the caller must take before proceeding (e.g. 'require_human_review') */
  requiredActions: string[];
  /** True when a human must review before any action executes */
  humanReviewRequired: boolean;
  /** VaultLine-ready audit payload — pass to writeAuditEvent() */
  vaultLineEvent: VaultLineAuditPayload;
  createdAt: string; // ISO 8601
}

/**
 * Subset of InsertAuditEvent fields that the governance module produces.
 *
 * The caller is responsible for supplying tenantId before persisting —
 * governance does not know the tenant at evaluation time.
 */
export type VaultLineAuditPayload = Omit<InsertAuditEvent, 'tenantId' | 'id' | 'createdAt'>;
