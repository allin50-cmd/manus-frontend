import { upsertMonitoredCompany } from '../repositories/monitoredCompanies.repo';
import { insertAlerts } from '../repositories/complianceAlerts.repo';

export async function activateCompanyMonitoring(params: {
  companyNumber: string;
  companyName: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  alertTypes: string[];
}) {
  await upsertMonitoredCompany({
    companyNumber: params.companyNumber,
    companyName: params.companyName,
    stripeSessionId: params.stripeSessionId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripeCustomerId: params.stripeCustomerId,
  });

  await insertAlerts(params.companyNumber, params.alertTypes, params.stripeSubscriptionId);
}
