'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  WORK_ITEM_TYPES,
  TYPE_LABELS as BASE_TYPE_LABELS,
  WORK_ITEM_STATUSES,
  STATUS_LABELS as BASE_STATUS_LABELS,
  PRIORITIES as BASE_PRIORITIES,
  OWNERS as BASE_OWNERS,
} from '../lib/work-item-enums'

interface FilterState {
  status?: string
  type?: string
  owner?: string
  priority?: string
}

const STATUSES = ['all', ...WORK_ITEM_STATUSES]
const STATUS_LABELS: Record<string, string> = { all: 'All Statuses', ...BASE_STATUS_LABELS }
const TYPES = ['all', ...WORK_ITEM_TYPES]
const TYPE_LABELS: Record<string, string> = { all: 'All Types', ...BASE_TYPE_LABELS }
const OWNERS = ['all', ...BASE_OWNERS]
const PRIORITIES = ['all', ...BASE_PRIORITIES]

export default function WorkItemFilters({ current }: { current: FilterState }) {
  const router = useRouter()
  const pathname = usePathname()

  function update(key: string, value: string) {
    const params = new URLSearchParams()
    const merged = { ...current, [key]: value }
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== 'all') params.set(k, v)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasActive = Object.values(current).some((v) => v && v !== 'all')
  const sel = 'text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="flex flex-wrap gap-2">
      <select className={sel} value={current.status || 'all'} onChange={(e) => update('status', e.target.value)}>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <select className={sel} value={current.type || 'all'} onChange={(e) => update('type', e.target.value)}>
        {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
      </select>
      <select className={sel} value={current.owner || 'all'} onChange={(e) => update('owner', e.target.value)}>
        {OWNERS.map((o) => <option key={o} value={o}>{o === 'all' ? 'All Owners' : o}</option>)}
      </select>
      <select className={sel} value={current.priority || 'all'} onChange={(e) => update('priority', e.target.value)}>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p}</option>)}
      </select>
      {hasActive && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
