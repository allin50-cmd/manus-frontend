import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import { getApps } from '@/lib/app-registry'

const STATUS_COLOR: Record<string, string> = {
  live:        '#00A86B',
  beta:        '#7A5AF8',
  coming_soon: 'rgba(255,255,255,0.3)',
}

const STATUS_LABEL: Record<string, string> = {
  live:        'Live',
  beta:        'Beta',
  coming_soon: 'Coming Soon',
}

export default function WorkspaceSettingsPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const apps = getApps(company.enabledApps)
  const activeApps = apps.filter((a) => a.status !== 'coming_soon').length
  const base = `/os/workspace/${params.companyId}`

  const controls = [
    {
      label: 'Manage Members',
      description: 'Add or remove team members.',
      href: `${base}/people`,
      action: 'Go to People →',
      available: true,
    },
    {
      label: 'Billing',
      description: 'Manage your plan and invoices.',
      href: null,
      action: 'Coming Soon',
      available: false,
    },
    {
      label: 'API Keys',
      description: 'Manage API credentials for integrations.',
      href: null,
      action: 'Coming Soon',
      available: false,
    },
    {
      label: 'Integrations',
      description: 'Connect third-party services.',
      href: null,
      action: 'Coming Soon',
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Settings</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {company.name} workspace configuration
        </p>
      </div>

      {/* ── Company Profile ──────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Company Profile
        </p>
        <div className="space-y-3">
          <Row label="Name"             value={company.name} />
          <Row label="Company ID"       value={company.id} />
          <Row label="Plan"             value={company.plan} />
          <Row label="Tagline"          value={company.tagline} />
          <Row label="Active Apps"      value={`${activeApps} of ${apps.length}`} />
        </div>
      </div>

      {/* ── Installed Apps ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Installed Apps
        </p>

        <div className="space-y-px">
          {apps.map((app, i) => {
            const available = app.status !== 'coming_soon'
            const href = app.externalRoute ?? `${base}/apps/${app.id}`
            const color = STATUS_COLOR[app.status] ?? 'rgba(255,255,255,0.3)'

            return (
              <div
                key={app.id}
                className="flex items-start gap-3 py-3 px-1"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 mt-0.5"
                  style={{
                    background: available ? `${app.color}15` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${available ? `${app.color}25` : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  {app.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: available ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.45)' }}
                    >
                      {app.name}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${color}20`,
                        color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {STATUS_LABEL[app.status]}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.32)' }}>
                    {app.description}
                  </p>
                </div>

                {available ? (
                  <Link
                    href={href}
                    className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg mt-0.5 transition-all hover:scale-[1.03]"
                    style={{
                      background: `${app.color}15`,
                      color: app.color,
                      border: `1px solid ${app.color}25`,
                    }}
                  >
                    Open →
                  </Link>
                ) : (
                  <span
                    className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg mt-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    Soon
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Workspace Controls ───────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Workspace Controls
        </p>

        <div className="space-y-px">
          {controls.map((ctrl, i) => (
            <div
              key={ctrl.label}
              className="flex items-center gap-3 py-3 px-1"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold"
                  style={{ color: ctrl.available ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.45)' }}
                >
                  {ctrl.label}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                  {ctrl.description}
                </p>
              </div>

              {ctrl.available && ctrl.href ? (
                <Link
                  href={ctrl.href}
                  className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(61,139,255,0.12)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.2)' }}
                >
                  {ctrl.action}
                </Link>
              ) : (
                <span
                  className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)' }}
                >
                  {ctrl.action}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
    </div>
  )
}
