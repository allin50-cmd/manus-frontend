import { useState, useEffect, useCallback } from 'react';
import { formatDate, formatRelativeTime } from '@/utils/formatting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Database,
  Search,
  AlertTriangle,
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  GitCommit,
  Server,
  HardDrive,
  Wifi,
  WifiOff,
  Building2,
  MapPin,
  Hash,
  FileCode,
  Play,
  Terminal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
}

interface BulkStats {
  ok: boolean;
  loaded: boolean;
  totalCompanies: number;
  statusBreakdown?: Record<string, number>;
  message?: string;
}

interface CompanyResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string | null;
  companyCategory: string | null;
  incorporationDate: string | null;
  addressLine1: string | null;
  postTown: string | null;
  postCode: string | null;
  sicCode1: string | null;
  accountsNextDueDate: string | null;
  confStmtNextDueDate: string | null;
}

interface Deployment {
  id: string;
  environment: string;
  status: string;
  commit: string;
  workflowRun: string;
  deployedAt: string;
}

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number | null;
  ok: boolean;
  latency: number;
  body: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DevOps() {
  // Health
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Bulk data stats
  const [bulkStats, setBulkStats] = useState<BulkStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'number' | 'postcode' | 'sic'>('name');
  const [searchResults, setSearchResults] = useState<CompanyResult[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  // Overdue
  const [overdueCompanies, setOverdueCompanies] = useState<CompanyResult[]>([]);
  const [overdueLoading, setOverdueLoading] = useState(false);

  // Deployments
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deployHistory, setDeployHistory] = useState<Deployment[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // API Tester
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [apiTesting, setApiTesting] = useState(false);

  // ============================================================================
  // DATA FETCHERS
  // ============================================================================

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'unreachable', timestamp: new Date().toISOString(), database: 'unknown' });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchBulkStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/bulk-data/stats');
      const data = await res.json();
      setBulkStats(data);
    } catch {
      toast.error('Failed to fetch bulk data stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error('Search query must be at least 2 characters');
      return;
    }
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery.trim(), by: searchBy, limit: '50' });
      const res = await fetch(`/api/companies/search?${params}`);
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.results);
        setSearchCount(data.count);
      } else {
        toast.error(data.error || 'Search failed');
      }
    } catch {
      toast.error('Search request failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchOverdue = useCallback(async () => {
    setOverdueLoading(true);
    try {
      const res = await fetch('/api/bulk-data/overdue?limit=50');
      const data = await res.json();
      if (data.ok) {
        setOverdueCompanies(data.results);
      }
    } catch {
      toast.error('Failed to fetch overdue companies');
    } finally {
      setOverdueLoading(false);
    }
  }, []);

  const fetchDeployments = useCallback(async () => {
    setDeploymentsLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch('/api/deployments/status'),
        fetch('/api/deployments/history?limit=20'),
      ]);
      const statusData = await statusRes.json();
      const historyData = await historyRes.json();
      setDeployments(statusData.deployments || []);
      setDeployHistory(historyData.deployments || []);
    } catch {
      toast.error('Failed to fetch deployment data');
    } finally {
      setDeploymentsLoading(false);
    }
  }, []);

  const runApiTests = async () => {
    setApiTesting(true);
    const endpoints = [
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '/api/deployments/status' },
      { method: 'GET', path: '/api/bulk-data/stats' },
      { method: 'GET', path: '/api/bulk-data/overdue?limit=5' },
      { method: 'GET', path: '/api/companies/search?q=test&by=name&limit=5' },
      { method: 'GET', path: '/api/deployments/history?limit=5' },
    ];

    const results: ApiTestResult[] = [];
    for (const ep of endpoints) {
      const start = performance.now();
      try {
        const res = await fetch(ep.path);
        const latency = Math.round(performance.now() - start);
        const body = await res.text();
        results.push({
          endpoint: ep.path,
          method: ep.method,
          status: res.status,
          ok: res.ok,
          latency,
          body: body.length > 500 ? body.substring(0, 500) + '...' : body,
        });
      } catch {
        results.push({
          endpoint: ep.path,
          method: ep.method,
          status: null,
          ok: false,
          latency: Math.round(performance.now() - start),
          body: 'Network error - endpoint unreachable',
        });
      }
    }
    setApiResults(results);
    setApiTesting(false);
    toast.success(`Tested ${results.length} endpoints`);
  };

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    fetchHealth();
    fetchBulkStats();
    fetchDeployments();
  }, [fetchHealth, fetchBulkStats, fetchDeployments]);

  // ============================================================================
  // HELPERS
  // ============================================================================



  const getEnvColor = (env: string) => {
    switch (env.toLowerCase()) {
      case 'prod': case 'production': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'staging': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'dev': case 'development': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const searchPlaceholders: Record<string, string> = {
    name: 'e.g. Tesco, Vodafone...',
    number: 'e.g. 00445790',
    postcode: 'e.g. EC2V 7HN',
    sic: 'e.g. 62012',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">DevOps & Local Testing</h1>
              <p className="text-gray-400">System health, bulk data explorer, deployment pipeline & API tester</p>
            </div>
            <Button
              onClick={() => { fetchHealth(); fetchBulkStats(); fetchDeployments(); }}
              disabled={healthLoading || statsLoading}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(healthLoading || statsLoading) ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SYSTEM HEALTH PANEL */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* API Status */}
          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Server className="w-4 h-4" />
                API Server
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {health?.status === 'ok' ? (
                  <Wifi className="w-8 h-8 text-green-400" />
                ) : health?.status === 'unreachable' ? (
                  <WifiOff className="w-8 h-8 text-red-400" />
                ) : (
                  <Activity className="w-8 h-8 text-gray-400 animate-pulse" />
                )}
                <div>
                  <p className="text-xl font-bold text-white capitalize">{health?.status || 'Checking...'}</p>
                  {health?.timestamp && (
                    <p className="text-xs text-gray-500">{formatRelativeTime(health.timestamp)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {health?.database === 'connected' ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <div>
                  <p className="text-xl font-bold text-white capitalize">{health?.database || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">PostgreSQL</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Data Status */}
          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Bulk Data (CH)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {bulkStats?.loaded ? (
                  <Database className="w-8 h-8 text-[#5A4BFF]" />
                ) : (
                  <Database className="w-8 h-8 text-gray-600" />
                )}
                <div>
                  <p className="text-xl font-bold text-white">
                    {bulkStats?.loaded
                      ? `${(bulkStats.totalCompanies || 0).toLocaleString()} companies`
                      : 'Not loaded'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {bulkStats?.loaded ? 'BasicCompanyDataAsOneFile' : 'Run pnpm db:import'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* MAIN TABS */}
        {/* ================================================================ */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="bg-[#13151C] border border-[#2A2D3A]">
            <TabsTrigger value="search" className="data-[state=active]:bg-[#5A4BFF]">
              <Search className="w-4 h-4 mr-2" />
              Company Search
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-cyan-500">
              <Database className="w-4 h-4 mr-2" />
              Bulk Data Stats
            </TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-orange-500">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Overdue
            </TabsTrigger>
            <TabsTrigger value="deploy" className="data-[state=active]:bg-green-500">
              <Rocket className="w-4 h-4 mr-2" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-[#C9A64A]">
              <Terminal className="w-4 h-4 mr-2" />
              API Tester
            </TabsTrigger>
          </TabsList>

          {/* ============================================================== */}
          {/* COMPANY SEARCH TAB */}
          {/* ============================================================== */}
          <TabsContent value="search">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#5A4BFF]" />
                  Local Company Search
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Search the bulk imported Companies House data (BasicCompanyDataAsOneFile)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex gap-1 bg-[#1A1D28] rounded-lg p-1 border border-[#2A2D3A]">
                    {([
                      { key: 'name', icon: Building2, label: 'Name' },
                      { key: 'number', icon: Hash, label: 'Number' },
                      { key: 'postcode', icon: MapPin, label: 'Postcode' },
                      { key: 'sic', icon: FileCode, label: 'SIC' },
                    ] as const).map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setSearchBy(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          searchBy === key
                            ? 'bg-[#5A4BFF] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder={searchPlaceholders[searchBy]}
                      className="bg-[#1A1D28] border-[#2A2D3A] text-white placeholder:text-gray-600"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={searchLoading}
                      className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white shrink-0"
                    >
                      {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span className="ml-2 hidden sm:inline">Search</span>
                    </Button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        Found <span className="text-white font-semibold">{searchCount}</span> result{searchCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                            <TableHead className="text-gray-400">Company No.</TableHead>
                            <TableHead className="text-gray-400">Name</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Location</TableHead>
                            <TableHead className="text-gray-400">SIC Code</TableHead>
                            <TableHead className="text-gray-400">Accounts Due</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((c) => (
                            <TableRow key={c.companyNumber} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                              <TableCell className="font-mono text-[#5A4BFF]">{c.companyNumber}</TableCell>
                              <TableCell className="text-white font-medium max-w-[200px] truncate">{c.companyName}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    c.companyStatus === 'Active'
                                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                      : c.companyStatus === 'Dissolved'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                      : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                  }
                                >
                                  {c.companyStatus || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm">
                                {[c.postTown, c.postCode].filter(Boolean).join(', ') || '-'}
                              </TableCell>
                              <TableCell className="text-gray-400 font-mono text-sm">{c.sicCode1 || '-'}</TableCell>
                              <TableCell>
                                {c.accountsNextDueDate ? (
                                  <span className={isOverdue(c.accountsNextDueDate) ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                                    {c.accountsNextDueDate}
                                    {isOverdue(c.accountsNextDueDate) && (
                                      <AlertTriangle className="w-3 h-3 inline ml-1 text-red-400" />
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {searchResults.length === 0 && searchCount === 0 && searchQuery && !searchLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No results found. Try a different search term.</p>
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Enter a search query to find companies in the local bulk data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================== */}
          {/* BULK DATA STATS TAB */}
          {/* ============================================================== */}
          <TabsContent value="bulk">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-cyan-400" />
                      Bulk Data Import Statistics
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      Overview of Companies House BasicCompanyDataAsOneFile import
                    </CardDescription>
                  </div>
                  <Button
                    onClick={fetchBulkStats}
                    disabled={statsLoading}
                    variant="outline"
                    className="border-[#2A2D3A] text-gray-400 hover:text-white"
                  >
                    <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!bulkStats?.loaded ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-400 mb-2">No Bulk Data Imported</p>
                    <p className="text-sm mb-4">{bulkStats?.message || 'Import Companies House CSV to enable local lookups'}</p>
                    <code className="px-4 py-2 bg-[#1A1D28] text-cyan-400 rounded-lg text-sm font-mono">
                      pnpm db:import &lt;path-to-csv&gt;
                    </code>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Total count */}
                    <div className="p-6 bg-[#1A1D28] rounded-xl border border-[#2A2D3A]">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                          <BarChart3 className="w-7 h-7 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Companies Imported</p>
                          <p className="text-4xl font-bold text-white">{(bulkStats.totalCompanies).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status breakdown */}
                    {bulkStats.statusBreakdown && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Status Breakdown</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(bulkStats.statusBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .map(([status, cnt]) => {
                              const pct = ((cnt / bulkStats.totalCompanies) * 100).toFixed(1);
                              const color =
                                status === 'Active' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                                status === 'Dissolved' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                                status === 'Liquidation' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
                                'text-gray-400 bg-gray-500/10 border-gray-500/30';

                              return (
                                <div key={status} className={`p-4 rounded-lg border ${color}`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium">{status}</span>
                                    <span className="text-xs opacity-70">{pct}%</span>
                                  </div>
                                  <p className="text-2xl font-bold">{cnt.toLocaleString()}</p>
                                  {/* Progress bar */}
                                  <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-current opacity-50"
                                      style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================== */}
          {/* OVERDUE TAB */}
          {/* ============================================================== */}
          <TabsContent value="overdue">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      Overdue Companies
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      Active companies with accounts past their due date (from bulk data)
                    </CardDescription>
                  </div>
                  <Button
                    onClick={fetchOverdue}
                    disabled={overdueLoading}
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${overdueLoading ? 'animate-spin' : ''}`} />
                    Load Overdue
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {overdueCompanies.length === 0 && !overdueLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Click "Load Overdue" to fetch companies with overdue accounts</p>
                  </div>
                ) : overdueLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin opacity-30" />
                    <p>Loading overdue companies...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-4">
                      Showing <span className="text-orange-400 font-semibold">{overdueCompanies.length}</span> overdue companies
                    </p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                            <TableHead className="text-gray-400">Company No.</TableHead>
                            <TableHead className="text-gray-400">Name</TableHead>
                            <TableHead className="text-gray-400">Accounts Due</TableHead>
                            <TableHead className="text-gray-400">Location</TableHead>
                            <TableHead className="text-gray-400">Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overdueCompanies.map((c) => (
                            <TableRow key={c.companyNumber} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                              <TableCell className="font-mono text-[#5A4BFF]">{c.companyNumber}</TableCell>
                              <TableCell className="text-white font-medium max-w-[200px] truncate">{c.companyName}</TableCell>
                              <TableCell className="text-red-400 font-semibold">
                                {c.accountsNextDueDate}
                                <AlertTriangle className="w-3 h-3 inline ml-1" />
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm">
                                {[c.postTown, c.postCode].filter(Boolean).join(', ') || '-'}
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm">{c.companyCategory || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================== */}
          {/* DEPLOYMENTS TAB */}
          {/* ============================================================== */}
          <TabsContent value="deploy">
            <div className="space-y-6">
              {/* Current Status */}
              <Card className="bg-[#13151C] border-[#2A2D3A]">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-green-400" />
                        Current Deployment Status
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Latest deployment per environment
                      </CardDescription>
                    </div>
                    <Button
                      onClick={fetchDeployments}
                      disabled={deploymentsLoading}
                      variant="outline"
                      className="border-[#2A2D3A] text-gray-400 hover:text-white"
                    >
                      <RefreshCw className={`w-4 h-4 ${deploymentsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {deployments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No deployments recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...deployments]
                        .sort((a, b) => {
                          const order: Record<string, number> = { prod: 0, production: 0, staging: 1, dev: 2, development: 2 };
                          return (order[a.environment.toLowerCase()] ?? 3) - (order[b.environment.toLowerCase()] ?? 3);
                        })
                        .map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-[#1A1D28] border border-[#2A2D3A] hover:border-[#3A3D4A] transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {getStatusIcon(d.status)}
                              <Badge variant="outline" className={`${getEnvColor(d.environment)} uppercase font-semibold px-3 py-1`}>
                                {d.environment}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-400 text-sm">{formatRelativeTime(d.deployedAt)}</span>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                  <div className="flex items-center gap-1">
                                    <GitCommit className="w-3 h-3" />
                                    <code className="font-mono">{d.commit.substring(0, 7)}</code>
                                  </div>
                                  <span className="text-gray-600">|</span>
                                  <span className="font-mono">Run #{d.workflowRun}</span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                d.status === 'success'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                  : d.status === 'failed'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              }
                            >
                              {d.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* History Toggle */}
              <Card className="bg-[#13151C] border-[#2A2D3A]">
                <CardHeader>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Deployment History
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Last 20 deployments across all environments
                      </CardDescription>
                    </div>
                    {showHistory ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                </CardHeader>
                {showHistory && (
                  <CardContent>
                    {deployHistory.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No deployment history</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                              <TableHead className="text-gray-400">Status</TableHead>
                              <TableHead className="text-gray-400">Environment</TableHead>
                              <TableHead className="text-gray-400">Commit</TableHead>
                              <TableHead className="text-gray-400">Workflow Run</TableHead>
                              <TableHead className="text-gray-400">Deployed At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deployHistory.map((d) => (
                              <TableRow key={d.id} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                                <TableCell>{getStatusIcon(d.status)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`${getEnvColor(d.environment)} uppercase text-xs`}>
                                    {d.environment}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-gray-400 text-sm">{d.commit.substring(0, 7)}</TableCell>
                                <TableCell className="font-mono text-gray-400 text-sm">#{d.workflowRun}</TableCell>
                                <TableCell className="text-gray-400 text-sm">{formatDate(d.deployedAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================== */}
          {/* API TESTER TAB */}
          {/* ============================================================== */}
          <TabsContent value="api">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-[#C9A64A]" />
                      API Endpoint Tester
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      Run automated tests against all public API endpoints
                    </CardDescription>
                  </div>
                  <Button
                    onClick={runApiTests}
                    disabled={apiTesting}
                    className="bg-[#C9A64A]/20 hover:bg-[#C9A64A]/30 text-[#C9A64A] border border-[#C9A64A]/50"
                  >
                    {apiTesting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {apiTesting ? 'Testing...' : 'Run All Tests'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Terminal className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Click "Run All Tests" to test API endpoints</p>
                    <p className="text-sm mt-2 text-gray-600">Tests GET /api/health, /api/deployments/status, /api/bulk-data/stats, and more</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="flex gap-4 p-4 bg-[#1A1D28] rounded-lg border border-[#2A2D3A]">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-semibold">{apiResults.filter(r => r.ok).length} passed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-semibold">{apiResults.filter(r => !r.ok).length} failed</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Avg {Math.round(apiResults.reduce((s, r) => s + r.latency, 0) / apiResults.length)}ms</span>
                      </div>
                    </div>

                    {/* Results */}
                    {apiResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-colors ${
                          result.ok
                            ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                            : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {result.ok ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/50">
                              {result.method}
                            </Badge>
                            <code className="text-sm font-mono text-white">{result.endpoint}</code>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={result.ok ? 'text-green-400' : 'text-red-400'}>{result.status || 'ERR'}</span>
                            <span className="text-gray-500">{result.latency}ms</span>
                          </div>
                        </div>
                        <pre className="text-xs text-gray-500 bg-[#0F1014] rounded p-3 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(result.body), null, 2);
                            } catch {
                              return result.body;
                            }
                          })()}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
