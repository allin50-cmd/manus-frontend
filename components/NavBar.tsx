'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/today', label: 'Today', icon: '◎' },
  { href: '/companies', label: 'Companies', icon: '▣' },
  { href: '/contacts', label: 'Contacts', icon: '☎' },
  { href: '/voice-intake', label: 'Voice', icon: '◉' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      <header className="hidden md:flex sticky top-0 z-40 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
        <Link href="/today" className="font-semibold text-white">
          UltraCore Ops
        </Link>

        <nav className="flex items-center gap-2">
          {NAV.map((n) => {
            const active = pathname === n.href

            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Log out
        </button>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 border-t border-slate-800 bg-slate-950 md:hidden">
        {NAV.map((n) => {
          const active = pathname === n.href

          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-1 py-2 text-xs ${
                active ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <span className="text-lg leading-none">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
