'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const MODULES = [
  {
    href: '/os/money',
    label: 'Money',
    sub: 'Revenue · Invoices · Payments',
    accent: '#FFC145',
    gradFrom: '#FFD070',
    gradTo: '#FF8C00',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M14 9.5c-.6-.9-1.5-1.5-2.5-1.5-1.7 0-3 1.3-3 3s1.3 3 3 3c1 0 1.9-.6 2.5-1.5" />
        <path strokeLinecap="round" d="M12 7v1.5M12 15.5V17" />
      </svg>
    ),
  },
  {
    href: '/os/messages',
    label: 'Messages',
    sub: 'Email · WhatsApp · SMS',
    accent: '#20AFFF',
    gradFrom: '#60C8FF',
    gradTo: '#0070CC',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/os/calls',
    label: 'Calls',
    sub: 'Today · Scheduled · Logged',
    accent: '#28C76F',
    gradFrom: '#4CE890',
    gradTo: '#16954A',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 011 1.18a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8a16 16 0 006.91 6.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    href: '/os/companies',
    label: 'Companies',
    sub: 'FineGuard · Builder Big Jobs · Accuracy',
    accent: '#7A5AF8',
    gradFrom: '#9B7AFF',
    gradTo: '#5A3AD0',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/os/alerts',
    label: 'Alerts',
    sub: 'Red · Amber · Compliance',
    accent: '#FF8A34',
    gradFrom: '#FFB07A',
    gradTo: '#CC5500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    href: '/os/tasks',
    label: 'Tasks',
    sub: 'Today · This Week · Assigned',
    accent: '#3D8BFF',
    gradFrom: '#70A8FF',
    gradTo: '#1A5CC0',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/os/documents',
    label: 'Documents',
    sub: 'Contracts · Invoices · Policies',
    accent: '#C7D2FE',
    gradFrom: '#E0E7FF',
    gradTo: '#8090E0',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/os/contacts',
    label: 'Contacts',
    sub: 'Customers · Prospects · Staff',
    accent: '#A855F7',
    gradFrom: '#C47BFF',
    gradTo: '#7A1ABF',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

function LogoutButton() {
  const router = useRouter()
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }
  return (
    <button
      onClick={handleLogout}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
      style={{ color: 'rgba(255,255,255,0.4)' }}
      onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
      onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
      title="Log out"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  )
}

export default function OsHomePage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 50%, #0A1428 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(122,90,248,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: '-10%',
          right: '-10%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, rgba(32,175,255,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7A5AF8, #3D8BFF)' }}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Ultratech OS
          </span>
        </div>
        <LogoutButton />
      </header>

      {/* Main content */}
      <main className="relative z-10 px-5 sm:px-8 pt-10 pb-16 max-w-5xl mx-auto">
        {/* Greeting */}
        <div className="mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Good morning.
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Select a workspace
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MODULES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group relative rounded-2xl overflow-hidden h-[160px] sm:h-[200px] transition-transform duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${mod.accent}18 0%, transparent 70%)`,
                }}
              />

              {/* Card content */}
              <div className="relative z-10 p-4 sm:p-5 h-full flex flex-col justify-between">
                {/* Icon */}
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${mod.gradFrom}, ${mod.gradTo})`,
                    boxShadow: `0 4px 16px ${mod.accent}40`,
                  }}
                >
                  <span style={{ color: '#fff' }}>{mod.icon}</span>
                </div>

                {/* Text */}
                <div>
                  <div
                    className="font-semibold text-sm sm:text-base leading-tight"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {mod.label}
                  </div>
                  <div
                    className="text-xs mt-1 hidden sm:block leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {mod.sub}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
