'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ACTIONS = [
  {
    id: 'talk',
    emoji: '🎤',
    label: 'Talk',
    sub: 'AI Receptionist',
    bg: 'rgba(122,90,248,0.15)',
    border: 'rgba(122,90,248,0.3)',
    glow: 'rgba(122,90,248,0.45)',
  },
  {
    id: 'book',
    emoji: '📅',
    label: 'Book',
    sub: 'Smart Diary',
    bg: 'rgba(61,139,255,0.15)',
    border: 'rgba(61,139,255,0.3)',
    glow: 'rgba(61,139,255,0.45)',
  },
  {
    id: 'quote',
    emoji: '💷',
    label: 'Quote',
    sub: 'Quick Estimate',
    bg: 'rgba(255,193,69,0.12)',
    border: 'rgba(255,193,69,0.25)',
    glow: 'rgba(255,193,69,0.45)',
  },
  {
    id: 'inbox',
    emoji: '📥',
    label: 'Inbox',
    sub: 'All Messages',
    bg: 'rgba(40,199,111,0.12)',
    border: 'rgba(40,199,111,0.25)',
    glow: 'rgba(40,199,111,0.45)',
  },
  {
    id: 'go',
    emoji: '📍',
    label: 'Go',
    sub: 'Route Planner',
    bg: 'rgba(255,59,48,0.1)',
    border: 'rgba(255,59,48,0.2)',
    glow: 'rgba(255,59,48,0.45)',
  },
  {
    id: 'scan',
    emoji: '📄',
    label: 'Scan',
    sub: 'Upload Doc',
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

interface BusinessAnywhereContentProps {
  companyId?: string
  companyName?: string
}

export default function BusinessAnywhereContent({ companyId, companyName }: BusinessAnywhereContentProps) {
  const router = useRouter()
  const [tapped, setTapped] = useState<string | null>(null)

  function handleTap(action: (typeof ACTIONS)[0]) {
    if (tapped) return
    setTapped(action.id)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)

    // If in workspace context, link to workspace sub-routes
    if (companyId) {
      const workspaceRoutes: Record<string, string> = {
        'talk': `/os/workspace/${companyId}/apps/smart-receptionist`,
        'book': `/os/workspace/${companyId}/book`,
        'quote': `/os/workspace/${companyId}/quote`,
        'inbox': `/os/workspace/${companyId}/inbox`,
        'go': `/os/workspace/${companyId}/go`,
        'scan': `/os/workspace/${companyId}/scan`,
      }
      router.push(workspaceRoutes[action.id] || `/os/workspace/${companyId}`)
    } else {
      // Global context - link to /os routes
      const globalRoutes: Record<string, string> = {
        'talk': '/os/talk',
        'book': '/os/book',
        'quote': '/os/quote',
        'inbox': '/os/inbox',
        'go': '/os/go',
        'scan': '/os/scan',
      }
      router.push(globalRoutes[action.id] || '/os')
    }
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
          <h1 className="text-4xl font-bold tracking-tight leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {companyName ? `${companyName}` : 'BusinessAnywhereOS'}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Mobile field operations
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleTap(action)}
              disabled={!!tapped}
              className="group relative rounded-2xl p-4 overflow-hidden transition-all touch-manipulation"
              style={{
                background: action.bg,
                border: `1px solid ${action.border}`,
              }}
              aria-label={action.label}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${action.glow} 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                <div className="text-3xl mb-2">{action.emoji}</div>
                <div className="text-left">
                  <p className="text-sm font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {action.label}
                  </p>
                  <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>
                    {action.sub}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Company context info */}
        {companyId && (
          <div
            className="mt-8 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Operating within <span style={{ color: 'rgba(255,255,255,0.7)' }} className="font-semibold">{companyName}</span> workspace
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
