import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unified Intelligence OS',
  description: 'Revenue, legal ops, and compliance intelligence for chambers and law firms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
