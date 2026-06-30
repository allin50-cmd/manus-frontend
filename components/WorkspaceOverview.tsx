'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCompany } from '@/lib/company-registry'
import { getApps } from '@/lib/app-registry'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueAt?: string | null
  createdAt: string
}

interface Alert {
  id: string
  title: string
  severity: string
  source?: string | null
  isRead: boolean
  createdAt: string
}

interface ActivityEvent {
  id: string
  action: string
  entityType: string
  entityId: string
  entityTitle?: string
  actor?: string
  createdAt: string
}

interface RecentDocument {
  id: string
  name: string
  uploadedAt: string
}

interface RecentDecision {
  id: string
  title: string
  status: string
  createdAt: string
}

interface WorkspaceOverviewProps {
  companyId: string
}

export default function WorkspaceOverview({ companyId }: WorkspaceOverviewProps) {
  const company = getCompany(companyId)
  if (!company) return null

  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [documents, setDocuments] = useState<RecentDocument[]>([])
  const [decisions, setDecisions] = useState<RecentDecision[]>([])
  const [loading, setLoading] = useState(true)

  const apps = getApps(company.enabledApps)
  const liveApps = apps.filter((a) => a.status === 'live' || a.status === 'beta')

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, alertsRes, docsRes, decisionsRes] = await Promise.all([
          fetch('/api/os/tasks').then((r) => r.json()).catch(() => []),
          fetch('/api/os/alerts').then((r) => r.json()).catch(() => []),
          fetch('/api/os/documents').then((r) => r.json()).catch(() => []),
          fetch('/api/decisions').then((r) => r.json()).catch(() => []),
        ])
        setTasks(Array.isArray(tasksRes) ? tasksRes.slice(0, 10) : [])
        setAlerts(Array.isArray(alertsRes) ? alertsRes.slice(0, 10) : [])
        setDocuments(Array.isArray(docsRes) ? docsRes.slice(0, 3) : [])
        setDecisions(Array.isArray(decisionsRes) ? decisionsRes.slice(0, 3) : [])
      } catch (err) {
        console.error('Error fetching workspace data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const openTasks = tasks.filter((t) => t.status === 'Open').length
  const unresolvedAlerts = alerts.filter((a) => !a.isRead).length
  const todaysTasks = tasks.filter((t) => {
    if (!t.dueAt) return false
    const dueDate = new Date(t.dueAt)
    const today = new Date()
    return dueDate.toDateString() === today.toDateString()
  })

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
              Open Work
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {openTasks}
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,59,48,0.1)',
              border: '1px solid rgba(255,59,48,0.2)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Alerts
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#FF6B6B' }}>
              {unresolvedAlerts}
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(0,168,107,0.1)',
              border: '1px solid rgba(0,168,107,0.2)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Team
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#00A86B' }}>
              {liveApps.length}
            </p>
          </div>
        </div>
      </section>

      {/* Today's Work */}
      {todaysTasks.length > 0 && (
        <section>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Today's Work
          </p>
          <div className="space-y-2">
            {todaysTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="w-5 h-5 rounded-full mt-0.5 shrink-0" style={{ background: 'rgba(0,168,107,0.3)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {task.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {task.priority} priority
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unresolved Alerts */}
      {unresolvedAlerts > 0 && (
        <section>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Alerts
          </p>
          <div className="space-y-2">
            {alerts
              .filter((a) => !a.isRead)
              .slice(0, 3)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: alert.severity === 'Critical' ? 'rgba(255,59,48,0.1)' : 'rgba(255,193,69,0.1)',
                    border: alert.severity === 'Critical' ? '1px solid rgba(255,59,48,0.2)' : '1px solid rgba(255,193,69,0.2)',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full mt-0.5 shrink-0"
                    style={{ background: alert.severity === 'Critical' ? 'rgba(255,59,48,0.4)' : 'rgba(255,193,69,0.3)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {alert.title}
                    </p>
                    {alert.source && (
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {alert.source}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            {unresolvedAlerts > 3 && (
              <Link
                href={`/os/alerts`}
                className="text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                View all {unresolvedAlerts} alerts →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Recent Documents */}
      {documents.length > 0 && (
        <section>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Recent Documents
          </p>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/os/documents`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(129,140,248,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-blue-400">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {doc.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
            {documents.length > 0 && (
              <Link
                href={`/os/documents`}
                className="text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                View all documents →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Recent Decisions */}
      {decisions.length > 0 && (
        <section>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Recent Decisions
          </p>
          <div className="space-y-2">
            {decisions.map((decision) => (
              <Link
                key={decision.id}
                href={`/os/decisions/${decision.id}`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="w-5 h-5 rounded-full mt-0.5 shrink-0" style={{ background: 'rgba(139,92,246,0.3)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {decision.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(decision.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
            {decisions.length > 0 && (
              <Link
                href={`/os/decisions`}
                className="text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                View all decisions →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Applications */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Applications
        </p>
        <div className="grid grid-cols-1 gap-3">
          {liveApps.map((app) => {
            const href = app.externalRoute ?? `/os/workspace/${companyId}/apps/${app.id}`
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{
                    background: `${app.color}18`,
                    border: `1px solid ${app.color}28`,
                  }}
                >
                  {app.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {app.name}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                      style={{
                        background: `${app.color}20`,
                        color: app.color,
                        border: `1px solid ${app.color}30`,
                      }}
                    >
                      {app.status === 'live' ? 'Live' : 'Beta'}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {app.description}
                  </p>
                </div>

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

      {/* Quick Actions */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/os/work-items/new`}
            className="py-3 rounded-xl text-sm font-semibold text-center transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #7A5AF8, #A855F7)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(122,90,248,0.3)',
            }}
          >
            + Work
          </Link>
          <Link
            href={`/os/documents`}
            className="py-3 rounded-xl text-sm font-semibold text-center transition-all hover:scale-[1.02]"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            + Docs
          </Link>
        </div>
      </section>
    </div>
  )
}
