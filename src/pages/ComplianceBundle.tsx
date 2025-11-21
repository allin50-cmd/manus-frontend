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

export default function ComplianceBundle() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bundleId, setBundleId] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
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
        setEstimatedTime(data.estimatedTime);
        toast.success(data.message || 'Compliance bundle request submitted!');

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

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-[#1A1A1A]/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#C9A64A]/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#C9A64A]" />
            </div>
            <CardTitle className="text-2xl text-[#1A1A1A]">Request Submitted!</CardTitle>
            <CardDescription className="text-gray-600">
              Your compliance bundle request has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="p-4 bg-[#F8F8F8] border border-[#1A1A1A]/10 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Bundle Reference</p>
              <p className="text-lg font-mono text-[#C9A64A] font-semibold">{bundleId}</p>
            </div>

            {estimatedTime && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Estimated: {estimatedTime}</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#C9A64A]/10 border border-[#C9A64A]/30 rounded-lg">
              <div className="flex items-start gap-3 text-left">
                <FileText className="w-5 h-5 text-[#C9A64A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1A1A1A] mb-1">What's Included:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Companies House filing status</li>
                    <li>• Outstanding compliance requirements</li>
                    <li>• Deadline calendar</li>
                    <li>• Automated reminder setup</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-600">
              We'll email you the compliance bundle within the estimated timeframe.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setSuccess(false)}
                variant="outline"
                className="flex-1 border-[#1A1A1A]/20 hover:bg-gray-100"
              >
                Request Another
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
