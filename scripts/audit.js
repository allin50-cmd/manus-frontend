const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const expected = {
  companies: 7,
  deadlines: 12,
  alerts: 8,
  recipients: 3,
  settings: 1,
};

async function audit() {
  console.log('🔍 Running data audit...\n');

  for (const [table, expectedCount] of Object.entries(expected)) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ Error counting ${table}:`, error.message);
      continue;
    }

    const actualCount = count ?? 0;
    const status = actualCount === expectedCount ? '✅' : '⚠️';
    console.log(`${status} ${table}: expected ${expectedCount}, got ${actualCount}`);
  }

  console.log('\n📋 To check foreign key integrity, run these SQL queries in the Supabase dashboard:');
  console.log(`
-- Check orphaned alerts (deadline_id doesn't exist)
SELECT a.id, a.deadline_id
FROM alerts a
LEFT JOIN deadlines d ON a.deadline_id = d.id
WHERE d.id IS NULL;

-- Check orphaned deadlines (company_id doesn't exist)
SELECT d.id, d.company_id
FROM deadlines d
LEFT JOIN companies c ON d.company_id = c.id
WHERE c.id IS NULL;

-- Check for duplicate route (if you have route column)
SELECT route, COUNT(*) FROM companies GROUP BY route HAVING COUNT(*) > 1;

-- Verify settings is a JSON object
SELECT jsonb_typeof(settings) FROM settings;
  `);
  console.log('\n✅ Count audit complete.');
}

audit().catch(console.error);
