import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '../components/NavBar'
import { getSession } from '../lib/auth'

export const metadata: Metadata = {
  title: 'FineGuard – Compliance Dashboard',
  description: 'Centralise. Prioritise. Comply.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FineGuard',
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
  themeColor: '#0c2340',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  return (
    <html lang="en">
      <body>
        <NavBar person={session?.person ?? null} />
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
