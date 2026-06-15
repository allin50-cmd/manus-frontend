'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const USE_CASES = [
  'Partnership outreach',
  'Construction lead outreach',
  'Planning lead outreach',
  'Internal process',
  'Compliance notice',
  'Client communication',
  'Other',
]

export default function AddTemplateForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', useCase: '', body: '' })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setOpen(false)
        setForm({ name: '', useCase: '', body: '' })
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to save template')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg px-4 py-2 transition-colors"
      >
        {open ? 'Cancel' : '+ Add Template'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">New Template</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Name *</label>
              <input
                required
                autoFocus
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Template name"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Use Case</label>
              <select value={form.useCase} onChange={(e) => set('useCase', e.target.value)} className={inp}>
                <option value="">Select…</option>
                {USE_CASES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Body *</label>
            <textarea
              required
              rows={8}
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Template text…"
              className={inp}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim() || !form.body.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {loading ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
