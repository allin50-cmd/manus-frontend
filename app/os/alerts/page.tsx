import { getDb } from '@/lib/db'
import { osAlerts } from '@/db/schema'
import { desc, sql, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function timeLabel(d: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) {
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }
  if (diffDays < 2) return 'Yesterday'
  return `${diffDays}d ago`
}

function severityStyle(severity: string | null) {
  switch (severity) {
    case 'Critical':
      return {
        bg: 'rgba(255,59,48,0.12)',
        border: 'rgba(255,59,48,0.2)',
        dot: '#FF3B30',
        badge: '#FF3B30',
      }
    case 'Warning':
      return {
        bg: 'rgba(255,159,10,0.10)',
        border: 'rgba(255,159,10,0.18)',
        dot: '#FF9F0A',
        badge: '#FF9F0A',
      }
    default:
      return {
        bg: 'rgba(61,139,255,0.10)',
        border: 'rgba(61,139,255,0.18)',
        dot: '#3D8BFF',
        badge: '#3D8BFF',
      }
  }
}

export default async function AlertsPage() {
  const db = await getDb()

  const [alerts, agg] = await Promise.all([
    db
      .select()
      .from(osAlerts)
      .where(eq(osAlerts.isRead, false))
      .orderBy(desc(osAlerts.createdAt))
      .limit(25),
    db.select({
      critical: sql<number>`count(*) filter (where severity = 'Critical' and is_read = false)`,
      warning: sql<number>`count(*) filter (where severity = 'Warning' and is_read = false)`,
      info: sql<number>`count(*) filter (where severity = 'Info' and is_read = false)`,
    }).from(osAlerts),
  ])

  const s = agg[0] ?? { critical: 0, warning: 0, info: 0 }
  const total = Number(s.critical) + Number(s.warning) + Number(s.info)

  const stats = [
    { label: 'Critical', value: Number(s.critical), urgent: true },
    { label: 'Warning', value: Number(s.warning), urgent: false },
    { label: 'Info', value: Number(s.info), urgent: false },
  ]

  const sections = [
    { label: 'Red / Critical', count: Number(s.critical), color: '#FF3B30' },
    { label: 'Amber / Warning', count: Number(s.warning), color: '#FF9F0A' },
    { label: 'Green / Info', count: Number(s.info), color: '#28C76F' },
    { label: 'Compliance', count: 0, color: '#818CF8' },
    { label: 'System', count: 0, color: '#3D8BFF' },
  ]

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Module Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="relative w-[60px] h-[60px] rounded-[20px] shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 20%, #FFD090 0%, #FF8A34 50%, #8C2800 100%)',
            boxShadow:
              '0 16px 40px -8px rgba(255,138,52,0.55), 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 pointer-events-none z-10"
            style={{
              height: '55%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
              borderRadius: '20px 20px 0 0',
            }}
          />
          <svg
            className="relative z-20 w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Alerts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {total} unread notification{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: stat.urgent ? '#FF3B30' : 'rgba(255,255,255,0.92)' }}
            >
              {stat.value}
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-sections */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {sections.map((section, i) => (
          <div
            key={section.label}
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
          >
            <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {section.label}
            </span>
            {section.count > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${section.color}20`, color: section.color }}
              >
                {section.count}
              </span>
            )}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Alert List */}
      <div className="flex flex-col gap-2 mb-6">
        {alerts.length === 0 && (
          <div
            className="rounded-2xl px-4 py-8 text-center text-sm"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.32)',
            }}
          >
            No unread alerts
          </div>
        )}

        {alerts.map((alert) => {
          const sev = severityStyle(alert.severity)
          const created = alert.createdAt ? new Date(alert.createdAt) : new Date()
          const label = timeLabel(created)

          return (
            <div
              key={alert.id}
              className="rounded-2xl px-4 py-3.5 cursor-pointer transition-colors"
              style={{
                background: sev.bg,
                border: `1px solid ${sev.border}`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Severity dot */}
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: sev.dot }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'rgba(255,255,255,0.92)' }}
                    >
                      {alert.title}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: `${sev.badge}18`,
                        color: sev.badge,
                        border: `1px solid ${sev.badge}30`,
                      }}
                    >
                      {alert.severity ?? 'Info'}
                    </span>
                  </div>

                  {alert.body && (
                    <p
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {alert.body}
                    </p>
                  )}

                  {alert.source && (
                    <p
                      className="text-[10px] mt-1 italic"
                      style={{ color: 'rgba(255,255,255,0.32)' }}
                    >
                      {alert.source}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span
                  className="text-[11px] shrink-0 mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, #FF8A34, #CC4400)',
            color: 'white',
          }}
        >
          Mark All Read
        </button>
        <button
          className="px-5 py-3 rounded-xl text-sm font-medium"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          View Archive
        </button>
      </div>
    </div>
  )
}
