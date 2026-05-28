import { FormEvent, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Calendar,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const ADMIN_KEY_STORAGE_KEY = 'vaultline-admin-api-key';

function readStoredAdminKey() {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY) ?? '';
}

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
  const { theme, toggleTheme } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [complianceBundles, setComplianceBundles] = useState<ComplianceBundle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState(readStoredAdminKey);
  const [adminKeyInput, setAdminKeyInput] = useState(readStoredAdminKey);
  const [authError, setAuthError] = useState('');

  const clearAdminSession = (message?: string) => {
    window.sessionStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    setAdminKey('');
    setAdminKeyInput('');
    if (message) setAuthError(message);
  };

  const fetchAllData = async () => {
    if (!adminKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError('');

    try {
      const adminHeaders = { 'X-ADMIN-KEY': adminKey };
      const [leadsRes, intakeRes, bundlesRes, contactsRes, deploymentsRes] = await Promise.all([
        fetch('/api/admin/leads', { headers: adminHeaders }),
        fetch('/api/admin/intake-forms', { headers: adminHeaders }),
        fetch('/api/admin/compliance-bundles', { headers: adminHeaders }),
        fetch('/api/admin/contacts', { headers: adminHeaders }),
        fetch('/api/deployments/status'),
      ]);

      const protectedResponses = [leadsRes, intakeRes, bundlesRes, contactsRes];
      if (protectedResponses.some((response) => response.status === 401)) {
        clearAdminSession('Admin key was rejected.');
        toast.error('Admin key was rejected');
        return;
      }
      if (protectedResponses.some((response) => response.status === 503)) {
        setAuthError('Admin access is not configured on the server.');
        toast.error('Admin access is not configured');
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
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [adminKey]);

  const handleAdminSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedKey = adminKeyInput.trim();

    if (!trimmedKey) {
      setAuthError('Enter the admin key.');
      return;
    }

    window.sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, trimmedKey);
    setAdminKey(trimmedKey);
    setAuthError('');
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

  // Sort deployments by environment order
  const sortedDeployments = [...deployments].sort((a, b) => {
    const order = { prod: 0, production: 0, staging: 1, dev: 2, development: 2 };
    return (order[a.environment.toLowerCase() as keyof typeof order] || 3) -
           (order[b.environment.toLowerCase() as keyof typeof order] || 3);
  });

  const themeToggle = (
    <Button
      type="button"
      onClick={toggleTheme}
      variant="outline"
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'light' ? 'Turn dark mode on' : 'Turn dark mode off'}
      className="bg-white dark:bg-[#1A1D28] border-slate-200 dark:border-[#2A2D3A] hover:bg-slate-50 dark:hover:bg-[#252830] text-slate-700 dark:text-white"
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );

  if (!adminKey) {
    return (
      <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#13151C] border-[#2A2D3A]">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-white">Admin Access</CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  Enter the deployment admin key to view operational data.
                </CardDescription>
              </div>
              {themeToggle}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-key" className="text-gray-300">
                  Admin API Key
                </Label>
                <Input
                  id="admin-key"
                  type="password"
                  value={adminKeyInput}
                  onChange={(event) => setAdminKeyInput(event.target.value)}
                  className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-[#5A4BFF]"
                  autoComplete="off"
                />
              </div>
              {authError && <p className="text-sm text-red-400">{authError}</p>}
              <Button type="submit" className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">VaultLine Brand Suite Management</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => fetchAllData()}
                disabled={loading}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => clearAdminSession()}
                variant="outline"
                className="bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white"
              >
                Lock
              </Button>
              {themeToggle}
            </div>
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
