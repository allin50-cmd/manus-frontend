import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Upload, Loader2, CheckCircle2, AlertTriangle, XCircle,
  ArrowLeft, FileText, Download, RotateCcw, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Navbar from '@/components/Navbar';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';

interface CompanyResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  incorporationDate?: string;
  complianceStatus: 'compliant' | 'warning' | 'overdue' | 'error';
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  accountsDueDate?: string;
  accountsDaysUntilDue?: number;
  accountsOverdue?: boolean;
  confirmationStatementDue?: string;
  confirmationDaysUntilDue?: number;
  confirmationOverdue?: boolean;
  overdueFilings: Array<{ type: string; description: string; daysOverdue: number; penaltyRisk: number }>;
  directorChanges?: number;
  strikeOffRisk?: boolean;
  estimatedPenalties: number;
  error?: string;
}

interface ScanResult {
  scanId: string;
  totalCompanies: number;
  results: CompanyResult[];
  summary: {
    compliant: number;
    warning: number;
    overdue: number;
    errors: number;
    totalPenaltyExposure: number;
  };
}

function getRiskBadge(level: string) {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    none: 'success', low: 'warning', medium: 'warning', high: 'danger'
  };
  return <Badge variant={variants[level] || 'secondary'} className="text-xs uppercase">{level}</Badge>;
}

function getStatusIcon(status: string) {
  if (status === 'compliant') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (status === 'overdue') return <XCircle className="w-4 h-4 text-red-500" />;
  return <XCircle className="w-4 h-4 text-gray-400" />;
}

function formatDate(dateStr?: string): string {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB');
  } catch {
    return dateStr;
  }
}

export default function DeadlineScanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [manualNumbers, setManualNumbers] = useState('');
  const [inputMode, setInputMode] = useState<'csv' | 'manual'>('manual');
  const fileRef = useRef<HTMLInputElement>(null);

  const runScan = async (companyNumbers: string[]) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await authFetch('/api/deadline-scan', {
        method: 'POST',
        body: JSON.stringify({ companyNumbers }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setResult(data.result);
        toast.success(`Scan complete — ${data.result.totalCompanies} companies checked`);
      } else {
        setError(data.error || 'Scan failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numbers = manualNumbers
      .split(/[\n,;]+/)
      .map((n) => n.trim().replace(/\s/g, ''))
      .filter((n) => n.length > 0);

    if (numbers.length === 0) {
      setError('Please enter at least one company number');
      return;
    }
    if (numbers.length > 50) {
      setError('Maximum 50 companies per scan. Please split into multiple scans.');
      return;
    }
    await runScan(numbers);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const numbers = text
      .split(/[\n,;]+/)
      .map((n) => n.trim().replace(/\s/g, ''))
      .filter((n) => n.length > 0 && n !== 'company_number' && n !== 'Company Number');

    if (numbers.length === 0) {
      setError('No valid company numbers found in the CSV file');
      return;
    }
    await runScan(numbers);
  };

  const downloadCSV = () => {
    if (!result) return;
    const headers = ['Company Number', 'Company Name', 'Status', 'Risk', 'Accounts Due', 'Confirmation Due', 'Overdue Filings', 'Est. Penalties'];
    const rows = result.results.map((r) => [
      r.companyNumber,
      r.companyName,
      r.complianceStatus,
      r.riskLevel,
      formatDate(r.accountsDueDate),
      formatDate(r.confirmationStatementDue),
      r.overdueFilings.length,
      `£${r.estimatedPenalties}`
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fineguard-deadline-scan-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-[#C9A64A]" />
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Companies House Deadline Scanner</h1>
            <Badge className="bg-[#1A1A1A] text-white">£1 per scan</Badge>
          </div>
          <p className="text-gray-600">
            Enter company numbers or upload a CSV to scan all Companies House deadlines in real time.
          </p>
        </div>

        {/* Summary Banner */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total Scanned', value: result.totalCompanies, color: 'bg-gray-100 text-gray-800' },
              { label: 'Compliant', value: result.summary.compliant, color: 'bg-green-100 text-green-800' },
              { label: 'Warnings', value: result.summary.warning, color: 'bg-amber-100 text-amber-800' },
              { label: 'Overdue', value: result.summary.overdue, color: 'bg-red-100 text-red-800' },
              { label: 'Penalty Exposure', value: `£${result.summary.totalPenaltyExposure.toLocaleString()}`, color: 'bg-red-50 text-red-700' },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Input panel */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enter Company Numbers</CardTitle>
                <CardDescription>Real-time Companies House lookup</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mode toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setInputMode('manual')}
                    className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${inputMode === 'manual' ? 'bg-[#C9A64A] text-white border-[#C9A64A]' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    Type Numbers
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('csv')}
                    className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${inputMode === 'csv' ? 'bg-[#C9A64A] text-white border-[#C9A64A]' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    Upload CSV
                  </button>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {inputMode === 'manual' ? (
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Company Numbers (one per line, or comma-separated)</Label>
                      <textarea
                        className="mt-1 w-full h-40 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A64A] resize-none font-mono"
                        placeholder="12345678&#10;SC123456&#10;OC123456"
                        value={manualNumbers}
                        onChange={(e) => setManualNumbers(e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Max 50 companies per scan</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
                      ) : (
                        <><Building2 className="w-4 h-4 mr-2" />Scan Deadlines — £1</>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#C9A64A] transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload CSV</p>
                      <p className="text-xs text-gray-400 mt-1">One company number per row</p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold mb-1">CSV Format:</p>
                      <pre className="text-xs text-gray-500 font-mono">company_number{'\n'}12345678{'\n'}SC123456</pre>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      <strong>Checks:</strong> Accounts due · Confirmation statement · Overdue filings · Strike-off risk · Director changes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <div className="mt-3 flex gap-2">
                <Button onClick={downloadCSV} variant="outline" size="sm" className="flex-1 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Download CSV
                </Button>
                <Button onClick={() => { setResult(null); setManualNumbers(''); }} variant="outline" size="sm" className="flex-1 text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  New Scan
                </Button>
              </div>
            )}
          </div>

          {/* Results table */}
          <div className="md:col-span-2">
            {loading && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#C9A64A] mx-auto mb-4" />
                  <p className="text-gray-600">Querying Companies House in real time...</p>
                  <p className="text-gray-400 text-sm mt-2">This may take a few seconds per company</p>
                </CardContent>
              </Card>
            )}

            {result && !loading && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Scan Results</CardTitle>
                    <span className="text-xs text-gray-500 font-mono">Ref: {result.scanId}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">Status</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Accounts Due</TableHead>
                          <TableHead>CS Due</TableHead>
                          <TableHead>Risk</TableHead>
                          <TableHead className="text-right">Penalties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.results.map((company) => (
                          <TableRow
                            key={company.companyNumber}
                            className={company.complianceStatus === 'overdue' ? 'bg-red-50' : company.complianceStatus === 'warning' ? 'bg-amber-50' : ''}
                          >
                            <TableCell>{getStatusIcon(company.complianceStatus)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{company.companyName || company.companyNumber}</div>
                                <div className="text-xs text-gray-500 font-mono">{company.companyNumber}</div>
                                {company.error && <div className="text-xs text-red-500">{company.error}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(company.accountsDueDate)}
                                {company.accountsOverdue && (
                                  <div className="text-xs text-red-600 font-medium">
                                    {Math.abs(company.accountsDaysUntilDue || 0)}d overdue
                                  </div>
                                )}
                                {!company.accountsOverdue && company.accountsDaysUntilDue !== undefined && (
                                  <div className={`text-xs ${(company.accountsDaysUntilDue || 0) < 30 ? 'text-amber-600' : 'text-gray-400'}`}>
                                    {company.accountsDaysUntilDue}d remaining
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(company.confirmationStatementDue)}
                                {company.confirmationOverdue && (
                                  <div className="text-xs text-red-600 font-medium">Overdue</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getRiskBadge(company.riskLevel)}</TableCell>
                            <TableCell className="text-right">
                              {company.estimatedPenalties > 0 ? (
                                <span className="text-red-700 font-semibold text-sm">
                                  £{company.estimatedPenalties.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">£0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {!result && !loading && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Enter company numbers to begin scanning</p>
                  <p className="text-gray-400 text-sm mt-2">Results will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
