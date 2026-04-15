/**
 * POST /api/cron/dispatch-alerts
 *
 * Cron-triggered endpoint that scans every actively-monitored company,
 * fetches its live deadline data from Companies House, and fires Zapier
 * `compliance.alert` webhooks for every crossed alert window (60 / 30 / 14
 * / 7 days before due date) that has not already been dispatched.
 *
 * Authentication:
 *   Authorization: Bearer <CRON_SECRET>
 *   If CRON_SECRET is not configured the endpoint is open (dev convenience).
 *
 * Response — full JSON:
 * {
 *   "ok": true,
 *   "runAt": "2026-04-15T10:00:00.000Z",
 *   "durationMs": 1234,
 *   "summary": { "companiesActive": 3, "companiesProcessed": 3,
 *                "companiesSkipped": 0, "totalFired": 5,
 *                "totalSkipped": 12, "totalErrors": 0 },
 *   "companies": [ { ...CompanyDispatchResult } ],
 *   "errors": []
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { listActiveWithAlerts } from '@/server/repositories/monitoredCompanies.repo';
import { CompaniesHouseService } from '@/server/services/companiesHouse';
import { dispatchAlertsForCompany, type DeadlineInfo } from '@/services/deadline-dispatcher';
import { daysUntil } from '@/lib/time';
import { log } from '@/lib/logger';
import type { AlertType } from '@/types/alerts';

// ── Auth ──────────────────────────────────────────────────────────────────────

function requireCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null; // not configured — allow (useful in dev/CI)

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// ── CH profile → deadlines ────────────────────────────────────────────────────

function profileToDeadlines(
  profile: Awaited<ReturnType<InstanceType<typeof CompaniesHouseService>['getCompanyProfile']>>,
  activeAlerts: AlertType[],
): DeadlineInfo[] {
  if (!profile) return [];
  const deadlines: DeadlineInfo[] = [];

  if (
    activeAlerts.includes('accounts_filing') &&
    profile.accounts?.nextAccounts?.dueOn
  ) {
    const dueDate = profile.accounts.nextAccounts.dueOn;
    deadlines.push({ alertType: 'accounts_filing', dueDate, daysLeft: daysUntil(dueDate) });
  }

  if (
    activeAlerts.includes('confirmation_statement') &&
    profile.confirmationStatement?.nextDue
  ) {
    const dueDate = profile.confirmationStatement.nextDue;
    deadlines.push({ alertType: 'confirmation_statement', dueDate, daysLeft: daysUntil(dueDate) });
  }

  // Strike-off: fire when company status is not 'active'
  if (
    activeAlerts.includes('strike_off') &&
    profile.companyStatus !== 'active'
  ) {
    const dueDate = new Date().toISOString().slice(0, 10);
    deadlines.push({ alertType: 'strike_off', dueDate, daysLeft: 0 });
  }

  return deadlines;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  const runAt = new Date().toISOString();
  const t0 = Date.now();

  log.info('[cron/dispatch-alerts] Run started');

  const chService = new CompaniesHouseService();
  const activeCompanies = await listActiveWithAlerts();

  const companyResults = [];
  const runErrors: string[] = [];
  let companiesSkipped = 0;

  for (const company of activeCompanies) {
    if (company.activeAlerts.length === 0) {
      companiesSkipped++;
      continue;
    }

    let profile: Awaited<ReturnType<typeof chService.getCompanyProfile>>;
    try {
      profile = await chService.getCompanyProfile(company.companyNumber);
    } catch (err) {
      const msg = `CH API error for ${company.companyNumber}: ${String(err)}`;
      runErrors.push(msg);
      log.warn('[cron/dispatch-alerts] CH API error', { companyNumber: company.companyNumber, err });
      companiesSkipped++;
      continue;
    }

    if (!profile) {
      runErrors.push(`Company ${company.companyNumber} not found in Companies House`);
      companiesSkipped++;
      continue;
    }

    const deadlines = profileToDeadlines(profile, company.activeAlerts);

    if (deadlines.length === 0) {
      // No deadline data available yet (e.g. newly incorporated)
      companiesSkipped++;
      continue;
    }

    const result = await dispatchAlertsForCompany(
      company.companyNumber,
      company.companyName,
      deadlines,
    );

    companyResults.push(result);

    if (result.errors > 0) {
      result.notifications
        .filter((n) => n.error)
        .forEach((n) => runErrors.push(`${company.companyNumber}/${n.alertType}: ${n.error}`));
    }
  }

  const totalFired = companyResults.reduce((s, r) => s + r.fired, 0);
  const totalSkipped = companyResults.reduce((s, r) => s + r.skipped, 0);
  const totalErrors = companyResults.reduce((s, r) => s + r.errors, 0) + runErrors.length;
  const durationMs = Date.now() - t0;

  log.info('[cron/dispatch-alerts] Run complete', {
    durationMs,
    companiesActive: activeCompanies.length,
    companiesProcessed: companyResults.length,
    companiesSkipped,
    totalFired,
    totalSkipped,
    totalErrors,
  });

  return NextResponse.json({
    ok: totalErrors === 0,
    runAt,
    durationMs,
    summary: {
      companiesActive: activeCompanies.length,
      companiesProcessed: companyResults.length,
      companiesSkipped,
      totalFired,
      totalSkipped,
      totalErrors,
    },
    companies: companyResults,
    errors: runErrors,
  });
}
