'use client'

import { useEffect, useState } from 'react'

interface WorkspaceInvoicesProps {
  companyId: string
  companyName: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  issueDate: string
  dueDate: string | null
  paidAt: string | null
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

export default function WorkspaceInvoices({ companyId, companyName }: WorkspaceInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setInvoices(null)
      try {
        const res = await fetch(`/api/os/invoices?companyId=${encodeURIComponent(companyId)}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load invoices')
        }
        const data: Invoice[] = await res.json()
        if (!cancelled) setInvoices(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoices')
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

  if (invoices === null) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading invoices…
        </p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No invoices yet for {companyName}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap"
          style={cardStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {invoice.invoiceNumber}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {formatAmount(invoice.amount, invoice.currency)}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
