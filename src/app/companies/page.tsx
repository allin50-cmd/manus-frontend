export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/shared/PageContainer';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { AddCompanyPanel } from '@/components/companies/AddCompanyPanel';
import { getAllMonitoredCompanies } from '@/server/services/companies.service';
import { getAlertsForCompany } from '@/server/services/alerts.service';
import type { MonitoredCompanyRow } from '@/types/dashboard';

export default async function CompaniesPage() {
  const raw = await getAllMonitoredCompanies();
  const companies: MonitoredCompanyRow[] = await Promise.all(
    raw.map(async (c) => {
      const alerts = await getAlertsForCompany(c.companyNumber);
      return {
        ...c,
        activeAlerts: alerts.map((a) => a.alertType) as MonitoredCompanyRow['activeAlerts'],
      };
    })
  );

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitored Companies</h1>
          <p className="text-slate-500 text-sm mt-1">All companies you are protecting.</p>
        </div>
      </div>
      <div className="space-y-4">
        <CompaniesTable companies={companies} />
        <AddCompanyPanel />
      </div>
    </PageContainer>
  );
}
