import { useState, useEffect, useCallback } from 'react';
import { cacheRead, cacheWrite, formatCacheAge } from '@/lib/offlineCache';
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
  ExternalLink,
  GitCommit,
  Calendar
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

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [complianceBundles, setComplianceBundles] = useState<ComplianceBundle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointHealth, setEndpointHealth] = useState<Record<string, 'live' | 'cached' | 'error'>>({});

  const fetchWithRetry = async (url: string, retries = 3): Promise<Response | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;
      } catch {
        if (i < retries - 1) await new Promise((r) => setTimeout(r, 1_000 * 2 ** i));
      }
    }
    return null;
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const health: Record<string, 'live' | 'cached' | 'error'> = {};

    const endpoints: Array<{ key: string; url: string; apply: (d: unknown) => void }> = [
      { key: 'leads',    url: '/api/admin/leads',             apply: (d) => setLeads(d as Lead[]) },
      { key: 'intake',   url: '/api/admin/intake-forms',      apply: (d) => setIntakeForms(d as IntakeForm[]) },
      { key: 'bundles',  url: '/api/admin/compliance-bundles',apply: (d) => setComplianceBundles(d as ComplianceBundle[]) },
      { key: 'contacts', url: '/api/admin/contacts',          apply: (d) => setContacts(d as Contact[]) },
      { key: 'deploys',  url: '/api/deployments/status',      apply: (d) => setDeployments(((d as Record<string, unknown>).deployments as Deployment[]) || []) },
    ];

    await Promise.all(endpoints.map(async ({ key, url, apply }) => {
      const cacheKey = `admin:${key}`;
      const res = await fetchWithRetry(url);
      if (res) {
        const data = await res.json();
        apply(data);
        cacheWrite(cacheKey, data);
        health[key] = 'live';
      } else {
        const cached = cacheRead<unknown>(cacheKey);
        if (cached) {
          apply(cached.data);
          health[key] = 'cached';
          toast.warning(`${key}: showing cached data from ${formatCacheAge(cached.ageMs)}`);
        } else {
          health[key] = 'error';
        }
      }
    }));

    setEndpointHealth(health);
    const errors = Object.values(health).filter((v) => v === 'error').length;
    if (errors > 0 && errors === endpoints.length) toast.error('All endpoints unreachable');
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

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

  // Sort deployments by environment order
  const sortedDeployments = [...deployments].sort((a, b) => {
    const order = { prod: 0, production: 0, staging: 1, dev: 2, development: 2 };
    return (order[a.environment.toLowerCase() as keyof typeof order] || 3) -
           (order[b.environment.toLowerCase() as keyof typeof order] || 3);
  });

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
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="bg-[#13151C] border border-[#2A2D3A]">
            {([
              { value: 'leads',    icon: Users,        label: 'Leads',              colour: 'data-[state=active]:bg-[#5A4BFF]' },
              { value: 'intake',   icon: FileText,     label: 'Intake Forms',       colour: 'data-[state=active]:bg-cyan-500' },
              { value: 'bundles',  icon: Package,      label: 'Compliance Bundles', colour: 'data-[state=active]:bg-[#C9A64A]' },
              { value: 'contacts', icon: MessageSquare,label: 'Contacts',           colour: 'data-[state=active]:bg-green-500' },
            ] as const).map(({ value, icon: Icon, label, colour }) => (
              <TabsTrigger key={value} value={value} className={colour}>
                <Icon className="w-4 h-4 mr-2" />
                {label}
                {endpointHealth[value] === 'cached' && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Cached data" />
                )}
                {endpointHealth[value] === 'error' && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-red-500 inline-block" title="Unreachable" />
                )}
                {endpointHealth[value] === 'live' && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" title="Live" />
                )}
              </TabsTrigger>
            ))}
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
        </Tabs>
      </div>
    </div>
  );
}
