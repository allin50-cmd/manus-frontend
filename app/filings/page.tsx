import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import Link from 'next/link'
import type { WorkItemStatus, Priority } from '@prisma/client'
import FilingsClient from './FilingsClient'

export const dynamic = 'force-dynamic'

// ── WorkItem-based compliance helpers (legacy view) ─────────────────────────

const STATUS_BADGE: Record<string, string> = {
  Captured:       'bg-slate-100 text-slate-600',
  InProgress:     'bg-blue-100 text-blue-700',
  Waiting:        'bg-yellow-100 text-yellow-700',
  FollowUpDue:    'bg-orange-100 text-orange-700',
  Escalated:      'bg-purple-100 text-purple-700',
  DecisionNeeded: 'bg-purple-100 text-purple-700',
  Completed:      'bg-green-100 text-green-700',
  Paused:         'bg-slate-100 text-slate-500',
  Controlled:     'bg-blue-100 text-blue-700',
}

const PRIORITY_BADGE: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High:   'bg-orange-100 text-orange-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-slate-100 text-slate-500',
}

const PRIORITY_ORDER: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function complianceStatus(item: { dueDate: Date | null; status: WorkItemStatus }): 'overdue' | 'action' | 'risk' | 'compliant' {
  if (item.status === 'Completed') return 'compliant'
  const now = new Date(); now.setHours(0, 0, 0, 0)
  if (item.dueDate && new Date(item.dueDate) < now) return 'overdue'
  if (item.status === 'Escalated' || item.status === 'DecisionNeeded' || item.status === 'FollowUpDue') return 'action'
  if (item.dueDate) {
    const days = (new Date(item.dueDate).getTime() - now.getTime()) / 86_400_000
    if (days <= 14) return 'action'
    if (days <= 30) return 'risk'
  }
  return 'compliant'
}

const VALID_STATUS_FILTERS = ['overdue', 'action', 'risk', 'compliant'] as const
type StatusFilter = typeof VALID_STATUS_FILTERS[number]

export default async function FilingsPage({
  searchParams,
}: {
  searchParams?: { status?: string; view?: string }
}) {
  await requireAuth()

  const view = searchParams?.view === 'legacy' ? 'legacy' : 'filings'

  // ── Filing model data ──────────────────────────────────────────────────────
  let filings: Awaited<ReturnType<typeof db.filing.findMany<{ include: { company: { select: { id: true; name: true } } } }>>> = []
  let healthData: { companies: { companyId: string; companyName: string; overdueCount: number; atRiskCount: number; upcomingCount: number; completedCount: number; healthStatus: 'RED' | 'AMBER' | 'GREEN' }[] } = { companies: [] }
  let companies: { id: string; name: string }[] = []

  try {
    const [filingsResult, companiesResult] = await Promise.all([
      db.filing.findMany({
        include: { company: { select: { id: true, name: true } } },
        orderBy: [{ dueDate: 'asc' }],
      }),
      db.company.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ])
    filings = filingsResult
    companies = companiesResult

    // Build health data server-side
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const companyMap = new Map<string, { id: string; name: string; filings: typeof filings }>()
    for (const f of filings) {
      if (!companyMap.has(f.companyId)) {
        companyMap.set(f.companyId, { id: f.companyId, name: f.company.name, filings: [] })
      }
      companyMap.get(f.companyId)!.filings.push(f)
    }
    const healthCompanies = Array.from(companyMap.values())
      .map((c) => {
        const overdueCount = c.filings.filter((f) => f.status === 'OVERDUE').length
        const atRiskCount = c.filings.filter((f) => f.status === 'AT_RISK').length
        const upcomingCount = c.filings.filter((f) => f.status === 'UPCOMING').length
        const completedCount = c.filings.filter(
          (f) => f.status === 'COMPLETED' && f.completedAt && f.completedAt >= ninetyDaysAgo
        ).length
        const healthStatus: 'RED' | 'AMBER' | 'GREEN' = overdueCount > 0 ? 'RED' : atRiskCount > 0 ? 'AMBER' : 'GREEN'
        return { companyId: c.id, companyName: c.name, overdueCount, atRiskCount, upcomingCount, completedCount, healthStatus }
      })
      .sort((a, b) => {
        const order: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 }
        return (order[a.healthStatus] ?? 3) - (order[b.healthStatus] ?? 3)
      })
    healthData = { companies: healthCompanies }
  } catch {
    // Fall through — will show empty state
  }

  // ── Legacy WorkItem data ───────────────────────────────────────────────────
  const activeFilter = VALID_STATUS_FILTERS.includes(searchParams?.status as StatusFilter)
    ? (searchParams!.status as StatusFilter)
    : null

  let items: Awaited<ReturnType<typeof db.workItem.findMany>> = []
  let legacyError = false
  try {
    items = await db.workItem.findMany({
      where: { status: { notIn: ['Archived', 'NotFit'] } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    })
  } catch {
    legacyError = true
  }

  const allAnnotated = items
    .map((item) => ({ ...item, compliance: complianceStatus(item) }))
    .sort((a, b) => {
      const urgency: Record<string, number> = { overdue: 0, action: 1, risk: 2, compliant: 3 }
      const ud = urgency[a.compliance] - urgency[b.compliance]
      if (ud !== 0) return ud
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    })

  const annotated = activeFilter ? allAnnotated.filter((i) => i.compliance === activeFilter) : allAnnotated

  const legacyCounts = {
    overdue:   allAnnotated.filter((i) => i.compliance === 'overdue').length,
    action:    allAnnotated.filter((i) => i.compliance === 'action').length,
    risk:      allAnnotated.filter((i) => i.compliance === 'risk').length,
    compliant: allAnnotated.filter((i) => i.compliance === 'compliant').length,
  }

  // Serialize filings for client (dates as strings)
  const serializedFilings = filings.map((f) => ({
    ...f,
    dueDate: f.dueDate.toISOString(),
    periodStart: f.periodStart?.toISOString() ?? null,
    periodEnd: f.periodEnd?.toISOString() ?? null,
    completedAt: f.completedAt?.toISOString() ?? null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Filing Obligations</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all upcoming compliance deadlines</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {view === 'filings' ? (
            <>
              {/* Add Filing button is handled inside FilingsClient via modal */}
              <span
                id="add-filing-trigger"
                data-add-filing="true"
                className="text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                style={{ background: '#0c2340' }}
              />
              <Link
                href="/filings?view=legacy"
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Legacy view
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/work-items/new"
                className="shrink-0 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: '#0c2340' }}
              >
                + Add
              </Link>
              <Link
                href="/filings"
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Filing view
              </Link>
            </>
          )}
        </div>
      </div>

      {view === 'filings' ? (
        <FilingsPageContent
          healthData={healthData}
          filings={serializedFilings as Parameters<typeof FilingsClient>[0]['initialFilings']}
          companies={companies}
        />
      ) : (
        <LegacyView
          activeFilter={activeFilter}
          counts={legacyCounts}
          annotated={annotated}
          legacyError={legacyError}
        />
      )}
    </div>
  )
}

// ── Filing view wrapper — server renders FilingsClient with Add Filing button ─

function FilingsPageContent({
  healthData,
  filings,
  companies,
}: {
  healthData: Parameters<typeof FilingsClient>[0]['initialHealth'] extends infer T ? { companies: T } : never
  filings: Parameters<typeof FilingsClient>[0]['initialFilings']
  companies: Parameters<typeof FilingsClient>[0]['companies']
}) {
  return (
    <FilingsClientWrapper
      initialHealth={healthData.companies}
      initialFilings={filings}
      companies={companies}
    />
  )
}

function FilingsClientWrapper(props: Parameters<typeof FilingsClient>[0]) {
  return <FilingsClient {...props} />
}

// ── Legacy WorkItem-based view ─────────────────────────────────────────────

function LegacyView({
  activeFilter,
  counts,
  annotated,
  legacyError,
}: {
  activeFilter: StatusFilter | null
  counts: { overdue: number; action: number; risk: number; compliant: number }
  annotated: Array<{
    id: string
    title: string
    company: string | null
    status: WorkItemStatus
    priority: Priority
    dueDate: Date | null
    compliance: 'overdue' | 'action' | 'risk' | 'compliant'
  }>
  legacyError: boolean
}) {
  const PRIORITY_BADGE_MAP: Record<string, string> = {
    Urgent: 'bg-red-100 text-red-700',
    High:   'bg-orange-100 text-orange-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low:    'bg-slate-100 text-slate-500',
  }

  function fmtDateLegacy(d: Date | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (legacyError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
        Could not load filings. Please refresh.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active filter chip */}
      {activeFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filtered:</span>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 rounded-full px-3 py-1 capitalize">
            {activeFilter}
          </span>
          <Link href="/filings?view=legacy" className="text-xs text-slate-400 hover:text-slate-600 underline">
            Clear
          </Link>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-2">
        <Link href="/filings?view=legacy&status=overdue" className="bg-red-50 border border-red-200 rounded-xl p-3 text-center hover:shadow-sm transition-shadow">
          <div className="text-2xl font-extrabold text-red-700">{counts.overdue}</div>
          <div className="text-[11px] font-semibold text-red-600 mt-0.5">Overdue</div>
        </Link>
        <Link href="/filings?view=legacy&status=action" className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center hover:shadow-sm transition-shadow">
          <div className="text-2xl font-extrabold text-orange-700">{counts.action}</div>
          <div className="text-[11px] font-semibold text-orange-600 mt-0.5">Action Req.</div>
        </Link>
        <Link href="/filings?view=legacy&status=risk" className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center hover:shadow-sm transition-shadow">
          <div className="text-2xl font-extrabold text-amber-700">{counts.risk}</div>
          <div className="text-[11px] font-semibold text-amber-600 mt-0.5">At Risk</div>
        </Link>
        <Link href="/filings?view=legacy&status=compliant" className="bg-green-50 border border-green-200 rounded-xl p-3 text-center hover:shadow-sm transition-shadow">
          <div className="text-2xl font-extrabold text-green-700">{counts.compliant}</div>
          <div className="text-[11px] font-semibold text-green-600 mt-0.5">Compliant</div>
        </Link>
      </div>

      {/* Empty state */}
      {annotated.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="text-5xl">📄</div>
          <p className="font-semibold text-slate-700">No filing obligations yet</p>
          <Link href="/work-items/new" className="inline-block text-sm text-blue-600 hover:underline font-medium">
            + Add the first one
          </Link>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {annotated.map((item) => {
          const now = new Date(); now.setHours(0, 0, 0, 0)
          const isOverdue = item.dueDate && new Date(item.dueDate) < now && item.status !== 'Completed'

          const leftBorder: Record<string, string> = {
            overdue:   'border-l-4 border-l-red-500',
            action:    'border-l-4 border-l-orange-500',
            risk:      'border-l-4 border-l-amber-400',
            compliant: 'border-l-4 border-l-green-500',
          }

          return (
            <Link
              key={item.id}
              href={`/work-items/${item.id}`}
              className={`block bg-white rounded-xl border border-slate-200 px-4 py-3.5 hover:shadow-sm transition-shadow ${leftBorder[item.compliance]}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm leading-tight">{item.title}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_BADGE_MAP[item.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {item.company && (
                      <span className="text-xs text-slate-500 font-medium">{item.company}</span>
                    )}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[item.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {item.dueDate && (
                    <>
                      <div className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                        {fmtDateLegacy(item.dueDate)}
                      </div>
                      {isOverdue && (
                        <div className="text-[10px] font-bold text-red-500 uppercase">Overdue</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
