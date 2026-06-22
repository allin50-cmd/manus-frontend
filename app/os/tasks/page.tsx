import { requireAuth } from '@/lib/auth'
import { getDb, workItems, actions } from '@/lib/db'
import { count, eq, notInArray, lte, gte, and } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const db = await getDb()

  const [totalRes, dueTodayRes, decisionNeededRes, openActionsRes, completedThisWeekRes] = await Promise.all([
    db.select({ count: count() }).from(workItems).where(
      notInArray(workItems.status, ['Archived'])
    ),
    db.select({ count: count() }).from(workItems).where(
      and(
        lte(workItems.dueDate, endOfToday),
        notInArray(workItems.status, ['Completed', 'Archived', 'NotFit'])
      )
    ),
    db.select({ count: count() }).from(workItems).where(
      and(
        eq(workItems.decisionNeeded, true),
        notInArray(workItems.status, ['Completed', 'Archived'])
      )
    ),
    db.select({ count: count() }).from(actions).where(eq(actions.status, 'Open')),
    db.select({ count: count() }).from(workItems).where(
      and(
        eq(workItems.status, 'Completed'),
        gte(workItems.updatedAt, startOfWeek)
      )
    ),
  ])

  return {
    total: Number(totalRes[0]?.count ?? 0),
    dueToday: Number(dueTodayRes[0]?.count ?? 0),
    decisionNeeded: Number(decisionNeededRes[0]?.count ?? 0),
    openActions: Number(openActionsRes[0]?.count ?? 0),
    completedThisWeek: Number(completedThisWeekRes[0]?.count ?? 0),
  }
}

const STAT_STYLES = [
  { label: 'Total Items', key: 'total' as const, bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  { label: 'Due / Overdue', key: 'dueToday' as const, bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  { label: 'Decision Needed', key: 'decisionNeeded' as const, bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' },
  { label: 'Open Actions', key: 'openActions' as const, bg: '#FEFCE8', border: '#FEF08A', text: '#A16207' },
  { label: 'Done This Week', key: 'completedThisWeek' as const, bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
]

const QUICK_ACTIONS = [
  { href: '/os/work-items/new', label: '+ New Task', desc: 'Create a work item', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  { href: '/os/work-items', label: 'All Tasks', desc: 'Browse every item', bg: '#F8FAFC', border: '#E2E8F0', text: '#334155' },
  { href: '/os/today', label: 'Today', desc: "Today's actions", bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  { href: '/os/decisions', label: 'Decisions', desc: 'Items needing a decision', bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' },
]

export default async function TasksPage() {
  await requireAuth()
  const stats = await getStats()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">Work items · Actions · Decisions</p>
      </div>

      {/* Stat badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAT_STYLES.map((s) => (
          <div
            key={s.key}
            className="rounded-xl border p-4"
            style={{ background: s.bg, borderColor: s.border }}
          >
            <div className="text-3xl font-bold" style={{ color: s.text }}>{stats[s.key]}</div>
            <div className="text-xs font-medium mt-1" style={{ color: s.text, opacity: 0.7 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((qa) => (
            <Link
              key={qa.href}
              href={qa.href}
              className="block rounded-xl border p-5 transition-all hover:shadow-md hover:scale-[1.02]"
              style={{ background: qa.bg, borderColor: qa.border }}
            >
              <div className="font-bold text-sm" style={{ color: qa.text }}>{qa.label}</div>
              <div className="text-xs text-slate-500 mt-1">{qa.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Voice intake note */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
        <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-slate-700">Voice Intake</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture tasks by voice at{' '}
            <Link href="/intake" className="text-blue-600 hover:underline">/intake</Link>
            {' '}— items will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
