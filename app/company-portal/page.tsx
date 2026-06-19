'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MonitoredCompany {
  number: string;
  name: string;
  addedDate: string;
  alerts: {
    accounts_filing: boolean;
    confirmation_statement: boolean;
    director_changes: boolean;
  };
  lastAlert?: string;
  status: 'active' | 'inactive';
}

interface Alert {
  id: string;
  company: string;
  type: string;
  date: string;
  message: string;
}

const MOCK_COMPANIES: MonitoredCompany[] = [
  {
    number: '01234567',
    name: 'Acme Corporation Ltd',
    addedDate: '2025-01-15',
    alerts: {
      accounts_filing: true,
      confirmation_statement: true,
      director_changes: true
    },
    lastAlert: '2025-06-10',
    status: 'active'
  },
  {
    number: '07654321',
    name: 'TechStart Holdings',
    addedDate: '2025-02-20',
    alerts: {
      accounts_filing: true,
      confirmation_statement: false,
      director_changes: true
    },
    lastAlert: '2025-06-05',
    status: 'active'
  },
  {
    number: '12345678',
    name: 'Global Industries plc',
    addedDate: '2025-03-10',
    alerts: {
      accounts_filing: true,
      confirmation_statement: true,
      director_changes: false
    },
    status: 'active'
  }
];

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    company: 'Acme Corporation Ltd',
    type: 'Director Changes',
    date: '2025-06-10',
    message: 'Director John Smith has been appointed'
  },
  {
    id: '2',
    company: 'TechStart Holdings',
    type: 'Confirmation Statement',
    date: '2025-06-05',
    message: 'Confirmation statement due in 14 days'
  },
  {
    id: '3',
    company: 'Acme Corporation Ltd',
    type: 'Annual Return',
    date: '2025-06-01',
    message: 'Annual return filing deadline: 30 June 2025'
  },
  {
    id: '4',
    company: 'Global Industries plc',
    type: 'Accounts Filing',
    date: '2025-05-28',
    message: 'Accounts have been filed at Companies House'
  }
];

export default function CompanyPortalPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to access your dashboard</p>
          <Link href="/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const totalCompanies = MOCK_COMPANIES.length;
  const totalAlerts = MOCK_ALERTS.length;
  const alertsThisMonth = MOCK_ALERTS.filter(a => {
    const alertDate = new Date(a.date);
    const now = new Date();
    return alertDate.getMonth() === now.getMonth() && alertDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Settings
            </Link>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor your Companies House compliance in one place</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Companies Monitored', value: totalCompanies, icon: '📊' },
              { label: 'Total Alerts', value: totalAlerts, icon: '🔔' },
              { label: 'This Month', value: alertsThisMonth, icon: '📅' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="text-4xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Monitored Companies */}
            <div className="lg:col-span-2">
              <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monitored Companies</h2>
                  <Link
                    href="/check"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                  >
                    + Add company
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Company</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Added</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Alerts</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_COMPANIES.map((company) => {
                        const alertCount = Object.values(company.alerts).filter(Boolean).length;
                        return (
                          <tr key={company.number} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{company.number}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(company.addedDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-1">
                                {company.alerts.accounts_filing && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">Accounts</span>}
                                {company.alerts.confirmation_statement && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">Confirmation</span>}
                                {company.alerts.director_changes && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">Directors</span>}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                Active
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div>
              <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 h-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Alerts</h2>

                <div className="space-y-3">
                  {MOCK_ALERTS.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-3 bg-gray-50 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{alert.company}</p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex-shrink-0">
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(alert.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>

                {MOCK_ALERTS.length > 5 && (
                  <button className="w-full mt-4 py-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                    View all alerts →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Need more companies?</h3>
            <p className="mb-4 opacity-90">Find and monitor additional UK companies with instant alerts</p>
            <Link
              href="/check"
              className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Search Companies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
