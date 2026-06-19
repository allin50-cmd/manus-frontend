import { useState } from 'react';
import { AlertCircle, Bell, Filter, Search } from 'lucide-react';

interface AlertItem {
  id: string;
  company: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  date: string;
  read: boolean;
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    company: 'Acme Corporation Ltd',
    type: 'Director Change',
    severity: 'critical',
    message: 'Director John Smith appointed',
    date: '2025-06-18',
    read: false,
  },
  {
    id: '2',
    company: 'TechStart Holdings',
    type: 'Filing Deadline',
    severity: 'warning',
    message: 'Accounts filing due in 7 days',
    date: '2025-06-17',
    read: false,
  },
  {
    id: '3',
    company: 'Global Industries plc',
    type: 'Status Update',
    severity: 'info',
    message: 'Annual return successfully filed',
    date: '2025-06-16',
    read: true,
  },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = alerts.filter(alert => {
    const matchesFilter = filter === 'all' ||
      (filter === 'unread' && !alert.read) ||
      (filter === 'critical' && alert.severity === 'critical');
    const matchesSearch = alert.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-600" />
            Alerts
          </h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'unread', 'critical'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map(alert => (
              <div
                key={alert.id}
                onClick={() => markAsRead(alert.id)}
                className={`card-elevated p-4 rounded-lg border-l-4 cursor-pointer transition ${
                  alert.read
                    ? 'bg-gray-50 dark:bg-slate-800 border-gray-300'
                    : 'bg-white dark:bg-slate-900 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{alert.company}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{alert.date}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No alerts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
