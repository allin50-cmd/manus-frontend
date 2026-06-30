import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import { APP_REGISTRY, getApps } from '@/lib/app-registry'

export default function WorkspaceAppsPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const enabledIds = new Set(company.enabledApps)
  const enabledApps = getApps(company.enabledApps)
  const otherApps = APP_REGISTRY.filter((a) => !enabledIds.has(a.id))

  return (
    <div className="space-y-8">
      {/* Enabled apps */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Enabled for {company.name}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {enabledApps.map((app) => {
            const isClickable = app.status !== 'coming_soon'
            const href = app.externalRoute ?? `/os/workspace/${params.companyId}/apps/${app.id}`
            const Inner = (
              <div
                className="p-4 rounded-2xl flex flex-col gap-3 transition-all"
                style={{
                  background: isClickable ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isClickable ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: isClickable ? 1 : 0.5,
                  minHeight: 120,
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${app.color}18`, border: `1px solid ${app.color}28` }}
                  >
                    {app.icon}
                  </div>
                  {app.status === 'live' && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#00A86B18', color: '#00A86B', border: '1px solid #00A86B28' }}
                    >
                      Live
                    </span>
                  )}
                  {app.status === 'beta' && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#7A5AF818', color: '#7A5AF8', border: '1px solid #7A5AF828' }}
                    >
                      Beta
                    </span>
                  )}
                  {app.status === 'coming_soon' && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Soon
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {app.name}
                  </p>
                  <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {app.description}
                  </p>
                </div>
              </div>
            )

            return isClickable ? (
              <Link key={app.id} href={href} className="group hover:scale-[1.02] transition-transform">
                {Inner}
              </Link>
            ) : (
              <div key={app.id}>{Inner}</div>
            )
          })}
        </div>
      </section>

      {/* Other available apps */}
      {otherApps.length > 0 && (
        <section>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Available on Platform
          </p>
          <div className="space-y-2">
            {otherApps.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 p-3 rounded-xl opacity-40"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-lg">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{app.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{app.description}</p>
                </div>
                <span className="text-[9px] shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Not enabled
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
