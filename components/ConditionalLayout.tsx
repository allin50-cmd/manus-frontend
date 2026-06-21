'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

// Routes that manage their own layout — skip the Ultratech OS NavBar shell.
// FineGuard public routes: /, /check, /landing, /privacy, /terms
// FineGuard customer portal: /company-portal (has its own PortalNav)
// Future Platform Lab (isolated — not linked from any FineGuard or Ultratech OS navigation):
//   /hub, /ultai
const PUBLIC_PATHS = ['/', '/check', '/landing', '/portal', '/intake/fineguard', '/intake/accuracy', '/intake/builder-big-jobs', '/builder-big-jobs', '/hub', '/privacy', '/terms']

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">{children}</main>
    </>
  )
}
