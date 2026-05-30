import type { Request, Response, NextFunction } from 'express';
import { policyEngine, type GovernanceResult } from './policyEngine';

// Extend Express Request so downstream handlers can read the pre-evaluated decision
declare global {
  namespace Express {
    interface Request {
      governanceDecision?: GovernanceResult;
    }
  }
}

/**
 * Returns an Express middleware that evaluates governance policies for each
 * matching request.  protectedPaths are matched against req.path (relative to
 * the router mount point).  Only POST requests on matched paths are governed.
 *
 * On DENY  → 403 JSON + short-circuits the request.
 * On error → 403 JSON (fail-closed).
 * Otherwise → attaches result to req.governanceDecision and sets response
 *              headers X-Governance-Decision-ID / -Decision / -Request-Digest.
 */
export function governanceMiddleware(protectedPaths: string[] = ['/process-transcript']) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only govern listed paths; pass everything else straight through
    if (!protectedPaths.includes(req.path) || req.method !== 'POST') {
      return next();
    }

    const agentId = (req.headers['x-agent-id'] as string | undefined) ?? 'anonymous';
    const sessionId =
      (req.headers['x-session-id'] as string | undefined) ??
      ((req.body as Record<string, unknown>)?.session_id as string | undefined) ??
      'unknown';
    const actionType = (req.headers['x-action-type'] as string | undefined) ?? 'PROCESS_TRANSCRIPT';
    const targetResource = req.path;
    const parameters: Record<string, unknown> =
      req.body !== null && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

    try {
      const result = await policyEngine.evaluate({ agentId, sessionId, actionType, targetResource, parameters });

      req.governanceDecision = result;

      if (result.decision === 'DENY') {
        res.status(403).json({
          error: 'Action denied by governance policy',
          decision_id: result.decisionId,
          reason: result.reason,
        });
        return;
      }

      // Attach traceability headers before passing through
      res.setHeader('X-Governance-Decision-ID', result.decisionId);
      res.setHeader('X-Governance-Decision', result.decision);
      res.setHeader('X-Governance-Request-Digest', result.requestDigest);

      next();
    } catch (err) {
      console.error('[governance] engine error — failing closed:', err);
      res.status(403).json({ error: 'Governance engine unavailable', reason: 'Fail-closed' });
    }
  };
}
