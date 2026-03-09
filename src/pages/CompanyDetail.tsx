import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2, Clock, CheckCircle2, AlertTriangle, XCircle, FileText,
  ArrowLeft, RefreshCw, Loader2, Bell, FolderOpen, FileCheck,
  User, UserMinus, Upload, Calendar, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  eventType: string;
  source?: string;
  notes?: string;
  eventDate: string;
}

interface Deadline {
  id: string;
  deadlineType: string;
  dueDate?: string;
  status: string;
}

interface CompanyDetail {
  id: string;
  companyName: string;
  companyNumber?: string;
  vatNumber?: string;
  accountingYearEnd?: string;
  companyStatus?: string;
  incorporationDate?: string;
  complianceStatus: string;
  lastChecked?: string;
  timeline: TimelineEvent[];
  deadlines: Deadline[];
  alerts: Array<{ id: string; message: string; severity: string; createdAt: string; resolved: boolean }>;
}

const EVENT_ICONS: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  accounts_filed: { icon: FileText, color: 'text-green-600', label: 'Accounts Filed' },
  confirmation_filed: { icon: CheckCircle2, color: 'text-blue-600', label: 'Confirmation Statement Filed' },
  director_appointment: { icon: User, color: 'text-purple-600', label: 'Director Appointed' },
  director_resignation: { icon: UserMinus, color: 'text-orange-600', label: 'Director Resigned' },
  vat_return_submitted: { icon: FileCheck, color: 'text-green-600', label: 'VAT Return Submitted' },
  vat_validation: { icon: FileCheck, color: 'text-blue-600', label: 'VAT Validation Check' },
  deadline_alert: { icon: Bell, color: 'text-amber-600', label: 'Deadline Alert' },
  document_upload: { icon: Upload, color: 'text-gray-600', label: 'Document Uploaded' },
  company_check: { icon: Building2, color: 'text-gray-600', label: 'Companies House Check' },
};

function getEventConfig(eventType: string) {
  return EVENT_ICONS[eventType] || { icon: Clock, color: 'text-gray-500', label: eventType.replace(/_/g, ' ') };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
    case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

function getDeadlineStatusColor(status: string, dueDate?: string) {
  if (status === 'filed') return 'bg-green-100 text-green-800';
  if (!dueDate) return 'bg-gray-100 text-gray-600';
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'bg-red-100 text-red-800';
  if (diff < 30) return 'bg-amber-100 text-amber-800';
  return 'bg-green-100 text-green-800';
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompany = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await authFetch(`/api/companies/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
      } else if (response.status === 404) {
        toast.error('Company not found');
        navigate('/dashboard');
      }
    } catch {
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshFromCompaniesHouse = async () => {
    if (!company?.companyNumber) {
      toast.info('No Companies House number set for this company');
      return;
    }
    setRefreshing(true);
    try {
      const response = await authFetch(`/api/companies/${id}/refresh`, { method: 'POST' });
      if (response.ok) {
        toast.success('Company data refreshed from Companies House');
        fetchCompany(true);
      } else {
        toast.error('Failed to refresh data from Companies House');
      }
    } catch {
      toast.error('Network error during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#C9A64A] mx-auto mb-3" />
            <p className="text-gray-500">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const statusCfg = {
    compliant: { icon: CheckCircle2, color: 'text-green-600', label: 'Compliant' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', label: 'Warning' },
    overdue: { icon: XCircle, color: 'text-red-600', label: 'Overdue' },
  }[company.complianceStatus] || { icon: Clock, color: 'text-gray-500', label: 'Unknown' };
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-medium">{company.companyName}</span>
        </div>

        {/* Company Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#C9A64A]/10 rounded-xl">
                  <Building2 className="w-8 h-8 text-[#C9A64A]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">{company.companyName}</h1>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {company.companyNumber && (
                      <span className="text-sm text-gray-500 font-mono">CH: {company.companyNumber}</span>
                    )}
                    {company.vatNumber && (
                      <span className="text-sm text-gray-500">VAT: {company.vatNumber}</span>
                    )}
                    {company.companyStatus && (
                      <Badge variant={company.companyStatus === 'active' ? 'success' : 'secondary'} className="text-xs">
                        {company.companyStatus}
                      </Badge>
                    )}
                  </div>
                  {company.lastChecked && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last checked: {formatDateTime(company.lastChecked)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getStatusColor(company.complianceStatus)}`}>
                  <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
                  <span className="font-semibold">{statusCfg.label}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshFromCompaniesHouse}
                  disabled={refreshing}
                  className="gap-2"
                >
                  {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh CH Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadlines overview */}
        {company.deadlines.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {company.deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`p-4 rounded-xl border ${getDeadlineStatusColor(deadline.status, deadline.dueDate)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">
                    {deadline.deadlineType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-lg font-bold">{deadline.dueDate ? formatDate(deadline.dueDate) : '—'}</div>
                <div className="text-xs mt-1 capitalize">{deadline.status}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="timeline">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline">
              <Clock className="w-4 h-4 mr-1" />
              Compliance Timeline
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="w-4 h-4 mr-1" />
              Alerts ({company.alerts.filter((a) => !a.resolved).length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderOpen className="w-4 h-4 mr-1" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C9A64A]" />
                  Compliance Timeline
                </CardTitle>
                <CardDescription>Complete chronological audit trail for {company.companyName}</CardDescription>
              </CardHeader>
              <CardContent>
                {company.timeline.length === 0 ? (
                  <div className="py-12 text-center">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No timeline events yet.</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Events are recorded when filings are made, documents uploaded, or VAT checks run.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {company.timeline.map((event) => {
                        const cfg = getEventConfig(event.eventType);
                        const Icon = cfg.icon;
                        return (
                          <div key={event.id} className="flex items-start gap-4 relative pl-3">
                            <div className={`w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center z-10 flex-shrink-0 shadow-sm`}>
                              <Icon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm text-[#1A1A1A]">{cfg.label}</p>
                                  {event.notes && (
                                    <p className="text-sm text-gray-600 mt-0.5">{event.notes}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {event.source && (
                                      <span className="text-xs text-gray-400 capitalize">{event.source.replace(/_/g, ' ')}</span>
                                    )}
                                  </div>
                                </div>
                                <time className="text-xs text-gray-400 flex-shrink-0 ml-4">
                                  {formatDateTime(event.eventDate)}
                                </time>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {company.alerts.length === 0 ? (
                  <div className="py-12 text-center">
                    <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500">No alerts for this company.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {company.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border text-sm ${
                          alert.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                          alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-700' :
                          alert.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          'bg-blue-50 border-blue-100 text-blue-700'
                        } ${alert.resolved ? 'opacity-50' : ''}`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-xs mt-1 opacity-70">{formatDate(alert.createdAt)}</p>
                          </div>
                          {alert.resolved && <Badge variant="secondary" className="text-xs">Resolved</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Document Vault</CardTitle>
                  <Link to={`/documents/${company.id}`}>
                    <Button size="sm" className="bg-[#C9A64A] hover:bg-[#B8954A] text-white gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Open Vault
                    </Button>
                  </Link>
                </div>
                <CardDescription>7-year document retention · AES-256 encrypted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">View and upload documents in the full Document Vault</p>
                  <Link to={`/documents/${company.id}`}>
                    <Button className="mt-4 bg-[#C9A64A] hover:bg-[#B8954A] text-white">
                      Open Document Vault
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
