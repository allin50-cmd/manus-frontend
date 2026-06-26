'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type QuoteState = 'form' | 'saving' | 'success' | 'error'

function generateQuoteNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `Q-${y}${m}${d}-${rand}`
}

function parsePence(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

function formatAmount(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
}

export default function QuotePage() {
  const router = useRouter()
  const [state, setState] = useState<QuoteState>('form')
  const [error, setError] = useState('')
  const [savedQuote, setSavedQuote] = useState<{ number: string; clientName: string; amountPence: number } | null>(null)
  const [form, setForm] = useState({
    customer: '',
    description: '',
    amount: '',
    notes: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.customer.trim()) return
    setState('saving')
    setError('')

    try {
      const res = await fetch('/api/os/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: generateQuoteNumber(),
          clientName: form.customer.trim(),
          description: form.description.trim() || null,
          amountPence: parsePence(form.amount),
          notes: form.notes.trim() || null,
          status: 'Draft',
        }),
      })

      if (!res.ok) throw new Error('save failed')
      const quote = await res.json()
      setSavedQuote(quote)
      setState('success')
      if ('vibrate' in navigator) navigator.vibrate([20, 50, 20])
    } catch {
      setState('error')
      setError('Could not create quote. Please try again.')
    }
  }

  if (state === 'success' && savedQuote) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 pb-28 lg:pb-0"
        style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
      >
        <div className="flex flex-col items-center text-center max-w-xs">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,193,69,0.15)', border: '2px solid rgba(255,193,69,0.4)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFD000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'rgba(255,255,255,0.92)' }}>Quote Created</h2>
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{savedQuote.clientName}</p>
          <p className="text-2xl font-bold mb-1" style={{ color: '#FFD000' }}>
            {savedQuote.amountPence > 0 ? formatAmount(savedQuote.amountPence) : 'No amount'}
          </p>
          <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>{savedQuote.number} · Draft</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => router.push('/os/money')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,193,69,0.15)', color: '#FFD000', border: '1px solid rgba(255,193,69,0.3)' }}
            >
              View Quote
            </button>
            <button
              onClick={() => router.push('/os')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canSave = form.customer.trim().length > 0

  return (
    <div
      className="min-h-screen pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/os')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Quote</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Quick Estimate</p>
          </div>
        </div>

        {state === 'error' && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}
            role="alert"
          >
            <span style={{ color: '#FF6B6B', fontSize: '1.2em' }} aria-hidden>⚠️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: '#FF6B6B' }}>{error}</p>
              <button onClick={() => setState('form')} className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Customer *
            </label>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => set('customer', e.target.value)}
              placeholder="Customer name"
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Amount
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                aria-hidden
              >
                £
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What does this cover?"
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Terms, exclusions, anything extra…"
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || state === 'saving'}
            className="w-full py-4 rounded-2xl text-base font-bold mt-2"
            style={{
              background: canSave ? 'linear-gradient(135deg, #FFD000, #FFA500)' : 'rgba(255,255,255,0.06)',
              color: canSave ? '#3A1800' : 'rgba(255,255,255,0.3)',
              boxShadow: canSave ? '0 4px 20px rgba(255,193,69,0.4)' : 'none',
              transition: 'background 150ms ease',
            }}
          >
            {state === 'saving' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-amber-900/40 border-t-amber-900 animate-spin" aria-hidden />
                Creating quote…
              </span>
            ) : (
              'Create Quote'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
