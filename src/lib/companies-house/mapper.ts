import type { Company } from '@/types/company';

export function mapComplianceResponse(data: {
  company: {
    number: string;
    name: string;
    status: string;
    type?: string;
    incorporationDate?: string;
  };
  compliance: {
    status: string;
    riskLevel: string;
    accounts: { nextDue: string; daysUntilDue: number; overdue: boolean };
    confirmationStatement?: { nextDue: string; daysUntilDue: number; overdue: boolean };
    overdueFilings: { type: string; description: string; dueDate: string; daysOverdue: number; penaltyRisk: number }[];
    penalties?: { estimated: number; description: string }[];
  };
}): Company {
  return {
    number: data.company.number,
    name: data.company.name,
    status: data.company.status,
    type: data.company.type ?? 'ltd',
    incorporationDate: data.company.incorporationDate ?? '',
    compliance: {
      status: data.compliance.status as Company['compliance']['status'],
      riskLevel: data.compliance.riskLevel as Company['compliance']['riskLevel'],
      accounts: data.compliance.accounts,
      confirmationStatement: data.compliance.confirmationStatement ?? {
        nextDue: 'N/A',
        daysUntilDue: 999,
        overdue: false,
      },
      overdueFilings: data.compliance.overdueFilings,
      penalties: data.compliance.penalties ?? [],
    },
  };
}
