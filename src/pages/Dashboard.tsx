import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Plus, Search, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle, Clock, Bell,
  FileCheck, ChevronRight, Loader2, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import { authFetch, getUser } from '@/lib/auth';
import { toast } from 'sonner';

interface Company {
  id: string;
  companyName: string;
  companyNumber?: string;
  vatNumber?: string;
  accountingYearEnd?: string;
  complianceStatus: string;
  lastChecked?: string;
  deadlines?: {
    accountsDueDate?: string;
    confirmationDue?: string;
    vatDue?: string;
  };
}

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

interface DashboardStats {
  totalCompanies: number;
  compliant: number;
  warning: number;
  overdue: number;
  unresolvedAlerts: number;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'compliant': return 'bg-green-100 text-green-800';
    case 'warning': return 'bg-amber-100 text-amber-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'compliant': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'overdue': return <XCircle className="w-4 h-4 text-red-500" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-red-50 text-red-700 border-red-100';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
    default: return 'bg-blue-50 text-blue-700 border-blue-100';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB');
  } catch {
    return dateStr;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newCompany, setNewCompany] = useState({
    companyName: '', companyNumber: '', vatNumber: '', accountingYearEnd: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesRes, alertsRes] = await Promise.all([
        authFetch('/api/companies'),
        authFetch('/api/alerts'),
      ]);

      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanies(data.companies || []);
        setStats(data.stats || null);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const response = await authFetch('/api/companies', {
        method: 'POST',
        body: JSON.stringify(newCompany),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        toast.success(`${newCompany.companyName} added to your dashboard`);
        setShowAddCompany(false);
        setNewCompany({ companyName: '', companyNumber: '', vatNumber: '', accountingYearEnd: '' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add company');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await authFetch(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' });
      if (response.ok) {
        setAlerts(alerts.map((a) => a.id === alertId ? { ...a, resolved: true } : a));
        toast.success('Alert resolved');
      }
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.companyNumber && c.companyNumber.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-[#C9A64A]" />
              Compliance Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name} · {user?.firmName}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchData} size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddCompany(true)} className="bg-[#C9A64A] hover:bg-[#B8954A] text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Company
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Companies', value: stats.totalCompanies, icon: Building2, color: 'text-gray-700', bg: 'bg-white' },
              { label: 'Compliant', value: stats.compliant, icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Warnings', value: stats.warning, icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Overdue', value: stats.overdue, icon: XCircle, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Active Alerts', value: stats.unresolvedAlerts, icon: Bell, color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-xs text-gray-500">{stat.label}</span>
                  </div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Company Form */}
        {showAddCompany && (
          <Card className="mb-6 border-[#C9A64A]/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C9A64A]" />
                Add Client Company
              </CardTitle>
              <CardDescription>Add a company to track compliance deadlines automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCompany}>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="Acme Ltd"
                      value={newCompany.companyName}
                      onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Companies House Number</Label>
                    <Input
                      placeholder="12345678"
                      value={newCompany.companyNumber}
                      onChange={(e) => setNewCompany({ ...newCompany, companyNumber: e.target.value })}
                      className="mt-1"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label>VAT Number</Label>
                    <Input
                      placeholder="GB123456789"
                      value={newCompany.vatNumber}
                      onChange={(e) => setNewCompany({ ...newCompany, vatNumber: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Accounting Year End</Label>
                    <Input
                      placeholder="31/03"
                      value={newCompany.accountingYearEnd}
                      onChange={(e) => setNewCompany({ ...newCompany, accountingYearEnd: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={addLoading} className="bg-[#C9A64A] hover:bg-[#B8954A] text-white">
                    {addLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Company
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddCompany(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Main content tabs */}
        <Tabs defaultValue="companies">
          <TabsList className="mb-4">
            <TabsTrigger value="companies">
              <Building2 className="w-4 h-4 mr-1" />
              Companies ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="w-4 h-4 mr-1" />
              Alerts ({alerts.filter((a) => !a.resolved).length})
            </TabsTrigger>
            <TabsTrigger value="tools">
              <FileCheck className="w-4 h-4 mr-1" />
              Quick Tools
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search by name or company number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C9A64A] mx-auto" />
                    <p className="text-gray-500 mt-3">Loading companies...</p>
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="py-16 text-center">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {companies.length === 0
                        ? 'No companies yet. Add your first client company above.'
                        : 'No companies match your search.'}
                    </p>
                    {companies.length === 0 && (
                      <Button onClick={() => setShowAddCompany(true)} className="mt-4 bg-[#C9A64A] hover:bg-[#B8954A] text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Company
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Accounts Due</TableHead>
                        <TableHead>CS Due</TableHead>
                        <TableHead>VAT Due</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow
                          key={company.id}
                          className={
                            company.complianceStatus === 'overdue' ? 'bg-red-50/50' :
                            company.complianceStatus === 'warning' ? 'bg-amber-50/50' : ''
                          }
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{company.companyName}</div>
                              {company.companyNumber && (
                                <div className="text-xs text-gray-500 font-mono">{company.companyNumber}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(company.complianceStatus)}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(company.complianceStatus)}`}>
                                {company.complianceStatus || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(company.deadlines?.accountsDueDate)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(company.deadlines?.confirmationDue)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(company.deadlines?.vatDue)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                company.complianceStatus === 'overdue' ? 'danger' :
                                company.complianceStatus === 'warning' ? 'warning' : 'success'
                              }
                              className="text-xs"
                            >
                              {company.complianceStatus === 'overdue' ? 'HIGH' :
                               company.complianceStatus === 'warning' ? 'MEDIUM' : 'LOW'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link to={`/company/${company.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                View
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No alerts at this time. All companies are up to date.</p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)} ${alert.resolved ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs uppercase font-semibold">{alert.alertType.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{formatDate(alert.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                          className="text-xs flex-shrink-0"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Quick Tools Tab */}
          <TabsContent value="tools">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="hover:border-[#C9A64A] transition-colors cursor-pointer" onClick={() => navigate('/vat-checker')}>
                <CardContent className="pt-6">
                  <FileCheck className="w-10 h-10 text-[#C9A64A] mb-3" />
                  <h3 className="font-bold text-[#1A1A1A] mb-1">VAT Pre-Submission Checker</h3>
                  <p className="text-sm text-gray-600 mb-3">Validate a client's VAT return before submitting to HMRC</p>
                  <Badge className="bg-[#C9A64A] text-white">£1 per check</Badge>
                </CardContent>
              </Card>
              <Card className="hover:border-[#C9A64A] transition-colors cursor-pointer" onClick={() => navigate('/deadline-scanner')}>
                <CardContent className="pt-6">
                  <Building2 className="w-10 h-10 text-[#1A1A1A] mb-3" />
                  <h3 className="font-bold text-[#1A1A1A] mb-1">Companies House Deadline Scanner</h3>
                  <p className="text-sm text-gray-600 mb-3">Bulk scan company deadlines from Companies House</p>
                  <Badge className="bg-[#1A1A1A] text-white">£1 per scan</Badge>
                </CardContent>
              </Card>
              <Card className="hover:border-[#C9A64A] transition-colors cursor-pointer" onClick={() => navigate('/documents')}>
                <CardContent className="pt-6">
                  <TrendingUp className="w-10 h-10 text-blue-500 mb-3" />
                  <h3 className="font-bold text-[#1A1A1A] mb-1">Document Vault</h3>
                  <p className="text-sm text-gray-600 mb-3">Upload and manage compliance documents with 7-year retention</p>
                  <Badge variant="secondary">Pro Feature</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
