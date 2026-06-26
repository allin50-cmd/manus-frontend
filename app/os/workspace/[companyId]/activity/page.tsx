import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { fgActivityLog, osAlerts } from '@/db/schema'
import { getCompany } from '@/lib/company-registry'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

type FeedItem = {
  id: string
  type: 'workflow' | 'alert'
  label: string
  sublabel?: string
  dotColor: string
  badgeLabel: string
  badgeColor: string
  date: Date
}

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#FF3B30',
  Warning:  '#FF9F0A',
  Info:     '#3D8BFF',
}

function relativeDate(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function WorkspaceActivityPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const db = await getDb()
  const hasFineGuard = company.enabledApps.includes('fineguard')

  const [workflowEvents, alerts] = await Promise.all([
    hasFineGuard
      ? db.select().from(fgActivityLog).orderBy(desc(fgActivityLog.occurredAt)).limit(20)
      : Promise.resolve([]),
    db.select().from(osAlerts).orderBy(desc(osAlerts.createdAt)).limit(15),
  ])

  const feed: FeedItem[] = [
    ...workflowEvents.map((e) => ({
      id: String(e.id),
      type: 'workflow' as const,
      label: e.action,
      sublabel: e.entityType ? `${e.entityType}${e.entityId ? ' · ' + e.entityId : ''}` : undefined,
      dotColor: '#00A86B',
      badgeLabel: 'Workflow',
      badgeColor: '#00A86B',
      date: new Date(e.occurredAt),
    })),
    ...alerts.map((a) => ({
      id: a.id,
      type: 'alert' as const,
      label: a.title,
      sublabel: a.source ?? undefined,
      dotColor: SEVERITY_COLOR[a.severity] ?? '#3D8BFF',
      badgeLabel: a.severity,
      badgeColor: SEVERITY_COLOR[a.severity] ?? '#3D8BFF',
      date: new Date(a.createdAt),
    })),
  ]

  feed.sort((a, b) => b.date.getTime() - a.date.getTime())
  const visible = feed.slice(0, 30)

  const totalEvents = workflowEvents.length
  const totalAlerts = alerts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Activity</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {totalEvents} workflow event{totalEvents !== 1 ? 's' : ''} · {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <span className="text-3xl mb-3" aria-hidden>📋</span>
          <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>No activity yet</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Events from applications and alerts will appear here.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {visible.map((item, i) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ background: item.dotColor, boxShadow: `0 0 6px ${item.dotColor}60` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  {item.label}
                </p>
                {item.sublabel && (
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {item.sublabel}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `${item.badgeColor}18`,
                    color: item.badgeColor,
                    border: `1px solid ${item.badgeColor}28`,
                  }}
                >
                  {item.badgeLabel}
                </span>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {relativeDate(item.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
