// ============================================================================
// FineGuard API Routes
// Clean, typed, domain-focused endpoints for the core monitoring workflow.
// ============================================================================

import { Router, Request, Response } from 'express';
import { getCHAdapter } from '../../adapters/ch/index.js';
import { getStore } from '../../store/index.js';
import { logAudit } from '../../lib/audit.js';
import {
  computeStatus,
  computeWorstStatus,
  alertThresholdMessage,
  computeAlertTriggers,
} from '../../lib/rules.js';
import type { AlertType } from '../../store/types.js';

const router = Router();

// ─── GET /api/fg/company/search?q=... ────────────────────────────────────────

router.get('/company/search', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const adapter = getCHAdapter();
    const results = await adapter.searchCompanies(q);
    res.json({ results });
  } catch (err) {
    console.error('[FG] search error:', err);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

// ─── GET /api/fg/company/:number ─────────────────────────────────────────────

router.get('/company/:number', async (req: Request, res: Response) => {
  const { number } = req.params;
  const cleanNumber = normaliseNumber(number);

  if (!isValidCompanyNumber(cleanNumber)) {
    return res.status(400).json({ error: 'Invalid company number format' });
  }

  try {
    const adapter = getCHAdapter();
    const store = await getStore();

    const profile = await adapter.getCompany(cleanNumber);
    if (!profile) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Persist / update company record
    const company = await store.upsertCompany({
      companyNumber: profile.companyNumber,
      companyName: profile.companyName,
      companyStatus: profile.companyStatus,
      incorporationDate: profile.incorporationDate,
      confirmationStatementDue: profile.confirmationStatement.nextDue,
      accountsDue: profile.accounts.nextDue,
      lastOfficerChangeAt: profile.lastOfficerChangeAt,
    });

    // Compute status from all relevant deadlines
    const deadlines: Array<{ date: Date; label: string; type: AlertType }> = [];

    if (profile.confirmationStatement.nextDue) {
      deadlines.push({
        date: new Date(profile.confirmationStatement.nextDue),
        label: 'Confirmation statement',
        type: 'confirmation_statement',
      });
    }
    if (profile.accounts.nextDue) {
      deadlines.push({
        date: new Date(profile.accounts.nextDue),
        label: 'Annual accounts',
        type: 'annual_accounts',
      });
    }

    const worstStatus = computeWorstStatus(deadlines.map((d) => ({ date: d.date, label: d.label })));

    // Find the soonest deadline
    const soonest = deadlines.sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )[0];

    // Check if monitoring is active
    const monitoring = await store.getMonitoring(company.id);
    const isMonitored = monitoring?.monitoringEnabled ?? false;

    // Log audit event
    await logAudit(store, {
      companyId: company.id,
      eventType: 'company_checked',
      eventSummary: `Company ${profile.companyName} checked. Status: ${worstStatus.status}`,
      metadata: {
        status: worstStatus.status,
        daysUntil: worstStatus.daysUntil,
        soonestDeadline: soonest?.date.toISOString() ?? null,
      },
    });

    res.json({
      companyNumber: profile.companyNumber,
      companyName: profile.companyName,
      companyStatus: profile.companyStatus,
      incorporationDate: profile.incorporationDate,
      nextConfirmationStatementDue: profile.confirmationStatement.nextDue,
      nextAccountsDue: profile.accounts.nextDue,
      lastOfficerChangeAt: profile.lastOfficerChangeAt,
      status: worstStatus.status,
      statusLabel: worstStatus.label,
      statusReason: worstStatus.reason,
      daysUntilNextDeadline: worstStatus.daysUntil,
      nextDeadlineType: soonest?.type ?? null,
      nextDeadlineDate: soonest?.date.toISOString().split('T')[0] ?? null,
      nextDeadlineLabel: soonest?.label ?? null,
      registeredAddress: profile.registeredAddress,
      isMonitored,
      monitoringId: monitoring?.id ?? null,
      companyId: company.id,
    });
  } catch (err) {
    console.error('[FG] company lookup error:', err);
    res.status(500).json({ error: 'Failed to retrieve company information.' });
  }
});

// ─── POST /api/fg/monitoring ─────────────────────────────────────────────────

router.post('/monitoring', async (req: Request, res: Response) => {
  const { companyId } = req.body;
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  try {
    const store = await getStore();
    const company = await store.getCompanyById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Compute current status to store on monitoring record
    const deadlines: Array<{ date: Date; label: string }> = [];
    if (company.confirmationStatementDue) deadlines.push({ date: new Date(company.confirmationStatementDue), label: 'Confirmation statement' });
    if (company.accountsDue) deadlines.push({ date: new Date(company.accountsDue), label: 'Annual accounts' });

    const status = computeWorstStatus(deadlines);
    const soonest = deadlines.sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    const monitoring = await store.createOrUpdateMonitoring(companyId, {
      monitoringEnabled: true,
      currentStatus: status.status,
      nextDeadlineAt: soonest?.date.toISOString().split('T')[0] ?? null,
      lastCheckedAt: new Date().toISOString(),
    });

    await logAudit(store, {
      companyId,
      eventType: 'monitoring_started',
      eventSummary: `Monitoring started for ${company.companyName}`,
      metadata: { status: status.status },
    });

    res.json({
      ok: true,
      monitoring: {
        id: monitoring.id,
        companyId: monitoring.companyId,
        companyNumber: company.companyNumber,
        companyName: company.companyName,
        monitoringEnabled: monitoring.monitoringEnabled,
        nextDeadlineAt: monitoring.nextDeadlineAt,
        currentStatus: monitoring.currentStatus,
        lastCheckedAt: monitoring.lastCheckedAt,
        createdAt: monitoring.createdAt,
      },
    });
  } catch (err) {
    console.error('[FG] start monitoring error:', err);
    res.status(500).json({ error: 'Failed to start monitoring.' });
  }
});

// ─── GET /api/fg/monitoring/:companyId ───────────────────────────────────────

router.get('/monitoring/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const store = await getStore();
    const company = await store.getCompanyById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const monitoring = await store.getMonitoring(companyId);
    const alerts = await store.getAlertsByCompany(companyId);
    const auditLog = await store.getAuditByCompany(companyId);

    res.json({
      company: {
        id: company.id,
        companyNumber: company.companyNumber,
        companyName: company.companyName,
        companyStatus: company.companyStatus,
        confirmationStatementDue: company.confirmationStatementDue,
        accountsDue: company.accountsDue,
      },
      monitoring: monitoring
        ? {
            id: monitoring.id,
            monitoringEnabled: monitoring.monitoringEnabled,
            currentStatus: monitoring.currentStatus,
            nextDeadlineAt: monitoring.nextDeadlineAt,
            lastCheckedAt: monitoring.lastCheckedAt,
            createdAt: monitoring.createdAt,
          }
        : null,
      alerts: alerts.map(alertToDto),
      auditLog: auditLog.slice(0, 50).map(auditToDto),
    });
  } catch (err) {
    console.error('[FG] monitoring view error:', err);
    res.status(500).json({ error: 'Failed to retrieve monitoring data.' });
  }
});

// ─── DELETE /api/fg/monitoring/:companyId ────────────────────────────────────

router.delete('/monitoring/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const store = await getStore();
    const company = await store.getCompanyById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    await store.createOrUpdateMonitoring(companyId, { monitoringEnabled: false });

    await logAudit(store, {
      companyId,
      eventType: 'monitoring_stopped',
      eventSummary: `Monitoring stopped for ${company.companyName}`,
      metadata: {},
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[FG] stop monitoring error:', err);
    res.status(500).json({ error: 'Failed to stop monitoring.' });
  }
});

// ─── GET /api/fg/alerts ──────────────────────────────────────────────────────

router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const store = await getStore();
    const alerts = await store.getPendingAlerts();

    // Enrich with company name
    const enriched = await Promise.all(
      alerts.map(async (a) => {
        const company = await store.getCompanyById(a.companyId);
        return { ...alertToDto(a), companyName: company?.companyName ?? '', companyNumber: company?.companyNumber ?? '' };
      }),
    );

    res.json({ alerts: enriched });
  } catch (err) {
    console.error('[FG] alerts error:', err);
    res.status(500).json({ error: 'Failed to retrieve alerts.' });
  }
});

// ─── GET /api/fg/alerts/:companyId ───────────────────────────────────────────

router.get('/alerts/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const store = await getStore();
    const alerts = await store.getAlertsByCompany(companyId);
    const company = await store.getCompanyById(companyId);

    res.json({
      alerts: alerts.map((a) => ({
        ...alertToDto(a),
        companyName: company?.companyName ?? '',
        companyNumber: company?.companyNumber ?? '',
      })),
    });
  } catch (err) {
    console.error('[FG] company alerts error:', err);
    res.status(500).json({ error: 'Failed to retrieve alerts.' });
  }
});

// ─── PATCH /api/fg/alerts/:id/handled ────────────────────────────────────────

router.patch('/alerts/:id/handled', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const store = await getStore();
    const alert = await store.markAlertHandled(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    await logAudit(store, {
      companyId: alert.companyId,
      eventType: 'alert_handled',
      eventSummary: `Alert marked handled: ${alert.message}`,
      metadata: { alertId: id, type: alert.type },
    });

    res.json({ ok: true, alert: alertToDto(alert) });
  } catch (err) {
    console.error('[FG] mark handled error:', err);
    res.status(500).json({ error: 'Failed to mark alert as handled.' });
  }
});

// ─── GET /api/fg/history/:companyId ──────────────────────────────────────────

router.get('/history/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const store = await getStore();
    const company = await store.getCompanyById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const [alerts, auditLog, monitoring] = await Promise.all([
      store.getAlertsByCompany(companyId),
      store.getAuditByCompany(companyId),
      store.getMonitoring(companyId),
    ]);

    res.json({
      company: {
        id: company.id,
        companyNumber: company.companyNumber,
        companyName: company.companyName,
        companyStatus: company.companyStatus,
      },
      monitoring: monitoring ?? null,
      alerts: alerts.map(alertToDto),
      auditLog: auditLog.slice(0, 100).map(auditToDto),
    });
  } catch (err) {
    console.error('[FG] history error:', err);
    res.status(500).json({ error: 'Failed to retrieve history.' });
  }
});

// ─── POST /api/fg/sweep (manual trigger for dev/testing) ─────────────────────

router.post('/sweep', async (_req: Request, res: Response) => {
  try {
    const { runAlertSweep } = await import('../../jobs/alertSweep.js');
    const result = await runAlertSweep();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[FG] manual sweep error:', err);
    res.status(500).json({ error: 'Sweep failed.' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseNumber(n: string): string {
  const clean = n.replace(/\s/g, '').toUpperCase();
  if (/^\d+$/.test(clean) && clean.length < 8) return clean.padStart(8, '0');
  return clean;
}

function isValidCompanyNumber(n: string): boolean {
  return /^([A-Z]{2}\d{6}|\d{8})$/.test(n);
}

function alertToDto(a: any) {
  return {
    id: a.id,
    companyId: a.companyId,
    type: a.type,
    status: a.status,
    dueDate: a.dueDate,
    triggeredAt: a.triggeredAt,
    handledAt: a.handledAt,
    thresholdDays: a.thresholdDays,
    message: a.message,
    createdAt: a.createdAt,
  };
}

function auditToDto(e: any) {
  return {
    id: e.id,
    companyId: e.companyId,
    eventType: e.eventType,
    eventSummary: e.eventSummary,
    metadata: (() => { try { return JSON.parse(e.metadataJson); } catch { return {}; } })(),
    createdAt: e.createdAt,
  };
}

export default router;
