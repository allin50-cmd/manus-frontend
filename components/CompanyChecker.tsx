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

interface SearchMatch {
  number: string
  name: string
}

const STATUS = {
  green: {
    bannerBg: 'bg-[#00A86B]',
    bodyBg: 'bg-[#E6F7F1]',
    border: 'border-[#00A86B]',
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    label: 'GREEN',
    simpleMessage: "You're OK",
    divider: 'border-[#00A86B]/20',
  },
  amber: {
    bannerBg: 'bg-amber-400',
    bodyBg: 'bg-amber-50',
    border: 'border-amber-400',
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    label: 'AMBER',
    simpleMessage: 'Action Required Soon',
    divider: 'border-amber-200',
  },
  red: {
    bannerBg: 'bg-red-500',
    bodyBg: 'bg-red-50',
    border: 'border-red-500',
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'RED',
    simpleMessage: 'Urgent Action Required',
    divider: 'border-red-200',
  },
}

export default function CompanyChecker() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [error, setError] = useState('')

  async function fetchStatus(company: string) {
    setLoading(true)
    setError('')
    setResult(null)
    setMatches([])

    try {
      const res = await fetch(`/api/check?company=${encodeURIComponent(company)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Unable to check company status. Please try again.')
        return
      }

      if (data.multipleResults) {
        setMatches(data.companies)
      } else {
        setResult(data)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheck(e: FormEvent) {
    e.preventDefault()
    const value = query.trim()
    if (!value) return
    await fetchStatus(value)
  }

  async function handleSelectCompany(number: string, name: string) {
    setQuery(name)
    await fetchStatus(number)
  }

  const cfg = result ? STATUS[result.status] : null

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (matches.length > 0) setMatches([])
            if (result) setResult(null)
          }}
          placeholder="Company name or number (e.g. Acme Ltd)"
          maxLength={120}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 px-5 py-4 rounded-xl text-slate-900 text-lg bg-white border-0 focus:outline-none focus:ring-3 focus:ring-[#00A86B] shadow-xl placeholder:text-slate-400 placeholder:font-sans"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-7 py-4 bg-[#00A86B] text-white font-bold rounded-xl text-base hover:bg-[#009960] active:bg-[#008850] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xl whitespace-nowrap tracking-wide uppercase"
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
            'Check My Status'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-5 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-left">
          {error}
        </div>
      )}

      {/* Company picker when multiple results returned */}
      {matches.length > 0 && (
        <div className="mt-5 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl text-left">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <p className="text-slate-700 text-sm font-semibold">
              {matches.length} companies found — select yours:
            </p>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {matches.map((m) => (
              <button
                key={m.number}
                onClick={() => handleSelectCompany(m.number, m.name)}
                className="w-full text-left px-5 py-4 hover:bg-[#E6F7F1] transition-colors flex items-center justify-between gap-4 group"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-[#00A86B] transition-colors">{m.name}</p>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">{m.number}</p>
                </div>
                <span className="text-[#00A86B] text-sm font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  Check →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result && cfg && (
        <div className={`mt-6 rounded-2xl border-2 text-left shadow-xl overflow-hidden ${cfg.border}`}>
          {/* Status banner */}
          <div className={`${cfg.bannerBg} px-6 py-5 flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-2 shrink-0">{cfg.icon}</div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-0.5">
                  {result.companyName} · {result.companyNumber}
                </p>
                <p className="text-white text-2xl md:text-3xl font-bold leading-tight">{cfg.simpleMessage}</p>
              </div>
            </div>
            <span className="shrink-0 bg-white/25 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
              {cfg.label}
            </span>
          </div>

          {/* Detail body */}
          <div className={`${cfg.bodyBg} px-6 py-5`}>
            <p className="text-slate-800 text-base leading-relaxed">{result.message}</p>

            {result.status !== 'red' && (
              <div className={`mt-5 pt-4 border-t ${cfg.divider} flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between`}>
                <p className="text-sm text-slate-600">
                  FineGuard monitors this company and alerts you before any deadline.
                </p>
                <a
                  href="#pricing"
                  className="shrink-0 inline-block bg-[#00A86B] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#009960] transition-colors whitespace-nowrap shadow-sm"
                >
                  Get Protected — £4.99/mo →
                </a>
              </div>
            )}

            {result.status === 'red' && (
              <div className={`mt-5 pt-4 border-t ${cfg.divider}`}>
                <p className="text-red-800 text-sm font-semibold mb-3">
                  A real member of our team will contact you directly to help resolve this urgently.
                </p>
                <a
                  href="mailto:help@fineguard.co.uk"
                  className="inline-block bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Contact Us Now →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
