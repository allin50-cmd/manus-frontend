import crypto from 'node:crypto';
import { db } from '../db/index';
import { governancePolicies, governanceDecisions, rateLimitCounters } from '../db/schema';
import { eq, and, gt, lt, count } from 'drizzle-orm';

export type GovernanceDecisionValue = 'ALLOW' | 'DENY' | 'ALLOW_WITH_CONDITIONS' | 'ESCALATE';

export interface GovernanceResult {
  decision: GovernanceDecisionValue;
  reason: string;
  conditions: string[];
  decisionId: string;
  requestDigest: string;
}

interface HardBlockConfig   { patterns: string[] }
interface RateLimitConfig   { max_rpm: number; window_seconds: number }
interface AllowlistConfig   { resources: string[] }
interface ConditionConfig   { conditions: string[] }

// Module-level cache — shared across all requests in the same process
const CACHE_TTL_MS = 5000;
let _cache: { policies: PolicyRow[]; ts: number } | null = null;

interface PolicyRow {
  id: string;
  name: string;
  ruleType: string;
  ruleConfig: unknown;
  priority: number;
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(obj).sort().map((k) => [k, canonicalize(obj[k])]),
  );
}

export class PolicyEngine {
  async evaluate(opts: {
    agentId: string;
    sessionId: string;
    actionType: string;
    targetResource: string;
    parameters: Record<string, unknown>;
  }): Promise<GovernanceResult> {
    const { agentId, sessionId, actionType, targetResource, parameters } = opts;

    // 1. Canonical request digest — sort all object keys recursively so the
    //    digest is stable regardless of insertion order in `parameters`.
    const payload = JSON.stringify(canonicalize({ agent_id: agentId, session_id: sessionId, action_type: actionType, target_resource: targetResource, parameters }));
    const requestDigest = crypto.createHash('sha256').update(payload).digest('hex');

    // 2. Load active policies (TTL-cached)
    const policies = await this._loadPolicies();

    // 3. Evaluate in priority order — first DENY terminates the loop
    const conditions: string[] = [];
    const denyReasons: string[] = [];

    for (const policy of policies) {
      const cfg = policy.ruleConfig as Record<string, unknown>;

      if (policy.ruleType === 'hard_block') {
        if (this._matchHardBlock(cfg as HardBlockConfig, targetResource, parameters)) {
          denyReasons.push(`Hard block policy '${policy.name}' matches.`);
          break;
        }
      } else if (policy.ruleType === 'rate_limit') {
        if (await this._checkRateLimit(agentId, cfg as RateLimitConfig)) {
          denyReasons.push(`Rate limit exceeded (${policy.name}).`);
          break;
        }
      } else if (policy.ruleType === 'resource_allowlist') {
        if (!(cfg as AllowlistConfig).resources.includes(targetResource)) {
          denyReasons.push(`Resource not in allowlist '${policy.name}'.`);
          break;
        }
      } else if (policy.ruleType === 'condition_always') {
        conditions.push(...((cfg as ConditionConfig).conditions ?? []));
      }
    }

    // 4. Compose decision
    let decision: GovernanceDecisionValue;
    let reason: string;

    if (denyReasons.length > 0) {
      decision = 'DENY';
      reason = denyReasons.join('; ');
    } else if (conditions.length > 0) {
      decision = 'ALLOW_WITH_CONDITIONS';
      reason = 'Conditions apply.';
    } else {
      decision = 'ALLOW';
      reason = 'All policies passed.';
    }

    // 5. Cryptographic decision ID
    const material = `${requestDigest}:${decision}:${new Date().toISOString()}`;
    const decisionId = crypto.createHash('sha256').update(material).digest('hex').slice(0, 16);

    // 6. Persist audit record — fire-and-forget (never block the request on audit failure)
    this._recordDecision({ decisionId, requestDigest, agentId, sessionId, actionType, targetResource, decision, conditions, reason }).catch(
      (err) => console.error('[governance] audit write failed:', err),
    );

    return { decision, reason, conditions, decisionId, requestDigest };
  }

  private async _loadPolicies(): Promise<PolicyRow[]> {
    const now = Date.now();
    if (_cache && now - _cache.ts < CACHE_TTL_MS) return _cache.policies;

    const rows = await db
      .select({
        id: governancePolicies.id,
        name: governancePolicies.name,
        ruleType: governancePolicies.ruleType,
        ruleConfig: governancePolicies.ruleConfig,
        priority: governancePolicies.priority,
      })
      .from(governancePolicies)
      .where(eq(governancePolicies.isActive, true))
      .orderBy(governancePolicies.priority);

    _cache = { policies: rows as PolicyRow[], ts: now };
    return _cache.policies;
  }

  private _matchHardBlock(cfg: HardBlockConfig, targetResource: string, params: Record<string, unknown>): boolean {
    const patterns = cfg.patterns ?? [];
    if (patterns.some((p) => targetResource.includes(p))) return true;
    // Also check transcript body for blocked term patterns
    const transcript = typeof params['transcript'] === 'string' ? params['transcript'].toLowerCase() : '';
    return transcript.length > 0 && patterns.some((p) => transcript.includes(p.toLowerCase()));
  }

  private async _checkRateLimit(agentId: string, cfg: RateLimitConfig): Promise<boolean> {
    const maxRpm = cfg.max_rpm ?? 60;
    const windowSeconds = cfg.window_seconds ?? 60;
    const windowStart = new Date(Date.now() - windowSeconds * 1000);

    // Insert a tick — log failures (don't silently swallow connection errors)
    await db.insert(rateLimitCounters).values({ agentId, bucket: 'rpm' }).catch((err) => {
      console.error('[governance] rate-limit tick insert failed:', err);
    });

    // Count ticks in the current window
    const [row] = await db
      .select({ count: count() })
      .from(rateLimitCounters)
      .where(and(eq(rateLimitCounters.agentId, agentId), eq(rateLimitCounters.bucket, 'rpm'), gt(rateLimitCounters.requestTime, windowStart)));

    // Prune expired rows for this agent to keep the table bounded
    db.delete(rateLimitCounters)
      .where(and(eq(rateLimitCounters.agentId, agentId), eq(rateLimitCounters.bucket, 'rpm'), lt(rateLimitCounters.requestTime, windowStart)))
      .catch((err) => console.error('[governance] rate-limit cleanup failed:', err));

    return (row?.count ?? 0) > maxRpm;
  }

  private async _recordDecision(opts: {
    decisionId: string;
    requestDigest: string;
    agentId: string;
    sessionId: string;
    actionType: string;
    targetResource: string;
    decision: GovernanceDecisionValue;
    conditions: string[];
    reason: string;
  }): Promise<void> {
    await db.insert(governanceDecisions).values({
      decisionId: opts.decisionId,
      requestDigest: opts.requestDigest,
      agentId: opts.agentId,
      sessionId: opts.sessionId,
      actionType: opts.actionType,
      targetResource: opts.targetResource,
      decision: opts.decision,
      policyId: 'composite',
      conditions: opts.conditions,
      reason: opts.reason,
      decidedAt: new Date(),
    });
  }

  /** Call after any policy create/update/delete so the next request sees fresh rules. */
  static invalidateCache(): void {
    _cache = null;
  }
}

export const policyEngine = new PolicyEngine();
