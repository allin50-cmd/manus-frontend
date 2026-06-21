'use client'

import { FormEvent, useState } from 'react'

type DeadlineStatus = {
  nextDue: string
  overdue: boolean
  daysUntilDue: number
}

type FilingDeadline = {
  type: string
  description: string
  dueDate: string
  daysUntilDue: number
  overdue: boolean
  penaltyRisk?: number
}

type Penalty = {
  estimated: number
  description: string
}

type CheckResult = {
  ok: true
  company: {
    number: string
    name: string
  }
  compliance: {
    status: 'compliant' | 'warning' | 'overdue'
    riskLevel: 'none' | 'low' | 'medium' | 'high'
    accounts: DeadlineStatus
    confirmationStatement: DeadlineStatus
    overdueFilings: FilingDeadline[]
    upcomingDeadlines: FilingDeadline[]
    penalties: Penalty[]
  }
}

function riskLabel(riskLevel: CheckResult['compliance']['riskLevel']) {
  if (riskLevel === 'high') return 'Red'
  if (riskLevel === 'medium') return 'Amber'
  if (riskLevel === 'low') return 'Amber'
  return 'Green'
}

function riskClasses(riskLevel: CheckResult['compliance']['riskLevel']) {
  if (riskLevel === 'high') return 'border-red-500 bg-red-500/10 text-red-300'
  if (riskLevel === 'medium' || riskLevel === 'low') return 'border-amber-500 bg-amber-500/10 text-amber-300'
  return 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
}

function formatDate(value: string) {
  if (!value || value === 'N/A') return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDays(status: DeadlineStatus) {
  if (status.nextDue === 'N/A') return 'No date available'
  if (status.overdue || status.daysUntilDue < 0) return `${Math.abs(status.daysUntilDue)} days overdue`
  if (status.daysUntilDue === 0) return 'Due today'
  return `${status.daysUntilDue} days remaining`
}

function DeadlineCard({ title, status }: { title: string; status: DeadlineStatus }) {
  const isOverdue = status.overdue || status.daysUntilDue < 0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-lg font-semibold text-white">{formatDate(status.nextDue)}</p>
      <p className={isOverdue ? 'mt-1 text-sm text-red-300' : 'mt-1 text-sm text-slate-400'}>
        {formatDays(status)}
      </p>
    </div>
  )
}

export default function CompaniesPage() {
  const [companyNumber, setCompanyNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = companyNumber.trim()
    if (!value) return

    setLoading(true)
    setResult(null)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNumber: value }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to check this company')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check this company')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 pb-24 text-white">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-emerald-300">FineGuard</p>
        <h1 className="mt-1 text-2xl font-semibold">Companies</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter a UK company number to check filing deadlines and risk.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label htmlFor="companyNumber" className="sr-only">
            Company number
          </label>
          <input
            id="companyNumber"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            value={companyNumber}
            onChange={(event) => setCompanyNumber(event.target.value)}
            placeholder="Example: 00445790"
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !companyNumber.trim()}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-4 text-base font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Check company'}
          </button>
        </form>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
          Test examples: TESCO PLC <span className="text-slate-200">00445790</span>, M&amp;S{' '}
          <span className="text-slate-200">04256886</span>, Barclays Bank{' '}
          <span className="text-slate-200">01026167</span>.
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-500 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        )}

        {result && (
          <section className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{result.company.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">Company number: {result.company.number}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${riskClasses(result.compliance.riskLevel)}`}>
                  {riskLabel(result.compliance.riskLevel)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="mt-1 font-semibold capitalize text-white">{result.compliance.status}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Risk level</p>
                  <p className="mt-1 font-semibold capitalize text-white">{result.compliance.riskLevel}</p>
                </div>
              </div>
            </div>

            <DeadlineCard title="Accounts deadline" status={result.compliance.accounts} />
            <DeadlineCard title="Confirmation statement" status={result.compliance.confirmationStatement} />

            {result.compliance.overdueFilings.length > 0 && (
              <div className="rounded-2xl border border-red-500 bg-red-500/10 p-4">
                <h3 className="font-semibold text-red-200">Overdue filings</h3>
                <div className="mt-3 space-y-3">
                  {result.compliance.overdueFilings.map((filing) => (
                    <div key={`${filing.type}-${filing.dueDate}`} className="text-sm text-red-100">
                      <p className="font-medium">{filing.description}</p>
                      <p className="text-red-200/80">
                        Due {formatDate(filing.dueDate)} · {Math.abs(filing.daysUntilDue)} days overdue
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.compliance.upcomingDeadlines.length > 0 && (
              <div className="rounded-2xl border border-amber-500 bg-amber-500/10 p-4">
                <h3 className="font-semibold text-amber-200">Upcoming deadlines</h3>
                <div className="mt-3 space-y-3">
                  {result.compliance.upcomingDeadlines.map((deadline) => (
                    <div key={`${deadline.type}-${deadline.dueDate}`} className="text-sm text-amber-100">
                      <p className="font-medium">{deadline.description}</p>
                      <p className="text-amber-200/80">
                        Due {formatDate(deadline.dueDate)} · {deadline.daysUntilDue} days remaining
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.compliance.penalties.length > 0 && (
              <div className="rounded-2xl border border-red-500 bg-red-500/10 p-4">
                <h3 className="font-semibold text-red-200">Estimated penalty risk</h3>
                <div className="mt-3 space-y-3">
                  {result.compliance.penalties.map((penalty) => (
                    <div key={penalty.description} className="text-sm text-red-100">
                      <p className="font-medium">£{penalty.estimated.toLocaleString('en-GB')}</p>
                      <p className="text-red-200/80">{penalty.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMessage('Monitoring requests are coming soon. For now, this check is view-only.')}
              className="w-full rounded-2xl border border-emerald-400 px-4 py-4 text-base font-semibold text-emerald-300"
            >
              Monitor this company — coming soon
            </button>
          </section>
        )}
      </section>
    </main>
  )
}
