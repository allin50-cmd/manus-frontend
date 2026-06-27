import type { ReactNode } from 'react'

export function FormShell({
  title,
  children,
  error,
  loading,
  submitLabel,
  disabled,
}: {
  title: string
  children: ReactNode
  error?: string
  loading?: boolean
  submitLabel: string
  disabled?: boolean
}) {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        {children}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || disabled}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : submitLabel}
        </button>
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
