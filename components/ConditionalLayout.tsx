'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

// Routes that manage their own layout — skip the default NavBar + container.
// Important: '/' is handled as an exact match only. Do not include it in the
// prefix-matched route arrays or every route can be treated as public.
const PUBLIC_PATHS = [
  '/check',
  '/landing',
  '/portal',
  '/company-portal',
  '/intake/fineguard',
  '/intake/accuracy',
  '/intake/builder-big-jobs',
  '/builder-big-jobs',
  '/privacy',
  '/terms',
  '/login',
]

// Routes inside the (internal) route group, or routes with their own shell
// (OsShell, AdminShell), provide their own NavBar + main. List them here to
// avoid rendering a duplicate default NavBar + container.
const INTERNAL_PATHS = [
  '/os',
  '/admin',
  '/intake',
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

  const ownsLayout =
    pathname === '/' ||
    [...PUBLIC_PATHS, ...INTERNAL_PATHS].some(
      (p) => pathname === p || pathname.startsWith(p + '/'),
    )

  if (ownsLayout) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar person={null} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">{children}</main>
    </>
  )
}
