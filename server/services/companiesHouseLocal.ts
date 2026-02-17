/**
 * Companies House Local Data Service
 *
 * Queries the ch_companies table (populated from BasicCompanyDataAsOneFile CSV)
 * for instant, offline lookups without hitting the live API.
 *
 * Use this as the primary data source, falling back to the live API
 * for fresh/real-time data when needed.
 */

import { db } from '../db/index';
import { chCompanies } from '../db/schema';
import { eq, ilike, or, sql, desc } from 'drizzle-orm';

export interface LocalCompanyResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string | null;
  companyCategory: string | null;
  incorporationDate: string | null;
  dissolutionDate: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postTown: string | null;
  county: string | null;
  country: string | null;
  postCode: string | null;
  sicCode1: string | null;
  sicCode2: string | null;
  sicCode3: string | null;
  sicCode4: string | null;
  accountsNextDueDate: string | null;
  accountsLastMadeUpDate: string | null;
  accountsCategory: string | null;
  confStmtNextDueDate: string | null;
  confStmtLastMadeUpDate: string | null;
  returnsNextDueDate: string | null;
  numMortCharges: number | null;
  numMortOutstanding: number | null;
  uri: string | null;
}

export class CompaniesHouseLocalService {
  /**
   * Look up a single company by company number
   */
  async getByNumber(companyNumber: string): Promise<LocalCompanyResult | null> {
    const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();

    const [result] = await db
      .select()
      .from(chCompanies)
      .where(eq(chCompanies.companyNumber, cleaned))
      .limit(1);

    if (!result) return null;

    return this.mapToResult(result);
  }

  /**
   * Search companies by name (partial match)
   */
  async searchByName(query: string, limit: number = 20): Promise<LocalCompanyResult[]> {
    if (!query || query.trim().length < 2) return [];

    const results = await db
      .select()
      .from(chCompanies)
      .where(ilike(chCompanies.companyName, `%${query.trim()}%`))
      .limit(limit);

    return results.map(r => this.mapToResult(r));
  }

  /**
   * Search companies by postcode
   */
  async searchByPostcode(postcode: string, limit: number = 50): Promise<LocalCompanyResult[]> {
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();

    const results = await db
      .select()
      .from(chCompanies)
      .where(
        sql`REPLACE(UPPER(${chCompanies.postCode}), ' ', '') = ${cleaned}`
      )
      .limit(limit);

    return results.map(r => this.mapToResult(r));
  }

  /**
   * Search companies by SIC code
   */
  async searchBySicCode(sicCode: string, limit: number = 50): Promise<LocalCompanyResult[]> {
    const results = await db
      .select()
      .from(chCompanies)
      .where(
        or(
          ilike(chCompanies.sicCode1, `${sicCode}%`),
          ilike(chCompanies.sicCode2, `${sicCode}%`),
          ilike(chCompanies.sicCode3, `${sicCode}%`),
          ilike(chCompanies.sicCode4, `${sicCode}%`),
        )
      )
      .limit(limit);

    return results.map(r => this.mapToResult(r));
  }

  /**
   * Get companies with overdue accounts (accounts_next_due_date in the past)
   */
  async getOverdueCompanies(limit: number = 100): Promise<LocalCompanyResult[]> {
    const today = new Date().toISOString().split('T')[0];

    const results = await db
      .select()
      .from(chCompanies)
      .where(
        sql`${chCompanies.accountsNextDueDate} IS NOT NULL
            AND ${chCompanies.accountsNextDueDate} != ''
            AND ${chCompanies.accountsNextDueDate} < ${today}
            AND ${chCompanies.companyStatus} = 'Active'`
      )
      .limit(limit);

    return results.map(r => this.mapToResult(r));
  }

  /**
   * Get total count of companies in the bulk data table
   */
  async getTotalCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chCompanies);

    return Number(result.count);
  }

  /**
   * Get counts by company status
   */
  async getStatusCounts(): Promise<Record<string, number>> {
    const results = await db
      .select({
        status: chCompanies.companyStatus,
        count: sql<number>`count(*)`,
      })
      .from(chCompanies)
      .groupBy(chCompanies.companyStatus)
      .orderBy(desc(sql`count(*)`));

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.status || 'Unknown'] = Number(row.count);
    }
    return counts;
  }

  /**
   * Check if bulk data has been imported
   */
  async isDataLoaded(): Promise<boolean> {
    const count = await this.getTotalCount();
    return count > 0;
  }

  /**
   * Map database row to LocalCompanyResult
   */
  private mapToResult(row: typeof chCompanies.$inferSelect): LocalCompanyResult {
    return {
      companyNumber: row.companyNumber,
      companyName: row.companyName,
      companyStatus: row.companyStatus,
      companyCategory: row.companyCategory,
      incorporationDate: row.incorporationDate,
      dissolutionDate: row.dissolutionDate,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      postTown: row.postTown,
      county: row.county,
      country: row.country,
      postCode: row.postCode,
      sicCode1: row.sicCode1,
      sicCode2: row.sicCode2,
      sicCode3: row.sicCode3,
      sicCode4: row.sicCode4,
      accountsNextDueDate: row.accountsNextDueDate,
      accountsLastMadeUpDate: row.accountsLastMadeUpDate,
      accountsCategory: row.accountsCategory,
      confStmtNextDueDate: row.confStmtNextDueDate,
      confStmtLastMadeUpDate: row.confStmtLastMadeUpDate,
      returnsNextDueDate: row.returnsNextDueDate,
      numMortCharges: row.numMortCharges,
      numMortOutstanding: row.numMortOutstanding,
      uri: row.uri,
    };
  }
}

// Export singleton
export const companiesHouseLocalService = new CompaniesHouseLocalService();
