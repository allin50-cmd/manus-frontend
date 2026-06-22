'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

// Routes that render their own full-page layout — skip Business Hub NavBar + container.
// /company-portal is a FineGuard customer page with its own PortalNav.
// /hub redirects immediately so it never needs a shell.
const PUBLIC_PATHS = ['/', '/check', '/landing', '/company-portal', '/hub', '/privacy', '/terms']

// Routes inside the (internal) route group provide their own NavBar + main via
// app/(internal)/layout.tsx. Route groups don't affect the URL, so these paths
// must be listed explicitly to avoid rendering a duplicate NavBar + container.
const INTERNAL_PATHS = [
  '/dashboard',
  '/today',
  '/activity',
  '/decisions',
  '/templates',
  '/voice-intake',
  '/work-items',
]

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ownsLayout = [...PUBLIC_PATHS, ...INTERNAL_PATHS].some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  if (ownsLayout) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">{children}</main>
    </>
  )
}
