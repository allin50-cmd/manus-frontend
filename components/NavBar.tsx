'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/work-items', label: 'Work Items', icon: '≡' },
  { href: '/today', label: 'Today', icon: '◎' },
  { href: '/decisions', label: 'Decisions', icon: '✓' },
]

const MORE = [
  { href: '/activity', label: 'Activity Log' },
  { href: '/templates', label: 'Templates' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden sm:flex items-center justify-between bg-[#0B1F3A] text-white px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white text-sm tracking-wide">
            <span className="w-6 h-6 bg-[#00A86B] rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            FineGuard
          </Link>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition-colors ${
                pathname.startsWith(n.href) ? 'text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
          {MORE.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition-colors ${
                pathname.startsWith(n.href) ? 'text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white transition-colors">
          Log out
        </button>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0B1F3A] border-t border-white/10 z-50 flex items-center">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              pathname.startsWith(n.href) ? 'text-white' : 'text-slate-400'
            }`}
          >
            <span className="text-base leading-none mb-0.5">{n.icon}</span>
            <span className="leading-none">{n.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex-1 flex flex-col items-center py-2 text-xs text-slate-400"
        >
          <span className="text-base leading-none mb-0.5">⋯</span>
          <span className="leading-none">More</span>
        </button>
      </nav>

      {/* Mobile overflow menu */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute bottom-16 right-4 left-4 bg-[#0B1F3A] border border-white/10 rounded-xl p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {n.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 text-red-400 rounded-lg hover:bg-white/10 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
