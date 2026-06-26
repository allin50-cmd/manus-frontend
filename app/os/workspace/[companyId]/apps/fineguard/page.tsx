import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { monitoredCompanies, fgAlerts, fgActivityLog } from '@/db/schema'
import { getCompany } from '@/lib/company-registry'
import { desc, eq, count, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const ALERT_TYPE_LABEL: Record<string, string> = {
  accounts_filing: 'Accounts Filing',
  confirmation_statement: 'Confirmation Statement',
  director_changes: 'Director Changes',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#FF9F0A',
  sent: '#28C76F',
  logged: '#3D8BFF',
  suppressed: 'rgba(255,255,255,0.3)',
}

export default async function FineGuardAppPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const db = await getDb()

  const [monitored, alertRows, recentActivity] = await Promise.all([
    db.select({ id: monitoredCompanies.id }).from(monitoredCompanies),
    db
      .select()
      .from(fgAlerts)
      .orderBy(desc(fgAlerts.createdAt))
      .limit(8),
    db
      .select()
      .from(fgActivityLog)
      .orderBy(desc(fgActivityLog.occurredAt))
      .limit(5),
  ])

  const monitoredCount = monitored.length
  const pendingAlerts = alertRows.filter((a) => a.status === 'pending').length
  const sentAlerts = alertRows.filter((a) => a.status === 'sent').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'radial-gradient(circle at 30% 25%, #6EE7B7, #059669)',
            boxShadow: '0 8px 24px rgba(0,168,107,0.4)',
          }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>FineGuard</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Companies House compliance monitoring
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Monitored', value: monitoredCount, color: '#00A86B' },
          { label: 'Pending', value: pendingAlerts, color: '#FF9F0A' },
          { label: 'Sent', value: sentAlerts, color: '#28C76F' },
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portal"
          className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
          style={{ background: 'rgba(0,168,107,0.1)', border: '1px solid rgba(0,168,107,0.2)' }}
        >
          <span className="text-xl" aria-hidden>🏛️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#00A86B' }}>Customer Portal</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Manage companies</p>
          </div>
        </Link>
        <Link
          href="/check"
          className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-xl" aria-hidden>🔍</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Check Company</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Search Companies House</p>
          </div>
        </Link>
      </div>

      {/* Recent alerts */}
      {alertRows.length > 0 && (
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Recent Alerts
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {alertRows.map((alert, i) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STATUS_COLOR[alert.status] ?? 'rgba(255,255,255,0.3)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {alert.companyNumber}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {ALERT_TYPE_LABEL[alert.alertType] ?? alert.alertType} · {alert.daysBefore}d before
                  </p>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 capitalize"
                  style={{
                    background: `${STATUS_COLOR[alert.status] ?? 'rgba(255,255,255,0.1)'}20`,
                    color: STATUS_COLOR[alert.status] ?? 'rgba(255,255,255,0.3)',
                  }}
                >
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertRows.length === 0 && (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center"
          style={{ background: 'rgba(0,168,107,0.04)', border: '1px dashed rgba(0,168,107,0.15)' }}
        >
          <span className="text-3xl mb-3" aria-hidden>✅</span>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>No alerts generated yet</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Add companies to monitoring to start receiving deadline alerts.
          </p>
        </div>
      )}

      {/* Recent workflow activity */}
      {recentActivity.length > 0 && (
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Workflow Activity
          </p>
          <div className="space-y-2">
            {recentActivity.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00A86B' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {event.action}
                  </p>
                  {event.entityId && (
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {event.entityType} · {event.entityId}
                    </p>
                  )}
                </div>
                <p className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {new Date(event.occurredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
