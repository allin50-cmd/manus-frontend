'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// ── Shared gradient defs (og- = "os gradient") ────────────────
function GradDefs() {
  return (
    <svg style={{ display: 'none' }} aria-hidden>
      <defs>
        <radialGradient id="og-money" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#FFF5A0"/><stop offset="40%" stopColor="#FFC107"/><stop offset="100%" stopColor="#7C4000"/>
        </radialGradient>
        <linearGradient id="og-msg" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#80E0FF"/><stop offset="50%" stopColor="#20AFFF"/><stop offset="100%" stopColor="#0040A0"/>
        </linearGradient>
        <linearGradient id="og-call" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#90F5C0"/><stop offset="50%" stopColor="#28C76F"/><stop offset="100%" stopColor="#065E30"/>
        </linearGradient>
        <radialGradient id="og-cont" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#E0A8FF"/><stop offset="50%" stopColor="#A855F7"/><stop offset="100%" stopColor="#5500A0"/>
        </radialGradient>
        <linearGradient id="og-alert" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#FFE080"/><stop offset="45%" stopColor="#FF8A34"/><stop offset="100%" stopColor="#8C2800"/>
        </linearGradient>
        <linearGradient id="og-task" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#90C8FF"/><stop offset="50%" stopColor="#3D8BFF"/><stop offset="100%" stopColor="#003080"/>
        </linearGradient>
        <linearGradient id="og-comp" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#C8A8FF"/><stop offset="50%" stopColor="#7A5AF8"/><stop offset="100%" stopColor="#2E0090"/>
        </linearGradient>
        <linearGradient id="og-doc" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#B0B8FF"/><stop offset="50%" stopColor="#6366F1"/><stop offset="100%" stopColor="#2C2C9C"/>
        </linearGradient>
        <linearGradient id="og-fg" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#80F5C8"/><stop offset="50%" stopColor="#00C880"/><stop offset="100%" stopColor="#005C38"/>
        </linearGradient>
        <linearGradient id="og-bbj" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#FFE080"/><stop offset="50%" stopColor="#F97316"/><stop offset="100%" stopColor="#7C2800"/>
        </linearGradient>
        <radialGradient id="og-acc" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#D4A8FF"/><stop offset="50%" stopColor="#8B5CF6"/><stop offset="100%" stopColor="#4C1D95"/>
        </radialGradient>
        <radialGradient id="og-spec" cx="25%" cy="20%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
    </svg>
  )
}

// ── 3D neon icon box ──────────────────────────────────────────
function IconBox({ bg, shadow, children }: { bg: string; shadow: string; children: React.ReactNode }) {
  return (
    <div
      className="relative w-[60px] h-[60px] rounded-[18px] flex items-center justify-center shrink-0 overflow-hidden"
      style={{ background: bg, boxShadow: shadow }}
    >
      <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: '48%', background: 'linear-gradient(180deg,rgba(255,255,255,0.14) 0%,transparent 100%)', borderRadius: '18px 18px 0 0' }} />
      <div className="relative z-20">{children}</div>
    </div>
  )
}

// ── Module icons ──────────────────────────────────────────────
const ICONS = {
  money: (
    <IconBox bg="#0E0800" shadow="0 0 0 1px rgba(255,180,0,0.2),0 0 20px rgba(255,160,0,0.5),0 6px 20px rgba(255,140,0,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" fill="url(#og-money)"/>
        <circle cx="18" cy="18" r="12.5" fill="none" stroke="rgba(255,240,100,0.25)" strokeWidth="0.75"/>
        <text x="18.5" y="23" textAnchor="middle" fontSize="16" fontWeight="900" fill="rgba(50,20,0,0.75)" fontFamily="system-ui,sans-serif">£</text>
        <ellipse cx="12.5" cy="12" rx="3.5" ry="2" fill="url(#og-spec)" transform="rotate(-15,12.5,12)"/>
      </svg>
    </IconBox>
  ),
  messages: (
    <IconBox bg="#020E1A" shadow="0 0 0 1px rgba(32,175,255,0.2),0 0 20px rgba(32,175,255,0.5),0 6px 20px rgba(32,175,255,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <rect x="5" y="10" width="26" height="17" rx="3" fill="url(#og-msg)"/>
        <path d="M5 13 L18 21 L31 13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="5" y="10" width="26" height="5" rx="3" fill="rgba(255,255,255,0.12)"/>
        <ellipse cx="10" cy="14" rx="3.5" ry="2" fill="url(#og-spec)" transform="rotate(-15,10,14)" opacity="0.7"/>
      </svg>
    </IconBox>
  ),
  calls: (
    <IconBox bg="#02140A" shadow="0 0 0 1px rgba(40,199,111,0.2),0 0 20px rgba(40,199,111,0.5),0 6px 20px rgba(40,199,111,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <path d="M10 9C10 9 11.5 6.5 14 6.5C15 6.5 16 7 16.5 8L18 11.5C18.5 12.5 18 13.8 17 14.3L15.5 15.2C16.5 17.2 20 21 23 22.5L24 21.5C24.5 20.5 25.8 20 26.8 20.5L30 22C31 22.5 31.5 23.5 31.5 24.5C31.5 27 28.5 30 28.5 30C24.5 32 6.5 19 10 9Z" fill="url(#og-call)"/>
        <ellipse cx="13" cy="10" rx="2.5" ry="1.5" fill="url(#og-spec)" transform="rotate(-30,13,10)" opacity="0.75"/>
      </svg>
    </IconBox>
  ),
  contacts: (
    <IconBox bg="#0C0218" shadow="0 0 0 1px rgba(168,85,247,0.2),0 0 20px rgba(168,85,247,0.5),0 6px 20px rgba(168,85,247,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <circle cx="23" cy="13" r="4.5" fill="url(#og-cont)" opacity="0.65"/>
        <path d="M14 30C14 25.5 18 22.5 23 22.5C28 22.5 32 25.5 32 30" stroke="url(#og-cont)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.65"/>
        <circle cx="14" cy="14" r="5.5" fill="url(#og-cont)"/>
        <path d="M4 30C4 25 8.5 21.5 14 21.5C19.5 21.5 24 25 24 30" fill="url(#og-cont)"/>
        <ellipse cx="11" cy="11" rx="2.5" ry="1.5" fill="url(#og-spec)" transform="rotate(-20,11,11)" opacity="0.6"/>
      </svg>
    </IconBox>
  ),
  alerts: (
    <IconBox bg="#150800" shadow="0 0 0 1px rgba(255,138,52,0.2),0 0 20px rgba(255,138,52,0.5),0 6px 20px rgba(255,138,52,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <path d="M18 4.5V6C13.5 6.8 10 10.8 10 16V23L7 26H29L26 23V16C26 10.8 22.5 6.8 18 6" fill="url(#og-alert)"/>
        <path d="M15.5 26C15.5 27.9 16.6 29 18 29C19.4 29 20.5 27.9 20.5 26" fill="url(#og-alert)"/>
        <rect x="8" y="22" width="20" height="4" fill="rgba(0,0,0,0.15)"/>
        <ellipse cx="13" cy="11" rx="3" ry="1.8" fill="url(#og-spec)" transform="rotate(-20,13,11)" opacity="0.5"/>
      </svg>
    </IconBox>
  ),
  tasks: (
    <IconBox bg="#020A1A" shadow="0 0 0 1px rgba(61,139,255,0.2),0 0 20px rgba(61,139,255,0.5),0 6px 20px rgba(61,139,255,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <rect x="8" y="9" width="20" height="23" rx="3" fill="url(#og-task)"/>
        <rect x="13.5" y="6" width="9" height="5.5" rx="2" fill="#0A1A3A"/>
        <rect x="13.5" y="6" width="9" height="3" rx="2" fill="rgba(255,255,255,0.08)"/>
        <path d="M12 20 L16.5 24.5 L25 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="9" width="20" height="5" rx="3" fill="rgba(255,255,255,0.1)"/>
      </svg>
    </IconBox>
  ),
  companies: (
    <IconBox bg="#0A0220" shadow="0 0 0 1px rgba(122,90,248,0.2),0 0 20px rgba(122,90,248,0.5),0 6px 20px rgba(122,90,248,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <rect x="11" y="8" width="14" height="24" rx="2" fill="url(#og-comp)"/>
        <rect x="5" y="16" width="9" height="16" rx="2" fill="url(#og-comp)" opacity="0.65"/>
        <rect x="14" y="12" width="3.5" height="3" rx="0.8" fill="rgba(255,255,255,0.45)"/>
        <rect x="19.5" y="12" width="3.5" height="3" rx="0.8" fill="rgba(255,255,255,0.45)"/>
        <rect x="14" y="18" width="3.5" height="3" rx="0.8" fill="rgba(255,255,255,0.35)"/>
        <rect x="19.5" y="18" width="3.5" height="3" rx="0.8" fill="rgba(255,255,255,0.35)"/>
        <rect x="16" y="27" width="4" height="5" rx="0.5" fill="rgba(0,0,0,0.3)"/>
      </svg>
    </IconBox>
  ),
  documents: (
    <IconBox bg="#060820" shadow="0 0 0 1px rgba(99,102,241,0.2),0 0 20px rgba(99,102,241,0.5),0 6px 20px rgba(99,102,241,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <path d="M6 15H30V29C30 30.1 29.1 31 28 31H8C6.9 31 6 30.1 6 29V15Z" fill="url(#og-doc)"/>
        <path d="M6 15C6 13.9 6.9 13 8 13H16.5L18.5 11H28C29.1 11 30 11.9 30 13V15H6Z" fill="url(#og-doc)" opacity="0.75"/>
        <rect x="11" y="19" width="14" height="2" rx="1" fill="rgba(255,255,255,0.55)"/>
        <rect x="11" y="23" width="10" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      </svg>
    </IconBox>
  ),
  bbj: (
    <IconBox bg="#180800" shadow="0 0 0 1px rgba(249,115,22,0.2),0 0 20px rgba(249,115,22,0.5),0 6px 20px rgba(249,115,22,0.2),inset 0 1px 0 rgba(255,255,255,0.07)">
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
        <rect x="16.5" y="5" width="3" height="17" rx="1.2" fill="url(#og-bbj)"/>
        <rect x="5" y="5.5" width="26" height="4" rx="2" fill="url(#og-bbj)"/>
        <line x1="28" y1="9.5" x2="28" y2="18" stroke="rgba(255,220,80,0.8)" strokeWidth="1.5"/>
        <path d="M25.5 18C25.5 18 25.5 20.5 27.5 21.5" stroke="rgba(255,220,80,0.9)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <rect x="6" y="27" width="24" height="4" rx="2" fill="url(#og-bbj)" opacity="0.6"/>
      </svg>
    </IconBox>
  ),
}

// ── Persona module sets ────────────────────────────────────────
const PERSONAS = {
  george: {
    name: 'George',
    avatarGrad: 'linear-gradient(135deg,#FFC145,#FF8A34)',
    focus: { text: '3 things need your attention', href: '/os/alerts', time: '14:00', meeting: 'Sales Review' },
    modules: [
      { href: '/os/money',     label: 'Money',     desc: 'Financial summary',     badge: null, icon: ICONS.money },
      { href: '/os/messages',  label: 'Messages',  desc: '8 unread messages',     badge: '8',  icon: ICONS.messages },
      { href: '/os/calls',     label: 'Calls',     desc: '4 calls today',         badge: '4',  icon: ICONS.calls },
      { href: '/os/contacts',  label: 'Contacts',  desc: 'Manage your contacts',  badge: null, icon: ICONS.contacts },
      { href: '/os/alerts',    label: 'Alerts',    desc: '3 need your attention', badge: '3',  icon: ICONS.alerts },
      { href: '/os/tasks',     label: 'Tasks',     desc: '4 tasks due today',     badge: '4',  icon: ICONS.tasks },
      { href: '/os/companies', label: 'Companies', desc: 'Your companies',        badge: null, icon: ICONS.companies },
      { href: '/os/documents', label: 'Documents', desc: 'Your documents',        badge: null, icon: ICONS.documents },
    ],
  },
  dagon: {
    name: 'Dagon',
    avatarGrad: 'linear-gradient(135deg,#20AFFF,#7A5AF8)',
    focus: { text: 'Hawk Construction call — 11:30', href: '/os/calls', time: '11:30', meeting: null },
    modules: [
      { href: '/os/calls',                       label: 'Calls',     desc: '6 calls today',     badge: '6', icon: ICONS.calls },
      { href: '/os/companies/builder-big-jobs',   label: 'BBJ Leads', desc: '2 leads to follow up', badge: '2', icon: ICONS.bbj },
      { href: '/os/tasks',                       label: 'My Tasks',  desc: '2 tasks assigned',  badge: '2', icon: ICONS.tasks },
      { href: '/os/messages',                    label: 'Messages',  desc: '3 unread',          badge: '3', icon: ICONS.messages },
    ],
  },
  alissa: {
    name: 'Alissa',
    avatarGrad: 'linear-gradient(135deg,#28C76F,#00A86B)',
    focus: { text: 'Accuracy Ltd SOW — send today', href: '/os/alerts', time: 'EOD', meeting: null },
    modules: [
      { href: '/os/tasks',                    label: 'My Tasks',    desc: '1 task captured',  badge: '1', icon: ICONS.tasks },
      { href: '/os/companies/accuracy',       label: 'Accuracy Ltd', desc: 'Proposal pending', badge: null, icon: ICONS.documents },
      { href: '/os/messages',                 label: 'Messages',    desc: 'Inbox',            badge: null, icon: ICONS.messages },
      { href: '/os/documents',                label: 'Documents',   desc: 'SOW drafts',       badge: null, icon: ICONS.documents },
    ],
  },
}

type PersonaKey = keyof typeof PERSONAS

export default function OsHomePage() {
  const [persona, setPersona] = useState<PersonaKey>('george')
  const [greeting, setGreeting] = useState('Good morning.')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.')
  }, [])

  const p = PERSONAS[persona]

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-24 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <GradDefs />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed" style={{ top: '-15%', left: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(122,90,248,0.11) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="pointer-events-none fixed" style={{ bottom: '-15%', right: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(32,175,255,0.09) 0%, transparent 70%)', borderRadius: '50%' }} />

      {/* Greeting */}
      <div className="relative z-10 px-5 sm:px-8 pt-8 pb-3">
        <p className="text-xs sm:text-sm mb-1" style={{ color: 'rgba(255,255,255,0.32)' }}>{greeting}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
          {p.name} <span style={{ fontSize: '0.85em' }}>👋</span>
        </h1>
      </div>

      {/* Persona chips */}
      <div className="relative z-10 flex gap-2 px-5 sm:px-8 pb-5 overflow-x-auto scrollbar-none">
        {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => {
          const pp = PERSONAS[key]
          return (
            <button
              key={key}
              onClick={() => setPersona(key)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all shrink-0"
              style={{
                background: persona === key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                borderColor: persona === key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                color: persona === key ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: pp.avatarGrad }}>
                {pp.name[0]}
              </span>
              {pp.name}
            </button>
          )
        })}
      </div>

      {/* Module grid */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {p.modules.map((mod) => (
            <Link
              key={mod.href + mod.label}
              href={mod.href}
              className="group relative rounded-[18px] overflow-hidden transition-transform duration-150 active:scale-[0.97] hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', minHeight: '150px' }}
            >
              <div className="relative z-10 p-[14px] flex flex-col h-full" style={{ minHeight: '150px' }}>
                <div className="flex items-start justify-between mb-auto">
                  {mod.icon}
                  {mod.badge && (
                    <span className="text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center" style={{ background: '#FF3B30', color: 'white', boxShadow: '0 2px 8px rgba(255,59,48,0.5)' }}>
                      {mod.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between mt-3 gap-1.5">
                  <div className="min-w-0">
                    <div className="font-semibold text-[13px] leading-tight truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>{mod.label}</div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.32)' }}>{mod.desc}</div>
                  </div>
                  <span className="shrink-0 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Focus bar */}
      <Link
        href={p.focus.href}
        className="relative z-10 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 block"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ fontSize: '18px', lineHeight: 1 }}>⭐</span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Today&apos;s Focus</div>
            <div className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.focus.text}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {p.focus.meeting && (
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Next Meeting</div>
              <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.focus.meeting}</div>
            </div>
          )}
          <span className="text-[12px] font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(61,139,255,0.2)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.3)' }}>
            {p.focus.time}
          </span>
        </div>
      </Link>

    </div>
  )
}
