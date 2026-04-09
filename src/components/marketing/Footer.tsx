import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-700"><span className="text-blue-600">Fine</span>Guard Pro</span>
        </div>
        <nav className="flex gap-5">
          <Link href="/pricing" className="hover:text-slate-800">Pricing</Link>
          <Link href="/about" className="hover:text-slate-800">About</Link>
          <Link href="/#faq" className="hover:text-slate-800">FAQ</Link>
          <Link href="/about#terms" className="hover:text-slate-800">Terms</Link>
          <Link href="/about#privacy" className="hover:text-slate-800">Privacy</Link>
          <Link href="/about#support" className="hover:text-slate-800">Support</Link>
        </nav>
        <p>© {new Date().getFullYear()} FineGuard Pro. All rights reserved.</p>
      </div>
    </footer>
  );
}
