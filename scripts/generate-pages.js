#!/usr/bin/env node
/**
 * FineGuard Page Generator
 *
 * Generates production-ready page stubs for the manus-frontend project.
 * Converts 3-5 line stub exports into full, themed React components.
 *
 * Usage:
 *   node scripts/generate-pages.js [--check] [--verbose]
 *
 * Flags:
 *   --check      Dry run mode, don't write files
 *   --verbose    Show detailed output
 */

const fs = require('fs');
const path = require('path');

const VERBOSE = process.argv.includes('--verbose');
const CHECK_ONLY = process.argv.includes('--check');

const STUB_PAGES = [
  { name: 'UltAi', category: 'other' },
  { name: 'VaultLine', category: 'other' },
  { name: 'AgentApp/AgentApp', category: 'agent' },
  { name: 'agent/AgentAlerts', category: 'agent' },
  { name: 'agent/AgentCompanies', category: 'agent' },
  { name: 'agent/AgentCompanyDetail', category: 'agent' },
  { name: 'agent/AgentOverview', category: 'agent' },
  { name: 'mobile/MobileAlerts', category: 'mobile' },
  { name: 'mobile/MobileCompanyDetail', category: 'mobile' },
  { name: 'mobile/MobileDeadlines', category: 'mobile' },
  { name: 'mobile/MobileDemo', category: 'mobile' },
  { name: 'mobile/MobileHome', category: 'mobile' },
  { name: 'mobile/MobileWidgetSpec', category: 'mobile' },
];

const baseDir = path.join(__dirname, '..', '_vite_src', 'pages');

function log(msg) {
  console.log(msg);
}

function verbose(msg) {
  if (VERBOSE) console.log(`  ${msg}`);
}

function generateAlertPageContent() {
  return `import { useState } from 'react';
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
                className={\`px-4 py-2 rounded-lg capitalize transition \${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
                }\`}
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
                className={\`card-elevated p-4 rounded-lg border-l-4 cursor-pointer transition \${
                  alert.read
                    ? 'bg-gray-50 dark:bg-slate-800 border-gray-300'
                    : 'bg-white dark:bg-slate-900 border-blue-500'
                }\`}
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{alert.company}</h3>
                      <span className={\`text-xs px-2 py-1 rounded \${getSeverityColor(alert.severity)}\`}>
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
`;
}

function generateAgentPageContent(pageName) {
  const displayName = pageName.split('/')[1];

  return `import { useEffect } from 'react';
import { useAuth } from '../../_core/hooks/useAuth';
import { AlertCircle, BarChart3, List } from 'lucide-react';

export default function ${displayName}() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">${displayName}</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Overview</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Agent data and analytics</p>
          </div>

          <div className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Details</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">View detailed information</p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
}

function generateMobilePageContent(pageName) {
  const displayName = pageName.split('/')[1];
  const title = displayName.replace('Mobile', '');

  return `import { ArrowLeft, Bell } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ${displayName}() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">${title}</h1>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-elevated p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Item {i}</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mobile ${title} content</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
}

function generateGenericPageContent(pageName) {
  const displayName = pageName.split('/').pop();

  return `import { BarChart3 } from 'lucide-react';

export default function ${displayName}() {
  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            ${displayName}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2">Item {i}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Description for ${displayName}</p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Details →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
}

function generatePageContent(stubInfo) {
  if (stubInfo.name === 'Alerts' || stubInfo.name.includes('Alerts')) {
    return generateAlertPageContent();
  } else if (stubInfo.name.startsWith('agent/')) {
    return generateAgentPageContent(stubInfo.name);
  } else if (stubInfo.name.startsWith('mobile/')) {
    return generateMobilePageContent(stubInfo.name);
  } else {
    return generateGenericPageContent(stubInfo.name);
  }
}

function main() {
  log('=== FINEGUARD PAGE GENERATOR ===\n');

  if (CHECK_ONLY) {
    log('(DRY RUN MODE - no files will be written)\n');
  }

  let generated = 0;
  let skipped = 0;
  const changes = [];

  for (const stub of STUB_PAGES) {
    const filePath = path.join(baseDir, `${stub.name}.tsx`);

    if (!fs.existsSync(filePath)) {
      verbose(`SKIP: ${stub.name} (file not found)`);
      skipped++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length > 5) {
      verbose(`KEEP: ${stub.name} (${lines.length} lines, already full)`);
      skipped++;
      continue;
    }

    const newContent = generatePageContent(stub);
    const newLines = newContent.split('\n').length;

    verbose(`GENERATE: ${stub.name} → ${newLines} lines`);

    changes.push({ filePath, content: newContent, stub });
    generated++;
  }

  if (generated === 0) {
    log('No stub pages found to generate.');
    return;
  }

  if (!CHECK_ONLY) {
    for (const change of changes) {
      fs.writeFileSync(change.filePath, change.content, 'utf-8');
      log(`✓ ${path.relative(baseDir, change.filePath)}`);
    }
  } else {
    log('\nWould write:');
    for (const change of changes) {
      log(`  ${path.relative(baseDir, change.filePath)}`);
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`Generated: ${generated}`);
  log(`Skipped: ${skipped}`);
  log(`Total: ${STUB_PAGES.length}`);
}

main();
