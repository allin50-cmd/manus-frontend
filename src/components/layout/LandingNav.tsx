import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, ChevronDown, Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingNavProps {
  theme?: 'dark' | 'light';
}

const PRODUCTS = [
  { label: 'VaultLine Cloud', href: '/vaultline', desc: 'Secure document storage & compliance' },
  { label: 'UltAi Intake',   href: '/ult-ai',    desc: 'AI-powered client matter intake' },
  { label: 'FineGuard',      href: '/fineguard',  desc: 'Companies House compliance tracking' },
];

export default function LandingNav({ theme = 'dark' }: LandingNavProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const isDark = theme === 'dark';

  const bgClass    = isDark ? 'bg-[#0F1014]/80 border-white/10' : 'bg-white/80 border-gray-200/80';
  const textClass  = isDark ? 'text-gray-300 hover:text-white'   : 'text-gray-600 hover:text-gray-900';
  const logoClass  = isDark ? 'text-white'                        : 'text-gray-900';
  const dropBg     = isDark ? 'bg-[#1a1d2e] border-white/10'      : 'bg-white border-gray-200';
  const dropText   = isDark ? 'text-gray-300 hover:bg-white/5'    : 'text-gray-700 hover:bg-gray-50';
  const mobileMenu = isDark ? 'bg-[#0F1014]'                      : 'bg-white';

  const isActive = (href: string) => location === href;

  return (
    <nav className={cn('fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md', bgClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => setLocation('/vaultline')}
            className={cn('flex items-center gap-2 font-bold text-lg', logoClass)}
          >
            <Shield className="w-6 h-6 text-[#5A4BFF]" />
            <span>VaultLine</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">

            {/* Products dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  textClass
                )}
              >
                Products
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', productsOpen && 'rotate-180')} />
              </button>

              {productsOpen && (
                <div className={cn('absolute top-full left-0 mt-1 w-64 rounded-xl border shadow-xl overflow-hidden', dropBg)}>
                  {PRODUCTS.map((p) => (
                    <button
                      key={p.href}
                      onClick={() => { setLocation(p.href); setProductsOpen(false); }}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors',
                        dropText,
                        isActive(p.href) && 'text-[#5A4BFF]'
                      )}
                    >
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className={cn('text-xs mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {[
              { label: 'About',   href: '/about' },
              { label: 'Team',    href: '/team' },
              { label: 'Pricing', href: '/pricing' },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => setLocation(link.href)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? (isDark ? 'text-white' : 'text-gray-900')
                    : textClass
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setLocation('/book-demo')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                isDark
                  ? 'border-white/20 text-gray-300 hover:text-white hover:border-white/40'
                  : 'border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
              )}
            >
              Book Demo
            </button>
            <button
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn('md:hidden p-2 rounded-lg', textClass)}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className={cn('md:hidden border-t', mobileMenu, isDark ? 'border-white/10' : 'border-gray-200')}>
          <div className="px-4 py-4 space-y-1">
            <p className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>
              Products
            </p>
            {PRODUCTS.map((p) => (
              <button
                key={p.href}
                onClick={() => { setLocation(p.href); setMenuOpen(false); }}
                className={cn('w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors', textClass)}
              >
                {p.label}
              </button>
            ))}
            <div className={cn('my-2 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
            {[
              { label: 'About',   href: '/about' },
              { label: 'Team',    href: '/team' },
              { label: 'Pricing', href: '/pricing' },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => { setLocation(link.href); setMenuOpen(false); }}
                className={cn('w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors', textClass)}
              >
                {link.label}
              </button>
            ))}
            <div className={cn('my-2 h-px', isDark ? 'bg-white/10' : 'bg-gray-200')} />
            <button
              onClick={() => { setLocation('/book-demo'); setMenuOpen(false); }}
              className={cn('w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors', textClass)}
            >
              Book Demo
            </button>
            <button
              onClick={() => { setLocation('/dashboard'); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-[#5A4BFF] text-white"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
