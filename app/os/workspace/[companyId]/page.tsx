import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import { getApps } from '@/lib/app-registry'
import { getDb } from '@/lib/db'
import { utActivityEvents, osAlerts, workItems, fgAlerts } from '@/db/schema'
import { desc, eq, and, lt, notInArray, isNotNull, or, isNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

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

const ALERT_TYPE_LABEL: Record<string, string> = {
  accounts_filing: 'Accounts Filing',
  confirmation_statement: 'Confirmation Statement',
  director_changes: 'Director Changes',
}

function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 60) return diffMins <= 1 ? 'just now' : `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return diffDays === 1 ? 'yesterday' : `${diffDays}d ago`
}

const TERMINAL_STATUSES = ['Completed', 'NotFit', 'Archived'] as const

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const apps = getApps(company.enabledApps)
  const activeApps = apps.filter((a) => a.status !== 'coming_soon').length
  const hasFineGuard = company.enabledApps.includes('fineguard')

  const db = await getDb()
  const now = new Date()

  const [recentEvents, unreadAlerts, overdueWork, pendingFgAlerts] = await Promise.all([
    db
      .select({
        id: utActivityEvents.id,
        eventType: utActivityEvents.eventType,
        source: utActivityEvents.source,
        notes: utActivityEvents.notes,
        occurredAt: utActivityEvents.occurredAt,
      })
      .from(utActivityEvents)
      .orderBy(desc(utActivityEvents.occurredAt))
      .limit(10),

    db
      .select({
        id: osAlerts.id,
        severity: osAlerts.severity,
        title: osAlerts.title,
        body: osAlerts.body,
        createdAt: osAlerts.createdAt,
      })
      .from(osAlerts)
      .where(
        and(
          eq(osAlerts.isRead, false),
          or(eq(osAlerts.companyId, params.companyId), isNull(osAlerts.companyId)),
        ),
      )
      .orderBy(desc(osAlerts.createdAt))
      .limit(10),

    db
      .select({
        id: workItems.id,
        title: workItems.title,
        dueDate: workItems.dueDate,
        priority: workItems.priority,
      })
      .from(workItems)
      .where(
        and(
          isNotNull(workItems.dueDate),
          lt(workItems.dueDate, now),
          notInArray(workItems.status, [...TERMINAL_STATUSES]),
        ),
      )
      .orderBy(workItems.dueDate)
      .limit(10),

    hasFineGuard
      ? db
          .select({
            id: fgAlerts.id,
            companyNumber: fgAlerts.companyNumber,
            alertType: fgAlerts.alertType,
            dueDate: fgAlerts.dueDate,
            daysBefore: fgAlerts.daysBefore,
          })
          .from(fgAlerts)
          .where(eq(fgAlerts.status, 'pending'))
          .orderBy(fgAlerts.dueDate)
          .limit(5)
      : Promise.resolve([]),
  ])

  const attentionCount = unreadAlerts.length + overdueWork.length + pendingFgAlerts.length
  const hasAttention = attentionCount > 0

  const SEVERITY_COLOR: Record<string, string> = {
    Critical: '#FF4D4D',
    Warning: '#FF9F0A',
    Info: '#3D8BFF',
  }

  const base = `/os/workspace/${params.companyId}`

  return (
    <div className="space-y-6">
      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active Apps',     value: activeApps,        color: '#7A5AF8' },
          { label: 'Team Members',    value: '—',               color: '#3D8BFF' },   // TODO: count from osPeople
          { label: 'Notifications',   value: unreadAlerts.length || '—', color: unreadAlerts.length ? '#FF9F0A' : '#3D8BFF' },
          { label: 'Recent Activity', value: recentEvents.length || '—', color: '#00A86B' },
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

      {/* ── Installed Applications ──────────────────────────── */}
      <div className="space-y-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Applications
        </p>

        {apps.map((app) => {
          const available = app.status !== 'coming_soon'
          const href = app.externalRoute ?? `${base}/apps/${app.id}`

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
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: available ? `${app.color}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${available ? `${app.color}28` : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {app.icon}
              </div>

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

      {/* ── Recent Activity ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Recent Activity
        </p>

        {recentEvents.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                  style={{ background: '#7A5AF8' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {event.eventType.replace(/_/g, ' ')}
                    {event.source && (
                      <span className="ml-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        via {event.source}
                      </span>
                    )}
                  </p>
                  {event.notes && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {event.notes}
                    </p>
                  )}
                </div>
                <p className="text-[10px] shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {formatRelative(event.occurredAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Attention Required ──────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: hasAttention ? 'rgba(255,77,77,0.04)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${hasAttention ? 'rgba(255,77,77,0.15)' : 'rgba(255,255,255,0.07)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: hasAttention ? 'rgba(255,100,100,0.7)' : 'rgba(255,255,255,0.22)' }}
          >
            Attention Required
          </p>
          {hasAttention && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,77,77,0.15)', color: '#FF6B6B' }}
            >
              {attentionCount}
            </span>
          )}
        </div>

        {!hasAttention ? (
          <p className="text-xs py-4 text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>
            No actions require attention.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Unread notifications */}
            {unreadAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: `${SEVERITY_COLOR[alert.severity] ?? '#3D8BFF'}0d` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                  style={{ background: SEVERITY_COLOR[alert.severity] ?? '#3D8BFF' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {alert.title}
                  </p>
                  {alert.body && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {alert.body}
                    </p>
                  )}
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: `${SEVERITY_COLOR[alert.severity] ?? '#3D8BFF'}20`,
                    color: SEVERITY_COLOR[alert.severity] ?? '#3D8BFF',
                  }}
                >
                  {alert.severity}
                </span>
              </div>
            ))}

            {/* Overdue work items */}
            {overdueWork.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,159,10,0.06)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#FF9F0A' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {item.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Overdue · due {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}
                >
                  Overdue
                </span>
              </div>
            ))}

            {/* Pending FineGuard alerts */}
            {pendingFgAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(0,168,107,0.06)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#00A86B' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {alert.companyNumber} — {ALERT_TYPE_LABEL[alert.alertType] ?? alert.alertType}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Due {new Date(alert.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {alert.daysBefore}d warning
                  </p>
                </div>
                <Link
                  href={`${base}/apps/fineguard`}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(0,168,107,0.15)', color: '#00A86B' }}
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Quick Actions
        </p>

        <div className="grid grid-cols-2 gap-3">
          {hasFineGuard && (
            <Link
              href={`${base}/apps/fineguard`}
              className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(0,168,107,0.08)', border: '1px solid rgba(0,168,107,0.18)' }}
            >
              <span className="text-xl shrink-0" aria-hidden>🛡️</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: '#00A86B' }}>Open FineGuard</p>
                <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Compliance alerts</p>
              </div>
            </Link>
          )}

          <Link
            href={`${base}/people`}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(61,139,255,0.08)', border: '1px solid rgba(61,139,255,0.18)' }}
          >
            <span className="text-xl shrink-0" aria-hidden>👥</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: '#3D8BFF' }}>Invite Member</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Team &amp; people</p>
            </div>
          </Link>

          <Link
            href={`${base}/documents`}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,138,52,0.08)', border: '1px solid rgba(255,138,52,0.18)' }}
          >
            <span className="text-xl shrink-0" aria-hidden>📄</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: '#FF8A34' }}>Upload Document</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Files &amp; vault</p>
            </div>
          </Link>

          <Link
            href={`${base}/settings`}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="text-xl shrink-0" aria-hidden>⚙️</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>Company Settings</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Config &amp; preferences</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
