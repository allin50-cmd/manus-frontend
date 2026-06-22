'use client'

import Link from 'next/link'
import {
  IconMoney, IconMessages, IconCalls, IconContacts,
  IconAlerts, IconTasks, IconCompanies, IconDocuments,
} from '@/components/OsIcons'

type ModuleIconComponent = React.ComponentType<{ size?: number; className?: string }>

const MODULES: {
  href: string
  label: string
  desc: string
  Icon: ModuleIconComponent
  badge: string | null
  glow: string
  gradFrom: string
  gradMid: string
  gradTo: string
  hoverBorder: string
}[] = [
  {
    href: '/os/money',
    label: 'Money',
    desc: '£42,140 total',
    Icon: IconMoney,
    badge: null,
    glow: 'rgba(255,193,69,0.45)',
    gradFrom: '#FFF0A0',
    gradMid: '#FFD000',
    gradTo: '#A85C00',
    hoverBorder: 'rgba(255,193,69,0.35)',
  },
  {
    href: '/os/messages',
    label: 'Messages',
    desc: '8 unread',
    Icon: IconMessages,
    badge: '8',
    glow: 'rgba(32,175,255,0.45)',
    gradFrom: '#A8E8FF',
    gradMid: '#20AFFF',
    gradTo: '#003A8C',
    hoverBorder: 'rgba(32,175,255,0.35)',
  },
  {
    href: '/os/calls',
    label: 'Calls',
    desc: '4 today',
    Icon: IconCalls,
    badge: '4',
    glow: 'rgba(40,199,111,0.45)',
    gradFrom: '#90F5C0',
    gradMid: '#28C76F',
    gradTo: '#065E30',
    hoverBorder: 'rgba(40,199,111,0.35)',
  },
  {
    href: '/os/contacts',
    label: 'Contacts',
    desc: '124 contacts',
    Icon: IconContacts,
    badge: null,
    glow: 'rgba(168,85,247,0.45)',
    gradFrom: '#E0A8FF',
    gradMid: '#A855F7',
    gradTo: '#550090',
    hoverBorder: 'rgba(168,85,247,0.35)',
  },
  {
    href: '/os/alerts',
    label: 'Alerts',
    desc: '3 red alerts',
    Icon: IconAlerts,
    badge: '3',
    glow: 'rgba(255,138,52,0.45)',
    gradFrom: '#FFD090',
    gradMid: '#FF8A34',
    gradTo: '#8C2800',
    hoverBorder: 'rgba(255,138,52,0.35)',
  },
  {
    href: '/os/tasks',
    label: 'Tasks',
    desc: '14 due',
    Icon: IconTasks,
    badge: '14',
    glow: 'rgba(61,139,255,0.45)',
    gradFrom: '#A0C8FF',
    gradMid: '#3D8BFF',
    gradTo: '#002880',
    hoverBorder: 'rgba(61,139,255,0.35)',
  },
  {
    href: '/os/companies',
    label: 'Companies',
    desc: '4 active',
    Icon: IconCompanies,
    badge: null,
    glow: 'rgba(122,90,248,0.45)',
    gradFrom: '#C8A8FF',
    gradMid: '#7A5AF8',
    gradTo: '#2E0EA0',
    hoverBorder: 'rgba(122,90,248,0.35)',
  },
  {
    href: '/os/documents',
    label: 'Documents',
    desc: '23 files',
    Icon: IconDocuments,
    badge: null,
    glow: 'rgba(129,140,248,0.45)',
    gradFrom: '#D0D4FF',
    gradMid: '#818CF8',
    gradTo: '#2C2CA8',
    hoverBorder: 'rgba(129,140,248,0.35)',
  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}

export default function OsHomePage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(122,90,248,0.11) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(32,175,255,0.09) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Top action bar (mobile) */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5 lg:pt-6">
        <div /> {/* spacer */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          {/* Notifications */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {/* Red dot */}
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: '#FF3B30', boxShadow: '0 0 6px rgba(255,59,48,0.7)' }}
            />
          </button>
          {/* User avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7A5AF8, #A855F7)', boxShadow: '0 2px 10px rgba(122,90,248,0.45)' }}
          >
            G
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="relative z-10 px-5 sm:px-8 pt-5 pb-5">
        <p className="text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{getGreeting()}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.95)' }}>
          George
          <span style={{ fontSize: '0.82em' }}>👋</span>
        </h1>
      </div>

      {/* Module grid */}
      <main className="relative z-10 px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MODULES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group relative rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.025]"
              style={{
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.09)',
                minHeight: '160px',
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 40% 0%, ${mod.glow} 0%, transparent 68%)` }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ border: `1px solid ${mod.hoverBorder}` }}
              />

              <div className="relative z-10 p-4 sm:p-5 flex flex-col h-full" style={{ minHeight: '160px' }}>
                {/* Top row: icon + badge */}
                <div className="flex items-start justify-between mb-3">
                  {/* 3D icon container */}
                  <div
                    className="relative w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-[18px] sm:rounded-[20px] flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 30% 20%, ${mod.gradFrom} 0%, ${mod.gradMid} 50%, ${mod.gradTo} 100%)`,
                      boxShadow: `0 12px 36px -6px ${mod.glow}, 0 4px 14px -2px rgba(0,0,0,0.55), inset 0 1.5px 0 rgba(255,255,255,0.45), inset -1px 0 0 rgba(255,255,255,0.08)`,
                    }}
                  >
                    {/* Gloss highlight */}
                    <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: '55%', background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)', borderRadius: '18px 18px 0 0' }} />
                    {/* Left specular */}
                    <div className="absolute inset-y-0 left-0 pointer-events-none z-10" style={{ width: '28%', background: 'linear-gradient(90deg, rgba(255,255,255,0.14) 0%, transparent 100%)' }} />
                    {/* SVG Icon */}
                    <mod.Icon
                      size={28}
                      className="relative z-20"
                    />
                  </div>

                  {/* Notification badge */}
                  {mod.badge && (
                    <span
                      className="text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center"
                      style={{ background: '#FF3B30', color: 'white', boxShadow: '0 2px 8px rgba(255,59,48,0.5)' }}
                    >
                      {mod.badge}
                    </span>
                  )}
                </div>

                {/* Bottom: label + desc + arrow */}
                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[13px] sm:text-[14px] leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      {mod.label}
                    </div>
                    <div className="text-[10px] sm:text-[11px] mt-0.5 leading-relaxed truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {mod.desc}
                    </div>
                  </div>
                  <span className="shrink-0 opacity-25 group-hover:opacity-65 transition-opacity" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Today's Focus bar */}
      <div
        className="relative z-10 mx-4 sm:mx-6 mt-4 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,193,69,0.12)', border: '1px solid rgba(255,193,69,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC145" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>TODAY&apos;S FOCUS</div>
            <div className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>3 things need your attention</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>NEXT MEETING</div>
            <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>Sales Review</div>
          </div>
          <span
            className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(61,139,255,0.15)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.25)' }}
          >
            14:00
          </span>
        </div>
      </div>

    </div>
  )
}
