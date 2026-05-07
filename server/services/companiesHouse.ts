import fetch from 'node-fetch';

/**
 * Companies House API Service
 * Real-time integration with Companies House API
 *
 * API Documentation: https://developer-specs.company-information.service.gov.uk/
 */

const CH_API_BASE = 'https://api.company-information.service.gov.uk';
const CH_STREAM_BASE = 'https://stream.companieshouse.gov.uk';
const CH_API_KEY = process.env.COMPANIES_HOUSE_API_KEY;

interface CompanyProfile {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  companyStatusDetail?: string;
  dateOfCreation: string;
  jurisdiction: string;
  sicCodes?: string[];
  hasBeenLiquidated: boolean;
  type: string;
  hasInsolvencyHistory: boolean;
  registeredOfficeAddress: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  accounts?: {
    nextAccounts?: {
      periodEndOn: string;
      periodStartOn: string;
      dueOn: string;
      overdue: boolean;
    };
    lastAccounts?: {
      madeUpTo: string;
      type: string;
    };
    accountingReferenceDate?: {
      day: string;
      month: string;
    };
  };
  confirmationStatement?: {
    nextDue: string;
    nextMadeUpTo: string;
    overdue: boolean;
    lastMadeUpTo?: string;
  };
  links: {
    self: string;
    filingHistory?: string;
    officers?: string;
    charges?: string;
  };
}

interface FilingHistoryItem {
  date: string;
  type: string;
  description: string;
  category: string;
  actionDate?: string;
  barcode?: string;
  links: {
    self: string;
    documentMetadata?: string;
  };
}

interface ComplianceStatus {
  companyNumber: string;
  companyName: string;
  status: 'compliant' | 'warning' | 'overdue';
  overdueFilings: FilingDeadline[];
  upcomingDeadlines: FilingDeadline[];
  lastFiling?: {
    type: string;
    date: string;
  };
  accountsStatus: {
    nextDue: string;
    overdue: boolean;
    daysUntilDue: number;
  };
  confirmationStatementStatus: {
    nextDue: string;
    overdue: boolean;
    daysUntilDue: number;
  };
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  penalties?: {
    estimated: number;
    description: string;
  }[];
}

interface FilingDeadline {
  type: 'accounts' | 'confirmation-statement' | 'annual-return' | 'other';
  description: string;
  dueDate: string;
  daysUntilDue: number;
  overdue: boolean;
  penaltyRisk?: number;
}

export class CompaniesHouseService {
  private apiKey: string;

  constructor() {
    if (!CH_API_KEY) {
      throw new Error('COMPANIES_HOUSE_API_KEY environment variable is required');
    }
    this.apiKey = CH_API_KEY;
  }

  private getAuthHeaders() {
    return {
      'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch company profile from Companies House
   */
  async getCompanyProfile(companyNumber: string): Promise<CompanyProfile | null> {
    const cleanNumber = companyNumber.replace(/\s/g, '').toUpperCase();
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${CH_API_BASE}/company/${cleanNumber}`, {
          headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Company not found
          }
          if (response.status === 401) {
            throw new Error('Invalid Companies House API key');
          }
          if (response.status === 429) {
            // Rate limited - wait and retry
            if (attempt < maxRetries) {
              await this.delay(2000 * attempt);
              continue;
            }
            throw new Error('Companies House API rate limit exceeded');
          }
          throw new Error(`Companies House API error: ${response.status}`);
        }

        const data = await response.json() as CompanyProfile;
        console.log(`📊 Company profile fetched: ${data.companyName}`);
        return data;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries && this.isRetryableError(error)) {
          console.log(`⏳ Retry attempt ${attempt}/${maxRetries} for ${cleanNumber}`);
          await this.delay(1000 * attempt);
          continue;
        }
        break;
      }
    }

    console.error('Error fetching company profile:', lastError);
    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return true;
    if (error.message.includes('rate limit')) return false;
    if (error.message.includes('Invalid')) return false;
    return true; // Network errors are retryable
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get filing history for a company
   */
  async getFilingHistory(companyNumber: string, limit: number = 20): Promise<FilingHistoryItem[]> {
    try {
      const cleanNumber = companyNumber.replace(/\s/g, '').toUpperCase();
      const response = await fetch(
        `${CH_API_BASE}/company/${cleanNumber}/filing-history?items_per_page=${limit}`,
        { headers: this.getAuthHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`📈 No filing history for ${cleanNumber}`);
          return []; // No filing history
        }
        throw new Error(`Failed to fetch filing history: ${response.status}`);
      }

      const data = await response.json() as any;
      const items = data.items || [];
      console.log(`📈 Filing history retrieved: ${items.length} filings`);
      return items;
    } catch (error) {
      console.error('Error fetching filing history:', error);
      // Don't throw - filing history is not critical
      return [];
    }
  }

  /**
   * Calculate compliance status with deadlines and risk assessment
   */
  async getComplianceStatus(companyNumber: string): Promise<ComplianceStatus> {
    const profile = await this.getCompanyProfile(companyNumber);

    if (!profile) {
      throw new Error('Company not found');
    }

    const filingHistory = await this.getFilingHistory(companyNumber, 5);
    const overdueFilings: FilingDeadline[] = [];
    const upcomingDeadlines: FilingDeadline[] = [];
    const penalties: { estimated: number; description: string }[] = [];

    // Check accounts status
    if (profile.accounts?.nextAccounts) {
      const accountsDueDate = new Date(profile.accounts.nextAccounts.dueOn);
      const daysUntilDue = this.calculateDaysUntil(accountsDueDate);
      const overdue = profile.accounts.nextAccounts.overdue || daysUntilDue < 0;

      const accountsDeadline: FilingDeadline = {
        type: 'accounts',
        description: 'Annual Accounts',
        dueDate: profile.accounts.nextAccounts.dueOn,
        daysUntilDue,
        overdue,
        penaltyRisk: overdue ? this.calculateAccountsPenalty(Math.abs(daysUntilDue)) : 0,
      };

      if (overdue) {
        overdueFilings.push(accountsDeadline);
        penalties.push({
          estimated: accountsDeadline.penaltyRisk!,
          description: `Late filing penalty for accounts (${Math.abs(daysUntilDue)} days overdue)`,
        });
      } else if (daysUntilDue <= 30) {
        upcomingDeadlines.push(accountsDeadline);
      }
    }

    // Check confirmation statement status
    if (profile.confirmationStatement?.nextDue) {
      const csDueDate = new Date(profile.confirmationStatement.nextDue);
      const daysUntilDue = this.calculateDaysUntil(csDueDate);
      const overdue = profile.confirmationStatement.overdue || daysUntilDue < 0;

      const csDeadline: FilingDeadline = {
        type: 'confirmation-statement',
        description: 'Confirmation Statement',
        dueDate: profile.confirmationStatement.nextDue,
        daysUntilDue,
        overdue,
        penaltyRisk: overdue ? this.calculateCSPenalty(Math.abs(daysUntilDue)) : 0,
      };

      if (overdue) {
        overdueFilings.push(csDeadline);
        penalties.push({
          estimated: csDeadline.penaltyRisk!,
          description: `Late filing penalty for confirmation statement (${Math.abs(daysUntilDue)} days overdue)`,
        });
      } else if (daysUntilDue <= 30) {
        upcomingDeadlines.push(csDeadline);
      }
    }

    // Determine overall status and risk level
    let status: 'compliant' | 'warning' | 'overdue' = 'compliant';
    let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (overdueFilings.length > 0) {
      const maxOverdueDays = Math.max(...overdueFilings.map(f => Math.abs(f.daysUntilDue)));
      status = 'overdue';

      // Risk level based on days overdue
      if (maxOverdueDays > 90) {
        riskLevel = 'high'; // 90+ days = high risk (max penalties)
      } else if (maxOverdueDays > 30) {
        riskLevel = 'high'; // 30-90 days = high risk
      } else {
        riskLevel = 'medium'; // 1-30 days = medium risk
      }
    } else if (upcomingDeadlines.some(d => d.daysUntilDue <= 7)) {
      // Deadline within 7 days
      status = 'warning';
      riskLevel = 'medium';
    } else if (upcomingDeadlines.some(d => d.daysUntilDue <= 14)) {
      // Deadline within 14 days
      status = 'warning';
      riskLevel = 'low';
    } else if (upcomingDeadlines.length > 0) {
      // Deadlines exist but >14 days away
      status = 'compliant';
      riskLevel = 'none';
    } else {
      // Fully compliant with no upcoming deadlines
      status = 'compliant';
      riskLevel = 'none';
    }

    const lastFiling = filingHistory[0] ? {
      type: filingHistory[0].description,
      date: filingHistory[0].date,
    } : undefined;

    return {
      companyNumber: profile.companyNumber,
      companyName: profile.companyName,
      status,
      overdueFilings,
      upcomingDeadlines,
      lastFiling,
      accountsStatus: {
        nextDue: profile.accounts?.nextAccounts?.dueOn || 'N/A',
        overdue: profile.accounts?.nextAccounts?.overdue || false,
        daysUntilDue: profile.accounts?.nextAccounts?.dueOn
          ? this.calculateDaysUntil(new Date(profile.accounts.nextAccounts.dueOn))
          : 999,
      },
      confirmationStatementStatus: {
        nextDue: profile.confirmationStatement?.nextDue || 'N/A',
        overdue: profile.confirmationStatement?.overdue || false,
        daysUntilDue: profile.confirmationStatement?.nextDue
          ? this.calculateDaysUntil(new Date(profile.confirmationStatement.nextDue))
          : 999,
      },
      riskLevel,
      penalties: penalties.length > 0 ? penalties : undefined,
    };
  }

  /**
   * Calculate days until a deadline
   */
  private calculateDaysUntil(date: Date): number {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate penalty for late accounts filing
   * Based on Companies House penalty structure
   */
  private calculateAccountsPenalty(daysOverdue: number): number {
    if (daysOverdue <= 30) return 150; // £150 for up to 1 month late
    if (daysOverdue <= 90) return 375; // £375 for up to 3 months late
    if (daysOverdue <= 180) return 750; // £750 for up to 6 months late
    return 1500; // £1,500 for more than 6 months late
  }

  /**
   * Calculate penalty for late confirmation statement
   * Note: Late filing can result in prosecution. Penalties vary.
   */
  private calculateCSPenalty(daysOverdue: number): number {
    // Confirmation statements don't have automatic fixed penalties like accounts
    // However, late filing is a criminal offense that can lead to:
    // - Prosecution and fines up to £5,000
    // - Director disqualification
    //
    // For estimation purposes, we use a graduated scale:
    if (daysOverdue <= 14) return 0; // Grace period
    if (daysOverdue <= 28) return 150; // £150 (minor delay)
    if (daysOverdue <= 90) return 500; // £500 (significant delay)
    return 1000; // £1,000+ (prosecution risk)
  }

  /**
   * Subscribe to Companies House streaming API for real-time updates
   * Returns event stream for company changes
   */
  async subscribeToCompanyUpdates(companyNumber: string): Promise<NodeJS.ReadableStream> {
    const cleanNumber = companyNumber.replace(/\s/g, '').toUpperCase();

    // Companies House Streaming API endpoint
    const streamUrl = `${CH_STREAM_BASE}/companies/${cleanNumber}`;

    const response = await fetch(streamUrl, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Streaming API error: ${response.status}`);
    }

    return response.body as unknown as NodeJS.ReadableStream;
  }

  /**
   * Validate company number format
   */
  static validateCompanyNumber(companyNumber: string): boolean {
    const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();
    return /^([A-Z]{2}\d{6}|\d{8})$/.test(cleaned);
  }

  static formatCompanyNumber(companyNumber: string): string {
    const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();

    if (/^\d+$/.test(cleaned) && cleaned.length < 8) {
      return cleaned.padStart(8, '0');
    }

    return cleaned;
  }
}

let _instance: CompaniesHouseService | null = null;

export const companiesHouseService = new Proxy({} as CompaniesHouseService, {
  get(_target, prop) {
    if (!_instance) _instance = new CompaniesHouseService();
    return (_instance as any)[prop];
  },
});
