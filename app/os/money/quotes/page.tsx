'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Quote = {
  id: string
  quoteNumber: string
  amount: number
  currency: string
  status: string
  issueDate: string
  expiryDate?: string | null
}

export default function QuotesPage() {
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }

    fetch(`/api/os/quotes?companyId=${encodeURIComponent(companyId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load quotes')
        return res.json()
      })
      .then(setQuotes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [companyId])

  if (!companyId) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">Open Quotes from a company workspace.</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotes</h1>
          <p className="text-sm text-slate-500">Company: {companyId}</p>
        </div>
        <Link href={`/os/money/quotes/new?companyId=${encodeURIComponent(companyId)}`} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
          New Quote
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading quotes…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && quotes.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No quotes yet.</div>}

      {quotes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Quote</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Expires</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{quote.quoteNumber}</td>
                  <td className="px-4 py-3">{quote.currency} {Number(quote.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">{quote.status}</td>
                  <td className="px-4 py-3">{new Date(quote.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3">{quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString('en-GB') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
