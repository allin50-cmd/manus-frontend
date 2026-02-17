import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Shield, User, Mail, Lock, Building2, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Signup() {
  const { register, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    setLocation('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, name, password, company || undefined);
      toast.success('Account created! Welcome to FineGuard.');
      setLocation('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-[#5A4BFF] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">Create Your Account</h1>
          <p className="text-slate-400">Start monitoring companies for free</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-slate-300 mb-1.5 block">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.co.uk" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Company <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Ltd" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3].map((level) => (
                    <div key={level} className={`h-1 flex-1 rounded-full ${pwStrength >= level ? (level === 1 ? 'bg-red-500' : level === 2 ? 'bg-amber-500' : 'bg-green-500') : 'bg-white/10'}`} />
                  ))}
                  <span className="text-xs text-slate-500 ml-1">{pwStrength === 1 ? 'Weak' : pwStrength === 2 ? 'Good' : 'Strong'}</span>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-[#5A4BFF] hover:underline">Terms</Link> and{' '}
            <Link href="/privacy" className="text-[#5A4BFF] hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#5A4BFF] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
