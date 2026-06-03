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
  { href: '/teams', label: 'Teams' },
  { href: '/alerts', label: 'Compliance Alerts' },
  { href: '/alert-recipients', label: 'Alert Recipients' },
  { href: '/alert-events', label: 'Alert Audit Log' },
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
      <nav className="hidden sm:flex items-center justify-between bg-slate-900 text-white px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-white text-sm tracking-wide">
            SheetOps
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 flex items-center px-1 py-1">
        {NAV.map((n) => {
          const active = pathname.startsWith(n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-1 flex flex-col items-center py-1.5 text-xs transition-colors rounded-lg ${
                active ? 'text-white bg-slate-700 font-semibold' : 'text-slate-400'
              }`}
            >
              <span className="text-base leading-none mb-0.5">{n.icon}</span>
              <span className="leading-none">{n.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex-1 flex flex-col items-center py-1.5 text-xs text-slate-400 rounded-lg"
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
            className="absolute bottom-16 right-4 left-4 bg-slate-800 rounded-xl p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                {n.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
