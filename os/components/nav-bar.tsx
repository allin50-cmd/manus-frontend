'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useApiKey } from './api-key-provider';

const links = [
  { href: '/', label: 'Home' },
  { href: '/audit', label: 'Revenue' },
  { href: '/law', label: 'Law Clerks' },
  { href: '/compliance', label: 'FineGuard' },
];

export function NavBar() {
  const pathname = usePathname();
  const { apiKey, setApiKey } = useApiKey();
  const [showKey, setShowKey] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-base font-semibold tracking-tight sm:text-lg">
            <span className="sm:hidden">UI OS</span>
            <span className="hidden sm:inline">Unified Intelligence OS</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
          </div>
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label="Toggle API key"
            className="inline-flex h-10 items-center gap-1.5 rounded border border-gray-300 px-3 text-xs font-medium md:hidden"
          >
            <span className={'h-2 w-2 rounded-full ' + (apiKey ? 'bg-green-500' : 'bg-gray-300')} />
            Key
          </button>
        </div>
        <nav
          className="mt-3 -mx-4 flex gap-1 overflow-x-auto px-4 text-sm sm:-mx-0 sm:px-0"
          aria-label="Primary"
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  'whitespace-nowrap rounded-full px-3 py-1.5 ' +
                  (active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100')
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        {showKey && (
          <div className="mt-3 md:hidden">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
          </div>
        )}
      </div>
    </header>
  );
}

function ApiKeyInput({
  apiKey,
  setApiKey,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
}) {
  return (
    <label className="flex w-full items-center gap-2 md:w-auto">
      <span className="text-xs uppercase tracking-wide text-gray-500">Key</span>
      <input
        type="password"
        inputMode="text"
        autoComplete="off"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="uios_..."
        className="h-10 w-full rounded border border-gray-300 px-3 text-base font-mono focus:border-gray-500 focus:outline-none md:w-60 md:text-sm"
      />
    </label>
  );
}
