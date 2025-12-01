import { useState, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyData {
  number: string;
  name: string;
  status: string;
  type?: string;
  incorporationDate?: string;
}

interface FilingDeadline {
  nextDue: string;
  daysUntilDue: number;
  overdue: boolean;
}

interface OverdueFiling {
  type: string;
  description: string;
  dueDate: string;
  daysOverdue: number;
  penaltyRisk: number;
}

interface Penalty {
  estimated: number;
  description: string;
}

interface ComplianceData {
  status: 'compliant' | 'warning' | 'overdue';
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  accounts: FilingDeadline;
  confirmationStatement?: FilingDeadline;
  overdueFilings: OverdueFiling[];
  penalties: Penalty[];
}

export default function ComplianceBundle() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bundleId, setBundleId] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companyNumber: '',
    requestorName: '',
    requestorEmail: '',
    bundleType: 'full',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/compliance-bundle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        setBundleId(data.bundleId);
        setCompanyData(data.company);
        setComplianceData(data.compliance);
        toast.success(data.message || 'Compliance data retrieved successfully!');

        // Reset form
        setFormData({
          companyName: '',
          companyNumber: '',
          requestorName: '',
          requestorEmail: '',
          bundleType: 'full',
        });
      } else {
        setError(data.error || 'Failed to submit form. Please try again.');
        toast.error(data.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'low': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 border-red-300 text-red-800';
      case 'warning': return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  if (success && companyData && complianceData) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-white border-[#1A1A1A]/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-[#1A1A1A] mb-2">{companyData.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    Company No: {companyData.number} • Status: {companyData.status}
                  </CardDescription>
                  <p className="text-sm text-gray-500 mt-1">Bundle Reference: <span className="font-mono text-[#C9A64A]">{bundleId}</span></p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${getRiskColor(complianceData.riskLevel)}`}>
                  <p className="text-sm font-semibold uppercase">{complianceData.riskLevel} Risk</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Compliance Status */}
          <Card className="bg-white border-[#1A1A1A]/10">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${getStatusColor(complianceData.status)}`}>
                <p className="font-semibold text-lg mb-1 capitalize">{complianceData.status}</p>
                <p className="text-sm">
                  {complianceData.status === 'compliant' && 'All filings are up to date'}
                  {complianceData.status === 'warning' && 'Upcoming deadlines - action required soon'}
                  {complianceData.status === 'overdue' && 'Immediate action required - filings overdue'}
                </p>
              </div>

              {/* Filing Deadlines */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Accounts */}
                <div className={`p-4 rounded-lg border ${complianceData.accounts.overdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Annual Accounts
                  </p>
                  <p className={`text-lg font-semibold ${complianceData.accounts.overdue ? 'text-red-700' : 'text-blue-700'}`}>
                    {complianceData.accounts.overdue ? `${Math.abs(complianceData.accounts.daysUntilDue)} days overdue` : `Due in ${complianceData.accounts.daysUntilDue} days`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Due: {new Date(complianceData.accounts.nextDue).toLocaleDateString('en-GB')}</p>
                </div>

                {/* Confirmation Statement */}
                {complianceData.confirmationStatement && (
                  <div className={`p-4 rounded-lg border ${complianceData.confirmationStatement.overdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Confirmation Statement
                    </p>
                    <p className={`text-lg font-semibold ${complianceData.confirmationStatement.overdue ? 'text-red-700' : 'text-blue-700'}`}>
                      {complianceData.confirmationStatement.overdue ? `${Math.abs(complianceData.confirmationStatement.daysUntilDue)} days overdue` : `Due in ${complianceData.confirmationStatement.daysUntilDue} days`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Due: {new Date(complianceData.confirmationStatement.nextDue).toLocaleDateString('en-GB')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Filings */}
          {complianceData.overdueFilings.length > 0 && (
            <Card className="bg-white border-red-300">
              <CardHeader>
                <CardTitle className="text-xl text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Overdue Filings
                </CardTitle>
                <CardDescription className="text-red-600">
                  Immediate action required to avoid additional penalties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {complianceData.overdueFilings.map((filing, idx) => (
                  <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-red-900">{filing.description}</p>
                        <p className="text-sm text-red-700">
                          Due: {new Date(filing.dueDate).toLocaleDateString('en-GB')} ({filing.daysOverdue} days overdue)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-800">£{filing.penaltyRisk.toLocaleString()}</p>
                        <p className="text-xs text-red-600">penalty risk</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Penalties */}
          {complianceData.penalties.length > 0 && (
            <Card className="bg-white border-orange-300">
              <CardHeader>
                <CardTitle className="text-xl text-orange-800">Estimated Penalties</CardTitle>
                <CardDescription className="text-orange-600">
                  Current or potential late filing penalties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {complianceData.penalties.map((penalty, idx) => (
                  <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-orange-900">{penalty.description}</p>
                    <p className="text-xl font-bold text-orange-800">£{penalty.estimated.toLocaleString()}</p>
                  </div>
                ))}
                <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-sm font-semibold text-orange-900">
                    Total Estimated Penalties: £{complianceData.penalties.reduce((sum, p) => sum + p.estimated, 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="bg-white border-[#1A1A1A]/10">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setCompanyData(null);
                    setComplianceData(null);
                  }}
                  variant="outline"
                  className="flex-1 border-[#1A1A1A]/20 hover:bg-gray-100"
                >
                  Check Another Company
                </Button>
                <Button
                  onClick={() => setLocation('/fineguard')}
                  className="flex-1 bg-[#C9A64A] hover:bg-[#B8954A] text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to FineGuard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">Compliance Bundle Request</h1>
          <p className="text-gray-600 text-lg">
            Get your comprehensive Companies House compliance report
          </p>
        </div>

        <Card className="bg-white border-[#1A1A1A]/10">
          <CardHeader>
            <CardTitle className="text-2xl text-[#1A1A1A]">Request Compliance Bundle</CardTitle>
            <CardDescription className="text-gray-600">
              Provide your company information to receive a detailed compliance bundle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1A1A1A] border-b border-gray-200 pb-2">
                  Company Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="border-gray-300 focus:border-[#C9A64A] focus:ring-[#C9A64A]"
                    placeholder="Your Company Ltd"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyNumber" className="text-gray-700">
                    Companies House Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyNumber"
                    required
                    value={formData.companyNumber}
                    onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                    className="border-gray-300 focus:border-[#C9A64A] focus:ring-[#C9A64A]"
                    placeholder="12345678"
                    maxLength={8}
                  />
                  <p className="text-sm text-gray-500">
                    8-digit company registration number
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1A1A1A] border-b border-gray-200 pb-2">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="requestorName" className="text-gray-700">
                      Your Name
                    </Label>
                    <Input
                      id="requestorName"
                      value={formData.requestorName}
                      onChange={(e) => setFormData({ ...formData, requestorName: e.target.value })}
                      className="border-gray-300 focus:border-[#C9A64A] focus:ring-[#C9A64A]"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestorEmail" className="text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="requestorEmail"
                      type="email"
                      value={formData.requestorEmail}
                      onChange={(e) => setFormData({ ...formData, requestorEmail: e.target.value })}
                      className="border-gray-300 focus:border-[#C9A64A] focus:ring-[#C9A64A]"
                      placeholder="john@company.co.uk"
                    />
                  </div>
                </div>
              </div>

              {/* Bundle Type */}
              <div className="space-y-2">
                <Label htmlFor="bundleType" className="text-gray-700">
                  Bundle Type
                </Label>
                <Select
                  value={formData.bundleType}
                  onValueChange={(value) => setFormData({ ...formData, bundleType: value })}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#C9A64A] focus:ring-[#C9A64A]">
                    <SelectValue placeholder="Select bundle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Full Compliance Bundle</span>
                        <span className="text-sm text-gray-500">Complete report with all filings</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="basic">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Basic Report</span>
                        <span className="text-sm text-gray-500">Essential compliance information only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Custom Bundle</span>
                        <span className="text-sm text-gray-500">We'll contact you for requirements</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">What You'll Receive:</p>
                    <ul className="space-y-1">
                      <li>• Current filing status from Companies House</li>
                      <li>• List of overdue or upcoming deadlines</li>
                      <li>• Automated compliance calendar</li>
                      <li>• Mobile alerts for important dates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/fineguard')}
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#C9A64A] hover:bg-[#B8954A] text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Request Bundle'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          Your information is secure and will only be used to generate your compliance bundle
        </p>
      </div>
    </div>
  );
}
