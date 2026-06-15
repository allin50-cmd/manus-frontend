'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stageLabel } from '../../lib/crm-utils'
import type { Decimal } from '@prisma/client/runtime/library'

interface PipelineItem {
  id: string
  title: string
  type: string
  owner: string
  pipelineStage: string | null
  dealValue: Decimal | null
  dueDate: Date | string | null
  daysSinceLastTouch: number | null
  companyRef: { id: string; name: string } | null
  company: string | null
  outreachLogs: { id: string; occurredAt: Date; followUpDate: Date | null; followUpDone: boolean }[]
}

const TYPE_LABELS: Record<string, string> = {
  Partnership: 'Software Integration',
  ConstructionLead: 'Construction',
  PlanningLead: 'Planning',
}

type SortKey = 'company' | 'title' | 'type' | 'stage' | 'owner' | 'dealValue' | 'lastTouch' | 'nextFollowUp' | 'dueDate'

function formatDealValue(val: Decimal | null): string {
  if (val === null || val === undefined) return '—'
  const num = typeof val === 'object' && 'toNumber' in val ? (val as { toNumber(): number }).toNumber() : Number(val)
  if (isNaN(num)) return '—'
  return `£${num.toLocaleString('en-GB')}`
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getNextFollowUp(logs: { followUpDate: Date | null; followUpDone: boolean }[]): Date | null {
  const pending = logs
    .filter((l) => l.followUpDate && !l.followUpDone)
    .map((l) => new Date(l.followUpDate!))
    .sort((a, b) => a.getTime() - b.getTime())
  return pending[0] ?? null
}

function TouchCell({ days }: { days: number | null }) {
  if (days === null)
    return <span className="text-xs text-red-600 font-semibold">Never</span>
  if (days < 7)
    return <span className="text-xs text-green-700 font-semibold">{days}d ago</span>
  if (days <= 30)
    return <span className="text-xs text-amber-700 font-semibold">{days}d ago</span>
  return <span className="text-xs text-red-600 font-semibold">{days}d ago</span>
}

export default function PartnershipList({ items }: { items: PipelineItem[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('company')
  const [sortAsc, setSortAsc] = useState(true)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  function sortValue(item: PipelineItem): string | number {
    switch (sortKey) {
      case 'company':
        return item.companyRef?.name ?? item.company ?? ''
      case 'title':
        return item.title
      case 'type':
        return TYPE_LABELS[item.type] ?? item.type
      case 'stage':
        return stageLabel(item.pipelineStage ?? '')
      case 'owner':
        return item.owner
      case 'dealValue': {
        if (item.dealValue === null || item.dealValue === undefined) return -Infinity
        const num = typeof item.dealValue === 'object' && 'toNumber' in item.dealValue
          ? (item.dealValue as { toNumber(): number }).toNumber()
          : Number(item.dealValue)
        return isNaN(num) ? -Infinity : num
      }
      case 'lastTouch':
        return item.daysSinceLastTouch ?? Infinity
      case 'nextFollowUp': {
        const d = getNextFollowUp(item.outreachLogs)
        return d ? d.getTime() : Infinity
      }
      case 'dueDate':
        return item.dueDate ? new Date(item.dueDate).getTime() : Infinity
      default:
        return ''
    }
  }

  const sorted = [...items].sort((a, b) => {
    const av = sortValue(a)
    const bv = sortValue(b)
    if (av < bv) return sortAsc ? -1 : 1
    if (av > bv) return sortAsc ? 1 : -1
    return 0
  })

  const cols: { key: SortKey; label: string }[] = [
    { key: 'company', label: 'Company' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'stage', label: 'Stage' },
    { key: 'owner', label: 'Owner' },
    { key: 'dealValue', label: 'Deal Value' },
    { key: 'lastTouch', label: 'Last Touch' },
    { key: 'nextFollowUp', label: 'Next Follow-up' },
    { key: 'dueDate', label: 'Due Date' },
  ]

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <p className="font-semibold text-slate-700">No pipeline items</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {cols.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 whitespace-nowrap select-none"
                onClick={() => toggleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((item) => {
            const nextFU = getNextFollowUp(item.outreachLogs)
            return (
              <tr
                key={item.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/work-items/${item.id}`)}
              >
                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap max-w-[160px] truncate">
                  {item.companyRef?.name ?? item.company ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{item.title}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5 font-medium">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.pipelineStage ? (
                    <span className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5 font-medium">
                      {stageLabel(item.pipelineStage)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{item.owner}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-700">
                  {formatDealValue(item.dealValue)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <TouchCell days={item.daysSinceLastTouch} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                  {nextFU ? formatDate(nextFU) : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                  {formatDate(item.dueDate)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
