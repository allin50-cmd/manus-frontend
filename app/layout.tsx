import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PageShell from '@/components/PageShell'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FineGuard — Companies House Peace of Mind',
  description: 'Know exactly where your company stands with Companies House. FineGuard monitors your obligations so UK directors never miss a deadline.',
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
  themeColor: '#0B1F3A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PageShell>{children}</PageShell>
      </body>
    </html>
  )
}
