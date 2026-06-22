'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function OsShell({
  children,
  person,
}: {
  children: React.ReactNode
  person?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/os'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (isHome) return <>{children}</>

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <nav
        className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Link
          href="/os"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: '#64748B' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="hidden sm:inline">Home</span>
        </Link>
        <div className="flex items-center gap-3">
          {person && (
            <span className="text-xs hidden sm:block" style={{ color: '#94A3B8' }}>
              {person}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#475569')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="pt-14 max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">{children}</main>
    </div>
  )
}
