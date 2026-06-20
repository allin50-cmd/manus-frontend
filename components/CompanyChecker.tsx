'use client'

import { useState, FormEvent } from 'react'

interface CheckResult {
  companyNumber: string
  companyName: string
  status: 'green' | 'amber' | 'red'
  headline: string
  message: string
  daysUntilAction: number | null
}

const STATUS = {
  green: {
    border: 'border-[#00A86B]',
    bg: 'bg-[#E6F7F1]',
    badge: 'bg-[#00A86B]',
    icon: (
      <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    label: 'GREEN',
  },
  amber: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    badge: 'bg-amber-400',
    icon: (
      <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    label: 'AMBER',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-500',
    icon: (
      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'RED',
  },
}

export default function CompanyChecker() {
  const [companyNumber, setCompanyNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState('')

  async function handleCheck(e: FormEvent) {
    e.preventDefault()
    const value = companyNumber.trim()
    if (!value) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/check?company=${encodeURIComponent(value)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Unable to check company status. Please try again.')
        return
      }

      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? STATUS[result.status] : null

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={companyNumber}
          onChange={(e) => setCompanyNumber(e.target.value)}
          placeholder="Enter company number (e.g. 12345678)"
          maxLength={12}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 px-5 py-4 rounded-xl text-slate-900 text-lg font-mono bg-white border-0 focus:outline-none focus:ring-3 focus:ring-[#00A86B] shadow-xl placeholder:text-slate-400 placeholder:font-sans"
        />
        <button
          type="submit"
          disabled={loading || !companyNumber.trim()}
          className="px-7 py-4 bg-[#00A86B] text-white font-semibold rounded-xl text-base hover:bg-[#009960] active:bg-[#008850] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xl whitespace-nowrap tracking-wide"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking…
            </span>
          ) : (
            'CHECK MY COMPANY'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-5 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-left">
          {error}
        </div>
      )}

      {result && cfg && (
        <div className={`mt-6 p-6 rounded-2xl border-l-4 text-left shadow-xl ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              {cfg.icon}
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-0.5">
                  {result.companyName} · {result.companyNumber}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">{result.headline}</h3>
              </div>
            </div>
            <span className={`shrink-0 ${cfg.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-slate-700 text-base leading-relaxed mt-1">{result.message}</p>
          {result.status !== 'red' && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                FineGuard can monitor this company and notify you before any deadline.{' '}
                <a href="#pricing" className="text-[#00A86B] font-semibold underline-offset-2 hover:underline">
                  See plans →
                </a>
              </p>
            </div>
          )}
          {result.status === 'red' && (
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm text-red-700">
                Our team can help you resolve this urgently.{' '}
                <a href="mailto:help@fineguard.co.uk" className="font-semibold underline-offset-2 hover:underline">
                  Contact us now →
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
