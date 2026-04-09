import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
          <Shield className="w-6 h-6 text-blue-600" />
          <span><span className="text-blue-600">Fine</span>Guard Pro</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <Link href="/#features" className="hover:text-slate-900 transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
          <Link href="/#faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Sign In</Link>
        </nav>
        <Link
          href="/check"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
