'use client'

import Link from 'next/link'

/* ─────────────────────────────────────────────────────────────────────────────
   Premium 3D-style icons
   Each icon uses:
     • A filled base shape (gives the object physical mass)
     • A semi-transparent highlight layer (simulates a top-left light source)
     • The key symbol rendered in solid white
   The gradient container + gloss overlay in the card do the rest of the work.
───────────────────────────────────────────────────────────────────────────── */

function CoinIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Coin depth – offset shadow disc */}
      <ellipse cx="14" cy="16" rx="9" ry="2.5" fill="rgba(0,0,0,0.22)" />
      {/* Coin body */}
      <circle cx="14" cy="13.5" r="9" fill="rgba(255,255,255,0.22)" />
      <circle cx="14" cy="13.5" r="9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.1" />
      {/* Inner groove ring */}
      <circle cx="14" cy="13.5" r="6.8" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
      {/* Top highlight arc – simulates a curved surface */}
      <path d="M7.5 10a9 9 0 0 1 13 0" stroke="rgba(255,255,255,0.38)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* £ symbol */}
      <text x="14" y="18" textAnchor="middle" fill="white" fillOpacity={0.93}
        fontSize="10.5" fontWeight="700" fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif">
        £
      </text>
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Envelope body */}
      <rect x="3" y="7" width="22" height="15" rx="2.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" />
      {/* Back flap (visible above fold) */}
      <path d="M3 9.5l11 7.5 11-7.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Left fold crease */}
      <path d="M3 22l7.5-6" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9" strokeLinecap="round" />
      {/* Right fold crease */}
      <path d="M25 22l-7.5-6" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9" strokeLinecap="round" />
      {/* Top-left gloss reflection */}
      <path d="M5 8.5h8" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Phone body – solid filled handset shape */}
      <path
        d="M8 4.5C6.3 4.5 5 5.8 5 7.5c0 8.8 7.2 16 16 16 1.7 0 3-1.3 3-3v-2.8l-4-1.7-1.1 2.1c-3.2-1.6-5.5-3.9-7.1-7.1l2.1-1.1L12.3 6 8 4.5z"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Earpiece – small fill circle top */}
      <circle cx="13.5" cy="7" r="1.3" fill="rgba(255,255,255,0.75)" />
      {/* Mouthpiece – small fill circle bottom */}
      <circle cx="21" cy="20.5" r="1.3" fill="rgba(255,255,255,0.75)" />
      {/* Surface highlight */}
      <path d="M7 7.5C7 6.4 7.9 5.5 9 5.5l1.5.5" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Building body */}
      <rect x="5" y="5" width="18" height="19" rx="1.5" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.1" />
      {/* Glass reflection panel – diagonal highlight */}
      <path d="M6 5.5h5l-3 8H6V5.5z" fill="rgba(255,255,255,0.1)" />
      {/* Windows – row 1 */}
      <rect x="8" y="9"  width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.72)" />
      <rect x="13.5" y="9"  width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.72)" />
      {/* Windows – row 2 */}
      <rect x="8" y="14.5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.72)" />
      <rect x="13.5" y="14.5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.72)" />
      {/* Door */}
      <rect x="11" y="19.5" width="4" height="4.5" rx="0.5" fill="rgba(255,255,255,0.45)" />
      {/* Roof line accent */}
      <line x1="5" y1="7.5" x2="23" y2="7.5" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Bell body – large dome */}
      <path
        d="M14 4.5A7 7 0 0 0 7 11.5c0 5-2.5 7-2.5 7h19S21 16.5 21 11.5A7 7 0 0 0 14 4.5z"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Bell mount at top */}
      <path d="M11.5 4.5a2.5 2.5 0 0 1 5 0" stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* Clapper */}
      <path d="M11.5 18.5a2.5 2.5 0 0 0 5 0" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Surface highlight arc */}
      <path d="M8.5 10a6.5 6.5 0 0 1 4-4.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Notification dot */}
      <circle cx="20.5" cy="6.5" r="3" fill="#FF3B30" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Board body */}
      <rect x="5" y="7" width="18" height="18" rx="2" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.1" />
      {/* Clip – metallic bar at top */}
      <rect x="9.5" y="4.5" width="9" height="4.5" rx="1.5" fill="rgba(255,255,255,0.72)" />
      <rect x="11.5" y="3.5" width="5" height="2.5" rx="1" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      {/* Check item 1 */}
      <rect x="8.5" y="13" width="2" height="2" rx="0.4" fill="rgba(255,255,255,0.6)" />
      <line x1="11.5" y1="14" x2="18" y2="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinecap="round" />
      {/* Check item 2 – with check mark */}
      <rect x="8.5" y="17" width="2" height="2" rx="0.4" fill="rgba(255,255,255,0.85)" />
      <path d="M9 18l.8.8 1.2-1.2" stroke="rgba(255,255,255,0)" strokeWidth="0" />
      <line x1="11.5" y1="18" x2="18" y2="18" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinecap="round" />
      {/* Check item 3 */}
      <rect x="8.5" y="21" width="2" height="2" rx="0.4" fill="rgba(255,255,255,0.4)" />
      <line x1="11.5" y1="22" x2="16" y2="22" stroke="rgba(255,255,255,0.35)" strokeWidth="1.1" strokeLinecap="round" />
      {/* Gloss */}
      <path d="M6.5 8h6" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" strokeLinecap="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Paper stack behind folder (peek) */}
      <rect x="8" y="12" width="15" height="12" rx="1.5" fill="rgba(255,255,255,0.15)" />
      {/* Folder body */}
      <path d="M4 10.5C4 9.4 4.9 8.5 6 8.5h6l2 2h8c1.1 0 2 .9 2 2V20c0 1.1-.9 2-2 2H6a2 2 0 01-2-2v-9.5z"
        fill="rgba(255,255,255,0.22)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Tab highlight */}
      <path d="M4 10.5C4 9.4 4.9 8.5 6 8.5h5.5l1.5 1.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Document lines inside */}
      <line x1="8" y1="16" x2="18" y2="16" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="19" x2="15" y2="19" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeLinecap="round" />
      {/* Surface gloss */}
      <path d="M5 10.5h9" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" strokeLinecap="round" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
      {/* Back person (right, slightly behind) */}
      <circle cx="17.5" cy="9.5" r="4" fill="rgba(255,255,255,0.35)" />
      <path d="M10.5 24c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Front person (left, in front) */}
      <circle cx="11" cy="10" r="4.5" fill="rgba(255,255,255,0.82)" />
      <path d="M3 24c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7.5" fill="rgba(255,255,255,0.72)" />
      {/* Face highlight */}
      <circle cx="11" cy="10" r="4.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Module definitions
───────────────────────────────────────────────────────────────────────────── */

const MODULES = [
  {
    href: '/os/money',
    label: 'Money',
    sub: 'Revenue · Invoices · Payments',
    accent: '#FFC145',
    glow: 'rgba(255,193,69,0.38)',
    gradFrom: '#FFE080',
    gradMid: '#FFC145',
    gradTo: '#CC7700',
    hoverBorder: 'rgba(255,193,69,0.3)',
    Icon: CoinIcon,
  },
  {
    href: '/os/messages',
    label: 'Messages',
    sub: 'Email · WhatsApp · SMS',
    accent: '#20AFFF',
    glow: 'rgba(32,175,255,0.38)',
    gradFrom: '#90D8FF',
    gradMid: '#20AFFF',
    gradTo: '#0055CC',
    hoverBorder: 'rgba(32,175,255,0.3)',
    Icon: EnvelopeIcon,
  },
  {
    href: '/os/calls',
    label: 'Calls',
    sub: 'Today · Scheduled · Logged',
    accent: '#28C76F',
    glow: 'rgba(40,199,111,0.38)',
    gradFrom: '#78F0B0',
    gradMid: '#28C76F',
    gradTo: '#0D7A40',
    hoverBorder: 'rgba(40,199,111,0.3)',
    Icon: PhoneIcon,
  },
  {
    href: '/os/companies',
    label: 'Companies',
    sub: 'FineGuard · BBJ · Accuracy',
    accent: '#7A5AF8',
    glow: 'rgba(122,90,248,0.38)',
    gradFrom: '#B898FF',
    gradMid: '#7A5AF8',
    gradTo: '#4020C0',
    hoverBorder: 'rgba(122,90,248,0.3)',
    Icon: BuildingIcon,
  },
  {
    href: '/os/alerts',
    label: 'Alerts',
    sub: 'Red · Amber · Compliance',
    accent: '#FF8A34',
    glow: 'rgba(255,138,52,0.38)',
    gradFrom: '#FFC080',
    gradMid: '#FF8A34',
    gradTo: '#BB4400',
    hoverBorder: 'rgba(255,138,52,0.3)',
    Icon: BellIcon,
  },
  {
    href: '/os/tasks',
    label: 'Tasks',
    sub: 'Today · This Week · Assigned',
    accent: '#3D8BFF',
    glow: 'rgba(61,139,255,0.38)',
    gradFrom: '#90BBFF',
    gradMid: '#3D8BFF',
    gradTo: '#0044BB',
    hoverBorder: 'rgba(61,139,255,0.3)',
    Icon: ClipboardIcon,
  },
  {
    href: '/os/documents',
    label: 'Documents',
    sub: 'Contracts · Invoices · Policies',
    accent: '#818CF8',
    glow: 'rgba(129,140,248,0.38)',
    gradFrom: '#C8CCFF',
    gradMid: '#818CF8',
    gradTo: '#4040C8',
    hoverBorder: 'rgba(129,140,248,0.3)',
    Icon: FolderIcon,
  },
  {
    href: '/os/contacts',
    label: 'Contacts',
    sub: 'Customers · Prospects · Staff',
    accent: '#A855F7',
    glow: 'rgba(168,85,247,0.38)',
    gradFrom: '#D898FF',
    gradMid: '#A855F7',
    gradTo: '#6B10B8',
    hoverBorder: 'rgba(168,85,247,0.3)',
    Icon: PeopleIcon,
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function OsHomePage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden pb-20 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed" style={{ top: '-15%', left: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(122,90,248,0.11) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="pointer-events-none fixed" style={{ bottom: '-15%', right: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(32,175,255,0.09) 0%, transparent 70%)', borderRadius: '50%' }} />

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
              className="group relative rounded-2xl overflow-hidden h-[164px] sm:h-[200px] transition-transform duration-200 hover:scale-[1.025]"
              style={{
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.085)',
              }}
            >
              {/* Hover top-glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 40% 0%, ${mod.glow} 0%, transparent 68%)` }}
              />
              {/* Hover border */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ border: `1px solid ${mod.hoverBorder}` }}
              />

              <div className="relative z-10 p-4 sm:p-5 h-full flex flex-col justify-between">

                {/* Icon container – gradient sphere + gloss + icon */}
                <div className="relative w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-2xl overflow-hidden shrink-0"
                  style={{
                    background: `radial-gradient(circle at 32% 24%, ${mod.gradFrom} 0%, ${mod.gradMid} 48%, ${mod.gradTo} 100%)`,
                    boxShadow: `0 14px 40px -8px ${mod.glow}, 0 4px 14px -3px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.38)`,
                  }}>
                  {/* Gloss sheen — top half white fade */}
                  <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{
                      height: '52%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                    }}
                  />
                  {/* Left-edge specular */}
                  <div
                    className="absolute inset-y-0 left-0 pointer-events-none"
                    style={{
                      width: '30%',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                    }}
                  />
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <mod.Icon />
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
