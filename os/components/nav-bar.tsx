'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApiKey } from './api-key-provider';

const links = [
  { href: '/', label: 'Home' },
  { href: '/audit', label: 'Revenue Audit' },
  { href: '/law', label: 'Law Clerks' },
  { href: '/compliance', label: 'FineGuard' },
];

export function NavBar() {
  const pathname = usePathname();
  const { apiKey, setApiKey } = useApiKey();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Unified Intelligence OS
          </Link>
          <nav className="flex gap-4 text-sm">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    active
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-800'
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-wide text-gray-500">API key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="uios_..."
            className="w-60 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>
    </header>
  );
}
