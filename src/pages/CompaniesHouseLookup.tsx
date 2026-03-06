import { useState } from 'react';
import { Search, Building2, User, MapPin, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';

// Mock Companies House data
const MOCK_RESULTS = [
  {
    companyNumber: '12345678',
    companyName: 'Apex Digital Solutions Ltd',
    status: 'active',
    companyType: 'Private Limited Company',
    dateOfCreation: '2018-03-15',
    registeredOfficeAddress: {
      addressLine1: '123 Tech Street',
      addressLine2: 'Shoreditch',
      locality: 'London',
      postalCode: 'EC1A 1BB',
      country: 'England',
    },
    directors: [
      { name: 'James Carter', appointedOn: '2018-03-15', occupation: 'Director' },
      { name: 'Emma Williams', appointedOn: '2019-06-01', occupation: 'Director' },
    ],
    filingHistory: [
      { type: 'CS01', date: '2024-03-20', description: 'Confirmation statement made on 20 March 2024' },
      { type: 'AA', date: '2024-01-15', description: 'Annual accounts made up to 31 December 2023' },
      { type: 'TM01', date: '2023-11-01', description: 'Termination of appointment of director' },
    ],
  },
];

export default function CompaniesHouseLookup() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<typeof MOCK_RESULTS[0] | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setResult(null);

    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));

    const found = MOCK_RESULTS.find(
      r => r.companyNumber === query.trim() ||
        r.companyName.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      setResult(found);
    } else {
      setNotFound(true);
    }
    setIsSearching(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Companies House Lookup"
        description="Search company information from the Companies House register"
      />

      {/* Search Form */}
      <form onSubmit={handleSearch} className="card p-6 mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">Company Number or Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="input pl-9"
                placeholder="e.g. 12345678 or Apex Digital Solutions"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={isSearching || !query.trim()} className="btn-primary flex items-center gap-2">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Try: <button type="button" onClick={() => setQuery('12345678')} className="text-blue-600 hover:underline">12345678</button>
          {' '}or{' '}
          <button type="button" onClick={() => setQuery('Apex Digital')} className="text-blue-600 hover:underline">Apex Digital</button>
        </p>
      </form>

      {/* Not Found */}
      {notFound && (
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-500 text-sm">
            No company found for "<strong>{query}</strong>". Try a different company number or name.
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Company Header */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{result.companyName}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="font-mono">{result.companyNumber}</span>
                    <span>·</span>
                    <span>{result.companyType}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Registered Office</p>
                  <p className="text-sm text-gray-700">
                    {result.registeredOfficeAddress.addressLine1}
                    {result.registeredOfficeAddress.addressLine2 && `, ${result.registeredOfficeAddress.addressLine2}`}
                  </p>
                  <p className="text-sm text-gray-700">
                    {result.registeredOfficeAddress.locality}, {result.registeredOfficeAddress.postalCode}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Incorporated</p>
                  <p className="text-sm text-gray-700">{formatDate(result.dateOfCreation)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Directors */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Directors ({result.directors.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {result.directors.map((d, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.occupation}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Appointed {formatDate(d.appointedOn)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Filing History */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Filing History</h3>
              <a
                href={`https://find-and-update.company-information.service.gov.uk/company/${result.companyNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                View on Companies House <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-gray-50">
              {result.filingHistory.map((filing, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {filing.type}
                    </span>
                    <p className="text-sm text-gray-700">{filing.description}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0 ml-4">{formatDate(filing.date)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
