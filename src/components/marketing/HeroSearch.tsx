'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/check?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter company name or number"
        className="flex-1 h-12 rounded-lg border border-slate-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-2 h-12 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        Check My Company
      </button>
    </form>
  );
}
