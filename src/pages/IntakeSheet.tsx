import { useState, useEffect, FormEvent } from 'react';
import { useLocation } from 'wouter';
import Nav from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function IntakeSheet() {
  useEffect(() => { document.title = 'Client Intake — UltAi'; }, []);

  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [matterRef, setMatterRef] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    matterType: '',
    urgency: '',
    description: '',
    claimValue: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        setMatterRef(data.matterRef);
        setUrgencyLevel(data.urgency);
        toast.success(data.message || 'Matter intake recorded successfully!');

        // Reset form
        setFormData({
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          matterType: '',
          urgency: '',
          description: '',
          claimValue: '',
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10] flex items-center justify-center p-4">
        <Nav />
        <Card className="w-full max-w-md bg-[#13151C] border-[#2A2D3A]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl text-white">Intake Recorded!</CardTitle>
            <CardDescription className="text-gray-400">
              Your client matter has been successfully recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="p-4 bg-[#1A1D28] border border-[#2A2D3A] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Matter Reference</p>
              <p className="text-lg font-mono text-cyan-400 font-semibold">{matterRef}</p>
            </div>

            {urgencyLevel && (
              <div className={`p-3 rounded-lg border ${getUrgencyColor(urgencyLevel)}`}>
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Priority: {urgencyLevel.toUpperCase()}</span>
                </div>
              </div>
            )}

            <p className="text-gray-300">
              Our team has been notified and will review this matter shortly.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setSuccess(false)}
                variant="outline"
                className="flex-1 bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white"
              >
                Submit Another
              </Button>
              <Button
                onClick={() => setLocation('/ultai')}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to UltAi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10] py-12 px-4">
      <Nav />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Client Matter Intake Sheet</h1>
          <p className="text-gray-400 text-lg">
            Secure and confidential matter information collection
          </p>
        </div>

        <Card className="bg-[#13151C] border-[#2A2D3A]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">New Matter Intake</CardTitle>
            <CardDescription className="text-gray-400">
              Please provide complete information about the client matter
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

              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-[#2A2D3A] pb-2">
                  Client Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clientName" className="text-gray-300">
                      Client Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="clientName"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-cyan-500"
                      placeholder="Full legal name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="text-gray-300">
                      Client Email
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-cyan-500"
                      placeholder="client@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="text-gray-300">
                      Client Phone
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-cyan-500"
                      placeholder="+44 7700 900000"
                    />
                  </div>
                </div>
              </div>

              {/* Matter Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-[#2A2D3A] pb-2">
                  Matter Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="matterType" className="text-gray-300">
                      Matter Type <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.matterType}
                      onValueChange={(value) => setFormData({ ...formData, matterType: value })}
                      required
                    >
                      <SelectTrigger className="bg-[#1A1D28] border-[#2A2D3A] text-white">
                        <SelectValue placeholder="Select matter type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1D28] border-[#2A2D3A]">
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="litigation">Litigation</SelectItem>
                        <SelectItem value="family">Family Law</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="employment">Employment</SelectItem>
                        <SelectItem value="intellectual-property">Intellectual Property</SelectItem>
                        <SelectItem value="criminal">Criminal Defense</SelectItem>
                        <SelectItem value="immigration">Immigration</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency" className="text-gray-300">
                      Urgency Level <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                      required
                    >
                      <SelectTrigger className="bg-[#1A1D28] border-[#2A2D3A] text-white">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1D28] border-[#2A2D3A]">
                        <SelectItem value="critical">Critical (Immediate)</SelectItem>
                        <SelectItem value="high">High (Within 48 hours)</SelectItem>
                        <SelectItem value="medium">Medium (Within 1 week)</SelectItem>
                        <SelectItem value="low">Low (No rush)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="claimValue" className="text-gray-300">
                      Estimated Claim Value
                    </Label>
                    <Input
                      id="claimValue"
                      value={formData.claimValue}
                      onChange={(e) => setFormData({ ...formData, claimValue: e.target.value })}
                      className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-cyan-500"
                      placeholder="£50,000 - £100,000"
                    />
                  </div>
                </div>
              </div>

              {/* Matter Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Matter Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#1A1D28] border-[#2A2D3A] text-white focus:border-cyan-500 min-h-[150px]"
                  placeholder="Provide detailed information about the matter, key facts, timeline, and any other relevant details..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/ultai')}
                  className="flex-1 bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording matter…
                    </>
                  ) : (
                    'Submit Intake'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          All information is encrypted and handled with strict confidentiality
        </p>
      </div>
    </div>
  );
}
