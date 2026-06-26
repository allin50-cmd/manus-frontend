'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function QuoteBuilderPage() {
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<{ quoteNumber: string; totalGbp: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customerName: '',
    customerContact: '',
    jobDescription: '',
    labourGbp: '',
    materialsGbp: '',
    notes: '',
  })

  const total =
    (parseFloat(form.labourGbp) || 0) + (parseFloat(form.materialsGbp) || 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.customerName || !form.jobDescription) {
      setError('Customer name and job description are required')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/apps/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          labourPence: Math.round((parseFloat(form.labourGbp) || 0) * 100),
          materialsPence: Math.round((parseFloat(form.materialsGbp) || 0) * 100),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed. Please try again.')
      }
      const data = await res.json()
      setResult({ quoteNumber: data.number, totalGbp: (data.amountPence / 100).toFixed(2) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Quote created</h2>
        <p className="text-sm text-gray-500 mb-4">Reference: <strong>{result.quoteNumber}</strong></p>
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 text-left">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-2xl font-bold text-gray-900">£{result.totalGbp}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
            <p>Customer: <span className="text-gray-900">{form.customerName}</span></p>
            <p className="mt-1">Job: <span className="text-gray-900">{form.jobDescription}</span></p>
          </div>
        </div>
        <Link href="/apps" className="text-sm text-blue-600 font-medium">
          ← Back to all tools
        </Link>
      </div>
    )
  }

  if (!started) {
    return (
      <div>
        <div className="mb-8">
          <div className="text-3xl mb-3">💷</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Builder</h1>
          <p className="text-base text-gray-600 mb-4">Send professional quotes in 2 minutes.</p>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">What it does</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span>✓</span><span>Build itemised quotes with labour and materials split out</span></li>
              <li className="flex gap-2"><span>✓</span><span>Calculates totals automatically — no spreadsheet needed</span></li>
              <li className="flex gap-2"><span>✓</span><span>Saves every quote for your records</span></li>
              <li className="flex gap-2"><span>✓</span><span>Works on any phone in 2 minutes</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm">Who it's for</h2>
            <p className="text-sm text-gray-500">
              Builders, tradespeople, and small business owners who need to quote quickly and professionally — without the faff.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-green-800">Free to start</p>
            <p className="text-xs text-green-700 mt-0.5">No account needed to try your first quote.</p>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm"
          >
            Build a quote →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setStarted(false)} className="text-sm text-gray-500 mb-6">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-1">New quote</h2>
      <p className="text-sm text-gray-500 mb-6">Fill in the details below.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer name</label>
          <input
            type="text"
            required
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="e.g. John Baker"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer contact</label>
          <input
            type="text"
            value={form.customerContact}
            onChange={(e) => setForm((f) => ({ ...f, customerContact: e.target.value }))}
            placeholder="Email or phone"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job description</label>
          <textarea
            required
            rows={3}
            value={form.jobDescription}
            onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))}
            placeholder="What work is being done?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labour (£)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.labourGbp}
              onChange={(e) => setForm((f) => ({ ...f, labourGbp: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materials (£)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.materialsGbp}
              onChange={(e) => setForm((f) => ({ ...f, materialsGbp: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {(form.labourGbp || form.materialsGbp) && (
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-base font-bold text-gray-900">£{total.toFixed(2)}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Payment terms, exclusions, other info…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm disabled:opacity-60"
        >
          {busy ? 'Saving quote…' : 'Create quote →'}
        </button>
      </form>
    </div>
  )
}
