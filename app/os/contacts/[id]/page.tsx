'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CATEGORIES = ['Team', 'Client', 'Partner', 'Supplier', 'Prospect']

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  category: string
  company: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Client',
    company: '',
    notes: '',
  })

  useEffect(() => {
    fetchContact()
  }, [contactId])

  async function fetchContact() {
    try {
      setLoading(true)
      const res = await fetch(`/api/os/people/${contactId}`)
      if (res.ok) {
        const data = await res.json()
        setContact(data)
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          category: data.category || 'Client',
          company: data.company || '',
          notes: data.notes || '',
        })
      } else {
        setError('Contact not found')
      }
    } catch (err) {
      setError('Failed to load contact')
    } finally {
      setLoading(false)
    }
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/os/people/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          category: form.category,
          company: form.company || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        await fetchContact()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update contact')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      setSaving(true)
      const res = await fetch(`/api/os/people/${contactId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/os/contacts')
      } else {
        setError('Failed to delete contact')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading contact…</div>
  }

  if (!contact) {
    return <div className="text-center py-8 text-red-600">Contact not found</div>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Contact Details</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Name *">
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Full name"
            className={inputClass}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="email@example.com"
            className={inputClass}
          />
        </Field>

        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+44 (0) 123 456 7890"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Company">
            <input
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Company name"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Additional notes…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-3 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 font-semibold rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </form>

      <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg">
        <p>Created: {new Date(contact.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(contact.updatedAt).toLocaleString()}</p>
      </div>
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
