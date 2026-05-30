import { useLocation } from 'wouter';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

interface MainNavProps {
  theme?: 'dark' | 'light';
  active?: string;
}

const products = [
  { label: 'FineGuard', desc: 'Companies House compliance', href: '/fineguard', dot: 'bg-[#C9A64A]' },
  { label: 'VaultLine', desc: 'Secure document storage', href: '/vaultline', dot: 'bg-[#5A4BFF]' },
  { label: 'UltAi', desc: 'AI client intake', href: '/ultai', dot: 'bg-cyan-400' },
  { label: 'Legal Suite', desc: 'Chambers management', href: '/legal', dot: 'bg-emerald-400' },
];

const company = [
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/team' },
  { label: 'Pricing', href: '/pricing' },
];

const platform = [
  { label: 'Portal', href: '/portal', icon: '⬡' },
  { label: 'Admin', href: '/admin', icon: '🛠' },
  { label: 'Clerk Dashboard', href: '/clerk-dashboard', icon: '⚖️' },
  { label: 'PIE Control Plane', href: '/pie', icon: '🧠' },
];

export default function MainNav({ theme = 'dark', active }: MainNavProps) {
  const [, setLocation] = useLocation();
  const [productsOpen, setProductsOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#0F1014]/90' : 'bg-[#1A1A1A]/95';
  const border = isDark ? 'border-white/10' : 'border-white/10';
  const text = 'text-white';
  const muted = 'text-gray-400';

  return (
    <nav className={`${bg} ${border} border-b sticky top-0 z-50 backdrop-blur-md`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-[#5A4BFF] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <button
          onClick={() => setLocation('/')}
          className={`text-lg font-bold tracking-tight ${text} hover:opacity-80 transition-opacity`}
        >
          Allin<span className="text-[#C9A64A]">50</span>
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {/* Products dropdown */}
          <div className="relative">
            <button
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
              onClick={() => setProductsOpen(v => !v)}
              className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${muted} hover:text-white`}
            >
              Products <ChevronDown className={`h-3.5 w-3.5 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsOpen && (
              <div
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
                className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-white/10 bg-[#0F1014] p-2 shadow-xl"
              >
                {products.map(({ label, desc, href, dot }) => (
                  <button
                    key={label}
                    onClick={() => { setLocation(href); setProductsOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${active === label ? 'bg-white/5' : ''}`}
                  >
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
                    <span>
                      <span className="block text-sm font-medium text-white">{label}</span>
                      <span className="block text-xs text-gray-500">{desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company links */}
          {company.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => setLocation(href)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active === label ? 'text-white' : `${muted} hover:text-white`}`}
            >
              {label}
            </button>
          ))}

          {/* Platform dropdown */}
          <div className="relative">
            <button
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
              onClick={() => setPlatformOpen(v => !v)}
              className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${muted} hover:text-white`}
            >
              Platform <ChevronDown className={`h-3.5 w-3.5 transition-transform ${platformOpen ? 'rotate-180' : ''}`} />
            </button>
            {platformOpen && (
              <div
                onMouseEnter={() => setPlatformOpen(true)}
                onMouseLeave={() => setPlatformOpen(false)}
                className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-white/10 bg-[#0F1014] p-2 shadow-xl"
              >
                {platform.map(({ label, href, icon }) => (
                  <button
                    key={label}
                    onClick={() => { setLocation(href); setPlatformOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${active === label ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white'}`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => setLocation('/book-demo')}
            className={`text-sm font-medium transition-colors ${muted} hover:text-white`}
          >
            Book Demo
          </button>
          <button
            onClick={() => setLocation('/audit')}
            className="rounded-lg bg-[#C9A64A] px-4 py-2 text-sm font-semibold text-black hover:bg-[#B8954A] transition-colors"
          >
            Free Audit →
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileOpen(v => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-white/10 bg-[#0F1014] px-6 py-4 md:hidden">
          <div className="space-y-1">
            {products.map(({ label, href, dot }) => (
              <button
                key={label}
                onClick={() => { setLocation(href); setMobileOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                {label}
              </button>
            ))}
            <div className="my-2 border-t border-white/10" />
            {company.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => { setLocation(href); setMobileOpen(false); }}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                {label}
              </button>
            ))}
            <div className="my-2 border-t border-white/10" />
            {platform.map(({ label, href, icon }) => (
              <button
                key={label}
                onClick={() => { setLocation(href); setMobileOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
            <div className="my-2 border-t border-white/10" />
            <button
              onClick={() => { setLocation('/audit'); setMobileOpen(false); }}
              className="w-full rounded-lg bg-[#C9A64A] py-2.5 text-sm font-semibold text-black"
            >
              Free Audit →
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
