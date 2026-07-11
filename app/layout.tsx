import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '../components/NavBar'
import { getSession } from '../lib/auth'

export const metadata: Metadata = {
  title: 'UltraCore Ops – Business Command Hub',
  description: 'Centralise. Prioritise. Execute.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'UltraCore Ops',
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
      <body className="min-h-screen bg-slate-50">
        <NavBar person={session?.person ?? null} />
        <main className="min-h-[calc(100vh-3.5rem)] w-full">{children}</main>
      </body>
    </html>
  )
}
