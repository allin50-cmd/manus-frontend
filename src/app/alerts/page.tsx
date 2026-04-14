export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/shared/PageContainer';
import { AlertsTable } from '@/components/alerts/AlertsTable';
import { db } from '@/server/db';
import { complianceAlerts } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { ComplianceAlert } from '@/types/alerts';

export default async function AlertsPage() {
  // Single query — all active alerts across all companies
  const rows = await db
    .select()
    .from(complianceAlerts)
    .where(eq(complianceAlerts.status, 'active'));

  const allAlerts: ComplianceAlert[] = rows.map((a) => ({
    id: a.id,
    companyNumber: a.companyNumber,
    alertType: a.alertType as ComplianceAlert['alertType'],
    stripeSubscriptionId: a.stripeSubscriptionId,
    stripeItemId: a.stripeItemId,
    status: a.status as ComplianceAlert['status'],
    activatedAt: a.activatedAt,
  }));

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
