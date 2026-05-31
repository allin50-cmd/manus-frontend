import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, pgClient } from '../db/index';
import { alerts, alertEvents, companies } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { replayState, type AlertEvent } from '../lib/events';

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

function createdBy(req: Request): string {
  return (req.headers['x-admin-key'] as string) || 'api';
}

// POST /api/alerts — create alert + CREATED event
router.post('/', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const schema = z.object({
    companyId: z.string().uuid(),
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    source: z.enum(['voice_agent', 'api', 'manual', 'system']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { companyId, title, description, source, severity } = parsed.data;

  try {
    let alert: typeof alerts.$inferSelect;
    let event: typeof alertEvents.$inferSelect;

    await pgClient.begin(async sql => {
      const [a] = await sql`
        INSERT INTO alerts (company_id, title, description, source, severity, status, status_changed_at)
        VALUES (${companyId}, ${title}, ${description ?? null}, ${source}, ${severity}, 'OPEN', now())
        RETURNING *
      `;
      alert = a;
      const [e] = await sql`
        INSERT INTO alert_events (alert_id, company_id, event_type, previous_value, new_value, created_by)
        VALUES (${a.id}, ${companyId}, 'CREATED', '{}', ${JSON.stringify({ title, description, source, severity, status: 'OPEN' })}, ${createdBy(req)})
        RETURNING *
      `;
      event = e;
    });

    res.status(201).json({ alert: alert!, event: event! });
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alerts?companyId=&status= — list alerts
router.get('/', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { companyId, status } = req.query;
  if (!companyId || typeof companyId !== 'string') return res.status(400).json({ error: 'companyId is required' });

  try {
    let rows = await db.select().from(alerts).where(eq(alerts.companyId, companyId));
    if (status && typeof status === 'string') rows = rows.filter(a => a.status === status);
    res.json(rows);
  } catch (err) {
    console.error('Error listing alerts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alerts/:alertId?companyId= — get alert with events and replay
router.get('/:alertId', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { alertId } = req.params;
  const { companyId } = req.query;
  if (!companyId || typeof companyId !== 'string') return res.status(400).json({ error: 'companyId is required' });

  try {
    const [alert] = await db.select().from(alerts).where(and(eq(alerts.id, alertId), eq(alerts.companyId, companyId)));
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const events = await pgClient<AlertEvent[]>`
      SELECT * FROM alert_events WHERE alert_id = ${alertId} ORDER BY created_at
    `;

    res.json({ alert, events, replayedState: replayState(events) });
  } catch (err) {
    console.error('Error fetching alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alerts/:alertId/acknowledge
router.post('/:alertId/acknowledge', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { alertId } = req.params;
  const { companyId } = req.body;
  if (!companyId) return res.status(400).json({ error: 'companyId is required' });

  try {
    await pgClient.begin(async sql => {
      const [alert] = await sql`
        SELECT * FROM alerts WHERE id = ${alertId} AND company_id = ${companyId} FOR UPDATE
      `;
      if (!alert) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
      const newOwner = alert.owner_id || createdBy(req);
      await sql`
        UPDATE alerts
        SET acknowledged_at = now(),
            owner_id = COALESCE(owner_id, ${newOwner}),
            updated_at = now()
        WHERE id = ${alertId}
      `;
      await sql`
        INSERT INTO alert_events (alert_id, company_id, event_type, previous_value, new_value, created_by)
        VALUES (${alertId}, ${companyId}, 'ACKNOWLEDGED',
          ${JSON.stringify({ acknowledged_at: null, owner_id: alert.owner_id })},
          ${JSON.stringify({ acknowledged_at: new Date().toISOString(), owner_id: newOwner })},
          ${createdBy(req)})
      `;
    });
    res.json({ success: true });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND') return res.status(404).json({ error: 'Alert not found' });
    console.error('Error acknowledging alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alerts/:alertId/escalate
router.post('/:alertId/escalate', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { alertId } = req.params;
  const schema = z.object({
    companyId: z.string().uuid(),
    targetStatus: z.enum(['ESCALATED', 'CRITICAL']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { companyId, targetStatus } = parsed.data;

  try {
    await pgClient.begin(async sql => {
      const [alert] = await sql`
        SELECT * FROM alerts WHERE id = ${alertId} AND company_id = ${companyId} FOR UPDATE
      `;
      if (!alert) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
      await sql`
        UPDATE alerts
        SET status = ${targetStatus}, status_changed_at = now(), updated_at = now()
        WHERE id = ${alertId}
      `;
      await sql`
        INSERT INTO alert_events (alert_id, company_id, event_type, previous_value, new_value, created_by)
        VALUES (${alertId}, ${companyId}, 'ESCALATED',
          ${JSON.stringify({ status: alert.status })},
          ${JSON.stringify({ status: targetStatus })},
          ${createdBy(req)})
      `;
    });
    res.json({ success: true });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND') return res.status(404).json({ error: 'Alert not found' });
    console.error('Error escalating alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alerts/:alertId/close
router.post('/:alertId/close', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { alertId } = req.params;
  const { companyId } = req.body;
  if (!companyId) return res.status(400).json({ error: 'companyId is required' });

  try {
    await pgClient.begin(async sql => {
      const [alert] = await sql`
        SELECT * FROM alerts WHERE id = ${alertId} AND company_id = ${companyId} FOR UPDATE
      `;
      if (!alert) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
      await sql`
        UPDATE alerts SET status = 'CLOSED', status_changed_at = now(), updated_at = now()
        WHERE id = ${alertId}
      `;
      await sql`
        INSERT INTO alert_events (alert_id, company_id, event_type, previous_value, new_value, created_by)
        VALUES (${alertId}, ${companyId}, 'CLOSED',
          ${JSON.stringify({ status: alert.status })},
          ${JSON.stringify({ status: 'CLOSED' })},
          ${createdBy(req)})
      `;
    });
    res.json({ success: true });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND') return res.status(404).json({ error: 'Alert not found' });
    console.error('Error closing alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
