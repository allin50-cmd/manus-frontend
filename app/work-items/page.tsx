import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import { formatUKDate, statusLabel, typeLabel } from '../../lib/utils'
import Link from 'next/link'
import StatusBadge from '../../components/StatusBadge'
import WorkItemFilters from '../../components/WorkItemFilters'
import { WorkItemStatus, WorkItemType, Priority } from '@/lib/types'
import { isValidType, isValidStatus, isValidPriority } from '../../lib/work-item-enums'

export const dynamic = 'force-dynamic'

interface SearchParams {
  status?: string
  type?: string
  owner?: string
  priority?: string
  company?: string
}

export default async function WorkItemsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuth()

  const where: Record<string, unknown> = {}
  if (searchParams.status && searchParams.status !== 'all' && isValidStatus(searchParams.status))
    where.status = searchParams.status as WorkItemStatus
  if (searchParams.type && searchParams.type !== 'all' && isValidType(searchParams.type))
    where.type = searchParams.type as WorkItemType
  if (searchParams.owner && searchParams.owner !== 'all') where.owner = searchParams.owner
  if (searchParams.priority && searchParams.priority !== 'all' && isValidPriority(searchParams.priority))
    where.priority = searchParams.priority as Priority
  if (searchParams.company) where.company = searchParams.company

  const hasFilters = Object.values(searchParams).some((v) => v && v !== 'all')

  let items: Awaited<ReturnType<typeof db.workItem.findMany>> = []
  try {
    items = await db.workItem.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    })
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Work Items</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load work items. Please refresh the page.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Work Items</h1>
        <Link
          href="/work-items/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Add
        </Link>
      </div>

      <WorkItemFilters current={searchParams} />

      {searchParams.company && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Company:</span>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 rounded-full px-3 py-1">
            {searchParams.company}
          </span>
          <a href="/work-items" className="text-xs text-slate-400 hover:text-slate-600 underline">Clear</a>
        </div>
      )}

      <p className="text-xs text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Type', 'Title', 'Company', 'Owner', 'Status', 'Priority', 'Next Action', 'Due', '?'].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{typeLabel(item.type)}</td>
                <td className="px-3 py-3">
                  <Link href={`/work-items/${item.id}`} className="font-medium text-blue-700 hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-600 text-xs">{item.company ?? '—'}</td>
                <td className="px-3 py-3 text-slate-700 text-xs font-medium">{item.owner}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={item.priority} />
                </td>
                <td className="px-3 py-3 text-xs text-slate-600 max-w-[200px] truncate">{item.nextAction ?? '—'}</td>
                <td className="px-3 py-3 text-xs whitespace-nowrap">
                  <span className={item.dueDate && new Date(item.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-slate-600'}>
                    {formatUKDate(item.dueDate)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">{item.decisionNeeded ? '🔴' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState hasFilters={hasFilters} />}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => (
          <Link key={item.id} href={`/work-items/${item.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">{typeLabel(item.type)}</span>
                <PriorityBadge priority={item.priority} />
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="font-semibold text-slate-900">{item.title}</p>
            {item.company && <p className="text-xs text-slate-500">{item.company}{item.contactName ? ` · ${item.contactName}` : ''}</p>}
            <p className="text-xs text-slate-600">Owner: <span className="font-medium">{item.owner}</span></p>
            {item.nextAction && (
              <div className="flex items-center gap-2 border-l-2 border-blue-400 bg-blue-50 rounded-r-lg pl-2 pr-3 py-1.5">
                <span className="text-xs font-medium text-blue-800 flex-1">{item.nextAction}</span>
                <span className="text-blue-400 text-sm">→</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              {item.dueDate ? (
                <span className={`text-xs ${new Date(item.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                  Due: {formatUKDate(item.dueDate)}
                </span>
              ) : <span />}
              {item.decisionNeeded && <span className="text-xs text-red-600 font-medium">Decision needed</span>}
            </div>
          </Link>
        ))}
        {items.length === 0 && <EmptyState hasFilters={hasFilters} />}
      </div>
    </div>
  )
}

function EmptyState({ hasFilters = false }: { hasFilters?: boolean }) {
  if (hasFilters) {
    return (
      <div className="text-center py-14 space-y-3">
        <p className="font-semibold text-slate-700">No items match your filters</p>
        <a href="/work-items" className="text-sm text-blue-600 hover:underline">
          Clear filters
        </a>
      </div>
    )
  }
  return (
    <div className="text-center py-14 space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mx-auto">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-slate-700">No work items yet</p>
        <p className="text-sm text-slate-400 mt-1">Add your first item to start tracking work</p>
      </div>
      <a href="/work-items/new" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors">
        + Add Work Item
      </a>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-medium rounded px-2 py-0.5 ${map[priority] ?? 'bg-slate-100 text-slate-600'}`}>
      {priority}
    </span>
  )
}
