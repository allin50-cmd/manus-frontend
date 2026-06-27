'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function NewContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    role: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/os/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        router.push('/os/contacts')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create contact')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Add Contact</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Name *">
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Company">
          <input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Email">
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Phone">
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Role">
          <input value={form.role} onChange={(e) => set('role', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={inputClass} />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.name}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'Create Contact'}
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
