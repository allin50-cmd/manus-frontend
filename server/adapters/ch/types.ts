// ============================================================================
// Companies House Adapter — Normalised Internal Types
// External CH API payloads must never leak into the application layer.
// ============================================================================

export interface CHCompanyProfile {
  companyNumber: string;
  companyName: string;
  companyStatus: 'active' | 'dissolved' | 'liquidation' | 'administration' | 'unknown';
  incorporationDate: string | null; // ISO date string
  confirmationStatement: {
    nextDue: string | null;      // ISO date string
    lastMadeUpTo: string | null;
    overdue: boolean;
  };
  accounts: {
    nextDue: string | null;      // ISO date string
    lastMadeUpTo: string | null;
    overdue: boolean;
  };
  lastOfficerChangeAt: string | null; // ISO date string, derived from filing history
  registeredAddress: {
    line1: string | null;
    line2: string | null;
    locality: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

export interface CHAdapter {
  getCompany(companyNumber: string): Promise<CHCompanyProfile | null>;
  searchCompanies(query: string): Promise<Array<{ companyNumber: string; companyName: string }>>;
}
