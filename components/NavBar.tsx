'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutGrid, AppWindow, Zap, CheckSquare, Bell, MoreHorizontal, ShieldCheck } from 'lucide-react'

const BOTTOM_TABS = [
  { href: '/dashboard',    label: 'Hub',       icon: LayoutGrid },
  { href: '/os/launcher',  label: 'Apps',      icon: AppWindow },
  { href: '/os/parser',    label: 'Parser',    icon: Zap },
  { href: '/today',        label: 'Tasks',     icon: CheckSquare },
  { href: '/alerts',       label: 'Alerts',    icon: Bell },
]

const DESKTOP_LINKS = [
  { href: '/dashboard',    label: 'Command Hub' },
  { href: '/os/launcher',  label: 'Launcher' },
  { href: '/os/parser',    label: 'Parser' },
  { href: '/today',        label: 'Tasks' },
  { href: '/portfolio',    label: 'Companies' },
  { href: '/contacts',     label: 'Contacts' },
  { href: '/alerts',       label: 'Alerts' },
]

const MORE_MENU = [
  { href: '/os/launcher',        label: 'OS Launcher' },
  { href: '/os/parser',          label: 'Universal Action Parser' },
  { href: '/work-items/new',     label: 'New Work Item' },
  { href: '/os/contacts/new',    label: 'New Contact' },
  { href: '/os/tasks/new',       label: 'New Task' },
  { href: '/os/calls/new',       label: 'New Call' },
  { href: '/os/messages/new',    label: 'New Message' },
  { href: '/os/documents/upload', label: 'Upload Document' },
  { href: '/filings',            label: 'Filings' },
  { href: '/decisions',          label: 'Decisions' },
  { href: '/teams',              label: 'Teams' },
  { href: '/templates',          label: 'Templates' },
  { href: '/activity',           label: 'Activity Log' },
]

export default function NavBar({ person }: { person: string | null }) {
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
      <nav className="hidden sm:flex items-center justify-between sticky top-0 z-50 px-6 py-0 h-14"
           style={{ background: '#0c2340' }}>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">UltraCore Ops</span>
          </Link>

          <div className="w-px h-5 bg-white/20" />

          {DESKTOP_LINKS.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(n.href)
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/90'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {person && (
            <Link
              href="/settings"
              className="text-xs text-white/50 hover:text-white transition-colors font-medium"
            >
              {person}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex items-center">
        {BOTTOM_TABS.map((n) => {
          const active = pathname.startsWith(n.href)
          const TabIcon = n.icon
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-1 flex flex-col items-center pt-2 pb-3 text-[10px] font-medium transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <TabIcon className={`w-5 h-5 mb-0.5 transition-transform ${active ? 'scale-110' : ''}`} />
              {n.label}
            </Link>
          )
        })}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex-1 flex flex-col items-center pt-2 pb-3 text-[10px] font-medium text-slate-400"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          More
        </button>
      </nav>

      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute bottom-16 right-4 left-4 bg-white rounded-2xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE_MENU.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-slate-800 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                {n.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-slate-500 text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                {person ? `Settings (${person})` : 'Settings'}
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
