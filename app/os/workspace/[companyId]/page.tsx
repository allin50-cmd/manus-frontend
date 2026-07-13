import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import { getApps } from '@/lib/app-registry'
import WorkspaceOverview from '@/components/WorkspaceOverview'
import ComplianceStatus from '@/components/ComplianceStatus'
import RecentActivity from '@/components/RecentActivity'
import WorkspaceTasks from '@/components/WorkspaceTasks'
import WorkspaceCalls from '@/components/WorkspaceCalls'
import WorkspaceMessages from '@/components/WorkspaceMessages'
import WorkspaceQuotes from '@/components/WorkspaceQuotes'
import WorkspaceInvoices from '@/components/WorkspaceInvoices'
import WorkspaceDocuments from '@/components/WorkspaceDocuments'

export default function WorkspaceOverviewPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const apps = getApps(company.enabledApps)
  const comingApps = apps.filter((a) => a.status === 'coming_soon')

  return (
    <div className="space-y-8">
      <WorkspaceOverview companyId={params.companyId} />

      <ComplianceStatus companyId={params.companyId} />

      <RecentActivity companyId={params.companyId} companyName={company.name} />

      {/* Related Records */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Operations</h2>
        <div className="grid grid-cols-1 gap-8">
          {/* Tasks */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Tasks
            </h3>
            <WorkspaceTasks companyName={company.name} />
          </div>

          {/* Calls */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Calls
            </h3>
            <WorkspaceCalls companyName={company.name} />
          </div>

          {/* Messages */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Messages
            </h3>
            <WorkspaceMessages companyId={params.companyId} companyName={company.name} />
          </div>

          {/* Quotes */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Quotes
            </h3>
            <WorkspaceQuotes companyId={params.companyId} companyName={company.name} />
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Invoices
            </h3>
            <WorkspaceInvoices companyId={params.companyId} companyName={company.name} />
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Documents
            </h3>
            <WorkspaceDocuments companyId={params.companyId} companyName={company.name} />
          </div>
        </div>
      </section>

      {/* Coming soon */}
      {comingApps.length > 0 && (
        <section>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Coming Soon
          </p>
          <div className="grid grid-cols-1 gap-3">
            {comingApps.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-4 p-4 rounded-2xl opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {app.name}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.09)' }}
                    >
                      Soon
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {app.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
