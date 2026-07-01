'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

export default function LoginPage() {
  const router = useRouter()
  const [passcode, setPasscode] = useState('')
  const [person, setPerson] = useState('Dagon')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkDevBypass() {
      try {
        const res = await fetch('/api/auth/dev-bypass')
        if (res.ok) {
          router.push('/dashboard')
        }
      } catch {
        // Bypass not available, show login form
      }
    }
    checkDevBypass()
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, person }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else if (res.status >= 500) {
        setError('Server unavailable. Please try again in a moment.')
      } else {
        setError('Incorrect passcode. Try again.')
        setPasscode('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">UltraCore Ops</h1>
          <p className="text-slate-400 text-sm mt-1">Business command hub</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Who are you?</label>
            <div className="grid grid-cols-3 gap-2">
              {PEOPLE.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPerson(p)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                    person === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              required
              autoFocus
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg tracking-widest"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Signing in…' : `Sign in as ${person}`}
          </button>
        </form>
      </div>
    </div>
  )
}
