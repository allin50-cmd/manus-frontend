// ============================================================================
// Companies House Real Adapter
// Wraps the live Companies House REST API.
// ============================================================================

import { CHAdapter, CHCompanyProfile } from './types.js';

const CH_BASE = 'https://api.company-information.service.gov.uk';

export class RealCHAdapter implements CHAdapter {
  private authHeader: string;

  constructor(apiKey: string) {
    this.authHeader = `Basic ${Buffer.from(apiKey + ':').toString('base64')}`;
  }

  private async get<T>(path: string): Promise<T | null> {
    const url = `${CH_BASE}${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) return null;
    if (res.status === 401) throw new Error('Invalid Companies House API key');
    if (res.status === 429) throw new Error('Companies House API rate limit exceeded');
    if (!res.ok) throw new Error(`Companies House API error: ${res.status}`);

    return res.json() as Promise<T>;
  }

  async getCompany(companyNumber: string): Promise<CHCompanyProfile | null> {
    const clean = normaliseNumber(companyNumber);
    const raw = await this.get<any>(`/company/${clean}`);
    if (!raw) return null;

    // Derive last officer change from filing history (best-effort)
    let lastOfficerChangeAt: string | null = null;
    try {
      const history = await this.get<any>(
        `/company/${clean}/filing-history?category=officers&items_per_page=1`,
      );
      const item = history?.items?.[0];
      if (item?.date) lastOfficerChangeAt = item.date;
    } catch {
      // non-critical — swallow
    }

    return {
      companyNumber: raw.company_number ?? clean,
      companyName: raw.company_name ?? 'Unknown',
      companyStatus: mapStatus(raw.company_status),
      incorporationDate: raw.date_of_creation ?? null,
      confirmationStatement: {
        nextDue: raw.confirmation_statement?.next_due ?? null,
        lastMadeUpTo: raw.confirmation_statement?.last_made_up_to ?? null,
        overdue: raw.confirmation_statement?.overdue ?? false,
      },
      accounts: {
        nextDue: raw.accounts?.next_accounts?.due_on ?? null,
        lastMadeUpTo: raw.accounts?.last_accounts?.made_up_to ?? null,
        overdue: raw.accounts?.next_accounts?.overdue ?? false,
      },
      lastOfficerChangeAt,
      registeredAddress: {
        line1: raw.registered_office_address?.address_line_1 ?? null,
        line2: raw.registered_office_address?.address_line_2 ?? null,
        locality: raw.registered_office_address?.locality ?? null,
        postalCode: raw.registered_office_address?.postal_code ?? null,
        country: raw.registered_office_address?.country ?? null,
      },
    };
  }

  async searchCompanies(query: string): Promise<Array<{ companyNumber: string; companyName: string }>> {
    const encoded = encodeURIComponent(query.trim());
    const raw = await this.get<any>(`/search/companies?q=${encoded}&items_per_page=10`);
    if (!raw?.items) return [];

    return raw.items.map((item: any) => ({
      companyNumber: item.company_number,
      companyName: item.title,
    }));
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseNumber(n: string): string {
  const clean = n.replace(/\s/g, '').toUpperCase();
  if (/^\d+$/.test(clean) && clean.length < 8) return clean.padStart(8, '0');
  return clean;
}

function mapStatus(raw: string | undefined): CHCompanyProfile['companyStatus'] {
  switch (raw) {
    case 'active': return 'active';
    case 'dissolved': return 'dissolved';
    case 'liquidation': return 'liquidation';
    case 'administration': return 'administration';
    default: return 'unknown';
  }
}
