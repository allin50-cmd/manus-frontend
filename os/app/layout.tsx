import type { Metadata, Viewport } from 'next';
import { ApiKeyProvider } from '@/components/api-key-provider';
import { NavBar } from '@/components/nav-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unified Intelligence OS',
  description: 'Revenue, legal ops, and compliance intelligence for chambers and law firms',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <ApiKeyProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
        </ApiKeyProvider>
      </body>
    </html>
  );
}
