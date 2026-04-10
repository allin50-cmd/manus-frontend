'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

interface Props {
  onResult: (data: { company?: unknown; results?: unknown[]; error?: string }) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const FETCH_TIMEOUT_MS = 10_000;

export function CompanyLookupForm({ onResult, loading, setLoading }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') ?? '');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = searchParams?.get('q');
    if (q) {
      setQuery(q);
      doLookup(q);
    }
    return () => {
      // Cancel any in-flight request when the component unmounts
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doLookup(q: string) {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS);

    setLoading(true);
    try {
      const res = await fetch(`/api/companies-house?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        onResult({ error: data.error ?? 'Company not found.' });
      } else {
        onResult(data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        const reason = (err as DOMException).message;
        onResult({
          error: reason === 'timeout'
            ? 'Request timed out. Please try again.'
            : 'Search cancelled.',
        });
      } else {
        onResult({ error: 'Network error. Please try again.' });
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/check?q=${encodeURIComponent(q)}`);
    doLookup(q);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Company name or number (e.g. 12345678)"
        className="flex-1 h-11 rounded-lg border border-slate-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Search
      </button>
    </form>
  );
}
