import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    firmName: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setAuth(data.token, data.user);
        toast.success('Account created! Welcome to FineGuard Pro.');
        navigate('/dashboard');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A1A1A] py-4 px-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <Shield className="w-6 h-6 text-[#C9A64A]" />
          <span className="text-white font-bold">FineGuard Pro</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-[#C9A64A] mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Create Your FineGuard Account</h1>
            <p className="text-gray-500 mt-1">Start protecting your clients from compliance failures</p>
          </div>

          {/* Benefits */}
          <div className="bg-white border border-[#C9A64A]/30 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-2">
              {[
                '£1 VAT pre-submission checks',
                '£1 Companies House deadline scans',
                'Free compliance dashboard',
                'Up to 5 companies free'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Account</CardTitle>
              <CardDescription>Your free account includes access to all entry tools</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      required
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firmName">Firm Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firmName"
                      required
                      placeholder="Smith & Partners"
                      value={form.firmName}
                      onChange={(e) => setForm({ ...form, firmName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="jane@yourfirm.co.uk"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="pr-10"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C9A64A] hover:bg-[#B8954A] text-white py-5"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
                  ) : 'Create Free Account'}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#C9A64A] hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-400 mt-6">
            Protected by AES-256 encryption · GDPR compliant · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
