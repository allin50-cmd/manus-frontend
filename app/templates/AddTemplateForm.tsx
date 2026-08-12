'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/template-enums'

const USE_CASES = [
  'Partnership outreach',
  'Construction lead outreach',
  'Planning lead outreach',
  'Internal process',
  'Compliance notice',
  'Client communication',
  'Other',
]

type TemplateForm = {
  name: string
  useCase: string
  body: string
  category: TemplateCategory
}

const EMPTY_FORM: TemplateForm = {
  name: '',
  useCase: '',
  body: '',
  category: 'General',
}

export default function AddTemplateForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM)

  function setField<K extends keyof TemplateForm>(field: K, value: TemplateForm[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
        setForm(EMPTY_FORM)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Failed to save draft')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg px-4 py-2 transition-colors"
      >
        {open ? 'Cancel' : '+ Add Template'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-800">New Template Draft</h2>
            <p className="text-xs text-slate-500 mt-1">Drafts must be submitted and approved before they can be used.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="template-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Name *</label>
              <input
                id="template-name"
                required
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                placeholder="Template name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="template-category" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Category</label>
              <select
                id="template-category"
                value={form.category}
                onChange={(event) => setField('category', event.target.value as TemplateCategory)}
                className={inputClass}
              >
                {TEMPLATE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="template-use-case" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Use Case</label>
            <select
              id="template-use-case"
              value={form.useCase}
              onChange={(event) => setField('useCase', event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {USE_CASES.map((useCase) => <option key={useCase}>{useCase}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="template-body" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Body *</label>
            <textarea
              id="template-body"
              required
              rows={8}
              value={form.body}
              onChange={(event) => setField('body', event.target.value)}
              placeholder="Template text…"
              className={inputClass}
            />
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

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
              {loading ? 'Saving…' : 'Save Draft'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
