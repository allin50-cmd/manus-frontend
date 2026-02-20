import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Shield, User, Mail, Lock, Building2, ArrowRight, ArrowLeft, Eye, EyeOff, Calculator, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageTitle } from '../hooks/usePageTitle';

const intents = [
  {
    key: 'accountant',
    icon: Calculator,
    title: 'Accountant / Advisor',
    description: 'Manage client compliance across your practice',
  },
  {
    key: 'business_owner',
    icon: Building2,
    title: 'Business Owner',
    description: 'Monitor your own company compliance',
  },
  {
    key: 'acsp_provider',
    icon: Shield,
    title: 'ACSP Provider',
    description: 'Corporate service provider compliance tools',
  },
  {
    key: 'company_secretary',
    icon: FileText,
    title: 'Company Secretary',
    description: 'Filing and governance management',
  },
] as const;

export default function Signup() {
  usePageTitle('Create Account');
  const { register, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIntent, setSelectedIntent] = useState<string>('');
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

  const companyRequired = selectedIntent === 'accountant' || selectedIntent === 'acsp_provider';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (companyRequired && !company.trim()) {
      toast.error('Company name is required for your account type');
      return;
    }
    setLoading(true);
    try {
      await register(email, name, password, company || undefined, selectedIntent || undefined);
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
          <p className="text-slate-400">
            {step === 1 ? 'What best describes you?' : 'Fill in your details to get started'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#5A4BFF]' : 'bg-white/10'}`} />
          <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#5A4BFF]' : 'bg-white/10'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {intents.map(({ key, icon: Icon, title, description }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedIntent(key)}
                  className={`text-left p-5 rounded-2xl border transition-all ${
                    selectedIntent === key
                      ? 'border-[#5A4BFF] bg-[#5A4BFF]/10'
                      : 'border-white/10 bg-white/5 hover:border-[#5A4BFF]/40'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${selectedIntent === key ? 'text-[#5A4BFF]' : 'text-slate-400'}`} />
                  <div className="text-white font-bold text-sm">{title}</div>
                  <div className="text-slate-500 text-xs mt-1">{description}</div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedIntent}
              className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base mt-4"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              type="button"
              onClick={() => { setSelectedIntent('individual'); setStep(2); }}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip this step
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="signup-name" className="text-slate-300 mb-1.5 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="signup-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
              </div>
              <div>
                <Label htmlFor="signup-email" className="text-slate-300 mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.co.uk" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
              </div>
              <div>
                <Label htmlFor="signup-company" className="text-slate-300 mb-1.5 block">
                  Company {companyRequired ? <span className="text-red-400">*</span> : <span className="text-slate-500 font-normal">(optional)</span>}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="signup-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Ltd"
                    required={companyRequired}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-slate-300 mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
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
              <div className="flex gap-3">
                <Button type="button" onClick={() => setStep(1)} variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base">
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            <p className="text-xs text-slate-500 text-center mt-4">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-[#5A4BFF] hover:underline">Terms</Link> and{' '}
              <Link href="/privacy" className="text-[#5A4BFF] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        )}

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#5A4BFF] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
