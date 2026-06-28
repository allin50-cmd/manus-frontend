'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']

function generateInvoiceNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `INV-${y}${m}${d}-${rand}`
}

function parsePence(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    description: '',
    amount: '',
    status: 'Sent',
    dueAt: '',
    linkedWorkItemId: '',
    notes: '',
    number: generateInvoiceNumber(),
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const amountPence = parsePence(form.amount)

      const res = await fetch('/api/os/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail || undefined,
          description: form.description || undefined,
          amountPence,
          status: form.status,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
          linkedWorkItemId: form.linkedWorkItemId || undefined,
          notes: form.notes || undefined,
          number: form.number,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push('/os/money')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create invoice')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Invoice Number *">
          <input
            required
            value={form.number}
            onChange={(e) => set('number', e.target.value)}
            placeholder="Auto-generated"
            className={inputClass}
          />
        </Field>

        <Field label="Client Name *">
          <input
            required
            value={form.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            placeholder="Client or company name"
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
            rows={3}
            placeholder="Description of work or items…"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount (£) *">
            <input
              required
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
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

        <Field label="Due Date *">
          <input
            required
            type="date"
            value={form.dueAt}
            onChange={(e) => set('dueAt', e.target.value)}
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

        <button
          type="submit"
          disabled={loading || !form.clientName || !form.amount || !form.dueAt}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'Create Invoice'}
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
