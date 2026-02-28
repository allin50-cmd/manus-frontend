import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchRisks, fetchSummary, RiskItem, SummaryData } from '@/lib/api';

function getTenantId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('tenantId') ?? '';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'OVERDUE') {
    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
        OVERDUE
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
      DUE SOON
    </Badge>
  );
}

function formatDeadline(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
}

export default function FineGuardDashboard() {
  const [, setLocation] = useLocation();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantId] = useState(getTenantId);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryData, risksData] = await Promise.all([
        fetchSummary(tenantId),
        fetchRisks(tenantId),
      ]);
      setSummary(summaryData);
      setRisks(risksData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load compliance data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] flex items-center justify-center px-4">
        <Card className="bg-[#13151C] border-[#2A2D3A] max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-[#C9A64A] mx-auto mb-2" />
            <CardTitle className="text-white">Tenant ID Required</CardTitle>
            <CardDescription className="text-gray-400">
              Add <code className="text-[#C9A64A]">?tenantId=your-id</code> to the URL to view your
              compliance dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => setLocation('/fineguard')}
              variant="outline"
              className="border-[#2A2D3A] text-gray-300 hover:bg-[#1A1D28]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to FineGuard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation('/fineguard')}
              variant="outline"
              size="sm"
              className="border-[#2A2D3A] text-gray-400 hover:bg-[#1A1D28]"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Shield className="w-7 h-7 text-[#C9A64A]" />
                FineGuard Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">Tenant: {tenantId}</p>
            </div>
          </div>
          <Button
            onClick={loadData}
            disabled={loading}
            className="bg-[#C9A64A] hover:bg-[#B8954A] text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#13151C] border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-400">
                {summary ? summary.overdue : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">services past deadline</p>
            </CardContent>
          </Card>

          <Card className="bg-[#13151C] border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                Due Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-400">
                {summary ? summary.dueSoon : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">services approaching deadline</p>
            </CardContent>
          </Card>

          <Card className="bg-[#13151C] border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-400">
                {summary ? summary.compliant : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">services up to date</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk List */}
        <Card className="bg-[#13151C] border-[#2A2D3A]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#C9A64A]" />
              Non-Compliant Services
            </CardTitle>
            <CardDescription className="text-gray-400">
              All OVERDUE and DUE SOON client services requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && risks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                <p>Loading compliance data…</p>
              </div>
            ) : risks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-60" />
                <p className="font-medium">All services are compliant</p>
                <p className="text-sm mt-1 text-gray-500">No overdue or due-soon items found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2D3A] hover:bg-[#1A1D28]">
                      <TableHead className="text-gray-400">Company</TableHead>
                      <TableHead className="text-gray-400">Number</TableHead>
                      <TableHead className="text-gray-400">Service</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Next Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {risks.map((risk, idx) => (
                      <TableRow
                        key={`${risk.CompanyNumber}-${risk.ServiceType}-${idx}`}
                        className="border-[#2A2D3A] hover:bg-[#1A1D28]"
                      >
                        <TableCell className="text-white font-medium">
                          {risk.CompanyName ?? '—'}
                        </TableCell>
                        <TableCell className="text-gray-400 font-mono">
                          {risk.CompanyNumber ?? '—'}
                        </TableCell>
                        <TableCell className="text-gray-400">{risk.ServiceType ?? '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={risk.Status} />
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatDeadline(risk.NextDeadline)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
