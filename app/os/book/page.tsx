'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BookState = 'form' | 'saving' | 'success' | 'error'

export default function BookPage() {
  const router = useRouter()
  const [state, setState] = useState<BookState>('form')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    contact: '',
    date: '',
    time: '',
    location: '',
    notes: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.date || !form.time || !form.contact) return
    setState('saving')
    setError('')

    try {
      const dueAt = new Date(`${form.date}T${form.time}`)
      const noteLines = [
        form.location ? `Location: ${form.location}` : '',
        form.notes || '',
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/os/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Appointment: ${form.contact}`,
          dueAt: dueAt.toISOString(),
          priority: 'High',
          notes: noteLines || null,
        }),
      })

      if (!res.ok) throw new Error('save failed')
      setState('success')
      if ('vibrate' in navigator) navigator.vibrate([20, 50, 20])
    } catch {
      setState('error')
      setError('Could not save appointment. Please try again.')
    }
  }

  if (state === 'success') {
    const apptDate = form.date && form.time ? new Date(`${form.date}T${form.time}`) : null
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 pb-28 lg:pb-0"
        style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
      >
        <div className="flex flex-col items-center text-center max-w-xs">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'rgba(40,199,111,0.15)', border: '2px solid rgba(40,199,111,0.4)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#28C76F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'rgba(255,255,255,0.92)' }}>Appointment Booked</h2>
          {apptDate && (
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {form.contact} · {apptDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at {form.time}
            </p>
          )}
          {form.location && (
            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              📍 {form.location}
            </p>
          )}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => router.push('/os/go')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(61,139,255,0.15)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.3)' }}
            >
              View in Go
            </button>
            <button
              onClick={() => router.push('/os')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canSave = form.contact.trim() && form.date && form.time

  return (
    <div
      className="min-h-screen pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/os')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Book</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Smart Diary</p>
          </div>
        </div>

        {state === 'error' && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}
            role="alert"
          >
            <span style={{ color: '#FF6B6B', fontSize: '1.2em' }} aria-hidden>⚠️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: '#FF6B6B' }}>{error}</p>
              <button onClick={() => setState('form')} className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Contact *
            </label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              placeholder="Who are you meeting?"
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Time *
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Address or place"
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
            {/* TODO: Phase 2 — Travel time, parking, route suggestions */}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Purpose, prep, anything else…"
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || state === 'saving'}
            className="w-full py-4 rounded-2xl text-base font-bold mt-2"
            style={{
              background: canSave ? 'linear-gradient(135deg, #3D8BFF, #0060FF)' : 'rgba(255,255,255,0.06)',
              color: canSave ? 'white' : 'rgba(255,255,255,0.3)',
              boxShadow: canSave ? '0 4px 20px rgba(61,139,255,0.4)' : 'none',
              transition: 'background 150ms ease',
            }}
          >
            {state === 'saving' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />
                Saving…
              </span>
            ) : (
              'Book Appointment'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
