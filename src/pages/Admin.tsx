import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  FileText,
  Package,
  MessageSquare,
  RefreshCw,
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  GitCommit,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  id: string;
  leadId: string;
  name: string;
  email: string;
  company: string;
  product: string;
  phone: string;
  message: string;
  createdAt: string;
}

interface IntakeForm {
  id: string;
  matterRef: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  matterType: string;
  urgency: string;
  description: string;
  claimValue: string;
  createdAt: string;
}

interface ComplianceBundle {
  id: string;
  bundleId: string;
  companyName: string;
  companyNumber: string;
  requestorName: string;
  requestorEmail: string;
  bundleType: string;
  estimatedTime: string;
  createdAt: string;
}

interface Contact {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Deployment {
  id: string;
  environment: string;
  status: string;
  commit: string;
  workflowRun: string;
  deployedAt: string;
}

interface FineGuardAlert {
  id: string;
  complianceRunId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [complianceBundles, setComplianceBundles] = useState<ComplianceBundle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [alerts, setAlerts] = useState<FineGuardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(
    () => sessionStorage.getItem('admin_api_key'),
  );
  const [keyInput, setKeyInput] = useState('');
  const keyInputRef = useRef<HTMLInputElement>(null);

  const adminFetch = (url: string, init?: RequestInit): Promise<Response> => {
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers as Record<string, string> | undefined),
        'x-admin-key': apiKey ?? '',
      },
    });
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    sessionStorage.setItem('admin_api_key', trimmed);
    setApiKey(trimmed);
    setKeyInput('');
  };

  const handleUnauthorized = () => {
    sessionStorage.removeItem('admin_api_key');
    setApiKey(null);
    toast.error('Invalid admin key — please re-enter');
  };

  useEffect(() => {
    if (apiKey) fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [leadsRes, intakeRes, bundlesRes, contactsRes, deploymentsRes, alertsRes] = await Promise.all([
        adminFetch('/api/admin/leads'),
        adminFetch('/api/admin/intake-forms'),
        adminFetch('/api/admin/compliance-bundles'),
        adminFetch('/api/admin/contacts'),
        fetch('/api/deployments/status'),
        adminFetch('/api/admin/alerts'),
      ]);

      if (leadsRes.status === 401 || intakeRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (intakeRes.ok) setIntakeForms(await intakeRes.json());
      if (bundlesRes.ok) setComplianceBundles(await bundlesRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (deploymentsRes.ok) {
        const data = await deploymentsRes.json();
        setDeployments(data.deployments || []);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json() as { alerts: FineGuardAlert[] };
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment.toLowerCase()) {
      case 'prod':
      case 'production':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'staging':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'dev':
      case 'development':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':     return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':   return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:         return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'pending':      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'acknowledged': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'resolved':     return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'failed':       return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:             return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getAlertCompanyName = (alert: FineGuardAlert): string => {
    try {
      const meta = JSON.parse(alert.metadata ?? '{}') as { companyName?: string };
      return meta.companyName ?? '—';
    } catch {
      return '—';
    }
  };

  const acknowledgeAlert = async (id: string) => {
    setAcknowledgingId(id);
    try {
      const res = await adminFetch(`/api/admin/alerts/${id}/acknowledge`, { method: 'PATCH' });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
        toast.success('Alert acknowledged');
      } else {
        toast.error('Failed to acknowledge alert');
      }
    } catch {
      toast.error('Failed to acknowledge alert');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const pendingAlertCount = alerts.filter(a => a.status === 'pending').length;

  // Sort deployments by environment order
  const sortedDeployments = [...deployments].sort((a, b) => {
    const order = { prod: 0, production: 0, staging: 1, dev: 2, development: 2 };
    return (order[a.environment.toLowerCase() as keyof typeof order] || 3) -
           (order[b.environment.toLowerCase() as keyof typeof order] || 3);
  });

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] flex items-center justify-center px-4">
        <Card className="bg-[#13151C] border-[#2A2D3A] w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#5A4BFF]" />
              Admin Access
            </CardTitle>
            <CardDescription className="text-gray-400">Enter your admin API key to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKeySubmit} className="flex flex-col gap-3">
              <input
                ref={keyInputRef}
                type="password"
                autoFocus
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="Admin API key"
                className="w-full rounded-md border border-[#2A2D3A] bg-[#0F1014] px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5A4BFF]"
              />
              <Button type="submit" className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white w-full">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">VaultLine Brand Suite Management</p>
            </div>
            <Button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Deployment Status Panel */}
        <Card className="mb-8 bg-[#13151C] border-[#2A2D3A]">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-[#5A4BFF]" />
                  Deployment Status
                </CardTitle>
                <CardDescription className="text-sm text-gray-400 mt-1">
                  Latest deployment status across all environments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sortedDeployments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No deployments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDeployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#1A1D28] border border-[#2A2D3A] hover:border-[#3A3D4A] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(deployment.status)}
                      </div>

                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`${getEnvironmentColor(deployment.environment)} uppercase font-semibold px-3 py-1`}
                        >
                          {deployment.environment}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-400 text-sm">
                            {formatRelativeTime(deployment.deployedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <GitCommit className="w-3 h-3" />
                            <code className="font-mono">{deployment.commit.substring(0, 7)}</code>
                          </div>
                          <span className="text-gray-600">•</span>
                          <span className="font-mono">Run #{deployment.workflowRun}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{leads.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Intake Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{intakeForms.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Compliance Bundles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{complianceBundles.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{contacts.length}</div>
            </CardContent>
          </Card>

          <Card className={`bg-[#13151C] border-[#2A2D3A] ${pendingAlertCount > 0 ? 'border-orange-500/50' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${pendingAlertCount > 0 ? 'text-orange-400' : ''}`} />
                FineGuard Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${pendingAlertCount > 0 ? 'text-orange-400' : 'text-white'}`}>
                {pendingAlertCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">pending of {alerts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="bg-[#13151C] border border-[#2A2D3A]">
            <TabsTrigger value="leads" className="data-[state=active]:bg-[#5A4BFF]">
              <Users className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="intake" className="data-[state=active]:bg-cyan-500">
              <FileText className="w-4 h-4 mr-2" />
              Intake Forms
            </TabsTrigger>
            <TabsTrigger value="bundles" className="data-[state=active]:bg-[#C9A64A]">
              <Package className="w-4 h-4 mr-2" />
              Compliance Bundles
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-green-500">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-orange-500 relative">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Alerts
              {pendingAlertCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {pendingAlertCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <CardTitle className="text-white">Demo Leads</CardTitle>
                <CardDescription className="text-gray-400">
                  All demo booking requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                        <TableHead className="text-gray-400">Lead ID</TableHead>
                        <TableHead className="text-gray-400">Name</TableHead>
                        <TableHead className="text-gray-400">Email</TableHead>
                        <TableHead className="text-gray-400">Company</TableHead>
                        <TableHead className="text-gray-400">Product</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                          <TableCell className="font-mono text-[#5A4BFF]">{lead.leadId}</TableCell>
                          <TableCell className="text-white">{lead.name}</TableCell>
                          <TableCell className="text-gray-400">{lead.email}</TableCell>
                          <TableCell className="text-gray-400">{lead.company || '-'}</TableCell>
                          <TableCell>
                            {lead.product && (
                              <Badge variant="outline" className="text-xs">
                                {lead.product}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(lead.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intake Forms Tab */}
          <TabsContent value="intake">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <CardTitle className="text-white">Client Matter Intake Forms</CardTitle>
                <CardDescription className="text-gray-400">
                  All client matter submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                        <TableHead className="text-gray-400">Matter Ref</TableHead>
                        <TableHead className="text-gray-400">Client</TableHead>
                        <TableHead className="text-gray-400">Matter Type</TableHead>
                        <TableHead className="text-gray-400">Urgency</TableHead>
                        <TableHead className="text-gray-400">Claim Value</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {intakeForms.map((form) => (
                        <TableRow key={form.id} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                          <TableCell className="font-mono text-cyan-400">{form.matterRef}</TableCell>
                          <TableCell className="text-white">{form.clientName}</TableCell>
                          <TableCell className="text-gray-400">{form.matterType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getUrgencyColor(form.urgency)}>
                              {form.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">{form.claimValue || '-'}</TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(form.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Bundles Tab */}
          <TabsContent value="bundles">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <CardTitle className="text-white">Compliance Bundle Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  All Companies House compliance bundle requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                        <TableHead className="text-gray-400">Bundle ID</TableHead>
                        <TableHead className="text-gray-400">Company</TableHead>
                        <TableHead className="text-gray-400">Company No.</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Estimated Time</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceBundles.map((bundle) => (
                        <TableRow key={bundle.id} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                          <TableCell className="font-mono text-[#C9A64A]">{bundle.bundleId}</TableCell>
                          <TableCell className="text-white">{bundle.companyName}</TableCell>
                          <TableCell className="text-gray-400">{bundle.companyNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {bundle.bundleType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">{bundle.estimatedTime}</TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(bundle.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <CardTitle className="text-white">Contact Form Submissions</CardTitle>
                <CardDescription className="text-gray-400">
                  All general contact form submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                        <TableHead className="text-gray-400">Ticket ID</TableHead>
                        <TableHead className="text-gray-400">Name</TableHead>
                        <TableHead className="text-gray-400">Email</TableHead>
                        <TableHead className="text-gray-400">Subject</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                          <TableCell className="font-mono text-green-400">{contact.ticketId}</TableCell>
                          <TableCell className="text-white">{contact.name}</TableCell>
                          <TableCell className="text-gray-400">{contact.email}</TableCell>
                          <TableCell className="text-gray-400">{contact.subject || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {contact.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(contact.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* FineGuard Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="bg-[#13151C] border-[#2A2D3A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-400" />
                  FineGuard Compliance Alerts
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Companies requiring compliance attention. Acknowledge to record review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No alerts — all monitored companies are compliant</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                          <TableHead className="text-gray-400">Company</TableHead>
                          <TableHead className="text-gray-400">Type</TableHead>
                          <TableHead className="text-gray-400">Severity</TableHead>
                          <TableHead className="text-gray-400">Title</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Raised</TableHead>
                          <TableHead className="text-gray-400"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => (
                          <TableRow key={alert.id} className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                            <TableCell className="text-white font-medium">
                              {getAlertCompanyName(alert)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-mono">
                                {alert.alertType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300 max-w-xs truncate">
                              {alert.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getAlertStatusColor(alert.status)}>
                                {alert.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {formatRelativeTime(alert.createdAt)}
                            </TableCell>
                            <TableCell>
                              {alert.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                                  disabled={acknowledgingId === alert.id}
                                  onClick={() => acknowledgeAlert(alert.id)}
                                >
                                  {acknowledgingId === alert.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Acknowledge
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
