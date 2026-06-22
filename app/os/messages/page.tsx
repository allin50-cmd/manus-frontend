'use client'

import Link from 'next/link'
import { useState } from 'react'

const THREADS = [
  {
    id: 1,
    sender: 'Dagon Kalev',
    initials: 'DK',
    avatarColor: 'linear-gradient(135deg,#20AFFF,#7A5AF8)',
    preview: 'Hawk Construction are keen — following up today at 11:30. Should I push for a site visit?',
    time: '14:23',
    unread: 3,
    href: '/os/companies/builder-big-jobs',
  },
  {
    id: 2,
    sender: 'Alissa Marsh',
    initials: 'AM',
    avatarColor: 'linear-gradient(135deg,#28C76F,#00A86B)',
    preview: 'Accuracy SOW draft is ready for review. Just needs sign-off before I send it to Sarah.',
    time: '13:05',
    unread: 2,
    href: '/os/companies/accuracy',
  },
  {
    id: 3,
    sender: 'FineGuard Support',
    initials: 'FG',
    avatarColor: 'linear-gradient(135deg,#064E3B,#065F46)',
    preview: 'Customer Clare Webb raised a billing query — invoice INV-2024-089 showing as unpaid.',
    time: '11:48',
    unread: 1,
    href: '/os/companies/fineguard',
  },
  {
    id: 4,
    sender: 'George Morris',
    initials: 'GM',
    avatarColor: 'linear-gradient(135deg,#FFC145,#FF8A34)',
    preview: 'Can we move the Monday review to Tuesday? Got a site visit with Premier Build first thing.',
    time: 'Yesterday',
    unread: 0,
    href: '/os/contacts',
  },
]

export default function MessagesPage() {
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const filtered = tab === 'unread' ? THREADS.filter((t) => t.unread > 0) : THREADS

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1E40AF,#2563EB)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <rect x="5" y="10" width="26" height="17" rx="3" fill="rgba(255,255,255,0.9)" />
            <path d="M5 13 L18 21 L31 13" stroke="rgba(37,99,235,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Module</div>
          <div className="text-2xl font-bold tracking-tight">Messages</div>
          <div className="text-sm opacity-60 mt-0.5">Email · WhatsApp · SMS</div>
        </div>
        <Link
          href="/os/companies"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          ✏️ Compose
        </Link>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 px-4 py-3">
        {(['all', 'unread'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: tab === t ? '#1D4ED8' : 'white',
              color: tab === t ? 'white' : '#64748B',
              boxShadow: tab === t ? '0 2px 8px rgba(29,78,216,0.3)' : 'none',
              border: '1px solid',
              borderColor: tab === t ? '#1D4ED8' : '#E2E8F0',
            }}
          >
            {t === 'all' ? 'All' : 'Unread'}
            {t === 'unread' && (
              <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}>
                {THREADS.filter((th) => th.unread > 0).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className="px-4 space-y-0">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filtered.map((thread, i) => (
            <Link
              key={thread.id}
              href={thread.href}
              className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: thread.avatarColor }}
              >
                {thread.initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold text-sm text-slate-900 truncate">{thread.sender}</div>
                  <div className="text-xs text-slate-400 shrink-0">{thread.time}</div>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{thread.preview}</div>
              </div>

              {/* Unread badge */}
              {thread.unread > 0 && (
                <span
                  className="text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#1D4ED8', color: 'white' }}
                >
                  {thread.unread}
                </span>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No unread messages</div>
          )}
        </div>
      </div>
    </div>
  )
}
