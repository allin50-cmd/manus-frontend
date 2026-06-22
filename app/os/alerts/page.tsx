'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function AlertsPage() {
  const [markedRead, setMarkedRead] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#C2410C,#EA580C)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M18 4.5V6C13.5 6.8 10 10.8 10 16V23L7 26H29L26 23V16C26 10.8 22.5 6.8 18 6"
              fill="rgba(255,255,255,0.9)"
            />
            <path d="M15.5 26C15.5 27.9 16.6 29 18 29C19.4 29 20.5 27.9 20.5 26" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Module</div>
          <div className="text-2xl font-bold tracking-tight">Alerts</div>
          <div className="text-sm opacity-60 mt-0.5">Urgent · Warnings · Updates</div>
        </div>
        <button
          onClick={() => setMarkedRead(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all"
          style={{
            background: markedRead ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
            color: 'white',
            opacity: markedRead ? 0.5 : 1,
          }}
        >
          {markedRead ? 'All read ✓' : 'Mark All Read'}
        </button>
      </div>

      <div className="px-4 py-5 space-y-5 pb-8">
        {/* Urgent */}
        {!markedRead && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide">Urgent — Act Now</h2>
            </div>
            {/* Full-bleed FineGuard invoice card */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#EF4444' }}>
                    Invoice Overdue
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">£4,800</div>
                  <div className="text-sm text-red-600 font-medium mt-0.5">FineGuard Ltd · 4 days overdue</div>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  OVERDUE
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-4">Contact: Clare Webb · INV-2024-089</div>
              <div className="flex gap-2">
                <a
                  href="tel:+441234567890"
                  className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white"
                  style={{ background: '#DC2626' }}
                >
                  📞 Call Customer
                </a>
                <button
                  className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl"
                  style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  ✉️ Send Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wide">Warning</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm"
                style={{ background: '#FEF3C7' }}
              >
                📉
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900">Premier Build Co — Lead Score Drop</div>
                <div className="text-xs text-slate-500 mt-0.5">Score fell from 74 → 58 · Follow up recommended</div>
              </div>
              <Link
                href="/os/leads/builder-big-jobs"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                View
              </Link>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm"
                style={{ background: '#FEF3C7' }}
              >
                🏗
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900">New BBJ Lead — Sovereign Structures</div>
                <div className="text-xs text-slate-500 mt-0.5">Just submitted · Needs qualification</div>
              </div>
              <Link
                href="/os/leads/builder-big-jobs"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                Review
              </Link>
            </div>
          </div>
        </div>

        {/* Earlier */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-bold text-green-700 uppercase tracking-wide">Earlier</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm"
                style={{ background: '#D1FAE5' }}
              >
                💰
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900">Payment Received — BBJ</div>
                <div className="text-xs text-slate-500 mt-0.5">£2,100 from Premier Build Co · 20 Jun</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ background: '#D1FAE5', color: '#065F46' }}>
                Paid
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm"
                style={{ background: '#D1FAE5' }}
              >
                ✅
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900">Task Completed</div>
                <div className="text-xs text-slate-500 mt-0.5">FineGuard onboarding checklist · Alissa · 19 Jun</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ background: '#D1FAE5', color: '#065F46' }}>
                Done
              </span>
            </div>
          </div>
        </div>

        <Link href="/os" className="block text-center text-xs text-slate-400 py-2">
          ← Back to Ultratech OS
        </Link>
      </div>
    </div>
  )
}
