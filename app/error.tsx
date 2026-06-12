'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log to console in production so server-side error tracking picks it up.
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 text-center space-y-5 border border-slate-700">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-slate-400 text-sm">
          The page encountered an error. This is usually a temporary issue.
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <p className="text-xs text-slate-500 font-mono break-all bg-slate-800 p-3 rounded-lg text-left">
            {error.message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
