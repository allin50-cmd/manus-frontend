import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { getSession } from '../lib/auth'

export const metadata: Metadata = {
  title: 'UltraCore SheetOps',
  description: 'Spreadsheets that do the work, not just store the work.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SheetOps',
  },
  icons: {
    apple: '/icons/icon-192.svg',
    icon: '/icons/icon-192.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e293b',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  return (
    <html lang="en">
      <body>
        <NavBar person={session?.person ?? null} />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
