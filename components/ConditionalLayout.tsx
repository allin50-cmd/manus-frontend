'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

// Routes that render their own full-page layout — skip root nav + container
const PUBLIC_PATHS = ['/', '/check', '/landing']

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
