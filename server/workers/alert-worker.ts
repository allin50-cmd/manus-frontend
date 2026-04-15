import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { monitoredCompanies, alertsLog } from '../db/schema';
import { companiesHouseService } from '../services/companiesHouse';
import { sendComplianceAlertEmail, type ComplianceAlert } from '../services/email';

/**
 * Alert Worker
 *
 * Runs daily to check all active monitored companies against Companies House.
 * Sends email alerts for:
 *   - Any overdue filing
 *   - Any deadline within the next 30 days
 *
 * Deduplication: each alert is identified by a SHA-256 hash of
 * (companyNumber + alertType + dueDate). If the hash already exists in
 * alertsLog, the alert is skipped to prevent spam.
 */

const DAYS_UPCOMING_THRESHOLD = 30;

function makeEventHash(companyNumber: string, alertType: string, dueDate: string): string {
  return createHash('sha256')
    .update(`${companyNumber}:${alertType}:${dueDate}`)
    .digest('hex');
}

export interface AlertWorkerResult {
  companiesChecked: number;
  alertsSent: number;
  alertsSkipped: number;
  errors: number;
}

export async function runAlertWorker(): Promise<AlertWorkerResult> {
  console.log('');
  console.log('🔔 FineGuard Alert Worker – starting run');
  console.log(`   ${new Date().toISOString()}`);
  console.log('');

  const result: AlertWorkerResult = {
    companiesChecked: 0,
    alertsSent: 0,
    alertsSkipped: 0,
    errors: 0,
  };

  // Only process active subscriptions that have an email to notify
  const companies = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.status, 'active'));

  const billableCompanies = companies.filter(c => c.email);

  console.log(`   Found ${companies.length} monitored companies (${billableCompanies.length} with alert email)`);

  for (const company of billableCompanies) {
    result.companiesChecked++;

    try {
      const compliance = await companiesHouseService.getComplianceStatus(company.companyNumber);

      // Gather all alerts that should fire
      const pendingAlerts: Array<{ alert: ComplianceAlert; hash: string }> = [];

      // Overdue filings
      for (const filing of compliance.overdueFilings) {
        const hash = makeEventHash(company.companyNumber, `overdue_${filing.type}`, filing.dueDate);
        pendingAlerts.push({
          hash,
          alert: {
            alertType: `overdue_${filing.type}`,
            description: filing.description,
            dueDate: filing.dueDate,
            daysOverdue: Math.abs(filing.daysUntilDue),
            penaltyRisk: filing.penaltyRisk,
          },
        });
      }

      // Upcoming deadlines within threshold
      for (const deadline of compliance.upcomingDeadlines) {
        if (deadline.daysUntilDue <= DAYS_UPCOMING_THRESHOLD) {
          const hash = makeEventHash(
            company.companyNumber,
            `upcoming_${deadline.type}`,
            deadline.dueDate
          );
          pendingAlerts.push({
            hash,
            alert: {
              alertType: `upcoming_${deadline.type}`,
              description: deadline.description,
              dueDate: deadline.dueDate,
              daysUntilDue: deadline.daysUntilDue,
            },
          });
        }
      }

      if (pendingAlerts.length === 0) {
        console.log(`   ✅ ${company.companyName} – no alerts needed`);
        continue;
      }

      // Filter out already-sent alerts
      const newAlerts: Array<{ alert: ComplianceAlert; hash: string }> = [];
      for (const pending of pendingAlerts) {
        const [existing] = await db
          .select()
          .from(alertsLog)
          .where(eq(alertsLog.eventHash, pending.hash))
          .limit(1);

        if (existing) {
          result.alertsSkipped++;
        } else {
          newAlerts.push(pending);
        }
      }

      if (newAlerts.length === 0) {
        console.log(`   ⏭️  ${company.companyName} – ${pendingAlerts.length} alert(s) already sent`);
        continue;
      }

      // Send a single consolidated email with all new alerts
      const emailSent = await sendComplianceAlertEmail(
        company.email!,
        company.companyName,
        company.companyNumber,
        newAlerts.map(a => a.alert)
      );

      if (emailSent) {
        // Log all new alerts so we don't re-send them
        for (const { alert, hash } of newAlerts) {
          await db
            .insert(alertsLog)
            .values({
              companyNumber: company.companyNumber,
              alertType: alert.alertType,
              eventHash: hash,
            })
            .onConflictDoNothing();
        }

        result.alertsSent += newAlerts.length;
        console.log(
          `   📧 ${company.companyName} – sent ${newAlerts.length} new alert(s) to ${company.email}`
        );
      } else {
        console.warn(`   ⚠️  ${company.companyName} – email send failed`);
        result.errors++;
      }

      // Polite delay between Companies House API calls
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`   ❌ Error processing ${company.companyName}:`, err);
      result.errors++;
    }
  }

  console.log('');
  console.log('🔔 Alert Worker – run complete');
  console.log(`   Companies checked : ${result.companiesChecked}`);
  console.log(`   New alerts sent   : ${result.alertsSent}`);
  console.log(`   Duplicates skipped: ${result.alertsSkipped}`);
  console.log(`   Errors            : ${result.errors}`);
  console.log('');

  return result;
}
