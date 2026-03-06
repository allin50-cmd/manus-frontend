import { useState } from 'react';
import { Bell, Search, ChevronDown, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { mockCompanies } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { user, selectedCompanyId, setSelectedCompany } = useAuth();
  const { isOnline, pendingCount } = useOffline();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userCompanies = mockCompanies.filter(c => user?.companyIds.includes(c.id));
  const selectedCompany = userCompanies.find(c => c.id === selectedCompanyId);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Company Selector */}
      <div className="relative">
        <button
          onClick={() => setShowCompanyDropdown(p => !p)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors text-sm"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              selectedCompany?.syncStatus === 'in_sync' ? 'bg-green-500' :
              selectedCompany?.syncStatus === 'variance_detected' ? 'bg-amber-500' : 'bg-gray-400'
            )}
          />
          <span className="font-medium text-gray-900 max-w-[200px] truncate">
            {selectedCompany?.name ?? 'Select Company'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {showCompanyDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCompanyDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
              {userCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => {
                    setSelectedCompany(company.id);
                    setShowCompanyDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left',
                    company.id === selectedCompanyId && 'bg-blue-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      company.syncStatus === 'in_sync' ? 'bg-green-500' :
                      company.syncStatus === 'variance_detected' ? 'bg-amber-500' : 'bg-gray-400'
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                    <div className="text-xs text-gray-500">
                      {company.companyNumber} · {company.vrn}
                    </div>
                    {company.syncStatus === 'variance_detected' && (
                      <div className="text-xs text-amber-600 mt-0.5">⚠ Variance detected</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search transactions, receipts, documents..."
          className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Online status */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
            isOnline ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
          )}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          {!isOnline && pendingCount > 0 && (
            <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Sync indicator */}
        {isOnline && (
          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <Link
          to="/alerts"
          className="relative p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </Link>

        {/* User avatar */}
        {user && (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
