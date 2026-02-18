import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, Menu, X, Bell, User, LogOut, ChevronDown,
  Home, Building2, FileText, BarChart3, HelpCircle, Settings, Terminal, GitBranch,
} from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/vaultline', label: 'VaultLine' },
    { href: '/ultai', label: 'UltAi' },
    { href: '/contact', label: 'Contact' },
    { href: '/devops', label: 'DevOps' },
  ];

  const authLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/acsp', label: 'ACSP', icon: Shield },
    { href: '/workflows', label: 'Workflows', icon: GitBranch },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setLocation('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0A0B14]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Shield className="w-8 h-8 text-[#5A4BFF]" />
            <span className="text-xl font-black text-white tracking-tight hidden sm:block">FineGuard</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {publicLinks.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                {l.label}
              </Link>
            ))}
            {isAuthenticated && authLinks.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5">
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Alerts Bell */}
                <button
                  onClick={() => setLocation('/dashboard')}
                  className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5A4BFF]/20 border border-[#5A4BFF]/40 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#5A4BFF]" />
                    </div>
                    <span className="hidden md:block text-sm font-medium text-white max-w-[120px] truncate">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-[#1A1D28] border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-in">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setProfileOpen(false)}>
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setProfileOpen(false)}>
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <div className="border-t border-white/10 mt-1 pt-1">
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-bold bg-[#5A4BFF] text-white rounded-full hover:bg-[#6B5BFF] transition-colors">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0A0B14]/95 backdrop-blur-xl border-t border-white/10 animate-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {publicLinks.map((l) => (
              <Link key={l.href} href={l.href} className="block px-4 py-3 text-base font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <div className="border-t border-white/10 my-2" />
                {authLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors" onClick={() => setMobileOpen(false)}>
                    <l.icon className="w-5 h-5" /> {l.label}
                  </Link>
                ))}
                <div className="border-t border-white/10 my-2" />
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-base text-slate-300 hover:text-white rounded-xl hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                  <User className="w-5 h-5" /> Profile
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-base text-red-400 hover:bg-red-500/10 rounded-xl w-full">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <div className="border-t border-white/10 my-2" />
                <Link href="/login" className="block px-4 py-3 text-base font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="block px-4 py-3 text-base font-bold text-white bg-[#5A4BFF] rounded-xl text-center" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
