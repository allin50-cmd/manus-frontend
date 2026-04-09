import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'FineGuard Pro — Stay Compliant. Avoid Penalties.',
  description: 'Automated deadline monitoring for UK businesses. Official Companies House data. Alerts before every deadline.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
