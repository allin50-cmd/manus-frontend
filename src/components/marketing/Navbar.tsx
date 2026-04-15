'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/dashboard', label: 'Sign In' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
          <Shield className="w-6 h-6 text-blue-600" />
          <span>
            <span className="text-blue-600">Fine</span>Guard Pro
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-slate-900 transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/check"
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 pb-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/check"
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 mt-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 text-center transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
