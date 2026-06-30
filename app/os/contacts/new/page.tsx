'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewContactPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    notes: '',
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
      const res = await fetch('/api/os/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          title: form.title || undefined,
          department: form.department || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/os/contacts?companyId=${companyId}`)
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

  if (!companyId) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Add Contact</h1>
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
        <h1 className="text-xl font-bold text-slate-900">Add Contact</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *">
            <input
              required
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="First name"
              className={inputClass}
            />
          </Field>
          <Field label="Last Name *">
            <input
              required
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="Last name"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+44 20 1234 5678"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Job title"
              className={inputClass}
            />
          </Field>
          <Field label="Department">
            <input
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              placeholder="Department"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Any additional context…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.firstName || !form.lastName}
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
