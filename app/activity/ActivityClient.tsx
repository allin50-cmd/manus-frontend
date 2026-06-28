'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const PERSONS = ['George', 'Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie'] as const
type Person = (typeof PERSONS)[number] | 'All'
type SignalFilter = 'all' | 'high' | 'high-medium'
type DateRange = 'today' | '7d' | '30d'

export type ActivityLogClient = {
  id: string
  workItemId: string | null
  person: string
  eventType: string
  summary: string
  oldStatus: string | null
  newStatus: string | null
  createdAt: string // ISO string
  workItem: { id: string; title: string } | null
}

const HIGH_SIGNAL_STATUSES = new Set(['DecisionNeeded', 'Escalated', 'FollowUpDue', 'Completed'])
const MEDIUM_SIGNAL_EVENTS = new Set(['ActionCompleted', 'DecisionMade'])

function getSignalTier(log: ActivityLogClient): 1 | 2 | 3 {
  if (
    log.eventType === 'StatusChanged' &&
    log.newStatus &&
    HIGH_SIGNAL_STATUSES.has(log.newStatus)
  ) {
    return 1
  }
  if (
    log.eventType === 'Created' &&
    log.summary.toLowerCase().includes('urgent')
  ) {
    return 1
  }
  if (log.eventType === 'StatusChanged' || MEDIUM_SIGNAL_EVENTS.has(log.eventType)) {
    return 2
  }
  return 3
}

const TIER_DOT: Record<1 | 2 | 3, string> = {
  1: 'bg-red-500',
  2: 'bg-amber-400',
  3: 'bg-slate-300',
}

const EVENT_BADGE: Record<string, string> = {
  Created:           'bg-blue-100 text-blue-700',
  NoteAdded:         'bg-slate-100 text-slate-700',
  StatusChanged:     'bg-yellow-100 text-yellow-800',
  ActionCreated:     'bg-orange-100 text-orange-700',
  ActionCompleted:   'bg-green-100 text-green-700',
  DecisionRequested: 'bg-purple-100 text-purple-700',
  DecisionMade:      'bg-purple-100 text-purple-700',
  FollowUpSet:       'bg-cyan-100 text-cyan-700',
  Archived:          'bg-slate-100 text-slate-600',
}

function humanEventDesc(log: ActivityLogClient): string {
  const name = log.person
  switch (log.eventType) {
    case 'Created':           return `${name} created this item`
    case 'NoteAdded':         return `${name} added a note`
    case 'StatusChanged':     return log.newStatus ? `${name} changed status to ${log.newStatus}` : `${name} changed status`
    case 'ActionCreated':     return `${name} created an action`
    case 'ActionCompleted':   return `${name} completed an action`
    case 'DecisionRequested': return `${name} requested a decision`
    case 'DecisionMade':      return `${name} made a decision`
    case 'FollowUpSet':       return `${name} set a follow-up`
    case 'Archived':          return `${name} archived this item`
    default:                  return `${name} ${log.eventType.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`
  }
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function ActivityClient({ logs }: { logs: ActivityLogClient[] }) {
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('all')
  const [personFilter, setPersonFilter] = useState<Person>('All')
  const [dateRange, setDateRange] = useState<DateRange>('7d')

  const filtered = useMemo(() => {
    const now = new Date()
    let cutoff: Date
    if (dateRange === 'today') {
      cutoff = new Date(now); cutoff.setHours(0, 0, 0, 0)
    } else if (dateRange === '7d') {
      cutoff = new Date(now.getTime() - 7 * 86_400_000)
    } else {
      cutoff = new Date(now.getTime() - 30 * 86_400_000)
    }

    return logs.filter((log) => {
      if (new Date(log.createdAt) < cutoff) return false
      if (personFilter !== 'All' && log.person !== personFilter) return false
      const tier = getSignalTier(log)
      if (signalFilter === 'high' && tier !== 1) return false
      if (signalFilter === 'high-medium' && tier === 3) return false
      return true
    })
  }, [logs, signalFilter, personFilter, dateRange])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Signal</label>
          <div className="flex gap-1">
            {(['all', 'high', 'high-medium'] as SignalFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setSignalFilter(v)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  signalFilter === v
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {v === 'all' ? 'All' : v === 'high' ? 'High only' : 'High + Medium'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Person</label>
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value as Person)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All people</option>
            {PERSONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Period</label>
          <div className="flex gap-1">
            {([['today', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days']] as [DateRange, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setDateRange(v)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  dateRange === v
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto text-xs text-slate-400 self-center">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="space-y-0">
        {filtered.map((log, i) => {
          const tier = getSignalTier(log)
          return (
            <div key={log.id} className="relative pl-7 pb-4">
              {i < filtered.length - 1 && (
                <div className="absolute left-[9px] top-5 bottom-0 w-px bg-slate-200" />
              )}
              <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${TIER_DOT[tier]}`} />
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  {log.workItem && (
                    <Link
                      href={`/work-items/${log.workItem.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline truncate max-w-[200px]"
                    >
                      {log.workItem.title}
                    </Link>
                  )}
                  <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${EVENT_BADGE[log.eventType] ?? 'bg-slate-100 text-slate-600'}`}>
                    {log.eventType.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {tier === 1 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 rounded px-1.5 py-0.5 border border-red-200">
                      High signal
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800">{humanEventDesc(log)}</p>
                <p className="text-xs text-slate-500 italic">{log.summary}</p>
                {log.oldStatus && log.newStatus && (
                  <p className="text-xs text-slate-400">{log.oldStatus} → {log.newStatus}</p>
                )}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <p className="text-xs text-slate-400">{relativeTime(log.createdAt)}</p>
                  {log.workItem && (
                    <Link
                      href={`/work-items/${log.workItem.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                    >
                      Open →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">No events match the current filters</p>
        )}
      </div>
    </div>
  )
}
