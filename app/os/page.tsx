'use client'

import Link from 'next/link'

const MODULES = [
  {
    href: '/os/money',
    label: 'Money',
    sub: 'Revenue · Invoices · Payments',
    accent: '#FFC145',
    glow: 'rgba(255,193,69,0.35)',
    gradFrom: '#FFE47A',
    gradMid: '#FFC145',
    gradTo: '#CC7700',
    hoverBorder: 'rgba(255,193,69,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M14 9.5c-.6-.9-1.5-1.5-2.5-1.5-1.7 0-3 1.3-3 3s1.3 3 3 3c1 0 1.9-.6 2.5-1.5" />
        <path d="M12 7v1.5M12 15.5V17" />
      </svg>
    ),
  },
  {
    href: '/os/messages',
    label: 'Messages',
    sub: 'Email · WhatsApp · SMS',
    accent: '#20AFFF',
    glow: 'rgba(32,175,255,0.35)',
    gradFrom: '#80D0FF',
    gradMid: '#20AFFF',
    gradTo: '#0055BB',
    hoverBorder: 'rgba(32,175,255,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/os/calls',
    label: 'Calls',
    sub: 'Today · Scheduled · Logged',
    accent: '#28C76F',
    glow: 'rgba(40,199,111,0.35)',
    gradFrom: '#70F0A8',
    gradMid: '#28C76F',
    gradTo: '#0D7A42',
    hoverBorder: 'rgba(40,199,111,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 011 1.18a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8a16 16 0 006.91 6.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    href: '/os/companies',
    label: 'Companies',
    sub: 'FineGuard · BBJ · Accuracy',
    accent: '#7A5AF8',
    glow: 'rgba(122,90,248,0.35)',
    gradFrom: '#B090FF',
    gradMid: '#7A5AF8',
    gradTo: '#4020C0',
    hoverBorder: 'rgba(122,90,248,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/os/alerts',
    label: 'Alerts',
    sub: 'Red · Amber · Compliance',
    accent: '#FF8A34',
    glow: 'rgba(255,138,52,0.35)',
    gradFrom: '#FFBF80',
    gradMid: '#FF8A34',
    gradTo: '#BB4400',
    hoverBorder: 'rgba(255,138,52,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    href: '/os/tasks',
    label: 'Tasks',
    sub: 'Today · This Week · Assigned',
    accent: '#3D8BFF',
    glow: 'rgba(61,139,255,0.35)',
    gradFrom: '#88BBFF',
    gradMid: '#3D8BFF',
    gradTo: '#0044BB',
    hoverBorder: 'rgba(61,139,255,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/os/documents',
    label: 'Documents',
    sub: 'Contracts · Invoices · Policies',
    accent: '#818CF8',
    glow: 'rgba(129,140,248,0.35)',
    gradFrom: '#C0C8FF',
    gradMid: '#818CF8',
    gradTo: '#4040C0',
    hoverBorder: 'rgba(129,140,248,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/os/contacts',
    label: 'Contacts',
    sub: 'Customers · Prospects · Staff',
    accent: '#A855F7',
    glow: 'rgba(168,85,247,0.35)',
    gradFrom: '#D090FF',
    gradMid: '#A855F7',
    gradTo: '#6B10B8',
    hoverBorder: 'rgba(168,85,247,0.25)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

export default function OsHomePage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden pb-20 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: '-15%', left: '-5%',
          width: '55vw', height: '55vw',
          background: 'radial-gradient(circle, rgba(122,90,248,0.11) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          bottom: '-15%', right: '-5%',
          width: '55vw', height: '55vw',
          background: 'radial-gradient(circle, rgba(32,175,255,0.09) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Greeting */}
      <div className="relative z-10 px-5 sm:px-8 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Good morning.
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Select a workspace to get started
        </p>
      </div>

      {/* Module grid */}
      <main className="relative z-10 px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MODULES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group relative rounded-2xl overflow-hidden h-[160px] sm:h-[196px] transition-transform duration-200 hover:scale-[1.025]"
              style={{
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.085)',
              }}
            >
              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 40% 0%, ${mod.glow} 0%, transparent 70%)`,
                }}
              />
              {/* Hover border highlight */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ border: `1px solid ${mod.hoverBorder}` }}
              />

              {/* Content */}
              <div className="relative z-10 p-4 sm:p-5 h-full flex flex-col justify-between">

                {/* 3D icon */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0"
                  style={{
                    background: `radial-gradient(circle at 35% 28%, ${mod.gradFrom} 0%, ${mod.gradMid} 45%, ${mod.gradTo} 100%)`,
                    boxShadow: `0 12px 36px -6px ${mod.glow}, 0 4px 12px -2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.35)`,
                  }}>
                  {/* Gloss sheen */}
                  <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{
                      height: '50%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)',
                      borderRadius: 'inherit',
                    }}
                  />
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {mod.icon}
                  </div>
                </div>

                {/* Label */}
                <div>
                  <div className="font-semibold text-sm sm:text-[15px] leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {mod.label}
                  </div>
                  <div className="text-[11px] mt-1 leading-relaxed hidden sm:block" style={{ color: 'rgba(255,255,255,0.32)' }}>
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
