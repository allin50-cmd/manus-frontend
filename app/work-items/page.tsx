import { requireAuth } from '@/lib/auth'
import { getDb, workItems } from '@/lib/db'
import { formatUKDate, statusLabel, typeLabel } from '@/lib/utils'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import WorkItemFilters from '@/components/WorkItemFilters'
import { eq, asc, desc, and } from 'drizzle-orm'
import type { WorkItem } from '@/db/schema'

export const dynamic = 'force-dynamic'

interface SearchParams {
  status?: string
  type?: string
  owner?: string
  priority?: string
}

export default async function WorkItemsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuth()

  const db = await getDb()

  const conditions = []
  if (searchParams.status && searchParams.status !== 'all') {
    conditions.push(eq(workItems.status, searchParams.status as WorkItem['status']))
  }
  if (searchParams.type && searchParams.type !== 'all') {
    conditions.push(eq(workItems.type, searchParams.type as WorkItem['type']))
  }
  if (searchParams.owner && searchParams.owner !== 'all') {
    conditions.push(eq(workItems.owner, searchParams.owner))
  }
  if (searchParams.priority && searchParams.priority !== 'all') {
    conditions.push(eq(workItems.priority, searchParams.priority as WorkItem['priority']))
  }

  const items = await db
    .select()
    .from(workItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(workItems.priority), asc(workItems.dueDate), desc(workItems.createdAt))

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
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400">No work items found</div>
        )}
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
            {item.nextAction && <p className="text-xs text-slate-700 bg-blue-50 rounded px-2 py-1">Next: {item.nextAction}</p>}
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
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400">No work items found</div>
        )}
      </div>
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
