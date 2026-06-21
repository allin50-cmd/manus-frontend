'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

const JOB_TYPES = [
  { value: 'extensions', label: 'Extensions' },
  { value: 'loft_conversions', label: 'Loft conversions' },
  { value: 'renovations', label: 'Renovations' },
  { value: 'new_builds', label: 'New builds' },
  { value: 'refurbishments', label: 'Refurbishments' },
  { value: 'structural_work', label: 'Structural work' },
  { value: 'commercial_fitout', label: 'Commercial fit-out' },
]

const JOB_SIZES = [
  { value: 'under_10k', label: 'Under £10k' },
  { value: '10k_50k', label: '£10k – £50k' },
  { value: '50k_250k', label: '£50k – £250k' },
  { value: 'over_250k', label: '£250k+' },
]

const TRAVEL_DISTANCES = [
  { value: '10', label: 'Up to 10 miles' },
  { value: '25', label: 'Up to 25 miles' },
  { value: '50', label: 'Up to 50 miles' },
  { value: '100', label: 'Up to 100 miles' },
  { value: '0', label: 'Nationwide' },
]

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

type Form = {
  companyName: string
  contactName: string
  email: string
  phone: string
  postcodeArea: string
  jobTypes: string[]
  minJobSizeBand: string
  maxTravelMiles: string
  preferredContact: string
  notes: string
}

export default function BuilderBigJobsIntakePage() {
  const [form, setForm] = useState<Form>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    postcodeArea: '',
    jobTypes: [],
    minJobSizeBand: '',
    maxTravelMiles: '25',
    preferredContact: 'email',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function toggleJobType(value: string) {
    setForm((f) => ({
      ...f,
      jobTypes: f.jobTypes.includes(value)
        ? f.jobTypes.filter((t) => t !== value)
        : [...f.jobTypes, value],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/builder-big-jobs/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxTravelMiles: form.maxTravelMiles ? Number(form.maxTravelMiles) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 text-white">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">You're registered</h1>
          <p className="text-slate-400 mb-8">We'll be in touch when we have building opportunities that match what you're looking for.</p>
          <Link href="/builder-big-jobs" className="text-orange-400 font-semibold hover:underline text-sm">
            ← Back to Builder Big Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto">
        <Link href="/builder-big-jobs" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="font-bold tracking-tight">Builder Big Jobs</span>
        </Link>
      </header>

      <div className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Register for building leads</h1>
          <p className="text-slate-400 text-sm">Tell us what you're looking for and we'll match planning-approved opportunities to your team.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact details */}
          <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Your details</h2>
            <Field label="Company / business name *">
              <input
                required
                type="text"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Accuracy Developments Ltd"
                className={inputCls}
              />
            </Field>
            <Field label="Your name *">
              <input
                required
                type="text"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                placeholder="Dagon White"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email *">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.co.uk"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="07700 900000"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Service areas */}
          <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Service area</h2>
            <Field label="Postcode areas you cover">
              <input
                type="text"
                value={form.postcodeArea}
                onChange={(e) => setForm((f) => ({ ...f, postcodeArea: e.target.value }))}
                placeholder="e.g. SW, SE, TW, KT, W4"
                className={inputCls}
              />
              <p className="text-xs text-slate-500 mt-1">Separate multiple postcodes with commas</p>
            </Field>
            <Field label="Maximum travel distance">
              <select
                value={form.maxTravelMiles}
                onChange={(e) => setForm((f) => ({ ...f, maxTravelMiles: e.target.value }))}
                className={inputCls}
              >
                {TRAVEL_DISTANCES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Job types */}
          <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Job types wanted</h2>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map((jt) => (
                <label
                  key={jt.value}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer border transition-colors ${
                    form.jobTypes.includes(jt.value)
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.jobTypes.includes(jt.value)}
                    onChange={() => toggleJobType(jt.value)}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{jt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Job size */}
          <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Minimum job size</h2>
            <div className="grid grid-cols-2 gap-2">
              {JOB_SIZES.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-center justify-center rounded-lg px-3 py-3 cursor-pointer border transition-colors ${
                    form.minJobSizeBand === s.value
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="minJobSizeBand"
                    value={s.value}
                    checked={form.minJobSizeBand === s.value}
                    onChange={() => setForm((f) => ({ ...f, minJobSizeBand: s.value }))}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred contact */}
          <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Preferred contact method</h2>
            <div className="flex gap-2 flex-wrap">
              {CONTACT_METHODS.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 cursor-pointer border transition-colors ${
                    form.preferredContact === c.value
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredContact"
                    value={c.value}
                    checked={form.preferredContact === c.value}
                    onChange={() => setForm((f) => ({ ...f, preferredContact: c.value }))}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Anything else?</h2>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Specialisms, certifications, preferred project types…"
              className={inputCls + ' resize-none'}
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/30 rounded-lg px-4 py-3">{error}</p>}

          <button
            type="submit"
            disabled={busy || !form.companyName || !form.contactName || !form.email}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-base"
          >
            {busy ? 'Submitting…' : 'Register for leads →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
