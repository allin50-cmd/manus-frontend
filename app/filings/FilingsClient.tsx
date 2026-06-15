'use client'

import { useState, useCallback } from 'react'
import { FILING_CATEGORY_LABELS } from '@/lib/compliance/thresholds'

type HealthStatus = 'RED' | 'AMBER' | 'GREEN'

interface CompanyHealth {
  companyId: string
  companyName: string
  overdueCount: number
  atRiskCount: number
  upcomingCount: number
  completedCount: number
  healthStatus: HealthStatus
}

interface Company {
  id: string
  name: string
}

interface FilingWithCompany {
  id: string
  companyId: string
  category: string
  title: string
  statutoryReference: string | null
  description: string | null
  dueDate: string
  status: string
  filedReference: string | null
  completedAt: string | null
  completedByPerson: string | null
  workItemId: string | null
  company: { id: string; name: string }
}

interface FilingsClientProps {
  initialHealth: CompanyHealth[]
  initialFilings: FilingWithCompany[]
  companies: Company[]
}

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'AT_RISK', label: 'At Risk' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

type StatusFilter = typeof STATUS_FILTERS[number]['value']

const HEALTH_COLORS: Record<HealthStatus, string> = {
  RED: 'bg-red-50 border-red-300',
  AMBER: 'bg-amber-50 border-amber-300',
  GREEN: 'bg-green-50 border-green-300',
}

const HEALTH_DOT: Record<HealthStatus, string> = {
  RED: 'bg-red-500',
  AMBER: 'bg-amber-400',
  GREEN: 'bg-green-500',
}

const FILING_STATUS_BADGE: Record<string, string> = {
  OVERDUE: 'bg-red-100 text-red-700',
  AT_RISK: 'bg-amber-100 text-amber-700',
  UPCOMING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  EXEMPT: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-slate-100 text-slate-400 line-through',
}

const FILING_STATUS_LABELS: Record<string, string> = {
  OVERDUE: 'Overdue',
  AT_RISK: 'At Risk',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
  EXEMPT: 'Exempt',
  CANCELLED: 'Cancelled',
}

const STATUS_ORDER: Record<string, number> = {
  OVERDUE: 0,
  AT_RISK: 1,
  UPCOMING: 2,
  COMPLETED: 3,
  EXEMPT: 4,
  CANCELLED: 5,
}

function relativeDueDate(dueDateStr: string): { label: string; isOverdue: boolean } {
  const due = new Date(dueDateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const days = Math.floor((due.getTime() - now.getTime()) / 86_400_000)
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, isOverdue: true }
  if (days === 0) return { label: 'Due today', isOverdue: false }
  if (days === 1) return { label: 'Due tomorrow', isOverdue: false }
  if (days <= 7) return { label: `${days}d`, isOverdue: false }
  return {
    label: due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    isOverdue: false,
  }
}

function AddFilingModal({
  companies,
  onClose,
  onAdded,
}: {
  companies: Company[]
  onClose: () => void
  onAdded: (filing: FilingWithCompany) => void
}) {
  const [form, setForm] = useState({
    companyId: '',
    category: 'OTHER',
    title: '',
    dueDate: '',
    description: '',
    isRecurring: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/filings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create filing')
        return
      }
      const filing = await res.json()
      onAdded(filing)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Add Filing</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Company *</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.companyId}
              onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
              required
            >
              <option value="">Select company…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              required
            >
              {Object.entries(FILING_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Q4 VAT Return"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date *</label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional notes…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
            />
            Recurring filing
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ background: '#0c2340' }}
            >
              {loading ? 'Saving…' : 'Add Filing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FilingsClient({ initialHealth, initialFilings, companies }: FilingsClientProps) {
  const [filings, setFilings] = useState<FilingWithCompany[]>(initialFilings)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  const handleMarkComplete = useCallback(async (id: string) => {
    setCompleting(id)
    try {
      const res = await fetch(`/api/filings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setFilings((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)))
      }
    } catch {
      // silently fail
    } finally {
      setCompleting(null)
    }
  }, [])

  const filtered = filings
    .filter((f) => statusFilter === 'ALL' || f.status === statusFilter)
    .filter((f) => categoryFilter === 'ALL' || f.category === categoryFilter)
    .sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      if (so !== 0) return so
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  const categories = Array.from(new Set(filings.map((f) => f.category))).sort()

  const counts: Record<StatusFilter, number> = {
    ALL: filings.length,
    OVERDUE: filings.filter((f) => f.status === 'OVERDUE').length,
    AT_RISK: filings.filter((f) => f.status === 'AT_RISK').length,
    UPCOMING: filings.filter((f) => f.status === 'UPCOMING').length,
    COMPLETED: filings.filter((f) => f.status === 'COMPLETED').length,
  }

  return (
    <>
      {showAddModal && (
        <AddFilingModal
          companies={companies}
          onClose={() => setShowAddModal(false)}
          onAdded={(filing) => setFilings((prev) => [filing as unknown as FilingWithCompany, ...prev])}
        />
      )}

      {/* Company Health Strip */}
      {initialHealth.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company Health</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {initialHealth.map((c) => (
              <div
                key={c.companyId}
                className={`shrink-0 border rounded-xl px-4 py-3 min-w-[160px] ${HEALTH_COLORS[c.healthStatus]}`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${HEALTH_DOT[c.healthStatus]}`} />
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[110px]">{c.companyName}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  {c.overdueCount > 0 && (
                    <span className="text-red-600 font-semibold">{c.overdueCount} overdue</span>
                  )}
                  {c.atRiskCount > 0 && (
                    <span className="text-amber-600 font-semibold">{c.atRiskCount} at risk</span>
                  )}
                  {c.overdueCount === 0 && c.atRiskCount === 0 && (
                    <span className="text-green-600 font-semibold">{c.upcomingCount} upcoming</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs + Category Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
              {counts[f.value] > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === f.value ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
                  {counts[f.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <select
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{FILING_CATEGORY_LABELS[c] ?? c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="text-5xl">📄</div>
          <p className="font-semibold text-slate-700">No filings match your filters</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-block text-sm text-blue-600 hover:underline font-medium"
          >
            + Add the first one
          </button>
        </div>
      )}

      {/* Filing list */}
      <div className="space-y-2">
        {filtered.map((filing) => {
          const { label: dueLabel, isOverdue } = relativeDueDate(filing.dueDate)
          const statusBadge = FILING_STATUS_BADGE[filing.status] ?? 'bg-slate-100 text-slate-500'
          const statusLabel = FILING_STATUS_LABELS[filing.status] ?? filing.status

          const leftBorder: Record<string, string> = {
            OVERDUE: 'border-l-4 border-l-red-500',
            AT_RISK: 'border-l-4 border-l-amber-400',
            UPCOMING: 'border-l-4 border-l-blue-400',
            COMPLETED: 'border-l-4 border-l-green-500',
          }

          return (
            <div
              key={filing.id}
              className={`bg-white rounded-xl border border-slate-200 px-4 py-3.5 ${leftBorder[filing.status] ?? ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadge}`}>
                      {statusLabel}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm leading-tight">{filing.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">{filing.company.name}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {FILING_CATEGORY_LABELS[filing.category] ?? filing.category}
                    </span>
                    {filing.workItemId && (
                      <a
                        href={`/work-items/${filing.workItemId}`}
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Work item
                      </a>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                  <div className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                    {dueLabel}
                  </div>
                  {filing.status !== 'COMPLETED' && filing.status !== 'CANCELLED' && filing.status !== 'EXEMPT' && (
                    <button
                      onClick={() => handleMarkComplete(filing.id)}
                      disabled={completing === filing.id}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {completing === filing.id ? 'Saving…' : 'Mark Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
