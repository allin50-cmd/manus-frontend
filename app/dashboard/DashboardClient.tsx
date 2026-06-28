'use client'

import { useState } from 'react'
import Link from 'next/link'

export type BriefingItemClient = {
  id: string
  title: string
  company: string | null
  owner: string
  status: string
  priority: string
  dueDate: string | null
  nextAction: string | null
}

type ActionTile = {
  label: string
  count: number
  colorClass: string
  href: string
}

const PRIORITY_BADGE: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700 border border-red-200',
  High:   'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low:    'bg-slate-100 text-slate-500 border border-slate-200',
}

const STATUS_CHIP: Record<string, string> = {
  DecisionNeeded: 'bg-purple-100 text-purple-700',
  Escalated:      'bg-red-100 text-red-700',
  FollowUpDue:    'bg-amber-100 text-amber-700',
  InProgress:     'bg-blue-100 text-blue-700',
  Waiting:        'bg-slate-100 text-slate-600',
  Captured:       'bg-slate-100 text-slate-500',
  Controlled:     'bg-green-100 text-green-700',
  Paused:         'bg-slate-100 text-slate-500',
}

function relativeDate(dateStr: string | null): { label: string; overdue: boolean } {
  if (!dateStr) return { label: '—', overdue: false }
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const diff = d.getTime() - today.getTime()
  const days = Math.round(diff / 86_400_000)

  if (days < 0) return { label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`, overdue: true }
  if (days === 0) return { label: 'Today', overdue: false }
  if (days === 1) return { label: 'Tomorrow', overdue: false }
  return { label: `In ${days} days`, overdue: false }
}

function ownerInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ItemRow({ item }: { item: BriefingItemClient }) {
  const { label: dateLabel, overdue } = relativeDate(item.dueDate)
  const statusLabel = item.status.replace(/([A-Z])/g, ' $1').trim()

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <Link
        href={`/work-items/${item.id}`}
        className="flex-1 min-w-0 text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline truncate"
      >
        {item.title}
      </Link>
      <span className={`text-[11px] font-semibold rounded px-1.5 py-0.5 shrink-0 ${PRIORITY_BADGE[item.priority] ?? 'bg-slate-100 text-slate-500'}`}>
        {item.priority}
      </span>
      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 shrink-0 ${STATUS_CHIP[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
        {statusLabel}
      </span>
      <span className={`text-[11px] font-semibold shrink-0 ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
        {dateLabel}
      </span>
      <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {ownerInitials(item.owner)}
      </span>
    </div>
  )
}

function CollapsibleSection({
  title,
  items,
  emptyLabel,
  defaultOpen = true,
}: {
  title: string
  items: BriefingItemClient[]
  emptyLabel: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</span>
          {items.length > 0 && (
            <span className="bg-slate-200 text-slate-600 text-[11px] font-bold rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {items.length === 0 ? (
            <p className="px-5 py-3 text-sm text-slate-400">No {emptyLabel} — looking good.</p>
          ) : (
            <div>
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MorningBriefing({ items }: { items: BriefingItemClient[] }) {
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const terminal = new Set(['Completed', 'Archived', 'NotFit'])

  const decisionsNeeded  = items.filter((i) => i.status === 'DecisionNeeded')
  const escalated        = items.filter((i) => i.status === 'Escalated')
  const overdue          = items.filter((i) => {
    if (!i.dueDate) return false
    if (terminal.has(i.status)) return false
    return new Date(i.dueDate) < todayStart
  })
  const followUpDueToday = items.filter((i) => {
    if (i.status !== 'FollowUpDue') return false
    if (!i.dueDate) return false
    const d = new Date(i.dueDate)
    return d >= todayStart && d <= todayEnd
  })

  const allClear =
    decisionsNeeded.length === 0 &&
    escalated.length === 0 &&
    overdue.length === 0 &&
    followUpDueToday.length === 0

  const decisionTileColor = decisionsNeeded.length > 0
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-slate-50 border-slate-200 text-slate-500'

  const overdueTileColor = overdue.length > 3
    ? 'bg-red-50 border-red-200 text-red-700'
    : overdue.length > 0
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-slate-50 border-slate-200 text-slate-400'

  const escalatedTileColor = escalated.length > 0
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-slate-50 border-slate-200 text-slate-400'

  const followUpTileColor = followUpDueToday.length > 0
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-slate-50 border-slate-200 text-slate-400'

  const tiles: ActionTile[] = [
    { label: 'Decisions Needed', count: decisionsNeeded.length,  colorClass: decisionTileColor,  href: '#briefing-decisions' },
    { label: 'Overdue',          count: overdue.length,          colorClass: overdueTileColor,   href: '#briefing-overdue'   },
    { label: 'Escalated',        count: escalated.length,        colorClass: escalatedTileColor, href: '#briefing-escalated' },
    { label: 'Follow-Ups Today', count: followUpDueToday.length, colorClass: followUpTileColor,  href: '#briefing-followup'  },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Morning Briefing</h2>
        <p className="text-xs text-slate-500 mt-0.5">Your personalised action summary</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {tiles.map((tile) => (
          <a
            key={tile.label}
            href={tile.href}
            className={`flex-shrink-0 rounded-xl border px-4 py-3 text-center min-w-[120px] hover:opacity-80 transition-opacity ${tile.colorClass}`}
          >
            <div className="text-2xl font-extrabold">{tile.count}</div>
            <div className="text-[11px] font-semibold mt-0.5 leading-tight">{tile.label}</div>
          </a>
        ))}
      </div>

      {allClear && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 text-center">
          <div className="text-2xl mb-1">✓</div>
          <p className="text-sm font-semibold text-green-700">All clear — no urgent items</p>
          <p className="text-xs text-green-600 mt-0.5">Great work. Keep it up.</p>
        </div>
      )}

      {!allClear && (
        <div className="space-y-3">
          <div id="briefing-decisions">
            <CollapsibleSection title="Decisions Needed" items={decisionsNeeded} emptyLabel="decisions needed" defaultOpen={decisionsNeeded.length > 0} />
          </div>
          <div id="briefing-overdue">
            <CollapsibleSection title="Overdue" items={overdue} emptyLabel="overdue items" defaultOpen={overdue.length > 0} />
          </div>
          <div id="briefing-escalated">
            <CollapsibleSection title="Escalated to Me" items={escalated} emptyLabel="escalated items" defaultOpen={escalated.length > 0} />
          </div>
          <div id="briefing-followup">
            <CollapsibleSection title="Follow-Ups Due Today" items={followUpDueToday} emptyLabel="follow-ups due today" defaultOpen={followUpDueToday.length > 0} />
          </div>
        </div>
      )}
    </div>
  )
}
