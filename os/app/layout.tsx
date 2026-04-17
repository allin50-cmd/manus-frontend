import type { Metadata } from 'next';
import { ApiKeyProvider } from '@/components/api-key-provider';
import { NavBar } from '@/components/nav-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unified Intelligence OS',
  description: 'Revenue, legal ops, and compliance intelligence for chambers and law firms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ApiKeyProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </ApiKeyProvider>
      </body>
    </html>
  );
}
