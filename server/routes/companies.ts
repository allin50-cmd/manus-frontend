import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/index';
import { companies, escalationRules } from '../db/schema';
import { eq } from 'drizzle-orm';

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

// POST /api/companies
router.post('/', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const schema = z.object({ name: z.string().min(1).max(255) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const [company] = await db.insert(companies).values({ name: parsed.data.name }).returning();
    res.status(201).json(company);
  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/companies
router.get('/', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    res.json(await db.select().from(companies));
  } catch (err) {
    console.error('Error listing companies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/companies/:id
router.get('/:id', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const [company] = await db.select().from(companies).where(eq(companies.id, req.params.id));
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Escalation rules (nested under company) ───────────────────────────────

// POST /api/companies/:id/escalation-rules
router.post('/:id/escalation-rules', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const schema = z.object({
    name: z.string().min(1),
    condition: z.object({
      status: z.string().default('OPEN'),
      severity: z.string().default('HIGH'),
      min_minutes: z.number().int().min(1),
    }),
    targetStatus: z.enum(['ESCALATED', 'CRITICAL']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const [rule] = await db
      .insert(escalationRules)
      .values({ companyId: req.params.id, name: parsed.data.name, condition: parsed.data.condition, targetStatus: parsed.data.targetStatus })
      .returning();
    res.status(201).json(rule);
  } catch (err) {
    console.error('Error creating escalation rule:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/companies/:id/escalation-rules
router.get('/:id/escalation-rules', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const rules = await db.select().from(escalationRules).where(eq(escalationRules.companyId, req.params.id));
    res.json(rules);
  } catch (err) {
    console.error('Error listing escalation rules:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/companies/:id/escalation-rules/:ruleId — toggle active
router.patch('/:id/escalation-rules/:ruleId', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive (boolean) is required' });
  try {
    const [rule] = await db
      .update(escalationRules)
      .set({ isActive })
      .where(eq(escalationRules.id, req.params.ruleId))
      .returning();
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    console.error('Error updating escalation rule:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
