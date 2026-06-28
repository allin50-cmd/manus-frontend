import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { osAlerts } from '@/db/schema'
import { getCompany } from '@/lib/company-registry'
import { desc, sql, or, eq, isNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const SEVERITY_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  Critical: { bg: 'rgba(255,59,48,0.12)',   color: '#FF3B30', dot: '#FF3B30' },
  Warning:  { bg: 'rgba(255,159,10,0.12)',  color: '#FF9F0A', dot: '#FF9F0A' },
  Info:     { bg: 'rgba(61,139,255,0.12)',  color: '#3D8BFF', dot: '#3D8BFF' },
}

function isFineGuardSource(source: string | null): boolean {
  return !!source && source.toLowerCase().includes('fineguard')
}

export default async function WorkspaceNotificationsPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const db = await getDb()

  // Show alerts for this company + legacy alerts with no company assigned.
  const companyFilter = or(
    eq(osAlerts.companyId, params.companyId),
    isNull(osAlerts.companyId),
  )

  const [alerts, agg] = await Promise.all([
    db.select().from(osAlerts).where(companyFilter).orderBy(desc(osAlerts.createdAt)).limit(30),
    db
      .select({
        total:    sql<number>`count(*)`,
        unread:   sql<number>`count(*) filter (where is_read = false)`,
        critical: sql<number>`count(*) filter (where severity = 'Critical')`,
        warning:  sql<number>`count(*) filter (where severity = 'Warning')`,
      })
      .from(osAlerts)
      .where(companyFilter),
  ])

  const s = agg[0] ?? { total: 0, unread: 0, critical: 0, warning: 0 }
  const total = Number(s.total)
  const unread = Number(s.unread)
  const base = `/os/workspace/${params.companyId}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Notifications</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {unread} unread · {total} total
          </p>
        </div>
        <Link
          href="/os/alerts"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,138,52,0.12)', color: '#FF8A34', border: '1px solid rgba(255,138,52,0.2)' }}
        >
          View all
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Unread',   value: unread,                 color: '#3D8BFF' },
          { label: 'Critical', value: Number(s.critical),     color: '#FF3B30' },
          { label: 'Warning',  value: Number(s.warning),      color: '#FF9F0A' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <span className="text-3xl mb-3" aria-hidden>🔔</span>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>All clear</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>No notifications for {company.name}</p>
        </div>
      ) : (
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Recent
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {alerts.map((alert, i) => {
              const sev = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.Info
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                    style={{ background: sev.dot, boxShadow: alert.isRead ? 'none' : `0 0 6px ${sev.dot}80` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: alert.isRead ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.88)' }}>
                        {alert.title}
                      </p>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: sev.bg, color: sev.color }}
                      >
                        {alert.severity}
                      </span>
                      {!alert.isRead && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(61,139,255,0.15)', color: '#3D8BFF' }}
                        >
                          Unread
                        </span>
                      )}
                    </div>
                    {alert.body && (
                      <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {alert.body}
                      </p>
                    )}
                    {alert.source && (
                      isFineGuardSource(alert.source) ? (
                        <Link
                          href={`${base}/apps/fineguard`}
                          className="text-[10px] mt-0.5 inline-flex items-center gap-1 hover:underline"
                          style={{ color: '#00A86B' }}
                        >
                          🛡️ {alert.source}
                        </Link>
                      ) : (
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {alert.source}
                        </p>
                      )
                    )}
                  </div>
                  <p className="text-[10px] shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {new Date(alert.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
