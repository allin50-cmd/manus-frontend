import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { auditLeads } from '../db/schema.js';
import { sendAuditReady, sendAgentMessage } from '../services/emailService.js';
import { runSalesAgent } from '../services/salesAgent.js';
import { fire } from '../services/zapierWebhook.js';
import type { AuditJobData } from '../queue/fgQueue.js';

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

export const auditWorker = new Worker<AuditJobData>(
  'fineguard-jobs',
  async (job) => {
    const data = job.data;
    console.log(`[auditWorker] Processing job ${job.id} for ${data.email}`);

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    // ── Step 1: Send audit-ready email ────────────────────────────────────────
    try {
      await sendAuditReady(data.email, data.companyName ?? '', data.tenantId, appUrl);
    } catch (err) {
      console.error('[auditWorker] sendAuditReady failed:', (err as Error).message);
    }

    // ── Step 2: Fire Zapier new_audit_lead trigger (non-blocking) ────────────
    fire('new_audit_lead', {
      id: data.leadId ?? null,
      tenantId: data.tenantId,
      email: data.email,
      name: data.companyName ?? null,
      chamberSize: data.chamberSize ?? null,
      painPoints: data.painPoints ? JSON.parse(data.painPoints) : [],
      stage: 'signed_up',
      createdAt: new Date().toISOString(),
    }).catch((err: Error) => console.error('[zapier] fire new_audit_lead error:', err));

    // ── Step 3: Run sales agent ───────────────────────────────────────────────
    const agentMode = process.env.AGENT_MODE ?? 'shadow';

    const decision = await runSalesAgent({
      id: data.leadId ?? data.tenantId,
      email: data.email,
      name: data.companyName ?? null,
      chamberSize: data.chamberSize ?? null,
      painPoints: data.painPoints ?? null,
    }).catch((err: Error) => {
      console.error('[salesAgent] error:', err);
      return null;
    });

    if (decision) {
      // Persist agent decision back to the DB (best-effort)
      if (data.leadId) {
        try {
          await db
            .update(auditLeads)
            .set({ agentDecision: JSON.stringify(decision) })
            .where(eq(auditLeads.id, data.leadId));
        } catch (err) {
          console.error('[auditWorker] failed to persist agentDecision:', (err as Error).message);
        }
      }

      if (agentMode === 'shadow') {
        console.log('[salesAgent] shadow decision:', decision);
      } else if (decision.action === 'negotiate' || decision.action === 'close') {
        try {
          await sendAgentMessage(data.email, 'Your chambers recovery plan', decision.message);
        } catch (err) {
          console.error('[auditWorker] sendAgentMessage failed:', (err as Error).message);
        }
        if (decision.action === 'close') {
          fire('deal_closed', {
            email: data.email,
            priceMonthly: decision.priceMonthly,
            closedAt: new Date().toISOString(),
          }).catch((err: Error) => console.error('[zapier] fire deal_closed error:', err));
        }
      } else if (decision.action === 'escalate') {
        console.warn('[salesAgent] escalation needed for', data.email, ':', decision.reasoning);
        fire('deal_escalated', {
          email: data.email,
          reason: decision.reasoning,
          agentAction: 'escalate',
          priceMonthly: decision.priceMonthly,
          escalatedAt: new Date().toISOString(),
        }).catch((err: Error) => console.error('[zapier] fire deal_escalated error:', err));
      }
    }
  },
  { connection, concurrency: 5 }
);

auditWorker.on('completed', (job) => console.log(`[auditWorker] ${job.id} completed`));
auditWorker.on('failed', (job, err) => console.error(`[auditWorker] ${job?.id} failed:`, err.message));
