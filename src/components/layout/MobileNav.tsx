import { useLocation, Link } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { Home, BarChart3, Building2, Bell, User } from 'lucide-react';
import { clsx } from 'clsx';

export default function MobileNav() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) return null;

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/reports', label: 'Reports', icon: Building2 },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0B14]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {links.map((l) => {
          const active = location === l.href || (l.href === '/dashboard' && location.startsWith('/dashboard'));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-[#5A4BFF]' : 'text-slate-500'
              )}
            >
              <l.icon className={clsx('w-5 h-5', active && 'drop-shadow-[0_0_8px_rgba(90,75,255,0.5)]')} />
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
