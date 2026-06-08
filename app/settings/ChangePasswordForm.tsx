'use client'

import { useState } from 'react'

export default function ChangePasswordForm({ person }: { person: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }
    setStatus('saving')
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
        setCurrent('')
        setNext('')
        setConfirm('')
      } else {
        setError(data.error ?? 'Something went wrong')
        setStatus('error')
      }
    } catch {
      setError('Something went wrong')
      setStatus('error')
    }
  }

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 max-w-sm">
      <div>
        <label htmlFor="cp-current" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Current password
        </label>
        <input
          id="cp-current"
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inp}
          autoComplete="current-password"
        />
      </div>
      <div>
        <label htmlFor="cp-new" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          New password
        </label>
        <input
          id="cp-new"
          type="password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inp}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="cp-confirm" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Confirm new password
        </label>
        <input
          id="cp-confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inp}
          autoComplete="new-password"
        />
      </div>

      {status === 'done' && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Password changed. Use your new password next time you log in.
        </p>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
      >
        {status === 'saving' ? 'Saving…' : 'Change password'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Changing password for <strong>{person}</strong>. Minimum 8 characters.
      </p>
    </form>
  )
}
