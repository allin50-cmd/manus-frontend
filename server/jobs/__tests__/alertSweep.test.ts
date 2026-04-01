// ============================================================================
// Alert Sweep Job Tests
// Uses mock CH adapter (no API key needed) + fresh MemoryStore per test.
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runAlertSweep } from '../alertSweep.js';
import { MemoryStore } from '../../store/memory.js';
import * as storeIndex from '../../store/index.js';

// The mock CH adapter has these known companies:
//   00000001 — safe (CS +45d, accounts +120d)
//   00000002 — urgent (CS +7d, accounts +30d)
//   00000003 — overdue (CS -5d, accounts +60d)

describe('runAlertSweep', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    vi.spyOn(storeIndex, 'getStore').mockResolvedValue(store);
  });

  it('returns zero counts when no companies are monitored', async () => {
    const result = await runAlertSweep();
    expect(result.companiesChecked).toBe(0);
    expect(result.alertsCreated).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('processes a monitored company and creates no alert when safe', async () => {
    // 00000001 is safe — no thresholds should fire
    const company = await store.upsertCompany({
      companyNumber: '00000001',
      companyName: 'ACME WIDGETS LIMITED',
      companyStatus: 'active',
      incorporationDate: null,
      confirmationStatementDue: null,
      accountsDue: null,
      lastOfficerChangeAt: null,
    });
    await store.createOrUpdateMonitoring(company.id, {
      monitoringEnabled: true,
      currentStatus: 'safe',
      nextDeadlineAt: null,
      lastCheckedAt: null,
    });

    const result = await runAlertSweep();
    expect(result.companiesChecked).toBe(1);
    expect(result.alertsCreated).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('creates a 7-day alert for company 00000002 (urgent)', async () => {
    const company = await store.upsertCompany({
      companyNumber: '00000002',
      companyName: 'URGENT FILINGS LTD',
      companyStatus: 'active',
      incorporationDate: null,
      confirmationStatementDue: null,
      accountsDue: null,
      lastOfficerChangeAt: null,
    });
    await store.createOrUpdateMonitoring(company.id, {
      monitoringEnabled: true,
      currentStatus: 'urgent',
      nextDeadlineAt: null,
      lastCheckedAt: null,
    });

    const result = await runAlertSweep();
    expect(result.companiesChecked).toBe(1);
    expect(result.alertsCreated).toBeGreaterThanOrEqual(1);
    expect(result.errors).toHaveLength(0);

    const alerts = await store.getAlertsByCompany(company.id);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });

  it('creates an overdue alert for company 00000003', async () => {
    const company = await store.upsertCompany({
      companyNumber: '00000003',
      companyName: 'OVERDUE COMPANY LTD',
      companyStatus: 'active',
      incorporationDate: null,
      confirmationStatementDue: null,
      accountsDue: null,
      lastOfficerChangeAt: null,
    });
    await store.createOrUpdateMonitoring(company.id, {
      monitoringEnabled: true,
      currentStatus: 'overdue',
      nextDeadlineAt: null,
      lastCheckedAt: null,
    });

    const result = await runAlertSweep();
    expect(result.companiesChecked).toBe(1);
    expect(result.alertsCreated).toBeGreaterThanOrEqual(1);

    const alerts = await store.getAlertsByCompany(company.id);
    const overdueAlert = alerts.find((a) => a.thresholdDays === 0);
    expect(overdueAlert).toBeDefined();
  });

  it('does not create duplicate alerts on a second sweep', async () => {
    const company = await store.upsertCompany({
      companyNumber: '00000002',
      companyName: 'URGENT FILINGS LTD',
      companyStatus: 'active',
      incorporationDate: null,
      confirmationStatementDue: null,
      accountsDue: null,
      lastOfficerChangeAt: null,
    });
    await store.createOrUpdateMonitoring(company.id, {
      monitoringEnabled: true,
      currentStatus: 'urgent',
      nextDeadlineAt: null,
      lastCheckedAt: null,
    });

    await runAlertSweep();
    const afterFirst = (await store.getAlertsByCompany(company.id)).length;

    const second = await runAlertSweep();
    expect(second.alertsCreated).toBe(0);

    const afterSecond = (await store.getAlertsByCompany(company.id)).length;
    expect(afterSecond).toBe(afterFirst);
  });

  it('skips companies with monitoring disabled', async () => {
    const company = await store.upsertCompany({
      companyNumber: '00000002',
      companyName: 'URGENT FILINGS LTD',
      companyStatus: 'active',
      incorporationDate: null,
      confirmationStatementDue: null,
      accountsDue: null,
      lastOfficerChangeAt: null,
    });
    await store.createOrUpdateMonitoring(company.id, {
      monitoringEnabled: false,
      currentStatus: 'urgent',
      nextDeadlineAt: null,
      lastCheckedAt: null,
    });

    const result = await runAlertSweep();
    expect(result.companiesChecked).toBe(0);
    expect(result.alertsCreated).toBe(0);
  });
});
