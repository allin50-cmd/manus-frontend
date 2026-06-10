'use client'

import Link from 'next/link'

export default function VoiceIntakePage() {
  return (
    <div className="mx-auto max-w-xl space-y-5 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Voice Intake</h1>
        <p className="text-sm text-slate-500">Capture a spoken note, review the draft, then approve before live records are created.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          Voice Intake backend is ready. Drafts are saved first and nothing writes to live work items until approval.
        </div>
        <Link href="/dashboard" className="block rounded-xl bg-slate-200 px-4 py-4 text-center font-semibold text-slate-800 hover:bg-slate-300">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
