import { useState, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import MainNav from '@/components/MainNav';
import SEO from '@/components/SEO';

export default function BookDemo() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    product: '',
    phone: '',
    message: '',
  });

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.company.trim()) errs.company = 'Company name is required.';
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        setLeadId(data.leadId);
        toast.success(data.message || 'Demo booking request submitted!');

        // Reset form
        setFormData({
          name: '',
          email: '',
          company: '',
          product: '',
          phone: '',
          message: '',
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
      <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
        <SEO title="Book a Demo" description="Book a free demo of the Allin50 Legal Suite. See FineGuard, VaultLine, UltAi, and Law Clerks in action." />
        <MainNav />
        <div className="flex items-center justify-center p-4 py-20">
          <Card className="w-full max-w-md bg-[#13151C] border-[#2A2D3A]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-2xl text-white">Demo Booked!</CardTitle>
              <CardDescription className="text-gray-400">
                We've received your demo booking request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              {leadId && (
                <div className="p-4 bg-[#1A1D28] border border-[#2A2D3A] rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Your Reference ID</p>
                  <p className="text-lg font-mono text-[#5A4BFF] font-semibold">{leadId}</p>
                </div>
              )}
              <p className="text-gray-300">
                You'll receive a calendar invite within 2 hours.
              </p>
              <p className="text-gray-400 text-sm">
                A member of our team will also send a personalised prep guide.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="flex-1 bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white"
                >
                  Submit Another
                </Button>
                <Button
                  onClick={() => setLocation('/')}
                  className="flex-1 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <SEO title="Book a Demo" description="Book a free demo of the Allin50 Legal Suite. See FineGuard, VaultLine, UltAi, and Law Clerks in action." />
      <MainNav />
      <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Book a Demo</h1>
          <p className="text-gray-400 text-lg">
            Experience the power of our solutions firsthand
          </p>
        </div>

        <Card className="bg-[#13151C] border-[#2A2D3A]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Request a Demo</CardTitle>
            <CardDescription className="text-gray-400">
              Fill out the form below and we'll get back to you within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
                    className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-[#5A4BFF]"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                    className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-[#5A4BFF]"
                    placeholder="john@company.com"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-300">
                    Company Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => { setFormData({ ...formData, company: e.target.value }); if (errors.company) setErrors(prev => ({ ...prev, company: '' })); }}
                    className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-[#5A4BFF]"
                    placeholder="Acme Corporation"
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-[#5A4BFF]"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product" className="text-gray-300">
                  Product Interest
                </Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => setFormData({ ...formData, product: value })}
                >
                  <SelectTrigger className="bg-[#1A1D28] border-[#2A2D3A] text-white">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D28] border-[#2A2D3A]">
                    <SelectItem value="vaultline">VaultLine Cloud</SelectItem>
                    <SelectItem value="ultai">UltAi Secure Intake</SelectItem>
                    <SelectItem value="fineguard">FineGuard Compliance Cloud</SelectItem>
                    <SelectItem value="all">All Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">
                  Additional Information
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-[#5A4BFF] min-h-[120px]"
                  placeholder="Tell us about your needs, timeline, or any specific requirements..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="flex-1 bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Submitting…
                    </span>
                  ) : 'Book Demo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          By submitting this form, you agree to our terms of service and privacy policy
        </p>
      </div>
      </div>
    </div>
  );
}
