'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const STATUSES = ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']
const CURRENCIES = ['GBP', 'USD', 'EUR']

function generateQuoteNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `Q-${y}${m}${d}-${rand}`
}

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    quoteNumber: generateQuoteNumber(),
    amount: '',
    currency: 'GBP',
    status: 'Draft',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyId) {
      setError('Company context is required')
      return
    }

    const amount = Number.parseFloat(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/os/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          quoteNumber: form.quoteNumber,
          amount,
          currency: form.currency,
          status: form.status,
          issueDate: form.issueDate,
          expiryDate: form.expiryDate || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        await res.json()
        router.push(`/os/money/quotes?companyId=${companyId}`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create quote')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!companyId) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Create Quote</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <p>Please access this form from a workspace context with a company ID.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Create Quote</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Quote Number *">
          <input required value={form.quoteNumber} onChange={(e) => set('quoteNumber', e.target.value)} placeholder="Auto-generated" className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount *">
            <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" className={inputClass} />
          </Field>
          <Field label="Currency">
            <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Issue Date *">
            <input required type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Expiry Date">
            <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Additional notes…" className={inputClass} />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading || !form.quoteNumber || !form.amount || !form.issueDate} className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
          {loading ? 'Creating…' : 'Create Quote'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
