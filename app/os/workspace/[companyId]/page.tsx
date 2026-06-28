import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import { getApps } from '@/lib/app-registry'

const STATUS_LABEL: Record<string, string> = {
  live: 'Live',
  beta: 'Beta',
  coming_soon: 'Coming Soon',
}

const STATUS_COLOR: Record<string, string> = {
  live: '#00A86B',
  beta: '#7A5AF8',
  coming_soon: 'rgba(255,255,255,0.25)',
}

export default function WorkspaceOverviewPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const apps = getApps(company.enabledApps)
  const activeApps = apps.filter((a) => a.status !== 'coming_soon').length
  // TODO: fetch real values from DB (osPeople, osAlerts.isRead, utActivityEvents)
  const teamMembers = '—'
  const unreadNotifications = '—'
  const recentActivity = '—'

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active Apps',     value: activeApps,           color: '#7A5AF8' },
          { label: 'Team Members',    value: teamMembers,          color: '#3D8BFF' },
          { label: 'Notifications',   value: unreadNotifications,  color: '#FF9F0A' },
          { label: 'Recent Activity', value: recentActivity,       color: '#00A86B' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        Applications
      </p>

      {apps.map((app) => {
        const available = app.status !== 'coming_soon'
        const href = app.externalRoute ?? `/os/workspace/${params.companyId}/apps/${app.id}`

        return (
          <div
            key={app.id}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{
              background: available ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${available ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)'}`,
              opacity: available ? 1 : 0.55,
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: available ? `${app.color}18` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${available ? `${app.color}28` : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {app.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: available ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.55)' }}
                >
                  {app.name}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                  style={{
                    background: `${STATUS_COLOR[app.status]}20`,
                    color: STATUS_COLOR[app.status],
                    border: `1px solid ${STATUS_COLOR[app.status]}30`,
                  }}
                >
                  {STATUS_LABEL[app.status]}
                </span>
              </div>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {app.description}
              </p>
            </div>

            {/* Action */}
            {available ? (
              <Link
                href={href}
                className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.03]"
                style={{
                  background: `${app.color}18`,
                  color: app.color,
                  border: `1px solid ${app.color}28`,
                }}
              >
                Open →
              </Link>
            ) : (
              <span
                className="shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.22)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Coming Soon
              </span>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}
