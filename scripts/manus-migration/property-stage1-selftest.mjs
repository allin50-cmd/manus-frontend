#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = await mkdtemp(path.join(tmpdir(), 'property-stage1-'));
const exportDir = path.join(root, 'export');
const outDir = path.join(root, 'mapped');
await import('node:fs/promises').then(({ mkdir }) => mkdir(exportDir, { recursive: true }));

await writeFile(path.join(exportDir, 'fg_properties.json'), JSON.stringify([
  { id: 1, address: '1 Test Street', postcode: 'SE20 1AA', extraSourceField: 'preserved' },
]));
await writeFile(path.join(exportDir, 'fg_certificates.json'), JSON.stringify({ data: [
  {
    id: 9,
    propertyId: 1,
    type: 'gas_safety',
    status: 'valid',
    issueDate: '2026-01-01T00:00:00Z',
    expiryDate: '2027-01-01T00:00:00Z',
    engineerName: 'Test Engineer',
    certNumber: 'GS-TEST-1',
    fileUrl: 'https://example.invalid/cert.pdf',
    notes: 'test',
    unknownField: 42
  }
]}));

const mapper = path.join(path.dirname(new URL(import.meta.url).pathname), 'map-property-export.mjs');
const run = spawnSync(process.execPath, [mapper, exportDir, '--out', outDir], { encoding: 'utf8' });
if (run.status !== 0) throw new Error(run.stderr || run.stdout || 'mapper failed');

const summary = JSON.parse(await readFile(path.join(outDir, 'summary.json'), 'utf8'));
if (summary.totals.rows !== 2) throw new Error(`expected 2 rows, got ${summary.totals.rows}`);
if (summary.totals.certificates !== 1) throw new Error('certificate count mismatch');
if (summary.tables.fg_tenants.status !== 'missing') throw new Error('missing tables must remain missing');

const props = JSON.parse(await readFile(path.join(outDir, 'fg_properties.staged.json'), 'utf8'));
if (props[0].source_record.extraSourceField !== 'preserved') throw new Error('source row was not preserved');
if (!/^[a-f0-9]{64}$/.test(props[0].source_hash)) throw new Error('invalid source hash');

const certs = JSON.parse(await readFile(path.join(outDir, 'fg_certificates.typed.json'), 'utf8'));
if (certs[0].certificate_type !== 'gas_safety') throw new Error('certificate type mismatch');
if (certs[0].certificate_number !== 'GS-TEST-1') throw new Error('certificate number mismatch');
if (certs[0].source_record.unknownField !== 42) throw new Error('certificate source row was not preserved');

const secondOut = path.join(root, 'mapped-2');
const rerun = spawnSync(process.execPath, [mapper, exportDir, '--out', secondOut], { encoding: 'utf8' });
if (rerun.status !== 0) throw new Error(rerun.stderr || rerun.stdout || 'mapper rerun failed');
const props2 = JSON.parse(await readFile(path.join(secondOut, 'fg_properties.staged.json'), 'utf8'));
if (props2[0].source_hash !== props[0].source_hash) throw new Error('hash is not deterministic');

await rm(root, { recursive: true, force: true });
console.log('property stage1 self-test: PASS');
