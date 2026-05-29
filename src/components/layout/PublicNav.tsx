import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Home,
  Info,
  LockKeyhole,
  Mic,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { isFineGuardHost } from '@/lib/host';

const PUBLIC_LINKS = [
  { href: '/', label: 'App', icon: Home },
  { href: '/fineguard', label: 'FineGuard', icon: ShieldCheck },
  { href: '/ultai', label: 'UltAi', icon: Sparkles },
  { href: '/vaultline', label: 'VaultLine', icon: LockKeyhole },
  { href: '/compliance-bundle', label: 'Compliance', icon: ClipboardCheck },
  { href: '/book-demo', label: 'Demo', icon: CalendarDays },
  { href: '/voice-agent', label: 'Voice', icon: Mic },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/about', label: 'About', icon: Info },
];

const FINEGUARD_LINKS = [
  { href: '/', label: 'Home', icon: ShieldCheck },
  { href: '/compliance-bundle', label: 'Check', icon: ClipboardCheck },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/book-demo', label: 'Demo', icon: CalendarDays },
  { href: '/app', label: 'App', icon: Home },
];

type PublicNavProps = {
  variant?: 'auto' | 'dark' | 'light';
};

export default function PublicNav({ variant = 'auto' }: PublicNavProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = variant === 'auto' ? theme === 'light' : variant === 'light';
  const fineGuardHost = isFineGuardHost();
  const links = fineGuardHost ? FINEGUARD_LINKS : PUBLIC_LINKS;
  const brand = fineGuardHost ? 'FineGuard' : 'ClerkOS';
  const BrandIcon = fineGuardHost ? ShieldCheck : BookOpen;

  return (
    <header
      className={[
        'px-4 py-4',
        isLight
          ? 'bg-white/80 border-b border-slate-200 text-slate-900'
          : 'bg-slate-950/60 border-b border-white/10 text-white',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span
            className={[
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              fineGuardHost
                ? 'bg-[#C9A64A] text-white'
                : isLight
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white',
            ].join(' ')}
          >
            <BrandIcon className="w-4 h-4" />
          </span>
          <span className="text-sm font-bold truncate">{brand}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Public navigation" className="flex flex-wrap items-center gap-1.5">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                    active
                      ? isLight
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-white/15 text-white'
                      : isLight
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'light' ? 'Turn dark mode on' : 'Turn dark mode off'}
            className={[
              'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
              isLight
                ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                : 'border-white/10 text-slate-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
