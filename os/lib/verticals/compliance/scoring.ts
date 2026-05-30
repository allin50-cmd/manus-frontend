import type { CompanyProfile, FilingHistoryItem } from './companiesHouse';
import { daysUntil } from './companiesHouse';

export interface UpcomingDeadline {
  type: 'accounts' | 'confirmation_statement';
  dueDate: string;
  daysLeft: number;
  overdue: boolean;
}

export interface ComplianceScore {
  companyNumber: string;
  companyName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  predictedPenalty: number;
  upcomingDeadlines: UpcomingDeadline[];
  drivers: string[];
}

const RISK_INCREMENTS = {
  overdue: 50,
  daysToDeadlineLessThan7: 20,
  lateFilingHistory: 30,
  eventTypeAccounts: 25,
  eventTypeConfirmationStatement: 15,
};

const PENALTY_MULTIPLIER = 50;
const RISK_BASE = 0;

export function scoreCompliance(
  profile: CompanyProfile,
  filings: FilingHistoryItem[],
): ComplianceScore {
  const drivers: string[] = [];
  let riskScore = RISK_BASE;

  const upcoming: UpcomingDeadline[] = [];

  const accDue = profile.accounts?.next_accounts?.due_on;
  if (accDue) {
    const days = daysUntil(accDue);
    const overdue = profile.accounts?.next_accounts?.overdue === true || days < 0;
    upcoming.push({ type: 'accounts', dueDate: accDue, daysLeft: days, overdue });

    if (overdue) {
      riskScore += RISK_INCREMENTS.overdue;
      riskScore += RISK_INCREMENTS.eventTypeAccounts;
      drivers.push(`Accounts overdue (due ${accDue})`);
    } else if (days < 7) {
      riskScore += RISK_INCREMENTS.daysToDeadlineLessThan7;
      riskScore += RISK_INCREMENTS.eventTypeAccounts;
      drivers.push(`Accounts due in ${days} day(s)`);
    }
  }

  const csDue = profile.confirmation_statement?.next_due;
  if (csDue) {
    const days = daysUntil(csDue);
    const overdue = profile.confirmation_statement?.overdue === true || days < 0;
    upcoming.push({ type: 'confirmation_statement', dueDate: csDue, daysLeft: days, overdue });

    if (overdue) {
      riskScore += RISK_INCREMENTS.overdue;
      riskScore += RISK_INCREMENTS.eventTypeConfirmationStatement;
      drivers.push(`Confirmation statement overdue (due ${csDue})`);
    } else if (days < 7) {
      riskScore += RISK_INCREMENTS.daysToDeadlineLessThan7;
      riskScore += RISK_INCREMENTS.eventTypeConfirmationStatement;
      drivers.push(`Confirmation statement due in ${days} day(s)`);
    }
  }

  if (hasLateFilingHistory(filings)) {
    riskScore += RISK_INCREMENTS.lateFilingHistory;
    drivers.push('Late filing history detected');
  }

  const capped = Math.min(100, riskScore);
  const riskLevel: ComplianceScore['riskLevel'] =
    capped >= 70 ? 'High' : capped >= 40 ? 'Medium' : 'Low';

  return {
    companyNumber: profile.company_number,
    companyName: profile.company_name,
    riskScore: capped,
    riskLevel,
    predictedPenalty: capped * PENALTY_MULTIPLIER,
    upcomingDeadlines: upcoming,
    drivers: drivers.length ? drivers : ['No immediate compliance risk detected'],
  };
}

function hasLateFilingHistory(filings: FilingHistoryItem[]): boolean {
  return filings.some((f) => {
    const haystack = `${f.type} ${f.description} ${f.category}`.toLowerCase();
    return haystack.includes('late') || haystack.includes('overdue') || haystack.includes('penalty');
  });
}
