'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const MODULE_LINKS = [
  { href: '/os/money',     label: 'Money',     color: '#FFC145' },
  { href: '/os/messages',  label: 'Messages',  color: '#20AFFF' },
  { href: '/os/calls',     label: 'Calls',     color: '#28C76F' },
  { href: '/os/companies', label: 'Companies', color: '#7A5AF8' },
  { href: '/os/alerts',    label: 'Alerts',    color: '#FF8A34' },
  { href: '/os/tasks',     label: 'Tasks',     color: '#3D8BFF' },
  { href: '/os/documents', label: 'Documents', color: '#818CF8' },
  { href: '/os/contacts',  label: 'Contacts',  color: '#A855F7' },
]

const COMPANY_LINKS = [
  { href: '/os/companies/fineguard',       label: 'FineGuard',           color: '#00A86B' },
  { href: '/os/companies/builder-big-jobs',label: 'Builder Big Jobs',    color: '#F97316' },
  { href: '/os/companies/ultratech',       label: 'Ultratech',           color: '#3B82F6' },
  { href: '/os/companies/accuracy',        label: 'Accuracy Ltd',        color: '#8B5CF6' },
]

const BORDER = '1px solid rgba(255,255,255,0.06)'

function SidebarLink({
  href,
  label,
  dot,
  active,
}: {
  href: string
  label: string
  dot?: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)',
        background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
      }}
    >
      {dot && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: dot, boxShadow: `0 0 6px ${dot}80` }}
        />
      )}
      <span className="truncate">{label}</span>
    </Link>
  )
}

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

  const initial = person?.charAt(0)?.toUpperCase() ?? 'U'

  const sidebar = (
    <aside
      className="hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 overflow-y-auto z-30"
      style={{ background: '#060C1C', borderRight: BORDER }}
    >
      {/* Logo */}
      <div className="px-4 py-[18px]" style={{ borderBottom: BORDER }}>
        <Link href="/os" className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7A5AF8, #3D8BFF)' }}
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xs font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Ultratech OS
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <div className="px-2 pt-3 pb-1">
        <SidebarLink href="/os" label="Home" active={isHome} />
        <SidebarLink href="/os/activity" label="Activity" active={pathname === '/os/activity'} />
      </div>

      {/* Modules */}
      <div className="px-2 pt-4" style={{ borderTop: BORDER }}>
        <p className="text-[9px] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Modules
        </p>
        {MODULE_LINKS.map((m) => (
          <SidebarLink
            key={m.href}
            href={m.href}
            label={m.label}
            dot={m.color}
            active={pathname === m.href || pathname.startsWith(m.href + '/')}
          />
        ))}
      </div>

      {/* Companies */}
      <div className="px-2 pt-4" style={{ borderTop: BORDER }}>
        <p className="text-[9px] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Companies
        </p>
        {COMPANY_LINKS.map((c) => (
          <SidebarLink
            key={c.href}
            href={c.href}
            label={c.label}
            dot={c.color}
            active={pathname === c.href || pathname.startsWith(c.href + '/')}
          />
        ))}
      </div>

      {/* User */}
      <div className="mt-auto p-4" style={{ borderTop: BORDER }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #7A5AF8, #A855F7)' }}
          >
            {initial}
          </div>
          <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {person ?? 'Admin'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] transition-colors"
          style={{ color: 'rgba(255,255,255,0.22)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
        >
          Log out
        </button>
      </div>
    </aside>
  )

  /* ── Home launcher: sidebar + dark card area ── */
  if (isHome) {
    return (
      <div className="flex min-h-screen" style={{ background: '#050816' }}>
        {sidebar}
        <div className="flex-1">{children}</div>

        {/* Mobile bottom bar */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center"
          style={{ background: '#060C1C', borderTop: BORDER }}
        >
          {[
            { href: '/os',          label: 'Home',      icon: '⊞' },
            { href: '/os/tasks',    label: 'Tasks',     icon: '≡' },
            { href: '/os/alerts',   label: 'Alerts',    icon: '◎' },
            { href: '/os/companies',label: 'Companies', icon: '▦' },
          ].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex-1 flex flex-col items-center py-2.5 text-[10px] transition-colors"
              style={{ color: pathname === n.href ? '#fff' : 'rgba(255,255,255,0.28)' }}
            >
              <span className="text-base leading-none mb-0.5">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    )
  }

  /* ── Workspace pages: sidebar + light content panel ── */
  return (
    <div className="flex min-h-screen" style={{ background: '#050816' }}>
      {sidebar}

      <div className="flex-1 min-h-screen" style={{ background: '#F1F5F9' }}>
        {/* Frosted top bar */}
        <nav
          className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 sm:px-6"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Link
            href="/os"
            className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Home
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {person && (
              <span className="text-xs text-slate-400 hidden sm:block">{person}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">{children}</main>
      </div>

      {/* Mobile bottom bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center"
        style={{ background: '#060C1C', borderTop: BORDER }}
      >
        {[
          { href: '/os',          label: 'Home',      icon: '⊞' },
          { href: '/os/tasks',    label: 'Tasks',     icon: '≡' },
          { href: '/os/alerts',   label: 'Alerts',    icon: '◎' },
          { href: '/os/companies',label: 'Companies', icon: '▦' },
        ].map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex-1 flex flex-col items-center py-2.5 text-[10px] transition-colors"
            style={{ color: pathname === n.href || pathname.startsWith(n.href + '/') ? '#fff' : 'rgba(255,255,255,0.28)' }}
          >
            <span className="text-base leading-none mb-0.5">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
