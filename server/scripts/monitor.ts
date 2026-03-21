#!/usr/bin/env tsx
// ============================================================================
// CLI: Start Monitoring a Company
// Usage: npm run monitor -- 00000001
// ============================================================================

import 'dotenv/config';
import { getCHAdapter } from '../adapters/ch/index.js';
import { getStore } from '../store/index.js';
import { computeWorstStatus } from '../lib/rules.js';
import { logAudit } from '../lib/audit.js';

const query = process.argv[2];

if (!query) {
  console.error('Usage: npm run monitor -- <company-number>');
  process.exit(1);
}

(async () => {
  try {
    const adapter = getCHAdapter();
    const store = await getStore();

    console.log(`\nStarting monitoring for: ${query}\n`);

    const profile = await adapter.getCompany(query);
    if (!profile) {
      console.error('Company not found.');
      process.exit(1);
    }

    const company = await store.upsertCompany({
      companyNumber: profile.companyNumber,
      companyName: profile.companyName,
      companyStatus: profile.companyStatus,
      incorporationDate: profile.incorporationDate,
      confirmationStatementDue: profile.confirmationStatement.nextDue,
      accountsDue: profile.accounts.nextDue,
      lastOfficerChangeAt: profile.lastOfficerChangeAt,
    });

    const deadlines: Array<{ date: Date; label: string }> = [];
    if (profile.confirmationStatement.nextDue) {
      deadlines.push({ date: new Date(profile.confirmationStatement.nextDue), label: 'Confirmation statement' });
    }
    if (profile.accounts.nextDue) {
      deadlines.push({ date: new Date(profile.accounts.nextDue), label: 'Annual accounts' });
    }

    const status = computeWorstStatus(deadlines);
    const soonest = deadlines.sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    const monitoring = await store.createOrUpdateMonitoring(company.id, {
      monitoringEnabled: true,
      currentStatus: status.status,
      nextDeadlineAt: soonest?.date.toISOString().split('T')[0] ?? null,
      lastCheckedAt: new Date().toISOString(),
    });

    await logAudit(store, {
      companyId: company.id,
      eventType: 'monitoring_started',
      eventSummary: `Monitoring started via CLI for ${company.companyName}`,
      metadata: { status: status.status },
    });

    console.log('─'.repeat(50));
    console.log(`Company:  ${profile.companyName}`);
    console.log(`ID:       ${company.id}`);
    console.log(`Status:   ${status.label.toUpperCase()}`);
    console.log(`Reason:   ${status.reason}`);
    console.log(`Monitor:  ${monitoring.id}`);
    console.log('─'.repeat(50));
    console.log('✓ Monitoring started');
    console.log('');
    console.log('Run "npm run alerts" to see generated alerts.');
    console.log('');
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
