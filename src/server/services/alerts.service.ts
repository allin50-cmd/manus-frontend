import { findByCompany } from '../repositories/complianceAlerts.repo';

export async function getAlertsForCompany(companyNumber: string) {
  return findByCompany(companyNumber);
}
