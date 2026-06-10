'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALERT_CATEGORIES } from '../../../lib/alert-recipient-selector'

const CATEGORY_LABELS: Record<string, string> = {
  CompaniesHouseConfirmation: 'CH Confirmation',
  CompaniesHouseAccounts: 'CH Accounts',
  CorporationTax: 'Corporation Tax',
  VatMtd: 'VAT / MTD',
  Paye: 'PAYE',
  SelfAssessment: 'Self Assessment',
  GeneralCompliance: 'General Compliance',
  SystemNotice: 'System Notice',
}

const CATEGORY_NOTE_HINTS: Record<string, string> = {
  CompaniesHouseConfirmation: 'Confirmation statement due at Companies House',
  CompaniesHouseAccounts: 'Accounts filing due at Companies House',
  CorporationTax: 'Corporation Tax CT600 filing deadline',
  VatMtd: 'VAT / MTD filing deadline',
  Paye: 'PAYE payment deadline',
  SelfAssessment: 'Self Assessment SA100 deadline',
  GeneralCompliance: 'General compliance action required',
  SystemNotice: 'System notice',
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const OWNERS = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

export default function NewAlertForm({ companies }: { companies: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    company: companies[0] ?? '',
    category: 'GeneralCompliance',
    title: '',
    notes: '',
    priority: 'High',
    dueDate: '',
    owner: 'Dagon',
  })

  function isAutoTitle(title: string, category: string, company: string): boolean {
    return (
      title === CATEGORY_LABELS[category] ||
      title === `${CATEGORY_LABELS[category]} — ${company}`
    )
  }

  function handleCategoryChange(cat: string) {
    setForm((f) => ({
      ...f,
      category: cat,
      notes: f.notes || CATEGORY_NOTE_HINTS[cat] || '',
      // Only auto-update title if it is still the auto-generated value
      title: isAutoTitle(f.title, f.category, f.company)
        ? f.company ? `${CATEGORY_LABELS[cat]} — ${f.company}` : CATEGORY_LABELS[cat]
        : f.title,
    }))
  }

  function handleCompanyChange(company: string) {
    setForm((f) => ({
      ...f,
      company,
      // Only auto-update title if it is still the auto-generated value
      title: isAutoTitle(f.title, f.category, f.company)
        ? `${CATEGORY_LABELS[f.category]} — ${company}`
        : f.title,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ComplianceAlert',
          title: form.title,
          company: form.company,
          notes: form.notes,
          priority: form.priority,
          dueDate: form.dueDate || null,
          owner: form.owner,
          status: 'Captured',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/work-items/${data.id}`)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to create alert')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 rounded-xl p-5">
      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Alert Category *
        </label>
        <div className="flex flex-wrap gap-2">
          {ALERT_CATEGORIES.filter((c) => c !== 'SystemNotice').map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                form.category === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Company */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Company *
          </label>
          {companies.length > 0 ? (
            <select
              value={form.company}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className={inp}
              required
            >
              <option value="">Select company…</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="Company name"
              className={inp}
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className={inp}
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Title *
        </label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Alert title"
          className={inp}
        />
      </div>

      {/* Due date + Owner */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Deadline
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className={inp}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Assigned to
          </label>
          <select
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
            className={inp}
          >
            {OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Details / Notes
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Any additional details…"
          className={inp}
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
        Alerts will be automatically dispatched to configured recipients for the selected company.
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {loading ? 'Creating…' : 'Create & Dispatch Alert'}
        </button>
      </div>
    </form>
  )
}
