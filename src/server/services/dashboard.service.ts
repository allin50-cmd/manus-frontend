import { findByCompanyNumber } from '../repositories/monitoredCompanies.repo';
import { findByCompany } from '../repositories/complianceAlerts.repo';

export async function getDashboardData(companyNumber: string) {
  const [company, alerts] = await Promise.all([
    findByCompanyNumber(companyNumber),
    findByCompany(companyNumber),
  ]);

  return { company, alerts };
}
