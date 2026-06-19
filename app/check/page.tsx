'use client';

import { useState } from 'react';
import { ActivationPanel } from '@/app/components/ActivationPanel';

interface CompanyResult {
  number: string;
  name: string;
  status: string;
  nextDeadline: string;
  nextDeadlineType: string;
}

export default function CheckPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed. Please try again.');
      const data = (await res.json()) as { results: CompanyResult[] };
      setResults(data.results ?? []);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCompany) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => setSelectedCompany(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-6 text-sm font-medium"
          >
            ← Back to search
          </button>
          <ActivationPanel
            companyNumber={selectedCompany.number}
            companyName={selectedCompany.name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Search Section */}
      <section className="px-4 py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Check a Company</h1>
          <p className="text-lg text-blue-100 mb-8">
            Find any UK company and set up instant alerts for compliance changes
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by company name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-sm text-white bg-red-500/30 border border-red-300/40 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Found {results.length} company{results.length !== 1 ? 'ies' : ''}
            </h2>

            <div className="space-y-4">
              {results.map((company) => (
                <div
                  key={company.number}
                  onClick={() => setSelectedCompany(company)}
                  className="p-6 rounded-lg bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">
                        Company number: {company.number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{company.status}</span>
                      </p>
                    </div>
                    {company.nextDeadline ? (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Next deadline</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                          {new Date(company.nextDeadline).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {company.nextDeadlineType}
                        </p>
                      </div>
                    ) : (
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Set up alerts →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      {!searchQuery && results.length === 0 && (
        <section className="px-4 py-12 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">How to monitor companies</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Search',
                  description: 'Find any UK company by name or Companies House number'
                },
                {
                  title: 'Select Alerts',
                  description: 'Choose which compliance changes you want to monitor (£1/month per alert)'
                },
                {
                  title: 'Get Notified',
                  description: 'Receive instant alerts via email and your dashboard'
                }
              ].map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
