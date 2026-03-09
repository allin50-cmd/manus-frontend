import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X, LogOut, LayoutDashboard, FileCheck, Building2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, clearAuth, isAuthenticated } from '@/lib/auth';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const authed = isAuthenticated();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const navLinks = authed
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/vat-checker', label: 'VAT Checker', icon: FileCheck },
        { to: '/deadline-scanner', label: 'Deadline Scanner', icon: Building2 },
        { to: '/documents', label: 'Document Vault', icon: FolderOpen },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/pricing', label: 'Pricing' },
      ];

  return (
    <nav className="bg-[#1A1A1A] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Shield className="w-7 h-7 text-[#C9A64A]" />
            <span>FineGuard <span className="text-[#C9A64A]">Pro</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-[#C9A64A] ${
                  location.pathname === link.to ? 'text-[#C9A64A]' : 'text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {authed ? (
              <>
                <span className="text-sm text-gray-400">{user?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-[#C9A64A] hover:bg-[#B8954A] text-white">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#111] border-t border-white/10 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block text-gray-300 hover:text-[#C9A64A] py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {authed ? (
            <button onClick={handleLogout} className="text-gray-400 text-sm mt-2">
              Logout
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="text-white border-white/20">Log In</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="bg-[#C9A64A] text-white">Start Free Trial</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
