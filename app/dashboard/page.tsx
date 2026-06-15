import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import { getBriefingItems, isOverdue } from '../../lib/queries/briefing'
import Link from 'next/link'
import type { WorkItemStatus } from '@prisma/client'
import MorningBriefing, { type BriefingItemClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
  const in7Days  = new Date(today.getTime() + 7  * 86_400_000)
  const in30Days = new Date(today.getTime() + 30 * 86_400_000)
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay())

  const nonFinal = { notIn: ['Completed', 'Archived', 'NotFit'] as WorkItemStatus[] }

  const [
    overdue,
    dueToday,
    in7DaysDue,
    in30DaysDue,
    escalated,
    completedThisWeek,
    total,
    openActions,
    decisionNeeded,
    complianceAlerts,
    teamPulse,
    recentItems,
  ] = await Promise.all([
    db.workItem.count({ where: { dueDate: { lt: today }, status: nonFinal } }),
    db.workItem.count({ where: { dueDate: { gte: today, lte: endOfToday }, status: nonFinal } }),
    db.workItem.count({ where: { dueDate: { gte: today, lt: in7Days }, status: nonFinal } }),
    db.workItem.count({ where: { dueDate: { gte: in7Days, lt: in30Days }, status: nonFinal } }),
    db.workItem.count({ where: { status: { in: ['Escalated', 'DecisionNeeded', 'FollowUpDue'] } } }),
    db.workItem.count({ where: { status: 'Completed', updatedAt: { gte: startOfWeek } } }),
    db.workItem.count({ where: { status: nonFinal } }),
    db.action.count({ where: { status: 'Open' } }),
    db.workItem.count({ where: { decisionNeeded: true, status: nonFinal } }),
    db.alertDelivery.count({ where: { status: { in: ['Sent', 'Pending'] } } }),
    Promise.all(
      ['Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie', 'George'].map((o) =>
        db.workItem.count({ where: { owner: o, status: nonFinal } }).then((c) => ({ owner: o, count: c }))
      )
    ),
    db.workItem.findMany({
      where: { status: nonFinal },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      select: { id: true, title: true, company: true, status: true, priority: true, dueDate: true, type: true },
      take: 5,
    }),
  ])

  // Compliance status bar buckets
  const actionRequired = Math.max(escalated, dueToday + overdue > 0 ? dueToday : 0)
  const compliantCount = Math.max(0, total - overdue - actionRequired - in30DaysDue)

  return {
    overdue, dueToday, in7DaysDue, in30DaysDue, escalated,
    completedThisWeek, total, openActions, decisionNeeded,
    complianceAlerts, compliantCount, teamPulse, recentItems,
  }
}

function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const PRIORITY_DOT: Record<string, string> = {
  Urgent: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-amber-400', Low: 'bg-slate-300',
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const isGeorge = session.person === 'George'

  // Fetch briefing items in parallel with dashboard data for George
  let briefingItems: BriefingItemClient[] = []
  let data: Awaited<ReturnType<typeof getDashboardData>>

  try {
    if (isGeorge) {
      const [dashData, rawBriefing] = await Promise.all([
        getDashboardData(),
        getBriefingItems(),
      ])
      data = dashData
      briefingItems = rawBriefing.map((item) => ({
        id: item.id,
        title: item.title,
        company: item.company,
        owner: item.owner,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate ? item.dueDate.toISOString() : null,
        nextAction: item.nextAction,
      }))
    } else {
      data = await getDashboardData()
    }
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load dashboard. Please refresh.
        </div>
      </div>
    )
  }

  const {
    overdue, dueToday, in7DaysDue, in30DaysDue, escalated,
    completedThisWeek, total, openActions, decisionNeeded,
    complianceAlerts, compliantCount, teamPulse, recentItems,
  } = data

  const actionRequired = escalated + dueToday
  const atRisk = in7DaysDue + in30DaysDue
  const grandTotal = compliantCount + atRisk + actionRequired + overdue || 1

  const pct = (n: number) => Math.round((n / grandTotal) * 100)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          {isGeorge ? 'Morning Briefing' : 'Compliance Dashboard'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back, <span className="font-medium text-slate-700">{session.person}</span>
        </p>
      </div>

      {/* ── Morning Briefing for George ── */}
      {isGeorge && (
        <MorningBriefing items={briefingItems} />
      )}

      {/* ── Divider between briefing and existing dashboard ── */}
      {isGeorge && (
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Team Overview</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {/* ── Compliance status bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Overall Compliance Status
            </span>
            <Link href="/filings" className="text-xs font-semibold text-blue-600 hover:underline">
              View filings →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Link href="/filings?status=compliant"
              className="rounded-xl bg-green-50 border border-green-200 p-3 text-center hover:bg-green-100 transition-colors">
              <div className="text-xl font-extrabold text-green-700">{compliantCount}</div>
              <div className="text-[11px] font-semibold text-green-600 mt-0.5">✓ Compliant</div>
              <div className="text-[10px] text-green-500">{pct(compliantCount)}%</div>
            </Link>
            <Link href="/filings?status=risk"
              className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center hover:bg-amber-100 transition-colors">
              <div className="text-xl font-extrabold text-amber-700">{atRisk}</div>
              <div className="text-[11px] font-semibold text-amber-600 mt-0.5">⚡ At Risk</div>
              <div className="text-[10px] text-amber-500">{pct(atRisk)}%</div>
            </Link>
            <Link href="/today"
              className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-center hover:bg-orange-100 transition-colors">
              <div className="text-xl font-extrabold text-orange-700">{actionRequired}</div>
              <div className="text-[11px] font-semibold text-orange-600 mt-0.5">⚠ Action Req.</div>
              <div className="text-[10px] text-orange-500">{pct(actionRequired)}%</div>
            </Link>
            <Link href="/today"
              className="rounded-xl bg-red-50 border border-red-200 p-3 text-center hover:bg-red-100 transition-colors">
              <div className="text-xl font-extrabold text-red-700">{overdue}</div>
              <div className="text-[11px] font-semibold text-red-600 mt-0.5">🔴 Overdue</div>
              <div className="text-[10px] text-red-500">{pct(overdue)}%</div>
            </Link>
          </div>
          {/* Progress strip */}
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 rounded-l-full" style={{ flex: compliantCount || 0 }} />
            <div className="bg-amber-400" style={{ flex: atRisk || 0 }} />
            <div className="bg-orange-500" style={{ flex: actionRequired || 0 }} />
            <div className="bg-red-500 rounded-r-full" style={{ flex: overdue || 0 }} />
          </div>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{total} active obligations</span>
          <span>{completedThisWeek} completed this week ✓</span>
        </div>
      </div>

      {/* ── Urgent banner ── */}
      {(overdue > 0 || dueToday > 0) && (
        <Link
          href="/today"
          className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 transition-colors shadow-sm"
        >
          <span className="text-xl shrink-0">🔴</span>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {[overdue > 0 && `${overdue} overdue`, dueToday > 0 && `${dueToday} due today`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="text-xs opacity-80">Tap to see Today&apos;s Actions</p>
          </div>
          <span className="opacity-70 text-lg shrink-0">→</span>
        </Link>
      )}

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Items"    value={total}           color="blue" />
        <StatCard label="Open Actions"    value={openActions}     color={openActions > 0 ? 'orange' : 'green'} />
        <StatCard label="Decisions"       value={decisionNeeded}  color={decisionNeeded > 0 ? 'purple' : 'green'} />
        <StatCard label="Alert Deliveries" value={complianceAlerts} color={complianceAlerts > 0 ? 'orange' : 'green'} />
      </div>

      {/* ── Recent priority items ── */}
      {recentItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Priority Items</span>
            <Link href="/filings" className="text-xs font-semibold text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentItems.map((item) => {
              const isPast = item.dueDate && new Date(item.dueDate) < new Date()
              return (
                <Link
                  key={item.id}
                  href={`/work-items/${item.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_DOT[item.priority] ?? 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{item.title}</div>
                    {item.company && (
                      <div className="text-xs text-slate-500 truncate">{item.company}</div>
                    )}
                  </div>
                  {item.dueDate && (
                    <span className={`text-xs font-semibold shrink-0 ${isPast ? 'text-red-600' : 'text-slate-500'}`}>
                      {fmt(item.dueDate)}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Team pulse ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Team Pulse</span>
          <Link href="/teams" className="text-xs font-semibold text-blue-600 hover:underline">
            Full view →
          </Link>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {teamPulse.map(({ owner, count }) => (
            <Link
              key={owner}
              href={`/work-items?owner=${owner}`}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: '#1d4ed8' }}>
                {owner[0]}
              </div>
              <span className="text-sm font-semibold text-slate-800">{owner}</span>
              <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/work-items/new"  label="+ New Item"      color="blue" />
        <QuickLink href="/today"           label="Today's Actions" color="orange" />
        <QuickLink href="/decisions"       label="Decisions"       color="purple" />
        <QuickLink href="/portfolio"       label="Portfolio"       color="navy" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const styles: Record<string, string> = {
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green:  'bg-green-50  border-green-200  text-green-700',
    slate:  'bg-slate-100 border-slate-200  text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${styles[color] ?? styles.slate}`}>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs font-medium mt-1 opacity-80">{label}</div>
    </div>
  )
}

function QuickLink({ href, label, color }: { href: string; label: string; color: string }) {
  const styles: Record<string, string> = {
    blue:   'bg-blue-600   hover:bg-blue-700   text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    navy:   'text-white hover:opacity-90',
    slate:  'bg-slate-200  hover:bg-slate-300  text-slate-800',
  }
  const inlineStyle = color === 'navy' ? { background: '#0c2340' } : undefined
  return (
    <Link
      href={href}
      style={inlineStyle}
      className={`block rounded-xl px-4 py-4 text-center font-semibold text-sm transition-colors ${styles[color] ?? styles.slate}`}
    >
      {label}
    </Link>
  )
}
