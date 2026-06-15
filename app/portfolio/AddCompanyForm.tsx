'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddCompanyForm() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      setName('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to add company')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add company name…"
        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
      >
        {loading ? 'Adding…' : '+ Add Company'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </form>
  )
}
