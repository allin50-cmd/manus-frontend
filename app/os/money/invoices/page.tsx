'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  issueDate: string
  dueDate?: string | null
  paidAt?: string | null
}

export default function InvoicesPage({ searchParams }: { searchParams?: { companyId?: string } }) {
  const companyId = searchParams?.companyId ?? null
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }

    fetch(`/api/os/invoices?companyId=${encodeURIComponent(companyId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load invoices')
        return res.json()
      })
      .then(setInvoices)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [companyId])

  if (!companyId) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">Open Invoices from a company workspace.</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Company: {companyId}</p>
        </div>
        <Link href={`/os/money/invoices/new?companyId=${encodeURIComponent(companyId)}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          New Invoice
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading invoices…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && invoices.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No invoices yet.</div>}

      {invoices.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Due</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">{invoice.currency} {(Number(invoice.amount) / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">{invoice.status}</td>
                  <td className="px-4 py-3">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
