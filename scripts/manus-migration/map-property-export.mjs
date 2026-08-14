#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const here = path.dirname(new URL(import.meta.url).pathname);
const contractPath = path.join(here, 'property-contract.json');
const contract = JSON.parse(await readFile(contractPath, 'utf8'));

function usage() {
  console.log(`Usage:\n  node scripts/manus-migration/map-property-export.mjs <export-dir> [--out <dir>]\n\nExpected files are JSON arrays or { data: [...] } objects named after source tables, e.g. fg_properties.json.\nThis command is dry-run only: it writes mapped JSON files and never connects to a database.`);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function rowsFromPayload(payload, table) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  throw new Error(`${table}: expected a JSON array or an object with a data array`);
}

function sourceId(row, table, index) {
  const candidate = row?.id ?? row?.source_id ?? row?.sourceId;
  if (candidate === undefined || candidate === null || String(candidate).trim() === '') {
    throw new Error(`${table}[${index}]: missing id/source_id/sourceId`);
  }
  return String(candidate);
}

function nullableString(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

function nullableDate(value, field, sourceIdValue) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`fg_certificates ${sourceIdValue}: invalid ${field}: ${String(value)}`);
  }
  return parsed.toISOString();
}

function mapGeneric(table, row, index) {
  return {
    source_table: table,
    source_id: sourceId(row, table, index),
    source_record: row,
    source_hash: sha256(row),
  };
}

function mapCertificate(row, index) {
  const id = sourceId(row, 'fg_certificates', index);
  const type = nullableString(row.type);
  const status = nullableString(row.status);

  if (type && !contract.certificate.types.includes(type)) {
    throw new Error(`fg_certificates ${id}: unsupported type ${type}`);
  }
  if (status && !contract.certificate.statuses.includes(status)) {
    throw new Error(`fg_certificates ${id}: unsupported status ${status}`);
  }

  return {
    source_id: id,
    property_source_id: nullableString(row.propertyId ?? row.property_id),
    certificate_type: type,
    certificate_status: status,
    expiry_date: nullableDate(row.expiryDate ?? row.expiry_date, 'expiryDate', id),
    issue_date: nullableDate(row.issueDate ?? row.issue_date, 'issueDate', id),
    engineer_name: nullableString(row.engineerName ?? row.engineer_name),
    certificate_number: nullableString(row.certNumber ?? row.cert_number),
    file_url: nullableString(row.fileUrl ?? row.file_url),
    notes: nullableString(row.notes),
    source_record: row,
    source_hash: sha256(row),
  };
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(args.length === 0 ? 1 : 0);
}

const exportDir = path.resolve(args[0]);
const outFlag = args.indexOf('--out');
const outDir = path.resolve(outFlag >= 0 ? args[outFlag + 1] : path.join(here, 'mapped', 'property-stage1'));
if (outFlag >= 0 && !args[outFlag + 1]) throw new Error('--out requires a directory');

await mkdir(outDir, { recursive: true });

const summary = { tables: {}, totals: { rows: 0, certificates: 0 } };

for (const table of contract.tables) {
  const file = path.join(exportDir, `${table}.json`);
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      summary.tables[table] = { status: 'missing', rows: 0 };
      continue;
    }
    throw error;
  }

  const rows = rowsFromPayload(JSON.parse(text), table);
  const seen = new Set();
  const staged = rows.map((row, index) => {
    const mapped = mapGeneric(table, row, index);
    if (seen.has(mapped.source_id)) throw new Error(`${table}: duplicate source id ${mapped.source_id}`);
    seen.add(mapped.source_id);
    return mapped;
  });

  await writeFile(path.join(outDir, `${table}.staged.json`), `${JSON.stringify(staged, null, 2)}\n`);
  summary.tables[table] = { status: 'mapped', rows: staged.length };
  summary.totals.rows += staged.length;

  if (table === 'fg_certificates') {
    const certificates = rows.map(mapCertificate);
    await writeFile(path.join(outDir, 'fg_certificates.typed.json'), `${JSON.stringify(certificates, null, 2)}\n`);
    summary.totals.certificates = certificates.length;
  }
}

await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
