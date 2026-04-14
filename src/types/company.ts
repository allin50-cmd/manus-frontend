export type CompanyStatus = 'active' | 'dissolved' | 'liquidation' | 'receivership' | string;
export type RiskLevel = 'none' | 'low' | 'medium' | 'high';
export type ComplianceStatus = 'compliant' | 'warning' | 'overdue';

export interface DeadlineStatus {
  nextDue: string;
  daysUntilDue: number;
  overdue: boolean;
}

export interface OverdueFiling {
  type: string;
  description: string;
  dueDate: string;
  daysOverdue: number;
  penaltyRisk: number;
}

export interface Company {
  number: string;
  name: string;
  status: CompanyStatus;
  type: string;
  incorporationDate: string;
  address?: {
    line1?: string;
    line2?: string;
    locality?: string;
    postalCode?: string;
  };
  compliance: {
    status: ComplianceStatus;
    riskLevel: RiskLevel;
    accounts: DeadlineStatus;
    confirmationStatement: DeadlineStatus;
    overdueFilings: OverdueFiling[];
    penalties: { estimated: number; description: string }[];
  };
}
