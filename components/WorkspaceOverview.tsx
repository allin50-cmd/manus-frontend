import { getCompany } from '@/lib/company-registry'
import { getApps } from '@/lib/app-registry'

interface WorkspaceOverviewProps {
  companyId: string
}

export default function WorkspaceOverview({ companyId }: WorkspaceOverviewProps) {
  const company = getCompany(companyId)
  if (!company) return null

  const apps = getApps(company.enabledApps)
  const liveApps = apps.filter((a) => a.status === 'live' || a.status === 'beta')

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <section>
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Company
            </p>
            <p className="text-lg font-bold mt-1 truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {company.name}
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Plan
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {company.plan}
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Apps
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {liveApps.length}
            </p>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {company.name}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {company.tagline}
        </p>
      </section>
    </div>
  )
}
