import Link from 'next/link'

// Global 404 page. Matches the dark card aesthetic of app/error.tsx.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 text-center space-y-5 border border-slate-700">
        <div className="text-5xl font-bold text-white/90">404</div>
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-slate-400 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="flex gap-3">
          <Link
            href="/os/launcher"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Launcher
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
