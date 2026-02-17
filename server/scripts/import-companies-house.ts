/**
 * Companies House Bulk Data Import Script
 *
 * Imports BasicCompanyDataAsOneFile CSV from Companies House into PostgreSQL.
 * Source: http://download.companieshouse.gov.uk/en_output.html
 *
 * Usage:
 *   pnpm db:import <path-to-csv>
 *   pnpm db:import ./data/BasicCompanyDataAsOneFile-2025-12-01.csv
 *
 * The CSV has these columns (in order):
 *   CompanyName, CompanyNumber, RegAddress.CareOf, RegAddress.POBox,
 *   RegAddress.AddressLine1, RegAddress.AddressLine2, RegAddress.PostTown,
 *   RegAddress.County, RegAddress.Country, RegAddress.PostCode,
 *   CompanyCategory, CompanyStatus, CountryOfOrigin, DissolutionDate,
 *   IncorporationDate, Accounts.AccountRefDay, Accounts.AccountRefMonth,
 *   Accounts.NextDueDate, Accounts.LastMadeUpDate, Accounts.AccountCategory,
 *   Returns.NextDueDate, Returns.LastMadeUpDate, Mortgages.NumMortCharges,
 *   Mortgages.NumMortOutstanding, Mortgages.NumMortPartSatisfied,
 *   Mortgages.NumMortSatisfied, SICCode.SicText_1, SICCode.SicText_2,
 *   SICCode.SicText_3, SICCode.SicText_4, LimitedPartnerships.NumGenPartners,
 *   LimitedPartnerships.NumLimPartners, URI, PreviousName_1.CONDATE,
 *   PreviousName_1.CompanyName, ... (PreviousName 2-10),
 *   ConfStmtNextDueDate, ConfStmtLastMadeUpDate
 */

import dotenv from 'dotenv';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { createInterface } from 'readline';
import path from 'path';
import { db } from '../db/index';
import { chCompanies } from '../db/schema';
import { sql } from 'drizzle-orm';

dotenv.config();

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 1000; // Rows per INSERT batch
const PROGRESS_INTERVAL = 10000; // Log progress every N rows

// ============================================================================
// CSV PARSER
// ============================================================================

/**
 * Parse a single CSV line, handling quoted fields with commas inside
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push the last field
  fields.push(current.trim());

  return fields;
}

/**
 * Convert a CSV row array into a database insert object
 */
function rowToInsert(fields: string[]) {
  const str = (val: string | undefined) => val && val.trim() !== '' ? val.trim() : null;
  const int = (val: string | undefined) => {
    if (!val || val.trim() === '') return null;
    const n = parseInt(val.trim(), 10);
    return isNaN(n) ? null : n;
  };

  return {
    companyName: fields[0]?.trim() || 'UNKNOWN',
    companyNumber: fields[1]?.trim() || '',
    careOf: str(fields[2]),
    poBox: str(fields[3]),
    addressLine1: str(fields[4]),
    addressLine2: str(fields[5]),
    postTown: str(fields[6]),
    county: str(fields[7]),
    country: str(fields[8]),
    postCode: str(fields[9]),
    companyCategory: str(fields[10]),
    companyStatus: str(fields[11]),
    countryOfOrigin: str(fields[12]),
    dissolutionDate: str(fields[13]),
    incorporationDate: str(fields[14]),
    accountsRefDay: str(fields[15]),
    accountsRefMonth: str(fields[16]),
    accountsNextDueDate: str(fields[17]),
    accountsLastMadeUpDate: str(fields[18]),
    accountsCategory: str(fields[19]),
    returnsNextDueDate: str(fields[20]),
    returnsLastMadeUpDate: str(fields[21]),
    numMortCharges: int(fields[22]),
    numMortOutstanding: int(fields[23]),
    numMortPartSatisfied: int(fields[24]),
    numMortSatisfied: int(fields[25]),
    sicCode1: str(fields[26]),
    sicCode2: str(fields[27]),
    sicCode3: str(fields[28]),
    sicCode4: str(fields[29]),
    numGenPartners: int(fields[30]),
    numLimPartners: int(fields[31]),
    uri: str(fields[32]),
    // Fields 33-52 are PreviousName_1 through PreviousName_10 (CONDATE + CompanyName pairs)
    // We skip these for now - can add later if needed
    confStmtNextDueDate: str(fields[53]),
    confStmtLastMadeUpDate: str(fields[54]),
  };
}

// ============================================================================
// IMPORT LOGIC
// ============================================================================

async function importCSV(filePath: string) {
  const absolutePath = path.resolve(filePath);

  // Check file exists
  try {
    const stats = await stat(absolutePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`\nCompanies House Bulk Data Import`);
    console.log(`================================`);
    console.log(`File: ${absolutePath}`);
    console.log(`Size: ${sizeMB} MB`);
    console.log(`Batch size: ${BATCH_SIZE} rows per INSERT`);
    console.log('');
  } catch {
    console.error(`File not found: ${absolutePath}`);
    console.error('');
    console.error('Usage: pnpm db:import <path-to-csv>');
    console.error('Example: pnpm db:import ./data/BasicCompanyDataAsOneFile-2025-12-01.csv');
    process.exit(1);
  }

  // Check if table already has data
  const [existingCount] = await db.select({ count: sql<number>`count(*)` }).from(chCompanies);
  if (existingCount.count > 0) {
    console.log(`Table ch_companies already has ${existingCount.count} records.`);
    console.log('Clearing existing data before import...');
    await db.execute(sql`TRUNCATE TABLE ch_companies`);
    console.log('Table cleared.');
    console.log('');
  }

  const startTime = Date.now();
  let totalRows = 0;
  let skippedRows = 0;
  let errorRows = 0;
  let batch: ReturnType<typeof rowToInsert>[] = [];
  let isFirstLine = true;

  const fileStream = createReadStream(absolutePath, { encoding: 'utf-8' });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log('Importing...');

  for await (const line of rl) {
    // Skip header row
    if (isFirstLine) {
      isFirstLine = false;
      console.log(`Header: ${line.substring(0, 120)}...`);
      console.log('');
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      skippedRows++;
      continue;
    }

    try {
      const fields = parseCSVLine(line);

      // Must have at least company name and number
      if (!fields[0] || !fields[1] || fields[1].trim() === '') {
        skippedRows++;
        continue;
      }

      const row = rowToInsert(fields);

      // Validate company number
      if (!row.companyNumber) {
        skippedRows++;
        continue;
      }

      batch.push(row);
      totalRows++;

      // Flush batch when full
      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        batch = [];
      }

      // Progress logging
      if (totalRows % PROGRESS_INTERVAL === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = Math.round(totalRows / ((Date.now() - startTime) / 1000));
        console.log(`  ${totalRows.toLocaleString()} rows imported (${elapsed}s, ${rate.toLocaleString()} rows/sec)`);
      }
    } catch (err) {
      errorRows++;
      if (errorRows <= 5) {
        console.warn(`  Row error: ${(err as Error).message} - Line: ${line.substring(0, 80)}...`);
      }
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    await insertBatch(batch);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = Math.round(totalRows / ((Date.now() - startTime) / 1000));

  console.log('');
  console.log('================================');
  console.log('Import Complete!');
  console.log('================================');
  console.log(`Total imported: ${totalRows.toLocaleString()} companies`);
  console.log(`Skipped rows:   ${skippedRows.toLocaleString()}`);
  console.log(`Error rows:     ${errorRows.toLocaleString()}`);
  console.log(`Time elapsed:   ${elapsed}s`);
  console.log(`Average rate:   ${rate.toLocaleString()} rows/sec`);
  console.log('');

  // Verify count
  const [finalCount] = await db.select({ count: sql<number>`count(*)` }).from(chCompanies);
  console.log(`Database now contains ${Number(finalCount.count).toLocaleString()} companies in ch_companies table.`);
}

async function insertBatch(batch: ReturnType<typeof rowToInsert>[]) {
  try {
    await db.insert(chCompanies).values(batch).onConflictDoUpdate({
      target: chCompanies.companyNumber,
      set: {
        companyName: sql`EXCLUDED.company_name`,
        companyStatus: sql`EXCLUDED.company_status`,
        companyCategory: sql`EXCLUDED.company_category`,
        addressLine1: sql`EXCLUDED.address_line_1`,
        postTown: sql`EXCLUDED.post_town`,
        postCode: sql`EXCLUDED.post_code`,
        accountsNextDueDate: sql`EXCLUDED.accounts_next_due_date`,
        accountsLastMadeUpDate: sql`EXCLUDED.accounts_last_made_up_date`,
        confStmtNextDueDate: sql`EXCLUDED.conf_stmt_next_due_date`,
        confStmtLastMadeUpDate: sql`EXCLUDED.conf_stmt_last_made_up_date`,
        importedAt: sql`NOW()`,
      },
    });
  } catch (err) {
    // If batch insert fails, try one-by-one
    let successCount = 0;
    for (const row of batch) {
      try {
        await db.insert(chCompanies).values(row).onConflictDoUpdate({
          target: chCompanies.companyNumber,
          set: {
            companyName: sql`EXCLUDED.company_name`,
            companyStatus: sql`EXCLUDED.company_status`,
            importedAt: sql`NOW()`,
          },
        });
        successCount++;
      } catch {
        // Skip individual row errors
      }
    }
    if (successCount < batch.length) {
      console.warn(`  Batch partially failed: ${successCount}/${batch.length} rows inserted`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: pnpm db:import <path-to-csv>');
  console.error('');
  console.error('Example:');
  console.error('  pnpm db:import ./data/BasicCompanyDataAsOneFile-2025-12-01.csv');
  console.error('');
  console.error('Download the file from:');
  console.error('  http://download.companieshouse.gov.uk/en_output.html');
  process.exit(1);
}

importCSV(csvPath)
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
