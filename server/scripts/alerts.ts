#!/usr/bin/env tsx
// ============================================================================
// CLI: Run Alert Sweep
// Usage: npm run alerts
// ============================================================================

import 'dotenv/config';
import { runAlertSweep } from '../jobs/alertSweep.js';

(async () => {
  try {
    console.log('\nRunning alert sweep…\n');
    const result = await runAlertSweep();

    console.log('─'.repeat(50));
    console.log(`Companies checked: ${result.companiesChecked}`);
    console.log(`Alerts created:    ${result.alertsCreated}`);
    if (result.errors.length > 0) {
      console.log(`Errors:            ${result.errors.length}`);
      result.errors.forEach((e) => console.log(`  • ${e}`));
    }
    console.log('─'.repeat(50));
    console.log('✓ Sweep complete\n');
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
