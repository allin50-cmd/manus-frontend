import { Suspense } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { ProtectionStatus } from '@/components/dashboard/ProtectionStatus';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UpcomingDeadlinesTable } from '@/components/dashboard/UpcomingDeadlinesTable';
import { RecentAlertsPanel } from '@/components/dashboard/RecentAlertsPanel';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { EmptyState } from '@/components/shared/EmptyState';
import { getDashboardData } from '@/server/services/dashboard.service';
import type { DashboardStats as DashboardStatsType, UpcomingDeadline } from '@/types/dashboard';
import type { ComplianceAlert } from '@/types/alerts';
import Link from 'next/link';

async function DashboardContent({ companyNumber }: { companyNumber?: string }) {
  if (!companyNumber) {
    return (
      <EmptyState
        title="No company selected"
        description="Search for a company to start monitoring."
        action={<Link href="/check" className="text-sm text-blue-600 hover:underline">Check a Company →</Link>}
      />
    );
  }

  const { company, alerts } = await getDashboardData(companyNumber);

  if (!company) {
    return (
      <EmptyState
        title="Company not monitored"
        description="This company isn't yet activated. Check it and activate protection."
        action={<Link href={`/check?q=${companyNumber}`} className="text-sm text-blue-600 hover:underline">Activate protection →</Link>}
      />
    );
  }

  const stats: DashboardStatsType = {
    companiesMonitored: alerts.length,
    upcomingDeadlines: 0,
    overdueCount: 0,
    complianceScore: 100,
  };

  const mappedAlerts: ComplianceAlert[] = alerts.map((a) => ({
    id: a.id,
    companyNumber: a.companyNumber,
    alertType: a.alertType as ComplianceAlert['alertType'],
    stripeSubscriptionId: a.stripeSubscriptionId,
    stripeItemId: a.stripeItemId,
    status: a.status as ComplianceAlert['status'],
    activatedAt: a.activatedAt,
  }));

  const deadlines: UpcomingDeadline[] = [];

  return (
    <div className="space-y-6">
      <ProtectionStatus companyName={company.companyName} alertCount={alerts.length} />
      <DashboardStats stats={stats} />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Upcoming Deadlines</h3>
          <UpcomingDeadlinesTable deadlines={deadlines} />
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Alerts</h3>
            <RecentAlertsPanel alerts={mappedAlerts} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <QuickActionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ searchParams }: { searchParams: { company?: string } }) {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your compliance monitoring overview.</p>
      </div>
      <Suspense fallback={<div className="text-slate-500 text-sm">Loading…</div>}>
        <DashboardContent companyNumber={searchParams.company} />
      </Suspense>
    </PageContainer>
  );
}
