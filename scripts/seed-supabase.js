const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dataDir = path.join(__dirname, '..', 'data', 'seed');

// List your JSON files here
const files = ['companies.json', 'alerts.json', /* ... */];

async function seed() {
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${file} – not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const table = path.basename(file, '.json');
    
    // Transform if needed (e.g., alerts.owner)
    const transformed = data.map(item => {
      if (table === 'alerts' && item.owner) {
        // Convert "push('sc-money')" to { action: "push", target: "sc-money" }
        const match = item.owner.match(/^(\w+)\(['"](.+)['"]\)$/);
        if (match) {
          return { ...item, owner: { action: match[1], target: match[2] } };
        }
      }
      return item;
    });

    const { error } = await supabase.from(table).insert(transformed);
    if (error) {
      console.error(`Error seeding ${table}:`, error);
    } else {
      console.log(`✅ Seeded ${transformed.length} rows into ${table}`);
    }
  }
}

seed().catch(console.error);
