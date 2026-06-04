'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Company {
  id: string
  name: string
}

interface Contact {
  id: string
  companyId: string
  company: Company
  name: string
  role: string | null
  email: string | null
  phone: string | null
  isPrimary: boolean
  notes: string | null
}

const blank = {
  companyId: '',
  name: '',
  role: '',
  email: '',
  phone: '',
  isPrimary: false,
  notes: '',
}

const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ContactsClient({
  contacts,
  companies,
}: {
  contacts: Contact[]
  companies: Company[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.role?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.company.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [contacts, search],
  )

  function openAdd() {
    setForm(blank)
    setEditId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(c: Contact) {
    setForm({
      companyId: c.companyId,
      name: c.name,
      role: c.role ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      isPrimary: c.isPrimary,
      notes: c.notes ?? '',
    })
    setEditId(c.id)
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm(blank)
    setError('')
  }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.companyId) { setError('Company is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(editId ? `/api/contacts/${editId}` : '/api/contacts', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to save')
        return
      }
      closeForm()
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function del(c: Contact) {
    if (!window.confirm(`Delete contact "${c.name}"?`)) return
    const res = await fetch(`/api/contacts/${c.id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Add Contact
        </button>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, role, email, company…"
          className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {editId ? 'Edit Contact' : 'New Contact'}
            </h2>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-700 text-lg leading-none">
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Company">
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select company</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Director, Accounts"
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Primary Contact">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-slate-600">Primary contact</span>
              </label>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={closeForm}
              className="text-sm px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="text-sm px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                  {c.isPrimary && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      ★ Primary
                    </span>
                  )}
                </div>
                {c.role && <p className="text-xs text-slate-500 mt-0.5">{c.role}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{c.company.name}</p>
                {(c.email || c.phone) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {c.email}
                    {c.email && c.phone && ' · '}
                    {c.phone}
                  </p>
                )}
                {c.notes && (
                  <p className="text-xs text-slate-400 mt-1 truncate">{c.notes}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors text-sm"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => del(c)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors text-sm"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <p className="text-sm text-slate-400 text-center py-10">
            {search ? 'No contacts match your search' : 'No contacts yet — add one above'}
          </p>
        )}
      </div>
    </div>
  )
}
