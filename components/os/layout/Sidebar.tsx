'use client'

import Link from 'next/link'

const items = [
  { href: '/os/launcher', label: 'Home' },
  { href: '/portfolio', label: 'Companies' },
  { href: '/today', label: 'Tasks' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/os/apps', label: 'Apps' },
]

export default function Sidebar() {
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
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

