'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const MODULE_LINKS = [
  { href: '/os/money',     label: 'Money',     color: '#FFC145' },
  { href: '/os/messages',  label: 'Messages',  color: '#20AFFF' },
  { href: '/os/calls',     label: 'Calls',     color: '#28C76F' },
  { href: '/os/contacts',  label: 'Contacts',  color: '#A855F7' },
  { href: '/os/alerts',    label: 'Alerts',    color: '#FF8A34' },
  { href: '/os/tasks',     label: 'Tasks',     color: '#3D8BFF' },
  { href: '/os/companies', label: 'Companies', color: '#7A5AF8' },
  { href: '/os/documents', label: 'Documents', color: '#818CF8' },
]

const COMPANY_LINKS = [
  { href: '/os/companies/fineguard',        label: 'FineGuard',        color: '#00A86B' },
  { href: '/os/companies/builder-big-jobs', label: 'Builder Big Jobs', color: '#F97316' },
  { href: '/os/companies/ultratech',        label: 'Ultratech',        color: '#3B82F6' },
  { href: '/os/companies/accuracy',         label: 'Accuracy Ltd',     color: '#8B5CF6' },
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
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
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

// SVG icon components for bottom nav
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function IconCompanies({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="13" height="14" rx="1" />
      <path d="M16 3h5v18h-5" />
      <path d="M7 11h5M7 15h5" />
    </svg>
  )
}

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function IconMore({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function BottomNav({ pathname }: { pathname: string }) {
  const isActive = (href: string) =>
    href === '/os' ? pathname === '/os' : pathname === href || pathname.startsWith(href + '/')

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center"
      style={{
        background: 'rgba(6,12,28,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Home */}
      <Link
        href="/os"
        className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
        style={{ color: isActive('/os') ? '#fff' : 'rgba(255,255,255,0.35)' }}
      >
        <IconHome active={isActive('/os')} />
        <span className="text-[9px] font-medium tracking-wide">Home</span>
      </Link>

      {/* Companies */}
      <Link
        href="/os/companies"
        className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
        style={{ color: isActive('/os/companies') ? '#fff' : 'rgba(255,255,255,0.35)' }}
      >
        <IconCompanies active={isActive('/os/companies')} />
        <span className="text-[9px] font-medium tracking-wide">Companies</span>
      </Link>

      {/* Add button (center) */}
      <div className="flex-1 flex flex-col items-center justify-center py-1.5">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7A5AF8 0%, #3D8BFF 100%)',
            boxShadow: '0 4px 16px rgba(122,90,248,0.5)',
            marginBottom: 2,
          }}
          aria-label="Add"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <Link
        href="/os/search"
        className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
        style={{ color: isActive('/os/search') ? '#fff' : 'rgba(255,255,255,0.35)' }}
      >
        <IconSearch active={isActive('/os/search')} />
        <span className="text-[9px] font-medium tracking-wide">Search</span>
      </Link>

      {/* More */}
      <Link
        href="/os/more"
        className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
        style={{ color: isActive('/os/more') ? '#fff' : 'rgba(255,255,255,0.35)' }}
      >
        <IconMore active={isActive('/os/more')} />
        <span className="text-[9px] font-medium tracking-wide">More</span>
      </Link>
    </nav>
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

      {/* Home link */}
      <div className="px-2 pt-3 pb-1">
        <SidebarLink href="/os" label="Home" active={pathname === '/os'} />
      </div>

      {/* Modules */}
      <div className="px-2 pt-3" style={{ borderTop: BORDER }}>
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

      {/* More */}
      <div className="px-2 py-2" style={{ borderTop: BORDER }}>
        <SidebarLink href="/os/more" label="More" active={pathname === '/os/more'} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <div className="p-4" style={{ borderTop: BORDER }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #7A5AF8, #A855F7)', boxShadow: '0 2px 8px rgba(122,90,248,0.4)' }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {person ?? 'Admin'}
            </p>
            <p className="text-[10px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Founder
            </p>
          </div>
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

  /* Home launcher: sidebar + dark card area */
  if (isHome) {
    return (
      <div className="flex min-h-screen" style={{ background: '#050816' }}>
        {sidebar}
        <div className="flex-1">{children}</div>
        <BottomNav pathname={pathname} />
      </div>
    )
  }

  /* Workspace pages: sidebar + dark content panel */
  return (
    <div className="flex min-h-screen" style={{ background: '#050816' }}>
      {sidebar}

      <div className="flex-1 min-h-screen" style={{ background: '#050816' }}>
        {/* Dark glassmorphism top bar */}
        <nav
          className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 sm:px-6"
          style={{
            background: 'rgba(5,8,22,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Link
            href="/os"
            className="lg:hidden flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.95)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Home
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {person && (
              <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {person}
              </span>
            )}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7A5AF8, #A855F7)' }}
            >
              {initial}
            </div>
          </div>
        </nav>

        <main className="px-4 sm:px-6 py-6 pb-28 lg:pb-8 max-w-2xl mx-auto">
          {children}
        </main>
      </div>

      <BottomNav pathname={pathname} />
    </div>
  )
}
