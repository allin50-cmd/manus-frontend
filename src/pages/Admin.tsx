import { useState, useEffect } from 'react';
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
  Calendar,
  Download,
  Trash2
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

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [complianceBundles, setComplianceBundles] = useState<ComplianceBundle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchLeads, setSearchLeads] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [searchIntakes, setSearchIntakes] = useState('');
  const [searchContacts, setSearchContacts] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [leadsRes, intakeRes, bundlesRes, contactsRes, deploymentsRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/intake-forms'),
        fetch('/api/admin/compliance-bundles'),
        fetch('/api/admin/contacts'),
        fetch('/api/deployments/status'),
      ]);

      if (leadsRes.ok) { const d = await leadsRes.json(); setLeads(d.data ?? d); }
      if (intakeRes.ok) { const d = await intakeRes.json(); setIntakeForms(d.data ?? d); }
      if (bundlesRes.ok) { const d = await bundlesRes.json(); setComplianceBundles(d.data ?? d); }
      if (contactsRes.ok) { const d = await contactsRes.json(); setContacts(d.data ?? d); }
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

  async function handleDelete(type: 'lead' | 'intake' | 'contact', id: string) {
    if (!confirm('Delete this record?')) return;
    const endpoint = type === 'lead'
      ? `/api/admin/leads/${id}`
      : type === 'intake'
      ? `/api/admin/intake-forms/${id}`
      : `/api/admin/contacts/${id}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    if (res.ok) {
      if (type === 'lead') setLeads(prev => prev.filter(l => l.id !== id));
      else if (type === 'intake') setIntakeForms(prev => prev.filter(f => f.id !== id));
      else setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Record deleted');
    } else {
      toast.error('Failed to delete');
    }
  }

  async function handleContactStatus(id: string, status: string) {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      toast.success('Status updated');
    }
  }

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

  // Filtered data for each tab
  const filteredLeads = leads.filter(l => {
    const q = searchLeads.toLowerCase();
    const matchesSearch = !q ||
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.company ?? '').toLowerCase().includes(q);
    const matchesProduct = !filterProduct || l.product === filterProduct;
    return matchesSearch && matchesProduct;
  });

  const filteredIntakes = intakeForms.filter(f => {
    const q = searchIntakes.toLowerCase();
    return !q ||
      f.clientName.toLowerCase().includes(q) ||
      f.clientEmail.toLowerCase().includes(q) ||
      f.matterType.toLowerCase().includes(q);
  });

  const filteredContacts = contacts.filter(c => {
    const q = searchContacts.toLowerCase();
    return !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
  });

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
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <input
                    type="search"
                    placeholder="Search..."
                    value={searchLeads}
                    onChange={e => setSearchLeads(e.target.value)}
                    className="w-full sm:w-72 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF]/50"
                  />
                  <select
                    value={filterProduct}
                    onChange={e => setFilterProduct(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5A4BFF]/50"
                  >
                    <option value="">All products</option>
                    <option value="vaultline">VaultLine</option>
                    <option value="ultai">UltAi</option>
                    <option value="fineguard">FineGuard</option>
                    <option value="law-clerks">Law Clerks</option>
                  </select>
                  <button
                    onClick={() => exportCSV(filteredLeads as unknown as Record<string, unknown>[], 'leads.csv')}
                    className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
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
                        <TableHead className="text-gray-400"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
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
                          <TableCell>
                            <button
                              onClick={() => handleDelete('lead', lead.id)}
                              className="text-red-400/60 hover:text-red-400 transition-colors p-1 rounded"
                              aria-label="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <input
                    type="search"
                    placeholder="Search..."
                    value={searchIntakes}
                    onChange={e => setSearchIntakes(e.target.value)}
                    className="w-full sm:w-72 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF]/50"
                  />
                  <button
                    onClick={() => exportCSV(filteredIntakes as unknown as Record<string, unknown>[], 'intakes.csv')}
                    className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
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
                        <TableHead className="text-gray-400"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIntakes.map((form) => (
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
                          <TableCell>
                            <button
                              onClick={() => handleDelete('intake', form.id)}
                              className="text-red-400/60 hover:text-red-400 transition-colors p-1 rounded"
                              aria-label="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <input
                    type="search"
                    placeholder="Search..."
                    value={searchContacts}
                    onChange={e => setSearchContacts(e.target.value)}
                    className="w-full sm:w-72 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF]/50"
                  />
                  <button
                    onClick={() => exportCSV(filteredContacts as unknown as Record<string, unknown>[], 'contacts.csv')}
                    className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
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
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleContactStatus(contact.id, 'followed_up')}
                                className="text-xs bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded px-2 py-0.5 transition-colors"
                              >
                                ✓ Followed up
                              </button>
                              <button
                                onClick={() => handleDelete('contact', contact.id)}
                                className="text-red-400/60 hover:text-red-400 transition-colors p-1 rounded"
                                aria-label="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
