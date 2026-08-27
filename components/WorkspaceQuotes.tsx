'use client'

import { useEffect, useState } from 'react'

interface WorkspaceQuotesProps {
  companyId: string
  companyName: string
}

interface Quote {
  id: string
  quoteNumber: string
  amount: number
  currency: string
  status: string
  issueDate: string
  expiryDate: string | null
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function WorkspaceQuotes({ companyId, companyName }: WorkspaceQuotesProps) {
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setQuotes(null)
      try {
        const res = await fetch(`/api/os/quotes?companyId=${encodeURIComponent(companyId)}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load quotes')
        }
        const data: Quote[] = await res.json()
        if (!cancelled) setQuotes(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load quotes')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [companyId])

  if (error) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,120,120,0.85)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (quotes === null) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading quotes…
        </p>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No quotes yet for {companyName}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {quotes.map((quote) => (
        <div
          key={quote.id}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap"
          style={cardStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {quote.quoteNumber}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Issued {formatDate(quote.issueDate)} · Expires {formatDate(quote.expiryDate)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {formatAmount(quote.amount, quote.currency)}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {quote.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
