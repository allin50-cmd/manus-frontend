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
  const liveApps = apps.filter((a) => a.status === 'live' || a.status === 'beta')
  const comingApps = apps.filter((a) => a.status === 'coming_soon')

  return (
    <div className="space-y-8">
      {/* Active applications */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Applications
        </p>
        <div className="grid grid-cols-1 gap-3">
          {liveApps.map((app) => {
            const href = app.externalRoute ?? `/os/workspace/${params.companyId}/apps/${app.id}`
            return (
              <Link
                key={app.id}
                href={href}
                className="group flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* App icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{
                    background: `${app.color}18`,
                    border: `1px solid ${app.color}28`,
                  }}
                >
                  {app.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
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
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {app.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 group-hover:stroke-white/40 transition-colors"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )
          })}
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
