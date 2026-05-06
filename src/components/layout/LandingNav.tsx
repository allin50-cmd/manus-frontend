import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'VaultLine', href: '/vaultline' },
  { label: 'UltAi', href: '/ultai' },
  { label: 'FineGuard', href: '/fineguard' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/team' },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-[#0F1014]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/vaultline" className="flex items-center gap-2 group">
            <Shield className="w-7 h-7 text-[#5A4BFF] group-hover:opacity-80 transition-opacity" />
            <span className="text-white font-bold text-lg tracking-tight group-hover:text-gray-200 transition-colors">
              VaultLine
            </span>
          </Link>

          {/* Center: Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link href="/book-demo">
              <Button className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm px-4 py-2 h-9">
                Book Demo
              </Button>
            </Link>
          </div>

          {/* Mobile: Hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0F1014]/95">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 flex flex-col gap-2 border-t border-white/10 mt-2">
              <Link
                href="/"
                className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/book-demo" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
