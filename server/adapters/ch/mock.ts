// ============================================================================
// Companies House Mock Adapter
// Used for local development and testing when no API key is available.
// Returns realistic, deterministic test data.
// ============================================================================

import { CHAdapter, CHCompanyProfile } from './types.js';

const today = () => new Date();
const daysFromNow = (n: number) => {
  const d = today();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const MOCK_COMPANIES: Record<string, CHCompanyProfile> = {
  '00000001': {
    companyNumber: '00000001',
    companyName: 'ACME WIDGETS LIMITED',
    companyStatus: 'active',
    incorporationDate: '2015-03-14',
    confirmationStatement: {
      nextDue: daysFromNow(45),
      lastMadeUpTo: daysFromNow(-320),
      overdue: false,
    },
    accounts: {
      nextDue: daysFromNow(120),
      lastMadeUpTo: daysFromNow(-245),
      overdue: false,
    },
    lastOfficerChangeAt: '2023-08-01',
    registeredAddress: {
      line1: '1 High Street',
      line2: null,
      locality: 'London',
      postalCode: 'EC1A 1AA',
      country: 'England',
    },
  },
  '00000002': {
    companyNumber: '00000002',
    companyName: 'URGENT FILINGS LTD',
    companyStatus: 'active',
    incorporationDate: '2018-07-22',
    confirmationStatement: {
      nextDue: daysFromNow(5),
      lastMadeUpTo: daysFromNow(-360),
      overdue: false,
    },
    accounts: {
      nextDue: daysFromNow(60),
      lastMadeUpTo: daysFromNow(-305),
      overdue: false,
    },
    lastOfficerChangeAt: null,
    registeredAddress: {
      line1: '50 Baker Street',
      line2: null,
      locality: 'London',
      postalCode: 'W1U 7EU',
      country: 'England',
    },
  },
  '00000003': {
    companyNumber: '00000003',
    companyName: 'OVERDUE HOLDINGS LTD',
    companyStatus: 'active',
    incorporationDate: '2010-01-10',
    confirmationStatement: {
      nextDue: daysFromNow(-30),
      lastMadeUpTo: daysFromNow(-395),
      overdue: true,
    },
    accounts: {
      nextDue: daysFromNow(-10),
      lastMadeUpTo: daysFromNow(-375),
      overdue: true,
    },
    lastOfficerChangeAt: '2024-01-15',
    registeredAddress: {
      line1: '99 Penalty Lane',
      line2: null,
      locality: 'Manchester',
      postalCode: 'M1 1AA',
      country: 'England',
    },
  },
  '00000004': {
    companyNumber: '00000004',
    companyName: 'DUESOON SERVICES LTD',
    companyStatus: 'active',
    incorporationDate: '2020-11-05',
    confirmationStatement: {
      nextDue: daysFromNow(22),
      lastMadeUpTo: daysFromNow(-343),
      overdue: false,
    },
    accounts: {
      nextDue: daysFromNow(180),
      lastMadeUpTo: daysFromNow(-185),
      overdue: false,
    },
    lastOfficerChangeAt: null,
    registeredAddress: {
      line1: '7 Commerce Road',
      line2: null,
      locality: 'Birmingham',
      postalCode: 'B1 1BB',
      country: 'England',
    },
  },
};

// Allow lookup by company name too (for search)
const SEARCH_INDEX = Object.values(MOCK_COMPANIES).map((c) => ({
  companyNumber: c.companyNumber,
  companyName: c.companyName,
}));

export class MockCHAdapter implements CHAdapter {
  async getCompany(companyNumber: string): Promise<CHCompanyProfile | null> {
    const clean = companyNumber.replace(/\s/g, '').toUpperCase().padStart(8, '0');
    return MOCK_COMPANIES[clean] ?? null;
  }

  async searchCompanies(query: string): Promise<Array<{ companyNumber: string; companyName: string }>> {
    const q = query.toLowerCase();
    return SEARCH_INDEX.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.companyNumber.includes(q),
    ).slice(0, 10);
  }
}
