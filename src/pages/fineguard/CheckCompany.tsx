import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api, type SearchResult } from '../../lib/api';

const PLACEHOLDER_EXAMPLES = [
  'Company number (e.g. 12345678)',
  'Company name (e.g. Acme Limited)',
];

export default function CheckCompany() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.searchCompanies(query.trim());
        setSuggestions(res.results);
        setShowSuggestions(res.results.length > 0);
      } catch {
        // Ignore search errors — don't block the user
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  async function checkCompany(numberOrQuery: string) {
    const trimmed = numberOrQuery.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);
    setShowSuggestions(false);

    try {
      const result = await api.getCompany(trimmed);
      navigate(`/company/${result.companyNumber}`, { state: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Company not found. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    checkCompany(query);
  }

  function selectSuggestion(s: SearchResult) {
    setQuery(s.companyNumber);
    setShowSuggestions(false);
    checkCompany(s.companyNumber);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Brand mark */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-fg-gold/15 border border-fg-gold/20 flex items-center justify-center mx-auto mb-5">
          <Shield className="w-8 h-8 text-fg-gold" />
        </div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          Check a company
        </h1>
        <p className="text-fg-muted mt-2 text-base max-w-sm mx-auto">
          Enter a Companies House number or company name to see upcoming deadlines.
        </p>
      </div>

      {/* Search form */}
      <div className="w-full max-w-md relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {searching ? (
                <Loader2 className="w-4 h-4 text-fg-muted animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-fg-muted" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={PLACEHOLDER_EXAMPLES[0]}
              className="w-full bg-fg-surface border border-fg-border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-fg-muted/60 focus:outline-none focus:ring-2 focus:ring-fg-gold/40 focus:border-fg-gold/50 transition-all text-sm"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute top-full mt-1 w-full bg-fg-surface border border-fg-border rounded-xl shadow-xl z-20 overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.companyNumber}
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-fg-border/50 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-white/90">
                      {s.companyName}
                    </p>
                    <p className="text-xs text-fg-muted mt-0.5">{s.companyNumber}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-white/60 transition-colors" />
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="mt-3 w-full bg-fg-gold hover:bg-fg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Looking up company…
              </>
            ) : (
              <>
                Check company
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 text-left bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Example hint */}
      <p className="text-xs text-fg-muted/50 mt-6">
        Try mock numbers: 00000001 (safe) · 00000002 (urgent) · 00000003 (overdue)
      </p>
    </div>
  );
}
