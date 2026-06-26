'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Overview', suffix: '' },
  { label: 'Apps', suffix: '/apps' },
  { label: 'People', suffix: '/people' },
  { label: 'Documents', suffix: '/documents' },
  { label: 'Activity', suffix: '/activity' },
  { label: 'Settings', suffix: '/settings' },
]

export default function WorkspaceTabBar({ base }: { base: string }) {
  const pathname = usePathname()

  function isActive(suffix: string) {
    const target = base + suffix
    return suffix === '' ? pathname === target : pathname === target || pathname.startsWith(target + '/')
  }

  return (
    <nav
      className="flex items-center overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.suffix)
        return (
          <Link
            key={tab.label}
            href={base + tab.suffix}
            className="shrink-0 px-3 py-3 text-xs font-semibold transition-colors relative whitespace-nowrap"
            style={{ color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.35)' }}
          >
            {tab.label}
            {active && (
              <span
                className="absolute bottom-0 inset-x-0 h-[2px] rounded-t-full"
                style={{ background: 'rgba(122,90,248,1)' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
