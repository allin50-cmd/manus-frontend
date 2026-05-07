import { useLocation } from 'wouter';
import { Scale } from 'lucide-react';

interface LegalNavProps {
  active?: 'hub' | 'intake' | 'clerks' | 'dashboard';
}

const links = [
  { id: 'hub', label: 'Overview', href: '/legal' },
  { id: 'intake', label: 'Client Intake', href: '/ultai' },
  { id: 'clerks', label: 'Chambers', href: '/law-clerks' },
  { id: 'dashboard', label: 'Dashboard', href: '/clerk-dashboard' },
] as const;

export default function LegalNav({ active }: LegalNavProps) {
  const [, setLocation] = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#C9A64A]/20 bg-[#0A0C12]/95 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-[#5A4BFF] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <button
          onClick={() => setLocation('/legal')}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <Scale className="h-5 w-5 text-[#C9A64A]" />
          <span className="font-bold tracking-tight">Legal Suite</span>
        </button>

        {/* Links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ id, label, href }) => (
            <button
              key={id}
              onClick={() => setLocation(href)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                active === id
                  ? 'text-[#C9A64A] border-b-2 border-[#C9A64A] rounded-none'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => setLocation('/clerk-dashboard')}
          className="rounded-lg bg-[#C9A64A] px-4 py-2 text-sm font-semibold text-black hover:bg-[#B8954A] transition-colors"
        >
          Open Dashboard →
        </button>
      </div>
    </nav>
  );
}
