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

// ── Health ─────────────────────────────────────────────────────────────────
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
  const { session_id, caller, transcript } = req.body;
  if (!session_id || !caller || !transcript) {
    return res.status(400).json({ error: 'session_id, caller, and transcript are required' });
  }
  try {
    const result = await processVoiceTranscriptAI({ session_id, caller, transcript });
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
      status: (result.policy_decision === 'ESCALATE' ? 'escalated' : 'completed') as 'escalated' | 'completed',
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
router.get('/sessions', (_req: Request, res: Response) => {
  res.json(listSessions());
});

router.get('/sessions/:id', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/sessions/:id/escalate', (req: Request, res: Response) => {
  const session = updateSession(req.params.id, { status: 'escalated' });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  broadcast({ type: 'session_updated', session });
  res.json(session);
});

router.post('/sessions/:id/resolve', (req: Request, res: Response) => {
  const session = updateSession(req.params.id, { status: 'resolved' });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  broadcast({ type: 'session_updated', session });
  res.json(session);
});

router.delete('/sessions/:id', (req: Request, res: Response) => {
  if (!sessionStore.has(req.params.id)) return res.status(404).json({ error: 'Session not found' });
  sessionStore.delete(req.params.id);
  broadcast({ type: 'session_deleted', id: req.params.id });
  res.json({ ok: true });
});

// ── SSE stream ─────────────────────────────────────────────────────────────
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  addSseClient(res);
  res.write(`data: ${JSON.stringify({ type: 'init', sessions: listSessions() })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeSseClient(res);
  });
});

export default router;
