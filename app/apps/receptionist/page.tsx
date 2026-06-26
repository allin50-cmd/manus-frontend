'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

const DUTIES = [
  { id: 'messages', label: 'Take messages' },
  { id: 'appointments', label: 'Book appointments' },
  { id: 'leads', label: 'Capture leads' },
  { id: 'faqs', label: 'Answer FAQs' },
]

export default function ReceptionistPage() {
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    businessName: '',
    contactNumber: '',
    duties: [] as string[],
    fallbackEmail: '',
  })

  function toggleDuty(id: string) {
    setForm((f) => ({
      ...f,
      duties: f.duties.includes(id) ? f.duties.filter((d) => d !== id) : [...f.duties, id],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.businessName || !form.contactNumber) {
      setError('Business name and contact number are required')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/apps/receptionist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Submission failed. Please try again.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You're set up!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your AI Receptionist is being configured for <strong>{form.businessName}</strong>. We'll be in touch shortly.
        </p>
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
          <div className="text-3xl mb-3">📞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Receptionist</h1>
          <p className="text-base text-gray-600 mb-4">Never miss a customer call again.</p>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">What it does</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span>✓</span><span>Answers calls when you're on the tools</span></li>
              <li className="flex gap-2"><span>✓</span><span>Takes detailed messages and sends them to you instantly</span></li>
              <li className="flex gap-2"><span>✓</span><span>Books appointments directly into your diary</span></li>
              <li className="flex gap-2"><span>✓</span><span>Captures customer details so no lead goes cold</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm">Who it's for</h2>
            <p className="text-sm text-gray-500">
              Tradespeople, sole traders, and small teams who can't always answer the phone — and can't afford to miss a job.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-amber-800">From £29/month</p>
            <p className="text-xs text-amber-700 mt-0.5">Cancel any time. No setup fees.</p>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm"
          >
            Set up my receptionist →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setStarted(false)} className="text-sm text-gray-500 mb-6 flex items-center gap-1">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-1">Set up your receptionist</h2>
      <p className="text-sm text-gray-500 mb-6">Takes about 2 minutes.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input
            type="text"
            required
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            placeholder="e.g. Smith Plumbing Ltd"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your contact number</label>
          <input
            type="tel"
            required
            value={form.contactNumber}
            onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
            placeholder="07700 900000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What should the receptionist do?</label>
          <div className="space-y-2">
            {DUTIES.map((d) => (
              <label key={d.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.duties.includes(d.id)}
                  onChange={() => toggleDuty(d.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fallback email</label>
          <input
            type="email"
            value={form.fallbackEmail}
            onChange={(e) => setForm((f) => ({ ...f, fallbackEmail: e.target.value }))}
            placeholder="you@yourbusiness.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">Where messages get forwarded if calls can't be handled</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm disabled:opacity-60"
        >
          {busy ? 'Setting up…' : 'Confirm setup →'}
        </button>
      </form>
    </div>
  )
}
