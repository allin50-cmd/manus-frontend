// ============================================================================
// Alert Sweep Job
// Runs on a schedule (or manually) to inspect all monitored companies,
// generate alerts when thresholds are hit, and update status records.
//
// Thresholds: 30 days, 7 days, 1 day, overdue (0)
// ============================================================================

import { getStore } from '../store/index.js';
import { getCHAdapter } from '../adapters/ch/index.js';
import {
  computeWorstStatus,
  computeAlertTriggers,
  alertThresholdMessage,
} from '../lib/rules.js';
import { logAudit } from '../lib/audit.js';
import type { AlertType } from '../store/types.js';

interface SweepResult {
  companiesChecked: number;
  alertsCreated: number;
  errors: string[];
}

export async function runAlertSweep(): Promise<SweepResult> {
  const store = await getStore();
  const adapter = getCHAdapter();

  const result: SweepResult = {
    companiesChecked: 0,
    alertsCreated: 0,
    errors: [],
  };

  const companies = await store.getAllMonitoredCompanies();
  console.log(`[AlertSweep] Checking ${companies.length} monitored companies`);

  for (const company of companies) {
    try {
      // Refresh data from CH
      const profile = await adapter.getCompany(company.companyNumber);
      if (!profile) {
        result.errors.push(`Company ${company.companyNumber} not found in CH`);
        continue;
      }

      // Update stored company data
      await store.upsertCompany({
        companyNumber: profile.companyNumber,
        companyName: profile.companyName,
        companyStatus: profile.companyStatus,
        incorporationDate: profile.incorporationDate,
        confirmationStatementDue: profile.confirmationStatement.nextDue,
        accountsDue: profile.accounts.nextDue,
        lastOfficerChangeAt: profile.lastOfficerChangeAt,
      });

      // Define deadlines to check
      const deadlinesToCheck: Array<{ date: Date; type: AlertType; label: string }> = [];

      if (profile.confirmationStatement.nextDue) {
        deadlinesToCheck.push({
          date: new Date(profile.confirmationStatement.nextDue),
          type: 'confirmation_statement',
          label: 'Confirmation statement',
        });
      }
      if (profile.accounts.nextDue) {
        deadlinesToCheck.push({
          date: new Date(profile.accounts.nextDue),
          type: 'annual_accounts',
          label: 'Annual accounts',
        });
      }

      // Compute overall status
      const worstStatus = computeWorstStatus(
        deadlinesToCheck.map((d) => ({ date: d.date, label: d.label })),
      );

      const soonest = deadlinesToCheck.sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      )[0];

      // Update monitoring subscription
      await store.createOrUpdateMonitoring(company.id, {
        currentStatus: worstStatus.status,
        nextDeadlineAt: soonest?.date.toISOString().split('T')[0] ?? null,
        lastCheckedAt: new Date().toISOString(),
      });

      // Check alert thresholds for each deadline
      for (const deadline of deadlinesToCheck) {
        const triggers = computeAlertTriggers(deadline.date);
        const dueDateStr = deadline.date.toISOString().split('T')[0];

        for (const trigger of triggers) {
          if (!trigger.shouldTrigger) continue;

          // Avoid duplicate alerts
          const exists = await store.alertExistsForThreshold(
            company.id,
            deadline.type,
            trigger.threshold,
            dueDateStr,
          );

          if (exists) continue;

          const message = alertThresholdMessage(trigger.threshold, deadline.label);

          const alert = await store.createAlert({
            companyId: company.id,
            type: deadline.type,
            status: 'pending',
            dueDate: dueDateStr,
            triggeredAt: new Date().toISOString(),
            handledAt: null,
            thresholdDays: trigger.threshold,
            message,
          });

          await logAudit(store, {
            companyId: company.id,
            eventType: 'alert_created',
            eventSummary: `Alert created: ${message}`,
            metadata: {
              alertId: alert.id,
              type: deadline.type,
              threshold: trigger.threshold,
              dueDate: dueDateStr,
            },
          });

          result.alertsCreated++;
          console.log(`[AlertSweep] Alert created for ${company.companyName}: ${message}`);
        }
      }

      // Log status update if status changed
      await logAudit(store, {
        companyId: company.id,
        eventType: 'status_updated',
        eventSummary: `Status updated to ${worstStatus.status}: ${worstStatus.reason}`,
        metadata: { status: worstStatus.status, daysUntil: worstStatus.daysUntil },
      });

      result.companiesChecked++;
    } catch (err) {
      const msg = `Error processing ${company.companyNumber}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[AlertSweep] ${msg}`);
      result.errors.push(msg);
    }
  }

  // Log sweep completion
  if (companies.length > 0) {
    // Use first company for audit (sweep log could be global in a real system)
    const firstCompany = companies[0];
    const store2 = await getStore();
    await store2.createAuditEntry({
      companyId: firstCompany.id,
      eventType: 'sweep_run',
      eventSummary: `Alert sweep complete: ${result.companiesChecked} checked, ${result.alertsCreated} alerts created`,
      metadataJson: JSON.stringify(result),
    });
  }

  console.log(
    `[AlertSweep] Done — ${result.companiesChecked} checked, ${result.alertsCreated} alerts created, ${result.errors.length} errors`,
  );

  return result;
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

/**
 * Start the alert sweep on a recurring interval.
 * Default: every 6 hours. Configurable via SWEEP_INTERVAL_HOURS env var.
 */
export function startAlertSweepScheduler(): void {
  const hours = parseInt(process.env.SWEEP_INTERVAL_HOURS ?? '6', 10);
  const intervalMs = hours * 60 * 60 * 1000;

  console.log(`[AlertSweep] Scheduler started — running every ${hours} hours`);

  // Run immediately on startup (after a short delay for server to be ready)
  setTimeout(() => {
    runAlertSweep().catch((err) => console.error('[AlertSweep] Initial sweep failed:', err));
  }, 5000);

  // Then on interval
  setInterval(() => {
    runAlertSweep().catch((err) => console.error('[AlertSweep] Scheduled sweep failed:', err));
  }, intervalMs);
}
