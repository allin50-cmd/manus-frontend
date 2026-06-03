'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALERT_CATEGORIES } from '@/lib/alert-recipient-selector'

const ROLES = ['Director', 'Accountant', 'CompanySecretary', 'Admin', 'ComplianceManager', 'ExternalAdviser', 'Custom']
const CHANNELS = ['Dashboard', 'Email', 'Sms', 'WhatsApp']
const ROLE_LABELS: Record<string, string> = {
  Director: 'Director',
  Accountant: 'Accountant',
  CompanySecretary: 'Company Secretary',
  Admin: 'Admin',
  ComplianceManager: 'Compliance Manager',
  ExternalAdviser: 'External Adviser',
  Custom: 'Custom',
}
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

interface Recipient {
  id: string
  company: string
  name: string
  email: string | null
  phone: string | null
  role: string
  preferredChannel: string
  alertCategories: string[]
  escalationLevel: number
  isActive: boolean
  isSuppressed: boolean
  suppressionReason: string | null
}

const blank = {
  company: '',
  name: '',
  email: '',
  phone: '',
  role: 'Director',
  preferredChannel: 'Dashboard',
  alertCategories: [] as string[],
  escalationLevel: 1,
}

export default function AlertRecipientsClient({
  byCompany,
  companies,
  pendingCount,
}: {
  byCompany: Record<string, Recipient[]>
  companies: string[]
  pendingCount: number
}) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [escalating, setEscalating] = useState(false)
  const [escalationResult, setEscalationResult] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Omit<typeof blank, 'company'> & { company: string }>(blank)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  function openEdit(r: Recipient) {
    setEditId(r.id)
    setEditForm({
      company: r.company,
      name: r.name,
      email: r.email ?? '',
      phone: r.phone ?? '',
      role: r.role,
      preferredChannel: r.preferredChannel,
      alertCategories: r.alertCategories,
      escalationLevel: r.escalationLevel,
    })
    setEditError('')
  }

  function toggleEditCategory(cat: string) {
    setEditForm((f) => ({
      ...f,
      alertCategories: f.alertCategories.includes(cat)
        ? f.alertCategories.filter((c) => c !== cat)
        : [...f.alertCategories, cat],
    }))
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setEditError('')
    setEditLoading(true)
    try {
      const res = await fetch(`/api/alert-recipients/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          role: editForm.role,
          preferredChannel: editForm.preferredChannel,
          alertCategories: editForm.alertCategories,
          escalationLevel: Number(editForm.escalationLevel),
        }),
      })
      if (res.ok) {
        setEditId(null)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setEditError(d.error ?? 'Failed to save')
      }
    } catch {
      setEditError('Something went wrong')
    } finally {
      setEditLoading(false)
    }
  }

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      alertCategories: f.alertCategories.includes(cat)
        ? f.alertCategories.filter((c) => c !== cat)
        : [...f.alertCategories, cat],
    }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/alert-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          email: form.email || null,
          phone: form.phone || null,
          escalationLevel: Number(form.escalationLevel),
        }),
      })
      if (res.ok) {
        setShowAdd(false)
        setForm(blank)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to add recipient')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this recipient? They will no longer receive alerts.')) return
    setBusyId(id)
    try {
      await fetch(`/api/alert-recipients/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function suppress(id: string) {
    const reason = prompt('Suppression reason (optional):') ?? ''
    setBusyId(id)
    try {
      await fetch(`/api/alert-recipients/${id}/suppress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function runEscalationCheck() {
    setEscalating(true)
    setEscalationResult(null)
    try {
      const res = await fetch('/api/alert-escalation-check', { method: 'POST' })
      const data = await res.json()
      setEscalationResult(
        data.escalated > 0
          ? `${data.escalated} delivery${data.escalated !== 1 ? 's' : ''} escalated`
          : 'No deliveries require escalation',
      )
      router.refresh()
    } catch {
      setEscalationResult('Escalation check failed')
    } finally {
      setEscalating(false)
    }
  }

  async function unsuppress(id: string) {
    setBusyId(id)
    try {
      await fetch(`/api/alert-recipients/${id}/unsuppress`, { method: 'POST' })
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Recipient'}
        </button>

        {pendingCount > 0 && (
          <button
            onClick={runEscalationCheck}
            disabled={escalating}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {escalating ? 'Checking…' : `Run Escalation Check (${pendingCount} pending)`}
          </button>
        )}

        {escalationResult && (
          <span className="text-sm text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
            {escalationResult}
          </span>
        )}
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-slate-800">New Alert Recipient</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Company *
              </label>
              <input
                required
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Exact company name"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={inp}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Channel
              </label>
              <select
                value={form.preferredChannel}
                onChange={(e) => setForm((f) => ({ ...f, preferredChannel: e.target.value }))}
                className={inp}
              >
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Escalation Level
              </label>
              <select
                value={form.escalationLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, escalationLevel: Number(e.target.value) }))
                }
                className={inp}
              >
                {[1, 2, 3, 4].map((l) => (
                  <option key={l} value={l}>
                    Level {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Alert Categories (empty = all categories)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALERT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    form.alertCategories.includes(cat)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {loading ? 'Adding…' : 'Add Recipient'}
          </button>
        </form>
      )}

      {companies.length === 0 && !showAdd && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No recipients configured yet. Add the first one above.
        </div>
      )}

      {companies.map((company) => (
        <div key={company} className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1">
            {company}
          </h3>
          {byCompany[company].map((r) => (
            <div
              key={r.id}
              className={`bg-white border rounded-xl px-4 py-3 text-sm ${
                !r.isActive
                  ? 'border-slate-100 opacity-50'
                  : r.isSuppressed
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{r.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                      {ROLE_LABELS[r.role] ?? r.role}
                    </span>
                    <span className="text-xs text-slate-400">L{r.escalationLevel}</span>
                    {r.isSuppressed && (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded px-2 py-0.5">
                        Suppressed{r.suppressionReason ? `: ${r.suppressionReason}` : ''}
                      </span>
                    )}
                    {!r.isActive && (
                      <span className="text-xs bg-red-100 text-red-700 rounded px-2 py-0.5">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {r.preferredChannel}
                    {r.email && ` · ${r.email}`}
                    {r.phone && ` · ${r.phone}`}
                  </p>
                  {r.alertCategories.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {r.alertCategories.map((c) => CATEGORY_LABELS[c] ?? c).join(', ')}
                    </p>
                  )}
                  {r.alertCategories.length === 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">All categories</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {r.isActive && (
                    <button
                      onClick={() => openEdit(r)}
                      disabled={busyId === r.id}
                      className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}
                  {r.isActive && !r.isSuppressed && (
                    <button
                      onClick={() => suppress(r.id)}
                      disabled={busyId === r.id}
                      className="text-xs text-orange-600 border border-orange-200 hover:bg-orange-50 rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Suppress
                    </button>
                  )}
                  {r.isSuppressed && (
                    <button
                      onClick={() => unsuppress(r.id)}
                      disabled={busyId === r.id}
                      className="text-xs text-green-600 border border-green-200 hover:bg-green-50 rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Unsuppress
                    </button>
                  )}
                  {r.isActive && (
                    <button
                      onClick={() => deactivate(r.id)}
                      disabled={busyId === r.id}
                      className="text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>

              {/* Inline edit form */}
              {editId === r.id && (
                <form
                  onSubmit={handleEdit}
                  className="mt-3 pt-3 border-t border-slate-100 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Name *</label>
                      <input required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
                      <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role</label>
                      <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} className={inp}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Channel</label>
                      <select value={editForm.preferredChannel} onChange={(e) => setEditForm((f) => ({ ...f, preferredChannel: e.target.value }))} className={inp}>
                        {CHANNELS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Escalation Level</label>
                      <select value={editForm.escalationLevel} onChange={(e) => setEditForm((f) => ({ ...f, escalationLevel: Number(e.target.value) }))} className={inp}>
                        {[1, 2, 3, 4].map((l) => <option key={l} value={l}>Level {l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Categories (empty = all)</label>
                      <div className="flex flex-wrap gap-1">
                        {ALERT_CATEGORIES.map((cat) => (
                          <button key={cat} type="button" onClick={() => toggleEditCategory(cat)}
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${editForm.alertCategories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}>
                            {CATEGORY_LABELS[cat]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {editError && <p className="text-red-600 text-xs">{editError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditId(null)} className="flex-1 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={editLoading} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors">
                      {editLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
