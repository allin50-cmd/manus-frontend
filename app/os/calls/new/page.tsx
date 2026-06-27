'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell, Field, inputClass } from '@/components/os/forms/FormShell'

const STATUSES = ['Open', 'Callback', 'Waiting', 'Closed']

export default function NewCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    company: '',
    contact: '',
    phone: '',
    status: 'Open',
    reason: '',
    summary: '',
    outcome: '',
    nextAction: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/os/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        router.push('/os/calls')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to log call')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormShell title="Log Call" error={error} loading={loading} submitLabel="Log Call" disabled={!form.company && !form.contact && !form.phone}>
        <Field label="Company">
          <input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Contact">
          <input value={form.contact} onChange={(e) => set('contact', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Phone">
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </Field>

        <Field label="Reason">
          <input value={form.reason} onChange={(e) => set('reason', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Summary">
          <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} className={inputClass} />
        </Field>

        <Field label="Outcome">
          <input value={form.outcome} onChange={(e) => set('outcome', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Next Action">
          <input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} className={inputClass} />
        </Field>
      </FormShell>
    </form>
  )
}
