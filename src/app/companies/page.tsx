export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/shared/PageContainer';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { AddCompanyPanel } from '@/components/companies/AddCompanyPanel';
import { listAllWithAlerts } from '@/server/repositories/monitoredCompanies.repo';

export default async function CompaniesPage() {
  // Single LEFT JOIN query — no N+1
  const companies = await listAllWithAlerts();

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
