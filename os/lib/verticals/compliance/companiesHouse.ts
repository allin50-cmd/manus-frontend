const CH_API_BASE = 'https://api.company-information.service.gov.uk';

export interface CompanyProfile {
  company_number: string;
  company_name: string;
  company_status: string;
  date_of_creation?: string;
  accounts?: {
    next_accounts?: {
      period_end_on?: string;
      period_start_on?: string;
      due_on?: string;
      overdue?: boolean;
    };
    last_accounts?: { made_up_to?: string; type?: string };
  };
  confirmation_statement?: {
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
    last_made_up_to?: string;
  };
}

export interface FilingHistoryItem {
  date: string;
  type: string;
  description: string;
  category: string;
}

export function normaliseCompanyNumber(raw: string): string {
  const cleaned = raw.replace(/\s/g, '').toUpperCase();
  if (/^\d+$/.test(cleaned) && cleaned.length < 8) return cleaned.padStart(8, '0');
  return cleaned;
}

export function isValidCompanyNumber(raw: string): boolean {
  const cleaned = raw.replace(/\s/g, '').toUpperCase();
  return /^([A-Z]{2}\d{6}|\d{8})$/.test(cleaned);
}

function authHeader(): { Authorization: string } {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) throw new Error('COMPANIES_HOUSE_API_KEY is not configured');
  return { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` };
}

async function chFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(`${CH_API_BASE}${path}`, {
    headers: authHeader(),
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new Error('Invalid Companies House API key');
  if (res.status === 429) throw new Error('Companies House rate limit exceeded');
  if (!res.ok) throw new Error(`Companies House API error: ${res.status}`);
  return (await res.json()) as T;
}

export async function getCompanyProfile(companyNumber: string): Promise<CompanyProfile | null> {
  const num = normaliseCompanyNumber(companyNumber);
  return chFetch<CompanyProfile>(`/company/${num}`);
}

export async function getFilingHistory(
  companyNumber: string,
  limit = 20,
): Promise<FilingHistoryItem[]> {
  const num = normaliseCompanyNumber(companyNumber);
  try {
    const data = await chFetch<{ items?: FilingHistoryItem[] }>(
      `/company/${num}/filing-history?items_per_page=${limit}`,
    );
    return data?.items ?? [];
  } catch {
    return [];
  }
}

export function daysUntil(isoDate: string | undefined): number {
  if (!isoDate) return 999;
  const due = new Date(isoDate).getTime();
  if (Number.isNaN(due)) return 999;
  return Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
}
