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
  status: 'compliant' | 'overdue' | 'warning' | 'critical';
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
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
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

  /**
   * Get authentication headers for Companies House API
   */
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
    try {
      const cleanNumber = companyNumber.replace(/\s/g, '').toUpperCase();
      const response = await fetch(`${CH_API_BASE}/company/${cleanNumber}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Company not found
        }
        throw new Error(`Companies House API error: ${response.status}`);
      }

      return await response.json() as CompanyProfile;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
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
        throw new Error(`Failed to fetch filing history: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.items || [];
    } catch (error) {
      console.error('Error fetching filing history:', error);
      throw error;
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
    let status: 'compliant' | 'overdue' | 'warning' | 'critical' = 'compliant';
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (overdueFilings.length > 0) {
      const maxOverdueDays = Math.max(...overdueFilings.map(f => Math.abs(f.daysUntilDue)));
      if (maxOverdueDays > 90) {
        status = 'critical';
        riskLevel = 'critical';
      } else if (maxOverdueDays > 30) {
        status = 'overdue';
        riskLevel = 'high';
      } else {
        status = 'overdue';
        riskLevel = 'medium';
      }
    } else if (upcomingDeadlines.some(d => d.daysUntilDue <= 7)) {
      status = 'warning';
      riskLevel = 'medium';
    } else if (upcomingDeadlines.length > 0) {
      status = 'warning';
      riskLevel = 'low';
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
   */
  private calculateCSPenalty(daysOverdue: number): number {
    // Confirmation statement penalties can lead to prosecution
    // Not a fixed fine structure but criminal offense
    if (daysOverdue <= 28) return 0;
    return 5000; // Estimated maximum penalty
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
  validateCompanyNumber(companyNumber: string): boolean {
    // UK company numbers are typically 8 characters (with leading zeros)
    // Can be 2 letters followed by 6 digits, or 8 digits
    const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();
    return /^([A-Z]{2}\d{6}|\d{8})$/.test(cleaned);
  }

  /**
   * Format company number (add leading zeros if needed)
   */
  formatCompanyNumber(companyNumber: string): string {
    const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();

    // If it's all digits and less than 8 characters, pad with zeros
    if (/^\d+$/.test(cleaned) && cleaned.length < 8) {
      return cleaned.padStart(8, '0');
    }

    return cleaned;
  }
}

// Export singleton instance
export const companiesHouseService = new CompaniesHouseService();
