import { useState, useEffect } from 'react';
import { DeploymentStatusPanel } from '@/components/admin/DeploymentStatusPanel';
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
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

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

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [complianceBundles, setComplianceBundles] = useState<ComplianceBundle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [leadsRes, intakeRes, bundlesRes, contactsRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/intake-forms'),
        fetch('/api/admin/compliance-bundles'),
        fetch('/api/admin/contacts'),
      ]);

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (intakeRes.ok) setIntakeForms(await intakeRes.json());
      if (bundlesRes.ok) setComplianceBundles(await bundlesRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
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
            <TabsTrigger value="deployments" className="data-[state=active]:bg-[#5A4BFF]">
              <Rocket className="w-4 h-4 mr-2" />
              Deployments
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

          {/* Deployments Tab */}
          <TabsContent value="deployments">
            <DeploymentStatusPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
