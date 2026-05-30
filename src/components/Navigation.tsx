import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navigation() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const isActive = (path: string) =>
    location === path ? 'text-white' : 'text-gray-400 hover:text-white';

  return (
    <header className="sticky top-0 z-50 bg-[#07091a]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xl font-bold text-[#5A4BFF]">UltAi</span>
            <span className="text-xl font-bold text-gray-400">Group</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors ${isActive('/')}`}>
              Home
            </Link>

            {/* Products dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                onClick={() => setProductsOpen(!productsOpen)}
              >
                Products
                <ChevronDown className="w-4 h-4" />
              </button>
              {productsOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#0F1014] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <Link
                    href="/fineguard"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setProductsOpen(false)}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C9A64A]" />
                    FineGuard
                  </Link>
                  <Link
                    href="/vaultline"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setProductsOpen(false)}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5A4BFF]" />
                    VaultLine
                  </Link>
                  <Link
                    href="/ultai"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setProductsOpen(false)}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    UltAi
                  </Link>
                </div>
              )}
            </div>

            <Link href="/pricing" className={`text-sm font-medium transition-colors ${isActive('/pricing')}`}>
              Pricing
            </Link>
            <Link href="/about" className={`text-sm font-medium transition-colors ${isActive('/about')}`}>
              About
            </Link>
            <Link href="/contact" className={`text-sm font-medium transition-colors ${isActive('/contact')}`}>
              Contact
            </Link>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#07091a]">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Products</p>
              <div className="space-y-1 ml-2">
                <Link
                  href="/fineguard"
                  className="flex items-center gap-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-[#C9A64A]" />
                  FineGuard
                </Link>
                <Link
                  href="/vaultline"
                  className="flex items-center gap-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-[#5A4BFF]" />
                  VaultLine
                </Link>
                <Link
                  href="/ultai"
                  className="flex items-center gap-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  UltAi
                </Link>
              </div>
            </div>
            <Link
              href="/pricing"
              className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-2 border-t border-white/10 flex items-center gap-3">
              <Link
                href="/admin"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Admin
              </Link>
              <Link
                href="/contact"
                className="flex-1 text-center px-4 py-2 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm font-medium rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
