/**
 * FineGuard Pro — Database Migration Runner
 *
 * Executes every *.sql file in db/migrations/ in lexicographic order.
 * Tracks applied migrations in a _migrations table so each file runs once.
 *
 * Usage:
 *   npx tsx src/scripts/migrate.ts
 *   # or via npm script:
 *   npm run db:migrate
 *
 * Env: DATABASE_URL must be set.
 */

import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), 'db', 'migrations');

async function main(): Promise<void> {
  const sql = postgres(DATABASE_URL!, { max: 1, connect_timeout: 15 });

  try {
    // Bootstrap tracking table — idempotent
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL      PRIMARY KEY,
        filename    TEXT        NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort(); // lexicographic = 0000 → 0001 → … order

    console.log(`Found ${files.length} migration file(s) in db/migrations/\n`);

    for (const file of files) {
      const [row] = await sql<{ id: number }[]>`
        SELECT id FROM _migrations WHERE filename = ${file}
      `;

      if (row) {
        console.log(`  skip    ${file}`);
        continue;
      }

      const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8');

      // PostgreSQL restriction: a newly added enum value cannot be used in the
      // same transaction as its addition (ALTER TYPE ... ADD VALUE).  Detect
      // this case and run the file outside a transaction (each statement gets
      // its own implicit auto-commit), then record the migration separately.
      const hasEnumAddValue = /ALTER\s+TYPE\s+\S+\s+ADD\s+VALUE/i.test(content);

      if (hasEnumAddValue) {
        // Run statements auto-committed (simple query protocol, no BEGIN/COMMIT).
        // All DDL in the file uses IF NOT EXISTS so it is safe to re-run.
        await sql.unsafe(content);
        await sql`INSERT INTO _migrations (filename) VALUES (${file})`;
      } else {
        // Run migration + record in a single atomic transaction
        await sql.begin(async (tx) => {
          await tx.unsafe(content);
          await tx`INSERT INTO _migrations (filename) VALUES (${file})`;
        });
      }

      console.log(`  applied ${file}`);
    }

    console.log('\nAll migrations complete.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('\nMigration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
