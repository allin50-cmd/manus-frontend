'use client'

import Link from 'next/link'
import { useState } from 'react'

const NEEDS_REVIEW = [
  {
    name: 'FineGuard Proposal 2024',
    type: 'Proposal',
    company: 'FineGuard Ltd',
    badgeLabel: 'Review',
    badgeBg: '#FEE2E2',
    badgeColor: '#DC2626',
    dotColor: '#065F46',
  },
  {
    name: 'Accuracy SOW Draft v2',
    type: 'Statement of Work',
    company: 'Accuracy Developments',
    badgeLabel: 'Draft',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    dotColor: '#6D28D9',
  },
]

const RECENT_FILES = [
  {
    name: 'Hawk Construction Quote Q3.pdf',
    size: '284 KB',
    date: '21 Jun',
    dotColor: '#C2410C',
  },
  {
    name: 'FineGuard Onboarding Pack.pdf',
    size: '1.2 MB',
    date: '18 Jun',
    dotColor: '#065F46',
  },
  {
    name: 'Accuracy Site Visit Notes.docx',
    size: '48 KB',
    date: '17 Jun',
    dotColor: '#6D28D9',
  },
  {
    name: 'BBJ Lead Intake Summary.pdf',
    size: '92 KB',
    date: '15 Jun',
    dotColor: '#C2410C',
  },
]

export default function DocumentsPage() {
  const [uploadClicked, setUploadClicked] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#3730A3,#4F46E5)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M6 15H30V29C30 30.1 29.1 31 28 31H8C6.9 31 6 30.1 6 29V15Z"
              fill="rgba(255,255,255,0.9)"
            />
            <path
              d="M6 15C6 13.9 6.9 13 8 13H16.5L18.5 11H28C29.1 11 30 11.9 30 13V15H6Z"
              fill="rgba(255,255,255,0.65)"
            />
            <rect x="11" y="19" width="14" height="2" rx="1" fill="rgba(63,63,180,0.6)" />
            <rect x="11" y="23" width="10" height="2" rx="1" fill="rgba(63,63,180,0.4)" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Module</div>
          <div className="text-2xl font-bold tracking-tight">Documents</div>
          <div className="text-sm opacity-60 mt-0.5">Proposals · Contracts · Files</div>
        </div>
        <button
          onClick={() => setUploadClicked(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          {uploadClicked ? 'Coming soon' : '↑ Upload'}
        </button>
      </div>

      <div className="px-4 py-5 space-y-5 pb-8">
        {/* Needs Review */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Needs Review</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {NEEDS_REVIEW.map((doc, i) => (
              <div
                key={doc.name}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < NEEDS_REVIEW.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                {/* Company colour dot */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${doc.dotColor}18` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: doc.dotColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{doc.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{doc.type} · {doc.company}</div>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: doc.badgeBg, color: doc.badgeColor }}
                >
                  {doc.badgeLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Recent Files</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {RECENT_FILES.map((file, i) => (
              <div
                key={file.name}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < RECENT_FILES.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${file.dotColor}18` }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={file.dotColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{file.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{file.size} · {file.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/os" className="block text-center text-xs text-slate-400 py-2">
          ← Back to Ultratech OS
        </Link>
      </div>
    </div>
  )
}
