#!/usr/bin/env tsx
// ============================================================================
// CLI: Check a Company
// Usage: npm run check -- 00000001
// ============================================================================

import 'dotenv/config';
import { getCHAdapter } from '../adapters/ch/index.js';
import { computeWorstStatus } from '../lib/rules.js';

const query = process.argv[2];

if (!query) {
  console.error('Usage: npm run check -- <company-number>');
  process.exit(1);
}

(async () => {
  try {
    const adapter = getCHAdapter();
    console.log(`\nLooking up company: ${query}\n`);

    const profile = await adapter.getCompany(query);
    if (!profile) {
      console.error('Company not found.');
      process.exit(1);
    }

    console.log('─'.repeat(50));
    console.log(`Company:  ${profile.companyName}`);
    console.log(`Number:   ${profile.companyNumber}`);
    console.log(`Status:   ${profile.companyStatus}`);
    if (profile.incorporationDate) {
      console.log(`Incorporated: ${profile.incorporationDate}`);
    }
    console.log('─'.repeat(50));

    const deadlines: Array<{ date: Date; label: string }> = [];

    if (profile.confirmationStatement.nextDue) {
      const d = new Date(profile.confirmationStatement.nextDue);
      deadlines.push({ date: d, label: 'Confirmation statement' });
      console.log(`CS due:   ${profile.confirmationStatement.nextDue}`);
    }

    if (profile.accounts.nextDue) {
      const d = new Date(profile.accounts.nextDue);
      deadlines.push({ date: d, label: 'Annual accounts' });
      console.log(`Accounts: ${profile.accounts.nextDue}`);
    }

    const status = computeWorstStatus(deadlines);
    console.log('─'.repeat(50));
    console.log(`Status:   ${status.label.toUpperCase()}`);
    console.log(`Reason:   ${status.reason}`);
    if (status.deadlineLabel) {
      console.log(`Deadline: ${status.deadlineLabel}`);
    }
    console.log('─'.repeat(50));
    console.log('');
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
