import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { governancePolicies, governanceDecisions } from '../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { PolicyEngine } from '../governance/policyEngine';

const router = Router();

const ADMIN_KEY = process.env.ADMIN_API_KEY;

function requireAuth(req: Request, res: Response): boolean {
  if (!ADMIN_KEY) return true;
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ── Policies ──────────────────────────────────────────────────────────────────

router.get('/policies', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const rows = await db.select().from(governancePolicies).orderBy(governancePolicies.priority);
    res.json(rows);
  } catch (err) {
    console.error('[governance] list policies error:', err);
    res.status(500).json({ error: 'Failed to list policies' });
  }
});

router.post('/policies', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { name, description, ruleType, ruleConfig, priority } = req.body as Record<string, unknown>;
  if (!name || !ruleType || !ruleConfig) {
    return res.status(400).json({ error: 'name, ruleType, and ruleConfig are required' });
  }
  const VALID_TYPES = new Set(['hard_block', 'rate_limit', 'resource_allowlist', 'condition_always']);
  if (!VALID_TYPES.has(ruleType as string)) {
    return res.status(400).json({ error: `ruleType must be one of: ${[...VALID_TYPES].join(', ')}` });
  }
  try {
    const [row] = await db
      .insert(governancePolicies)
      .values({
        name: name as string,
        description: (description as string) ?? null,
        ruleType: ruleType as string,
        ruleConfig: ruleConfig as Record<string, unknown>,
        priority: typeof priority === 'number' ? priority : 100,
      })
      .returning();
    PolicyEngine.invalidateCache();
    res.status(201).json(row);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'A policy with that name already exists' });
    }
    console.error('[governance] create policy error:', err);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

router.patch('/policies/:id', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const { name, description, ruleType, ruleConfig, priority, isActive } = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined)        patch.name = name;
  if (description !== undefined) patch.description = description;
  if (ruleType !== undefined)    patch.ruleType = ruleType;
  if (ruleConfig !== undefined)  patch.ruleConfig = ruleConfig;
  if (priority !== undefined)    patch.priority = priority;
  if (isActive !== undefined)    patch.isActive = isActive;

  try {
    const [row] = await db
      .update(governancePolicies)
      .set(patch as Parameters<typeof db.update>[0])
      .where(eq(governancePolicies.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: 'Policy not found' });
    PolicyEngine.invalidateCache();
    res.json(row);
  } catch (err) {
    console.error('[governance] update policy error:', err);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

router.delete('/policies/:id', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const [row] = await db
      .update(governancePolicies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(governancePolicies.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ error: 'Policy not found' });
    PolicyEngine.invalidateCache();
    res.json({ ok: true, id: row.id });
  } catch (err) {
    console.error('[governance] delete policy error:', err);
    res.status(500).json({ error: 'Failed to deactivate policy' });
  }
});

// ── Decisions (audit trail) ───────────────────────────────────────────────────

router.get('/decisions', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 200);
  const agentId = req.query['agent_id'] as string | undefined;
  const since = req.query['since'] as string | undefined;

  try {
    let query = db.select().from(governanceDecisions);
    if (agentId && since) {
      query = query.where(and(eq(governanceDecisions.agentId, agentId), gte(governanceDecisions.decidedAt, new Date(since)))) as typeof query;
    } else if (agentId) {
      query = query.where(eq(governanceDecisions.agentId, agentId)) as typeof query;
    } else if (since) {
      query = query.where(gte(governanceDecisions.decidedAt, new Date(since))) as typeof query;
    }
    const rows = await query.orderBy(desc(governanceDecisions.decidedAt)).limit(limit);
    res.json(rows);
  } catch (err) {
    console.error('[governance] list decisions error:', err);
    res.status(500).json({ error: 'Failed to list decisions' });
  }
});

export default router;
