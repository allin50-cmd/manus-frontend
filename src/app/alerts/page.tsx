export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/shared/PageContainer';
import { AlertsTable } from '@/components/alerts/AlertsTable';
import { getAllMonitoredCompanies } from '@/server/services/companies.service';
import { getAlertsForCompany } from '@/server/services/alerts.service';
import type { ComplianceAlert } from '@/types/alerts';

export default async function AlertsPage() {
  const companies = await getAllMonitoredCompanies();
  const allAlerts: ComplianceAlert[] = [];

  for (const company of companies) {
    const alerts = await getAlertsForCompany(company.companyNumber);
    allAlerts.push(
      ...alerts.map((a) => ({
        id: a.id,
        companyNumber: a.companyNumber,
        alertType: a.alertType as ComplianceAlert['alertType'],
        stripeSubscriptionId: a.stripeSubscriptionId,
        stripeItemId: a.stripeItemId,
        status: a.status as ComplianceAlert['status'],
        activatedAt: a.activatedAt,
      }))
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <p className="text-slate-500 text-sm mt-1">Stay on top of your compliance obligations.</p>
      </div>
      <AlertsTable alerts={allAlerts} />
    </PageContainer>
  );
}
