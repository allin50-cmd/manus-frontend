'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, CheckSquare, Contact, Bell, AppWindow } from 'lucide-react'

const items = [
  { href: '/os/launcher', label: 'Home', icon: Home },
  { href: '/portfolio', label: 'Companies', icon: Building2 },
  { href: '/today', label: 'Tasks', icon: CheckSquare },
  { href: '/contacts', label: 'Contacts', icon: Contact },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/os/apps', label: 'Apps', icon: AppWindow },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    // Hidden below `sm` — the root NavBar (app/layout.tsx) already renders a
    // fixed bottom tab bar at that breakpoint, which is this app's real
    // mobile nav pattern. Without this, this fixed w-64 sidebar stacked
    // alongside it forces horizontal overflow on every /os/* page.
    <aside className="hidden sm:block sm:w-64 sm:shrink-0 border-r border-white/10 bg-[#0B1020] text-white">
      <div className="p-6">
        <h2 className="text-xl font-bold">UltraTech OS</h2>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          const ItemIcon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 ${
                active ? 'bg-white/10 text-white' : 'text-white/70'
              }`}
            >
              <ItemIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

