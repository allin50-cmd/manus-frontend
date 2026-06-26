'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function BookingPage() {
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<{ ref: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customerName: '',
    customerContact: '',
    date: '',
    time: '',
    location: '',
    notes: '',
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.customerName || !form.date) {
      setError('Customer name and date are required')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/apps/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed. Please try again.')
      }
      const data = await res.json()
      setResult({ ref: data.id?.slice(0, 8).toUpperCase() || 'N/A' })
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Appointment booked</h2>
        <p className="text-sm text-gray-500 mb-4">Reference: <strong>{result.ref}</strong></p>
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 text-left space-y-1.5">
          <p className="text-sm"><span className="text-gray-500">Customer:</span> <span className="font-medium text-gray-900">{form.customerName}</span></p>
          {form.customerContact && <p className="text-sm"><span className="text-gray-500">Contact:</span> <span className="font-medium text-gray-900">{form.customerContact}</span></p>}
          <p className="text-sm"><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-900">{form.date}{form.time ? ` at ${form.time}` : ''}</span></p>
          {form.location && <p className="text-sm"><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-900">{form.location}</span></p>}
          {/* TODO: Add travel time, maps, parking, and route optimisation */}
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
          <div className="text-3xl mb-3">📅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booking</h1>
          <p className="text-base text-gray-600 mb-4">Book your next job in seconds.</p>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">What it does</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span>✓</span><span>Log every appointment with customer, time, and location</span></li>
              <li className="flex gap-2"><span>✓</span><span>Keep customer contact details in one place</span></li>
              <li className="flex gap-2"><span>✓</span><span>Add notes before you arrive on site</span></li>
              <li className="flex gap-2"><span>✓</span><span>All jobs tracked and searchable later</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm">Who it's for</h2>
            <p className="text-sm text-gray-500">
              Any business owner who books jobs, visits, or appointments — and wants them logged without a diary or spreadsheet.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-green-800">Free to start</p>
            <p className="text-xs text-green-700 mt-0.5">No account needed to log your first appointment.</p>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm"
          >
            Book an appointment →
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

      <h2 className="text-xl font-bold text-gray-900 mb-1">New appointment</h2>
      <p className="text-sm text-gray-500 mb-6">Fill in the details below.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer name</label>
          <input
            type="text"
            required
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="e.g. Sarah Clarke"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer contact</label>
          <input
            type="text"
            value={form.customerContact}
            onChange={(e) => setForm((f) => ({ ...f, customerContact: e.target.value }))}
            placeholder="Phone or email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Address or area"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Access instructions, what to bring, scope of work…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm disabled:opacity-60"
        >
          {busy ? 'Booking…' : 'Confirm appointment →'}
        </button>
      </form>
    </div>
  )
}
