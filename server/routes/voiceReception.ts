import { Router, Request, Response } from 'express';
import { processVoiceTranscriptAI } from '../voiceAgent';
import {
  addSession,
  addSseClient,
  broadcast,
  getSession,
  listSessions,
  removeSseClient,
  sessionStore,
  updateSession,
} from '../lib/voiceSessionStore';
import { db } from '../db/index';
import { deploymentStatus } from '../db/schema';

const router = Router();

const ADMIN_KEY = process.env.ADMIN_API_KEY;
const MAX_TRANSCRIPT_LEN = 4000;

function requireAuth(req: Request, res: Response): boolean {
  if (!ADMIN_KEY) return true;
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ── Health (public — intentionally no auth) ───────────────────────────────
router.get('/health', async (_req: Request, res: Response) => {
  try {
    await db.select().from(deploymentStatus).limit(1);
    res.json({ status: 'healthy', service: 'voice-reception', mode: 'same-origin', database: 'connected' });
  } catch {
    res.json({ status: 'degraded', service: 'voice-reception', mode: 'same-origin', database: 'disconnected' });
  }
});

// ── Process transcript ─────────────────────────────────────────────────────
router.post('/process-transcript', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { session_id, caller, transcript } = req.body;
  if (!session_id || !caller || !transcript) {
    return res.status(400).json({ error: 'session_id, caller, and transcript are required' });
  }
  if (typeof transcript !== 'string' || transcript.length > MAX_TRANSCRIPT_LEN) {
    return res.status(400).json({ error: `transcript must be a string of ≤ ${MAX_TRANSCRIPT_LEN} characters` });
  }
  if (sessionStore.has(session_id)) {
    return res.status(409).json({ error: 'session_id already exists; use a unique session_id' });
  }
  try {
    const result = await processVoiceTranscriptAI({ session_id, caller, transcript });
    const statusMap: Record<string, 'escalated' | 'denied' | 'completed'> = {
      ESCALATE: 'escalated',
      DENY: 'denied',
    };
    const session = {
      id: session_id,
      caller,
      transcript,
      intent: result.intent,
      risk_level: result.risk_level,
      policy_decision: result.policy_decision,
      next_action: result.next_action,
      audit_event_id: result.audit_event_id,
      events: result.events,
      ai_reasoning: result.ai_reasoning,
      ai_model: result.ai_model,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: (statusMap[result.policy_decision] ?? 'completed') as 'escalated' | 'denied' | 'completed',
    };
    addSession(session);
    broadcast({ type: 'session_created', session });
    res.json({
      intent: result.intent,
      risk_level: result.risk_level,
      policy_decision: result.policy_decision,
      next_action: result.next_action,
      audit_event_id: result.audit_event_id,
    });
  } catch (err) {
    console.error('[voiceReception] process-transcript error:', err);
    res.status(500).json({ error: 'Failed to process transcript' });
  }
});

// ── Sessions ───────────────────────────────────────────────────────────────
router.get('/sessions', (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  res.json(listSessions());
});

router.get('/sessions/:id', (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/sessions/:id/escalate', (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const session = updateSession(req.params.id, { status: 'escalated' });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  broadcast({ type: 'session_updated', session });
  res.json(session);
});

router.post('/sessions/:id/resolve', (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const session = updateSession(req.params.id, { status: 'resolved' });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  broadcast({ type: 'session_updated', session });
  res.json(session);
});

router.delete('/sessions/:id', (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  if (!sessionStore.has(req.params.id)) return res.status(404).json({ error: 'Session not found' });
  sessionStore.delete(req.params.id);
  broadcast({ type: 'session_deleted', id: req.params.id });
  res.json({ ok: true });
});

// ── SSE stream ─────────────────────────────────────────────────────────────
router.get('/stream', (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Write init payload before registering — if it throws the client is never added
  try {
    res.write(`data: ${JSON.stringify({ type: 'init', sessions: listSessions() })}\n\n`);
  } catch {
    return;
  }

  addSseClient(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      removeSseClient(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeSseClient(res);
  });
});

export default router;
