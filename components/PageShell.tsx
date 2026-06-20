'use client'

import { usePathname } from 'next/navigation'
import NavBar from '@/components/NavBar'

const PUBLIC_PATHS = ['/', '/login']

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </>
  )
}
