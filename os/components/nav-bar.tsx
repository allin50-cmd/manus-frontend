'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/companies', label: 'Companies' },
  { href: '/audit', label: 'Revenue' },
  { href: '/law', label: 'Law Clerks' },
  { href: '/compliance', label: 'FineGuard' },
  { href: '/pie.html', label: 'Accuracy PIE', external: true },
  { href: '/dashboard', label: 'Settings' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          FineGuard Pro
        </Link>
        <nav
          className="mt-3 -mx-4 flex gap-1 overflow-x-auto px-4 text-sm sm:-mx-0 sm:px-0"
          aria-label="Primary"
        >
          {links.map((l) => {
            const active = !l.external && pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  'whitespace-nowrap rounded-md px-3 py-1.5 ' +
                  (active
                    ? 'bg-slate-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100')
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
