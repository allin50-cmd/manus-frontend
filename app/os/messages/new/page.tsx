'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewMessagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    subject: '',
    body: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyId) {
      setError('Company context is required')
      return
    }

    setError('')
    setLoading(true)
    try {
      // First, create a message thread
      const threadRes = await fetch('/api/os/message-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
        }),
      })

      if (!threadRes.ok) {
        const data = await threadRes.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create message thread')
        setLoading(false)
        return
      }

      const thread = await threadRes.json()

      // Then, send the initial message
      const msgRes = await fetch('/api/os/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread.id,
          fromPerson: 'System',
          body: form.body,
        }),
      })

      if (msgRes.ok) {
        router.push(`/os/messages?companyId=${companyId}`)
      } else {
        const data = await msgRes.json().catch(() => ({}))
        setError(data.error ?? 'Failed to send message')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!companyId) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-xl font-bold text-slate-900">New Message</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <p>Please access this form from a workspace context with a company ID.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">New Message</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Subject *">
          <input
            required
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            placeholder="Message subject"
            className={inputClass}
          />
        </Field>

        <Field label="Message *">
          <textarea
            required
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            rows={5}
            placeholder="Write your message…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.subject || !form.body}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
