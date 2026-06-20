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
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => setSelectedCompany(null)}
            className="text-[#00A86B] hover:underline mb-6 text-sm font-medium"
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
    <div className="min-h-screen bg-white">
      {/* Search Section */}
      <section className="px-4 py-16 bg-[#0B1F3A]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Check a Company</h1>
          <p className="text-lg text-slate-300 mb-8">
            Find any UK company and set up instant compliance monitoring
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by company name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-lg border-0 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A86B] bg-white"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#00A86B] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#009960] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {loading ? 'Searching…' : 'Search'}
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
            <h2 className="text-2xl font-bold mb-6 text-slate-900">
              Found {results.length} compan{results.length !== 1 ? 'ies' : 'y'}
            </h2>

            <div className="space-y-4">
              {results.map((company) => (
                <div
                  key={company.number}
                  onClick={() => setSelectedCompany(company)}
                  className="p-6 rounded-xl bg-white border-2 border-slate-200 cursor-pointer hover:border-[#00A86B] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {company.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-mono mt-1">
                        {company.number}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        Status: <span className="font-semibold text-[#00A86B]">{company.status}</span>
                      </p>
                    </div>
                    {company.nextDeadline ? (
                      <div className="text-right shrink-0">
                        <p className="text-sm text-slate-500">Next deadline</p>
                        <p className="text-lg font-bold text-amber-600 mt-1">
                          {new Date(company.nextDeadline).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {company.nextDeadlineType}
                        </p>
                      </div>
                    ) : (
                      <div className="text-right shrink-0">
                        <span className="text-sm text-[#00A86B] font-medium">
                          Check Status →
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
        <section className="px-4 py-12 bg-[#F7F8FA]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-slate-900">How to monitor companies</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Search', description: 'Find any UK company by name or Companies House number' },
                { title: 'Select Alerts', description: 'Choose which compliance changes you want to monitor' },
                { title: 'Get Notified', description: 'Receive alerts via email and your dashboard' },
              ].map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 bg-[#00A86B] text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">{step.title}</h3>
                  <p className="text-slate-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
