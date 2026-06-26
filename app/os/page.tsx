'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ACTIONS = [
  {
    id: 'talk',
    emoji: '🎤',
    label: 'Talk',
    sub: 'AI Receptionist',
    href: '/os/talk',
    bg: 'rgba(122,90,248,0.15)',
    border: 'rgba(122,90,248,0.3)',
    glow: 'rgba(122,90,248,0.45)',
  },
  {
    id: 'book',
    emoji: '📅',
    label: 'Book',
    sub: 'Smart Diary',
    href: '/os/book',
    bg: 'rgba(61,139,255,0.15)',
    border: 'rgba(61,139,255,0.3)',
    glow: 'rgba(61,139,255,0.45)',
  },
  {
    id: 'quote',
    emoji: '💷',
    label: 'Quote',
    sub: 'Quick Estimate',
    href: '/os/quote',
    bg: 'rgba(255,193,69,0.12)',
    border: 'rgba(255,193,69,0.25)',
    glow: 'rgba(255,193,69,0.45)',
  },
  {
    id: 'inbox',
    emoji: '📥',
    label: 'Inbox',
    sub: 'All Messages',
    href: '/os/inbox',
    bg: 'rgba(40,199,111,0.12)',
    border: 'rgba(40,199,111,0.25)',
    glow: 'rgba(40,199,111,0.45)',
  },
  {
    id: 'go',
    emoji: '📍',
    label: 'Go',
    sub: 'Route Planner',
    href: '/os/go',
    bg: 'rgba(255,59,48,0.1)',
    border: 'rgba(255,59,48,0.2)',
    glow: 'rgba(255,59,48,0.45)',
  },
  {
    id: 'scan',
    emoji: '📄',
    label: 'Scan',
    sub: 'Upload Doc',
    href: '/os/scan',
    bg: 'rgba(129,140,248,0.12)',
    border: 'rgba(129,140,248,0.25)',
    glow: 'rgba(129,140,248,0.45)',
  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}

export default function LauncherPage() {
  const router = useRouter()
  const [tapped, setTapped] = useState<string | null>(null)

  function handleTap(action: (typeof ACTIONS)[0]) {
    if (tapped) return
    setTapped(action.id)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
    router.push(action.href)
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(122,90,248,0.11) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(32,175,255,0.09) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="relative z-10 max-w-sm mx-auto px-4 pt-12 pb-6">
        <div className="mb-8">
          <p className="text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{getGreeting()}</p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
            What do you need?
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleTap(action)}
              disabled={tapped !== null}
              className="relative rounded-2xl p-5 flex flex-col items-start gap-1 text-left touch-manipulation"
              style={{
                background: action.bg,
                border: `1px solid ${action.border}`,
                minHeight: '120px',
                transform: tapped === action.id ? 'scale(0.95)' : 'scale(1)',
                opacity: tapped !== null && tapped !== action.id ? 0.5 : 1,
                transition: 'transform 100ms ease, opacity 150ms ease',
                boxShadow: tapped === action.id ? `0 0 24px ${action.glow}` : 'none',
              }}
            >
              <span className="text-3xl leading-none mb-1" aria-hidden>{action.emoji}</span>
              <span className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {action.label}
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {action.sub}
              </span>
              {tapped === action.id && (
                <div className="absolute right-3 top-3" aria-hidden>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
