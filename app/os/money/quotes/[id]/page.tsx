'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'

const STATUSES = ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']

interface Quote {
  id: string
  number: string
  clientName: string
  clientEmail: string | null
  description: string | null
  amountPence: number
  status: string
  validUntil: string | null
  linkedWorkItemId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function QuoteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    description: '',
    amountPounds: '',
    status: 'Draft',
    validUntil: '',
    linkedWorkItemId: '',
    notes: '',
  })

  useEffect(() => {
    fetchQuote()
  }, [quoteId])

  async function fetchQuote() {
    try {
      setLoading(true)
      const res = await fetch(`/api/os/quotes/${quoteId}`)
      if (res.ok) {
        const data = await res.json()
        setQuote(data)
        setForm({
          clientName: data.clientName || '',
          clientEmail: data.clientEmail || '',
          description: data.description || '',
          amountPounds: (data.amountPence / 100).toFixed(2),
          status: data.status || 'Draft',
          validUntil: data.validUntil ? new Date(data.validUntil).toISOString().slice(0, 16) : '',
          linkedWorkItemId: data.linkedWorkItemId || '',
          notes: data.notes || '',
        })
      } else {
        setError('Quote not found')
      }
    } catch (err) {
      setError('Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const amountPence = Math.round(parseFloat(form.amountPounds) * 100)

      const res = await fetch(`/api/os/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail || undefined,
          description: form.description || undefined,
          amountPence,
          status: form.status,
          validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
          linkedWorkItemId: form.linkedWorkItemId || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        await fetchQuote()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update quote')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function acceptQuote() {
    setSaving(true)
    try {
      const res = await fetch(`/api/os/quotes/${quoteId}/accept`, { method: 'POST' })
      if (res.ok) {
        await fetchQuote()
      } else {
        setError('Failed to accept quote')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function declineQuote() {
    setSaving(true)
    try {
      const res = await fetch(`/api/os/quotes/${quoteId}/decline`, { method: 'POST' })
      if (res.ok) {
        await fetchQuote()
      } else {
        setError('Failed to decline quote')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this quote?')) return

    try {
      setSaving(true)
      const res = await fetch(`/api/os/quotes/${quoteId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/os/money')
      } else {
        setError('Failed to delete quote')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading quote…</div>
  }

  if (!quote) {
    return <div className="text-center py-8 text-red-600">Quote not found</div>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Quote {quote.number}</h1>
      </div>

      <div className={`p-4 rounded-lg ${quote.status === 'Accepted' ? 'bg-green-50 border border-green-200' : quote.status === 'Declined' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
        <p className="text-sm font-semibold text-slate-900">Status: {quote.status}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Client Name *">
          <input
            required
            value={form.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            placeholder="Client name"
            className={inputClass}
          />
        </Field>

        <Field label="Client Email">
          <input
            type="email"
            value={form.clientEmail}
            onChange={(e) => set('clientEmail', e.target.value)}
            placeholder="client@example.com"
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            placeholder="Quote description"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount (£) *">
            <input
              required
              type="number"
              step="0.01"
              value={form.amountPounds}
              onChange={(e) => set('amountPounds', e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Valid Until">
          <input
            type="datetime-local"
            value={form.validUntil}
            onChange={(e) => set('validUntil', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Linked Work Item">
          <input
            value={form.linkedWorkItemId}
            onChange={(e) => set('linkedWorkItemId', e.target.value)}
            placeholder="Work item ID (optional)"
            className={inputClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Additional notes…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="space-y-2 pt-2">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-3 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 font-semibold rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
          {quote.status !== 'Accepted' && quote.status !== 'Declined' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={acceptQuote}
                disabled={saving}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={declineQuote}
                disabled={saving}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </form>

      <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg">
        <p>Created: {new Date(quote.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(quote.updatedAt).toLocaleString()}</p>
      </div>
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
